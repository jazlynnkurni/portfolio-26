"use client";

/**
 * CHROME-LAB — a tuning studio for the "Liquid Chrome Void" direction.
 * -------------------------------------------------------------------
 * One WebGL fragment shader renders a real-looking pool table (felt surface,
 * beveled rails with depth, six pockets that read as holes) plus molten-chrome
 * balls. Everything is driven by live controls (color pickers + sliders) so the
 * look can be dialed in. Real Matter.js physics + cue-aim kept — drag to break;
 * pocketed balls sink into the holes. Not linked in nav.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { useCueAim, type ShotInfo } from "@/hooks/useCueAim";
import CueStick from "@/components/snooker/CueStick";
import AimGuide from "@/components/snooker/AimGuide";

/* ---------------- rack + physics ---------------- */
type RackBall = { number: number; x: number; y: number; color: string };
const RACK: RackBall[] = [
  { number: 1, x: 50, y: 24, color: "#7A9471" },
  { number: 2, x: 46.8, y: 29.6, color: "#B08968" },
  { number: 9, x: 53.2, y: 29.6, color: "#7A9471" },
  { number: 10, x: 43.5, y: 35.3, color: "#B08968" },
  { number: 8, x: 50, y: 35.3, color: "#1E1E1E" },
  { number: 3, x: 56.5, y: 35.3, color: "#C97836" },
  { number: 11, x: 40.3, y: 40.9, color: "#C97836" },
  { number: 4, x: 46.8, y: 40.9, color: "#5B7F9E" },
  { number: 12, x: 53.3, y: 40.9, color: "#5B7F9E" },
  { number: 5, x: 59.8, y: 40.9, color: "#C9A437" },
  { number: 6, x: 37, y: 46.5, color: "#A04A3F" },
  { number: 13, x: 43.5, y: 46.5, color: "#A04A3F" },
  { number: 7, x: 50, y: 46.5, color: "#7B6293" },
  { number: 14, x: 56.5, y: 46.5, color: "#C9A437" },
  { number: 15, x: 63, y: 46.5, color: "#7B6293" },
];
const CUE_INIT = { x: 50, y: 72 };
const PHYS_W = 768, PHYS_H = 1376;
const ASPECT = PHYS_H / PHYS_W;
const BALL_RADIUS = (6.5 / 2 / 100) * PHYS_W;
const CUSHION_INSET_X = 56, CUSHION_INSET_Y = 90, CUSHION_THICKNESS = 200;
const REST_V = 0.12, MAX_SHOT_SPEED = 42, PULLBACK_MAX = 40;
const POCKET_RADIUS = BALL_RADIUS * 1.4;
const POCKETS = [
  { x: 60, y: 100 }, { x: PHYS_W - 60, y: 100 },
  { x: 60, y: PHYS_H / 2 }, { x: PHYS_W - 60, y: PHYS_H / 2 },
  { x: 60, y: PHYS_H - 100 }, { x: PHYS_W - 60, y: PHYS_H - 100 },
].map((p, i) => ({ ...p, label: `pocket-${i}` }));
// normalized (width-units) pocket centers for the shader
const POCKETS_N = POCKETS.map((p) => [p.x / PHYS_W, (p.y / PHYS_W)]);

const MAX_BALLS = 16;
const hexToRgb = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/* ---------------- controls schema ---------------- */
type Params = {
  envTop: string; envBottom: string; rimCol: string;
  felt: string; rail: string; voidCol: string;
  reflect: number; ripple: number; rippleSpeed: number;
  fresnel: number; highlight: number; colorMix: number;
  pocket: number; vignette: number; feltGloss: number;
};
const DEFAULTS: Params = {
  envTop: "#dfebff", envBottom: "#10131b", rimCol: "#cfe0ff",
  felt: "#16211f", rail: "#2b2f38", voidCol: "#0a0a0d",
  reflect: 1.0, ripple: 0.09, rippleSpeed: 0.5,
  fresnel: 1.1, highlight: 42, colorMix: 0.22,
  pocket: 0.058, vignette: 0.28, feltGloss: 0.35,
};
const SLIDERS: { key: keyof Params; label: string; min: number; max: number; step: number }[] = [
  { key: "reflect", label: "Reflectivity", min: 0, max: 1.5, step: 0.01 },
  { key: "ripple", label: "Ripple amount", min: 0, max: 0.3, step: 0.005 },
  { key: "rippleSpeed", label: "Ripple speed", min: 0, max: 2, step: 0.02 },
  { key: "fresnel", label: "Rim / fresnel", min: 0, max: 2.5, step: 0.02 },
  { key: "highlight", label: "Highlight sharpness", min: 8, max: 120, step: 1 },
  { key: "colorMix", label: "Ball-color bleed", min: 0, max: 1, step: 0.01 },
  { key: "feltGloss", label: "Felt sheen", min: 0, max: 1, step: 0.01 },
  { key: "pocket", label: "Pocket size", min: 0.035, max: 0.085, step: 0.001 },
  { key: "vignette", label: "Vignette", min: 0, max: 0.6, step: 0.01 },
];
const COLORS: { key: keyof Params; label: string }[] = [
  { key: "envTop", label: "Chrome — light" },
  { key: "envBottom", label: "Chrome — dark" },
  { key: "rimCol", label: "Rim glow" },
  { key: "felt", label: "Felt" },
  { key: "rail", label: "Rail" },
  { key: "voidCol", label: "Void" },
];

