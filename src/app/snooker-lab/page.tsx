"use client";

/**
 * SNOOKER-LAB — surrealist shader exploration.
 * -------------------------------------------------------------------
 * Keeps the real Matter.js physics + cue-aim (playable break) but renders the
 * whole scene through a single WebGL fragment shader. Five "worlds" swap the
 * table treatment AND the ball material together (ambient idle motion that
 * intensifies while balls are moving / while aiming). Player-only (no avatar AI)
 * so the focus is the LOOK — pick one and I'll graft it onto the real scene.
 *
 * Not linked in nav. Throwaway lab.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { useCueAim, type ShotInfo } from "@/hooks/useCueAim";
import CueStick from "@/components/snooker/CueStick";
import AimGuide from "@/components/snooker/AimGuide";

/* ---------------- rack + physics (mirrors SnookerScene) ---------------- */
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
const ASPECT = PHYS_H / PHYS_W; // 1.7916…
const BALL_RADIUS = (6.5 / 2 / 100) * PHYS_W; // ≈25
const CUSHION_INSET_X = 56, CUSHION_INSET_Y = 90, CUSHION_THICKNESS = 200;
const REST_V = 0.12, MAX_SHOT_SPEED = 42, PULLBACK_MAX = 40;
const POCKET_RADIUS = BALL_RADIUS * 1.4;
const POCKETS = [
  { x: 60, y: 100 }, { x: PHYS_W - 60, y: 100 },
  { x: 60, y: PHYS_H / 2 }, { x: PHYS_W - 60, y: PHYS_H / 2 },
  { x: 60, y: PHYS_H - 100 }, { x: PHYS_W - 60, y: PHYS_H - 100 },
].map((p, i) => ({ ...p, label: `pocket-${i}` }));

const MAX_BALLS = 16;
const hexToRgb = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/* ---------------- worlds ---------------- */
const WORLDS = [
  { id: 0, name: "Liquid Chrome Void", blurb: "mercury table, molten-metal balls with fresnel rims" },
  { id: 1, name: "Iridescent Dream", blurb: "cream halftone felt, soap-bubble thin-film orbs" },
  { id: 2, name: "Cosmos", blurb: "deep-space nebula table, glowing plasma balls + corona" },
  { id: 3, name: "Melting Dalí", blurb: "sagging warped felt, drooping glossy spheres" },
  { id: 4, name: "Vaporwave Grid", blurb: "neon perspective grid, translucent glass balls" },
];

/* ---------------- shaders ---------------- */
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform int uMode;
uniform int uCount;
uniform vec2 uBallPos[${MAX_BALLS}];
uniform vec3 uBallCol[${MAX_BALLS}];
uniform float uR;
uniform vec2 uPointer;
uniform float uEnergy;

const float PI = 3.14159265;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
}
float fbm(vec2 p){
  float v=0., a=0.5;
  for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5; }
  return v;
}
vec3 hue(float h){ return 0.5+0.5*cos(6.2831*(h+vec3(0.,0.33,0.67))); }