/* ---------------- shaders ---------------- */
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform float uEnergy;
uniform int uCount;
uniform vec2 uBallPos[${MAX_BALLS}];
uniform vec3 uBallCol[${MAX_BALLS}];
uniform float uBallScale[${MAX_BALLS}];
uniform float uR;
uniform vec2 uPointer;
uniform vec3 uEnvTop, uEnvBottom, uRim, uFelt, uRail, uVoid;
uniform float uReflect, uRipple, uRippleSpeed, uFresnel, uHighlight, uColorMix, uPocketR, uVignette, uFeltGloss;
uniform vec2 uPockets[6];
const float PI=3.14159265;
const float ASP=${ASPECT.toFixed(5)};

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=0.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.03;a*=0.5;}return v;}
float sdRB(vec2 p, vec2 b, float r){ vec2 d=abs(p)-b+r; return length(max(d,0.))+min(max(d.x,d.y),0.)-r; }

void main(){
  vec2 uv = vec2(gl_FragCoord.x, uRes.y-gl_FragCoord.y)/uRes.x; // x:0..1, y:0..ASP (down)
  vec2 C = vec2(0.5, ASP*0.5);
  vec2 outerH = vec2(0.47, ASP*0.5-0.03);
  vec2 innerH = outerH - 0.078;
  float dOuter = sdRB(uv-C, outerH, 0.10);
  float dInner = sdRB(uv-C, innerH, 0.055);

  // nearest pocket
  float pk = 1e9; for(int i=0;i<6;i++){ pk = min(pk, length(uv-uPockets[i])-uPocketR); }

  vec3 col;
  if(uv.x<0.02||uv.x>0.98||dOuter>0.0){
    col = uVoid;                                   // outside the table
  } else if(pk < 0.0){                             // pocket hole
    float t = clamp(length(uv-C)*0.0+ (uPocketR+pk)/uPocketR, 0.0, 1.0);
    float depth = smoothstep(0.0, 1.0, 1.0-t);     // 1 at center
    col = mix(uFelt*0.35, vec3(0.015,0.015,0.02), depth);
    col *= 0.6;
  } else if(dInner > 0.0){                          // rail
    float railT = clamp(dInner/0.078, 0.0, 1.0);   // 0 inner nose → 1 outer
    float bevel = sin(railT*PI);                    // brightest mid-rail
    vec3 metal = uRail;
    // brushed streaks
    metal *= 0.85 + 0.15*fbm(vec2(uv.x*8.0, uv.y*60.0));
    col = metal*(0.55 + 0.6*bevel);
    col += pow(bevel,6.0)*0.25;                     // rail glint
    if(dInner < 0.008) col *= 0.35;                 // dark cushion nose line
    // pocket jaws: darken rail near a pocket
    col *= smoothstep(-0.004, 0.03, pk);
  } else {                                          // felt
    vec3 f = uFelt;
    f *= 0.92 + 0.08*fbm(uv*160.0);                 // cloth grain
    float cushShadow = smoothstep(0.0, -0.09, dInner); // near cushions
    f *= 1.0 - 0.35*cushShadow;
    // gentle top-light sheen across the cloth
    f += uFeltGloss * 0.06 * smoothstep(1.2, 0.0, length((uv-C)*vec2(1.0,0.8)));
    // felt lip around each pocket
    f *= 0.6 + 0.4*smoothstep(0.0, 0.02, pk);
    col = f;
  }

  // ---- ball ground shadows (depth) ----
  for(int i=0;i<${MAX_BALLS};i++){
    if(i>=uCount) break;
    float s = uBallScale[i]; if(s<=0.01) continue;
    float sd = length(uv-(uBallPos[i]+vec2(0.012,0.02)))/(uR*s);
    col *= 1.0 - 0.4*smoothstep(1.5, 0.5, sd);
  }

  // ---- liquid chrome balls ----
  float bestZ=-1.0; vec3 bc=vec3(0.); vec2 bcen=vec2(0.); float br=uR; float bd=0.; bool hit=false;
  for(int i=0;i<${MAX_BALLS};i++){
    if(i>=uCount) break;
    float s=uBallScale[i]; if(s<=0.01) continue;
    float r=uR*s;
    float d=length(uv-uBallPos[i])/r;
    if(d<1.0){ float z=sqrt(max(0.,1.-d*d)); if(z>bestZ){bestZ=z;bc=uBallCol[i];bcen=uBallPos[i];br=r;bd=d;hit=true;} }
  }
  if(hit){
    vec2 q=(uv-bcen)/br;
    vec3 n=normalize(vec3(q,bestZ+0.001));
    // ripple distortion of the normal (ambient + energy reactive)
    float amp = uRipple*(1.0+uEnergy*3.0);
    n.xy += amp*vec2(fbm(q*3.5+uTime*uRippleSpeed), fbm(q*3.5-uTime*uRippleSpeed*0.8));
    n=normalize(n);
    vec3 V=vec3(0.,0.,1.), L=normalize(vec3(-0.4,-0.55,0.8));
    vec3 rd=reflect(-V,n);
    float env=0.5+0.5*rd.y;
    vec3 chrome = mix(uEnvBottom, uEnvTop, env)*uReflect;
    chrome += pow(max(dot(reflect(-L,n),V),0.0), uHighlight); // sharp key highlight
    chrome = mix(chrome, bc*0.7+chrome*0.5, uColorMix);        // let ball hue bleed
    float fres = pow(1.0-clamp(n.z,0.0,1.0), 3.0)*uFresnel;
    chrome += fres*uRim;
    float edge = smoothstep(1.0, 0.93, bd);
    col = mix(col, chrome, edge);
  }

  // pointer sheen (reactive) + vignette
  col += smoothstep(0.13,0.0,length(uv-uPointer))*uRim*0.12;
  vec2 vd=uv-C; col *= 1.0 - uVignette*dot(vd*vec2(1.0,0.62),vd*vec2(1.0,0.62));
  gl_FragColor=vec4(col,1.0);
}`;

/* ---------------- renderer ---------------- */
type BallRender = { x: number; y: number; col: [number, number, number]; scale: number };
function useRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  posRef: React.MutableRefObject<BallRender[]>,
  pointerRef: React.MutableRefObject<{ x: number; y: number }>,
  energyRef: React.MutableRefObject<number>,
  paramsRef: React.MutableRefObject<Params>
) {
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: true }); if (!gl) return;
    const compile = (t: number, s: string) => {
      const sh = gl.createShader(t)!; gl.shaderSource(sh, s); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh));
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const u = {
      res: U("uRes"), time: U("uTime"), energy: U("uEnergy"), count: U("uCount"),
      pos: U("uBallPos"), col: U("uBallCol"), scale: U("uBallScale"), r: U("uR"), pointer: U("uPointer"),
      envTop: U("uEnvTop"), envBottom: U("uEnvBottom"), rim: U("uRim"), felt: U("uFelt"), rail: U("uRail"), vd: U("uVoid"),
      reflect: U("uReflect"), ripple: U("uRipple"), rippleSpeed: U("uRippleSpeed"), fresnel: U("uFresnel"),
      highlight: U("uHighlight"), colorMix: U("uColorMix"), pocketR: U("uPocketR"), vignette: U("uVignette"), feltGloss: U("uFeltGloss"),
      pockets: U("uPockets"),
    };
    gl.uniform2fv(u.pockets, new Float32Array(POCKETS_N.flat()));

    let raf = 0, dead = false; const t0 = performance.now();
    const c3 = (hex: string) => hexToRgb(hex);
    const render = (now: number) => {
      if (dead) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth * dpr, h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
      const balls = posRef.current; const n = Math.min(balls.length, MAX_BALLS);
      const pos = new Float32Array(MAX_BALLS * 2), col = new Float32Array(MAX_BALLS * 3), sc = new Float32Array(MAX_BALLS);
      for (let i = 0; i < n; i++) {
        pos[i * 2] = balls[i].x / 100; pos[i * 2 + 1] = (balls[i].y / 100) * ASPECT;
        col[i * 3] = balls[i].col[0]; col[i * 3 + 1] = balls[i].col[1]; col[i * 3 + 2] = balls[i].col[2];
        sc[i] = balls[i].scale;
      }
      const p = paramsRef.current;
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.time, (now - t0) / 1000);
      gl.uniform1f(u.energy, energyRef.current);
      gl.uniform1i(u.count, n);
      gl.uniform2fv(u.pos, pos); gl.uniform3fv(u.col, col); gl.uniform1fv(u.scale, sc);
      gl.uniform1f(u.r, BALL_RADIUS / PHYS_W);
      gl.uniform2f(u.pointer, pointerRef.current.x, pointerRef.current.y * ASPECT);
      gl.uniform3fv(u.envTop, c3(p.envTop)); gl.uniform3fv(u.envBottom, c3(p.envBottom)); gl.uniform3fv(u.rim, c3(p.rimCol));
      gl.uniform3fv(u.felt, c3(p.felt)); gl.uniform3fv(u.rail, c3(p.rail)); gl.uniform3fv(u.vd, c3(p.voidCol));
      gl.uniform1f(u.reflect, p.reflect); gl.uniform1f(u.ripple, p.ripple); gl.uniform1f(u.rippleSpeed, p.rippleSpeed);
      gl.uniform1f(u.fresnel, p.fresnel); gl.uniform1f(u.highlight, p.highlight); gl.uniform1f(u.colorMix, p.colorMix);
      gl.uniform1f(u.pocketR, p.pocket); gl.uniform1f(u.vignette, p.vignette); gl.uniform1f(u.feltGloss, p.feltGloss);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => { dead = true; cancelAnimationFrame(raf); };
  }, [canvasRef, posRef, pointerRef, energyRef, paramsRef]);
}

/* ---------------- page ---------------- */
export default function ChromeLab() {
  const [params, setParams] = useState<Params>(DEFAULTS);
  const paramsRef = useRef(params); paramsRef.current = params;

  const tableRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [positions, setPositions] = useState(() => ({ cueBall: { x: CUE_INIT.x, y: CUE_INIT.y } }));

  const posRef = useRef<BallRender[]>([]);
  const pointerRef = useRef({ x: 0.5, y: 0.5 });
  const energyRef = useRef(0);
  const dropRef = useRef<{ x: number; y: number; px: number; py: number; col: [number, number, number]; t0: number }[]>([]);

  const bodies = useRef<Matter.Body[]>([]);
  const cueBody = useRef<Matter.Body | null>(null);
  const worldObj = useRef<Matter.World | null>(null);
  const shotInFlight = useRef(false);
  const pocketed = useRef<Set<number>>(new Set());

  useRenderer(canvasRef, posRef, pointerRef, energyRef, paramsRef);

  const handleShoot = useCallback(({ aimAngleDeg, pullback }: ShotInfo) => {
    const cb = cueBody.current; if (!cb || shotInFlight.current) return;
    const speed = (pullback / PULLBACK_MAX) * MAX_SHOT_SPEED; const a = (aimAngleDeg * Math.PI) / 180;
    Matter.Body.setVelocity(cb, { x: Math.cos(a) * speed, y: Math.sin(a) * speed });
    shotInFlight.current = true;
  }, []);
  const { cueAngle, aimAngle, pullback, isHovering, isAiming, bind } = useCueAim(
    tableRef, positions.cueBall.x, positions.cueBall.y, { onShoot: handleShoot }
  );

  useEffect(() => {
    const engine = Matter.Engine.create(); engine.gravity.scale = 0;
    const world = engine.world; worldObj.current = world;
    const bs = RACK.map((b) => Matter.Bodies.circle((b.x / 100) * PHYS_W, (b.y / 100) * PHYS_H, BALL_RADIUS,
      { restitution: 0.9, friction: 0.001, frictionAir: 0.012, density: 0.001, label: `ball-${b.number}` }));
    const cb = Matter.Bodies.circle((CUE_INIT.x / 100) * PHYS_W, (CUE_INIT.y / 100) * PHYS_H, BALL_RADIUS,
      { restitution: 0.9, friction: 0.001, frictionAir: 0.012, density: 0.001, label: "cue-ball" });
    bodies.current = bs; cueBody.current = cb;
    const o = { isStatic: true, restitution: 0.8, friction: 0.05 };
    const pw = PHYS_W - 2 * CUSHION_INSET_X, ph = PHYS_H - 2 * CUSHION_INSET_Y;
    const cush = [
      Matter.Bodies.rectangle(PHYS_W / 2, CUSHION_INSET_Y - CUSHION_THICKNESS / 2, pw + CUSHION_THICKNESS * 2, CUSHION_THICKNESS, o),
      Matter.Bodies.rectangle(PHYS_W / 2, PHYS_H - CUSHION_INSET_Y + CUSHION_THICKNESS / 2, pw + CUSHION_THICKNESS * 2, CUSHION_THICKNESS, o),
      Matter.Bodies.rectangle(CUSHION_INSET_X - CUSHION_THICKNESS / 2, PHYS_H / 2, CUSHION_THICKNESS, ph + CUSHION_THICKNESS * 2, o),
      Matter.Bodies.rectangle(PHYS_W - CUSHION_INSET_X + CUSHION_THICKNESS / 2, PHYS_H / 2, CUSHION_THICKNESS, ph + CUSHION_THICKNESS * 2, o),
    ];
    const pb = POCKETS.map((p) => Matter.Bodies.circle(p.x, p.y, POCKET_RADIUS, { isStatic: true, isSensor: true, label: p.label }));
    Matter.World.add(world, [...bs, cb, ...cush, ...pb]);

    const onCol = (e: Matter.IEventCollision<Matter.Engine>) => {
      for (const pair of e.pairs) {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        const pkIdx = labels.findIndex((l) => l.startsWith("pocket-"));
        if (pkIdx === -1) continue;
        const pocketLabel = labels[pkIdx];
        const pnum = parseInt(pocketLabel.slice(7), 10);
        const bl = labels.find((l) => l.startsWith("ball-"));
        if (bl) {
          const num = parseInt(bl.slice(5), 10);
          if (!pocketed.current.has(num)) {
            pocketed.current.add(num);
            const idx = RACK.findIndex((r) => r.number === num);
            const body = bs[idx];
            dropRef.current.push({
              x: (body.position.x / PHYS_W) * 100, y: (body.position.y / PHYS_H) * 100,
              px: (POCKETS[pnum].x / PHYS_W) * 100, py: (POCKETS[pnum].y / PHYS_H) * 100,
              col: hexToRgb(RACK[idx].color), t0: performance.now(),
            });
            Matter.Body.setVelocity(body, { x: 0, y: 0 }); Matter.World.remove(world, body);
          }
        }
        if (labels.includes("cue-ball")) {
          Matter.Body.setPosition(cb, { x: (CUE_INIT.x / 100) * PHYS_W, y: (CUE_INIT.y / 100) * PHYS_H });
          Matter.Body.setVelocity(cb, { x: 0, y: 0 });
        }
      }
    };
    Matter.Events.on(engine, "collisionStart", onCol);

    let raf = 0, dead = false, last = performance.now();
    const all = [...bs, cb];
    const tick = (now: number) => {
      if (dead) return;
      Matter.Engine.update(engine, Math.min(now - last, 32)); last = now;
      let energy = 0; const rp: BallRender[] = [];
      bs.forEach((b, i) => {
        if (pocketed.current.has(RACK[i].number)) return;
        energy += Math.hypot(b.velocity.x, b.velocity.y);
        rp.push({ x: (b.position.x / PHYS_W) * 100, y: (b.position.y / PHYS_H) * 100, col: hexToRgb(RACK[i].color), scale: 1 });
      });
      energy += Math.hypot(cb.velocity.x, cb.velocity.y);
      rp.push({ x: (cb.position.x / PHYS_W) * 100, y: (cb.position.y / PHYS_H) * 100, col: [0.98, 0.96, 0.93], scale: 1 });
      // sinking balls
      dropRef.current = dropRef.current.filter((d) => {
        const t = (now - d.t0) / 260; if (t >= 1) return false;
        const e = t * t; // ease-in toward hole
        rp.push({ x: d.x + (d.px - d.x) * e, y: d.y + (d.py - d.y) * e, col: d.col, scale: 1 - t });
        return true;
      });
      posRef.current = rp; energyRef.current = Math.min(1, energy / 60);
      setPositions({ cueBall: { x: (cb.position.x / PHYS_W) * 100, y: (cb.position.y / PHYS_H) * 100 } });
      if (shotInFlight.current && all.every((b) => Math.hypot(b.velocity.x, b.velocity.y) < REST_V)) shotInFlight.current = false;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      dead = true; cancelAnimationFrame(raf); Matter.Events.off(engine, "collisionStart", onCol);
      Matter.World.clear(world, false); Matter.Engine.clear(engine);
      worldObj.current = null; bodies.current = []; cueBody.current = null; pocketed.current.clear();
    };
  }, []);

  const reset = () => {
    const world = worldObj.current, cb = cueBody.current; if (!world || !cb) return;
    RACK.forEach((m, i) => {
      const b = bodies.current[i];
      Matter.Body.setPosition(b, { x: (m.x / 100) * PHYS_W, y: (m.y / 100) * PHYS_H });
      Matter.Body.setVelocity(b, { x: 0, y: 0 });
      if (pocketed.current.has(m.number)) Matter.World.add(world, b);
    });
    Matter.Body.setPosition(cb, { x: (CUE_INIT.x / 100) * PHYS_W, y: (CUE_INIT.y / 100) * PHYS_H });
    Matter.Body.setVelocity(cb, { x: 0, y: 0 });
    pocketed.current.clear(); dropRef.current = []; shotInFlight.current = false;
  };

  const set = (k: keyof Params, v: string | number) => setParams((p) => ({ ...p, [k]: v }));

  return (
    <main className="min-h-screen flex items-start justify-center gap-8 py-10 px-6" style={{ background: "#0b0b0e" }}>
      {/* table */}
      <div
        ref={tableRef}
        className="relative shrink-0"
        style={{ width: "min(380px, calc((100vh - 120px) / 1.79))", aspectRatio: "768 / 1376" }}
        onPointerMove={(e) => {
          const r = tableRef.current!.getBoundingClientRect();
          pointerRef.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: "block" }} />
        <AimGuide aimAngle={aimAngle} visible={isAiming} cueBallX={positions.cueBall.x} cueBallY={positions.cueBall.y} />
        <CueStick angle={cueAngle} pullback={pullback} x={positions.cueBall.x} y={positions.cueBall.y} visible={!shotInFlight.current} />
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 50, touchAction: "none", cursor: isHovering ? "crosshair" : "default" }} {...bind} />
      </div>

      {/* control panel */}
      <aside className="w-[280px] shrink-0 rounded-2xl p-5 text-[13px]"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#EDE6DE", position: "sticky", top: 20 }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-mono text-[13px] tracking-wide" style={{ color: "#E0965A" }}>LIQUID CHROME VOID</h1>
          <button onClick={reset} className="font-mono text-[11px] px-2.5 py-1 rounded-full" style={{ border: "1px solid rgba(255,255,255,0.15)", color: "#bbb" }}>reset ↺</button>
        </div>

        <div className="font-mono text-[10px] uppercase tracking-wider opacity-40 mb-2">Colors</div>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {COLORS.map((c) => (
            <label key={c.key} className="flex items-center gap-2 cursor-pointer">
              <input type="color" value={params[c.key] as string} onChange={(e) => set(c.key, e.target.value)}
                className="w-7 h-7 rounded-md bg-transparent cursor-pointer" style={{ border: "1px solid rgba(255,255,255,0.15)" }} />
              <span className="opacity-70 text-[11px] leading-tight">{c.label}</span>
            </label>
          ))}
        </div>

        <div className="font-mono text-[10px] uppercase tracking-wider opacity-40 mb-2">Material &amp; table</div>
        <div className="flex flex-col gap-3">
          {SLIDERS.map((s) => (
            <label key={s.key} className="flex flex-col gap-1">
              <span className="flex justify-between opacity-70 text-[11px]">
                <span>{s.label}</span>
                <span className="opacity-60 tabular-nums">{(params[s.key] as number).toFixed(s.step < 0.01 ? 3 : 2)}</span>
              </span>
              <input type="range" min={s.min} max={s.max} step={s.step} value={params[s.key] as number}
                onChange={(e) => set(s.key, parseFloat(e.target.value))} className="accent-[#E0965A]" />
            </label>
          ))}
        </div>

        <button onClick={() => setParams(DEFAULTS)} className="mt-5 w-full font-mono text-[11px] py-2 rounded-lg" style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#999" }}>
          reset controls to defaults
        </button>
        <p className="mt-3 text-[11px] opacity-40 leading-snug">drag on the table to aim &amp; break · balls sink into the six pockets</p>
      </aside>
    </main>
  );
}