// ---- table backgrounds ----
vec3 table(vec2 uv){
  float t = uTime;
  if(uMode==0){ // mercury void
    float r = fbm(uv*4.0 + vec2(t*0.05, -t*0.04));
    r += 0.4*fbm(uv*9.0 - t*0.08);
    vec3 c = mix(vec3(0.06,0.07,0.09), vec3(0.16,0.18,0.22), r);
    c += pow(r,6.0)*vec3(0.6,0.7,0.8)*0.5; // caustic glints
    return c;
  } else if(uMode==1){ // cream halftone
    vec3 base = mix(vec3(0.99,0.96,0.92), vec3(0.79,0.47,0.21), smoothstep(0.0,1.8,uv.y));
    float dots = sin(uv.x*130.0)*sin(uv.y*130.0);
    base -= smoothstep(0.2,0.9,dots)*0.06;
    return base;
  } else if(uMode==2){ // cosmos
    vec3 c = mix(vec3(0.02,0.02,0.05), vec3(0.10,0.05,0.16), uv.y/1.8);
    float neb = fbm(uv*3.0 + vec2(t*0.02,0.0));
    c += hue(0.6+neb*0.3)*pow(neb,3.0)*0.5;
    float star = step(0.996, hash(floor(uv*220.0)));
    c += star*vec3(1.0)*(0.5+0.5*sin(t*3.0+uv.x*50.0));
    return c;
  } else if(uMode==3){ // dali felt
    vec2 w = uv + 0.15*vec2(fbm(uv*2.0+t*0.03), fbm(uv*2.0-t*0.02));
    float g = fbm(w*3.0);
    vec3 c = mix(vec3(0.30,0.38,0.28), vec3(0.52,0.56,0.36), g);
    c *= 0.9 + 0.1*sin(w.y*8.0);
    return c;
  } else { // vaporwave grid
    vec3 c = mix(vec3(0.05,0.02,0.09), vec3(0.20,0.05,0.22), 1.0-uv.y/1.8);
    // sun
    float sun = smoothstep(0.35,0.0, length(uv-vec2(0.5,0.55)));
    c += sun*mix(vec3(1.0,0.5,0.2),vec3(1.0,0.2,0.6), uv.y);
    // perspective grid
    vec2 g = uv; g.y = uv.y;
    float persp = 1.0/(g.y+0.15);
    float lx = abs(fract((g.x-0.5)*persp*2.0)-0.5);
    float ly = abs(fract((g.y*3.0 - t*0.3))-0.5);
    float grid = smoothstep(0.03,0.0,lx)+smoothstep(0.02,0.0,ly);
    c += grid*vec3(0.2,0.9,1.0)*0.5*step(0.5,uv.y);
    return c;
  }
}

void main(){
  vec2 uv = vec2(gl_FragCoord.x, uRes.y-gl_FragCoord.y)/uRes.x; // width-normalized, y down
  vec3 col = table(uv);

  // find frontmost ball covering this pixel
  float bestZ = -1.0; vec3 bcol = vec3(0.); vec2 bcen = vec2(0.); bool hit=false; float bd=0.;
  for(int i=0;i<${MAX_BALLS};i++){
    if(i>=uCount) break;
    vec2 c = uBallPos[i];
    vec2 q = uv - c;
    // melting: stretch vertically
    if(uMode==3){ q.y *= 0.72; }
    float d = length(q)/uR;
    if(d<1.0){
      float z = sqrt(max(0.0,1.0-d*d));
      if(z>bestZ){ bestZ=z; bcol=uBallCol[i]; bcen=c; hit=true; bd=d; }
    }
  }

  if(hit){
    vec2 q = (uv-bcen)/uR;
    vec3 n = normalize(vec3(q, bestZ+0.001));
    vec3 L = normalize(vec3(-0.4,-0.6,0.8));
    vec3 V = vec3(0.,0.,1.);
    float diff = clamp(dot(n,L),0.0,1.0);
    float fres = pow(1.0-clamp(n.z,0.0,1.0), 3.0);
    float amb = 0.9+0.1*sin(uTime*1.5);
    vec3 bcolor;

    if(uMode==0){ // liquid chrome
      vec3 rd = reflect(-V, n);
      rd.xy += 0.08*vec2(fbm(q*3.0+uTime*0.4), fbm(q*3.0-uTime*0.3))*(1.0+uEnergy*4.0);
      float env = 0.5+0.5*rd.y;
      bcolor = mix(vec3(0.15,0.17,0.2), vec3(0.9,0.95,1.0), env);
      bcolor += pow(max(dot(reflect(-L,n),V),0.0), 40.0); // sharp highlight
      bcolor = mix(bcolor, bcol*0.6+bcolor*0.4, 0.25);
      bcolor += fres*vec3(0.8,0.9,1.0);
    } else if(uMode==1){ // iridescent soap bubble
      float ang = acos(clamp(n.z,0.0,1.0));
      float film = ang*6.0 + uTime*0.6 + fbm(q*2.0);
      vec3 irid = hue(film*0.15);
      bcolor = mix(bcol, irid, 0.7);
      bcolor += fres*irid*1.2;
      bcolor *= (0.7+0.5*diff);
    } else if(uMode==2){ // plasma
      float g = fbm(q*3.0 + uTime*0.8) + 0.5*fbm(q*7.0 - uTime*0.6);
      vec3 hot = mix(bcol, hue(0.05+g*0.15), 0.4);
      bcolor = hot*(0.6+g*1.4);
      bcolor += fres*hot*2.0; // corona at rim
    } else if(uMode==3){ // melting glossy
      float spec = pow(max(dot(reflect(-L,n),V),0.0), 24.0);
      bcolor = bcol*(0.35+0.75*diff) + spec*vec3(1.0);
      bcolor += fres*bcol*0.6;
      bcolor *= amb;
    } else { // neon glass
      vec3 behind = table(bcen + q*uR*1.3); // fake refraction
      bcolor = mix(behind, bcol, 0.35);
      float rim = pow(1.0-clamp(n.z,0.0,1.0), 2.0);
      bcolor += rim*bcol*2.2; // neon rim
      bcolor += pow(max(dot(reflect(-L,n),V),0.0), 60.0);
    }

    // soft anti-aliased edge
    float edge = smoothstep(1.0, 0.94, bd);
    // contact shadow already implied; blend ball over table
    col = mix(col, bcolor, edge);
  }

  // pointer glow (reactive)
  float pg = smoothstep(0.14,0.0, length(uv-uPointer));
  col += pg*vec3(0.4,0.5,0.7)*0.15;

  // subtle vignette
  vec2 vd = uv - vec2(0.5, 0.9);
  col *= 1.0 - 0.25*dot(vd,vd);

  gl_FragColor = vec4(col,1.0);
}
`;

/* ---------------- WebGL renderer hook ---------------- */
function useRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  world: number,
  posRef: React.MutableRefObject<{ x: number; y: number; col: [number, number, number] }[]>,
  pointerRef: React.MutableRefObject<{ x: number; y: number }>,
  energyRef: React.MutableRefObject<number>
) {
  const worldRef = useRef(world);
  worldRef.current = world;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: true, premultipliedAlpha: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = {
      res: gl.getUniformLocation(prog, "uRes"),
      time: gl.getUniformLocation(prog, "uTime"),
      mode: gl.getUniformLocation(prog, "uMode"),
      count: gl.getUniformLocation(prog, "uCount"),
      pos: gl.getUniformLocation(prog, "uBallPos"),
      col: gl.getUniformLocation(prog, "uBallCol"),
      r: gl.getUniformLocation(prog, "uR"),
      pointer: gl.getUniformLocation(prog, "uPointer"),
      energy: gl.getUniformLocation(prog, "uEnergy"),
    };

    let raf = 0, dead = false;
    const t0 = performance.now();
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth * dpr, h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const render = (now: number) => {
      if (dead) return;
      resize();
      const balls = posRef.current;
      const pos = new Float32Array(MAX_BALLS * 2);
      const col = new Float32Array(MAX_BALLS * 3);
      const count = Math.min(balls.length, MAX_BALLS);
      for (let i = 0; i < count; i++) {
        pos[i * 2] = balls[i].x / 100;
        pos[i * 2 + 1] = (balls[i].y / 100) * ASPECT;
        col[i * 3] = balls[i].col[0];
        col[i * 3 + 1] = balls[i].col[1];
        col[i * 3 + 2] = balls[i].col[2];
      }
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform1f(U.time, (now - t0) / 1000);
      gl.uniform1i(U.mode, worldRef.current);
      gl.uniform1i(U.count, count);
      gl.uniform2fv(U.pos, pos);
      gl.uniform3fv(U.col, col);
      gl.uniform1f(U.r, BALL_RADIUS / PHYS_W);
      gl.uniform2f(U.pointer, pointerRef.current.x, pointerRef.current.y * ASPECT);
      gl.uniform1f(U.energy, energyRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => { dead = true; cancelAnimationFrame(raf); };
  }, [canvasRef, posRef, pointerRef, energyRef]);
}

/* ---------------- page ---------------- */
export default function SnookerLab() {
  const [world, setWorld] = useState(0);
  const tableRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [positions, setPositions] = useState(() => ({
    balls: RACK.map((b) => ({ x: b.x, y: b.y })),
    cueBall: { x: CUE_INIT.x, y: CUE_INIT.y },
  }));

  // refs the renderer reads each frame
  const posRef = useRef<{ x: number; y: number; col: [number, number, number] }[]>([]);
  const pointerRef = useRef({ x: 0.5, y: 0.5 });
  const energyRef = useRef(0);

  const worldBodies = useRef<Matter.Body[]>([]);
  const cueBody = useRef<Matter.Body | null>(null);
  const worldObj = useRef<Matter.World | null>(null);
  const shotInFlight = useRef(false);
  const pocketed = useRef<Set<number>>(new Set());
  const [, force] = useState(0);

  useRenderer(canvasRef, world, posRef, pointerRef, energyRef);

  const handleShoot = useCallback(({ aimAngleDeg, pullback }: ShotInfo) => {
    const cb = cueBody.current;
    if (!cb || shotInFlight.current) return;
    const speed = (pullback / PULLBACK_MAX) * MAX_SHOT_SPEED;
    const a = (aimAngleDeg * Math.PI) / 180;
    Matter.Body.setVelocity(cb, { x: Math.cos(a) * speed, y: Math.sin(a) * speed });
    shotInFlight.current = true;
  }, []);

  const { cueAngle, aimAngle, pullback, isHovering, isAiming, bind } = useCueAim(
    tableRef, positions.cueBall.x, positions.cueBall.y, { onShoot: handleShoot }
  );

  // physics engine
  useEffect(() => {
    const engine = Matter.Engine.create();
    engine.gravity.scale = 0;
    const world = engine.world;
    worldObj.current = world;

    const bodies = RACK.map((b) =>
      Matter.Bodies.circle((b.x / 100) * PHYS_W, (b.y / 100) * PHYS_H, BALL_RADIUS, {
        restitution: 0.9, friction: 0.001, frictionAir: 0.012, density: 0.001,
        label: `ball-${b.number}`,
      })
    );
    const cb = Matter.Bodies.circle((CUE_INIT.x / 100) * PHYS_W, (CUE_INIT.y / 100) * PHYS_H, BALL_RADIUS, {
      restitution: 0.9, friction: 0.001, frictionAir: 0.012, density: 0.001, label: "cue-ball",
    });
    worldBodies.current = bodies;
    cueBody.current = cb;

    const opt = { isStatic: true, restitution: 0.8, friction: 0.05 };
    const pw = PHYS_W - 2 * CUSHION_INSET_X, ph = PHYS_H - 2 * CUSHION_INSET_Y;
    const cush = [
      Matter.Bodies.rectangle(PHYS_W / 2, CUSHION_INSET_Y - CUSHION_THICKNESS / 2, pw + CUSHION_THICKNESS * 2, CUSHION_THICKNESS, opt),
      Matter.Bodies.rectangle(PHYS_W / 2, PHYS_H - CUSHION_INSET_Y + CUSHION_THICKNESS / 2, pw + CUSHION_THICKNESS * 2, CUSHION_THICKNESS, opt),
      Matter.Bodies.rectangle(CUSHION_INSET_X - CUSHION_THICKNESS / 2, PHYS_H / 2, CUSHION_THICKNESS, ph + CUSHION_THICKNESS * 2, opt),
      Matter.Bodies.rectangle(PHYS_W - CUSHION_INSET_X + CUSHION_THICKNESS / 2, PHYS_H / 2, CUSHION_THICKNESS, ph + CUSHION_THICKNESS * 2, opt),
    ];
    const pocketBodies = POCKETS.map((p) =>
      Matter.Bodies.circle(p.x, p.y, POCKET_RADIUS, { isStatic: true, isSensor: true, label: p.label })
    );
    Matter.World.add(world, [...bodies, cb, ...cush, ...pocketBodies]);

    const onCol = (e: Matter.IEventCollision<Matter.Engine>) => {
      for (const pair of e.pairs) {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        const pk = labels.find((l) => l.startsWith("pocket-"));
        const bl = labels.find((l) => l.startsWith("ball-"));
        if (pk && bl) {
          const num = parseInt(bl.slice(5), 10);
          if (!pocketed.current.has(num)) {
            pocketed.current.add(num);
            const body = bodies[RACK.findIndex((r) => r.number === num)];
            Matter.Body.setVelocity(body, { x: 0, y: 0 });
            Matter.World.remove(world, body);
          }
        }
        if (pk && labels.includes("cue-ball")) {
          Matter.Body.setPosition(cb, { x: (CUE_INIT.x / 100) * PHYS_W, y: (CUE_INIT.y / 100) * PHYS_H });
          Matter.Body.setVelocity(cb, { x: 0, y: 0 });
        }
      }
    };
    Matter.Events.on(engine, "collisionStart", onCol);

    let raf = 0, dead = false, last = performance.now();
    const all = [...bodies, cb];
    const tick = (now: number) => {
      if (dead) return;
      const dt = Math.min(now - last, 32); last = now;
      Matter.Engine.update(engine, dt);

      let energy = 0;
      const rp: { x: number; y: number; col: [number, number, number] }[] = [];
      bodies.forEach((b, i) => {
        if (pocketed.current.has(RACK[i].number)) return;
        energy += Math.hypot(b.velocity.x, b.velocity.y);
        rp.push({ x: (b.position.x / PHYS_W) * 100, y: (b.position.y / PHYS_H) * 100, col: hexToRgb(RACK[i].color) });
      });
      energy += Math.hypot(cb.velocity.x, cb.velocity.y);
      rp.push({ x: (cb.position.x / PHYS_W) * 100, y: (cb.position.y / PHYS_H) * 100, col: [0.98, 0.96, 0.93] });
      posRef.current = rp;
      energyRef.current = Math.min(1, energy / 60);

      setPositions({
        balls: bodies.map((b) => ({ x: (b.position.x / PHYS_W) * 100, y: (b.position.y / PHYS_H) * 100 })),
        cueBall: { x: (cb.position.x / PHYS_W) * 100, y: (cb.position.y / PHYS_H) * 100 },
      });

      if (shotInFlight.current && all.every((b) => Math.hypot(b.velocity.x, b.velocity.y) < REST_V)) {
        shotInFlight.current = false;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      dead = true; cancelAnimationFrame(raf);
      Matter.Events.off(engine, "collisionStart", onCol);
      Matter.World.clear(world, false); Matter.Engine.clear(engine);
      worldObj.current = null; worldBodies.current = []; cueBody.current = null;
      pocketed.current.clear();
    };
  }, []);

  const reset = () => {
    const world = worldObj.current, cb = cueBody.current;
    if (!world || !cb) return;
    RACK.forEach((meta, i) => {
      const body = worldBodies.current[i];
      Matter.Body.setPosition(body, { x: (meta.x / 100) * PHYS_W, y: (meta.y / 100) * PHYS_H });
      Matter.Body.setVelocity(body, { x: 0, y: 0 });
      if (pocketed.current.has(meta.number)) Matter.World.add(world, body);
    });
    Matter.Body.setPosition(cb, { x: (CUE_INIT.x / 100) * PHYS_W, y: (CUE_INIT.y / 100) * PHYS_H });
    Matter.Body.setVelocity(cb, { x: 0, y: 0 });
    pocketed.current.clear();
    shotInFlight.current = false;
    force((n) => n + 1);
  };

  // keyboard world switch
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = Number(e.key);
      if (k >= 1 && k <= WORLDS.length) setWorld(k - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const current = WORLDS[world];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center py-10" style={{ background: "#0d0d10" }}>
      <div
        ref={tableRef}
        className="relative"
        style={{ width: "min(400px, calc((100vh - 200px) / 1.79))", aspectRatio: "768 / 1376" }}
        onPointerMove={(e) => {
          const r = tableRef.current!.getBoundingClientRect();
          pointerRef.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-[18px]" style={{ display: "block" }} />

        <AimGuide aimAngle={aimAngle} visible={isAiming} cueBallX={positions.cueBall.x} cueBallY={positions.cueBall.y} />
        <CueStick angle={cueAngle} pullback={pullback} x={positions.cueBall.x} y={positions.cueBall.y} visible={!shotInFlight.current} />

        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0, zIndex: 50, touchAction: "none",
            cursor: isHovering ? "crosshair" : "default",
          }}
          {...bind}
        />
      </div>

      {/* world dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2">
        <div className="flex items-center gap-1 rounded-full p-1.5"
          style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.14)" }}>
          {WORLDS.map((w, i) => (
            <button key={w.id} onClick={() => setWorld(i)}
              className="px-3.5 py-2 rounded-full text-[13px] font-mono transition-all"
              style={{ backgroundColor: world === i ? "#C97836" : "transparent", color: world === i ? "#fff" : "rgba(255,255,255,0.7)" }}>
              <span className="opacity-50 mr-1.5">{i + 1}</span>{w.name}
            </button>
          ))}
          <button onClick={reset} className="px-3 py-2 rounded-full text-[13px] font-mono ml-1"
            style={{ color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.14)" }}>
            reset ↺
          </button>
        </div>
        <p className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>{current.blurb} · drag to aim &amp; break</p>
      </div>
    </main>
  );
}
