"use client";

/**
 * WATER-LAB — the felt becomes a reflective pond.
 * -------------------------------------------------------------------
 * Same locked palette + chrome balls as chrome-lab, but the playing surface is
 * now a water shader with a height field (ambient wavelets + ripples radiating
 * from every ball, like koi eggs resting on a lily pond). Five water treatments
 * to compare, switchable live, plus intensity / speed sliders. Physics kept —
 * balls ripple the water as they move and sink into the pockets. Not in nav.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { useCueAim, type ShotInfo } from "@/hooks/useCueAim";
import CueStick from "@/components/snooker/CueStick";
import AimGuide from "@/components/snooker/AimGuide";

/* ---- rack + physics (same as chrome-lab) ---- */
type RackBall = { number: number; x: number; y: number; color: string };
const RACK: RackBall[] = [
  { number: 1, x: 50, y: 24, color: "#7A9471" }, { number: 2, x: 46.8, y: 29.6, color: "#B08968" },
  { number: 9, x: 53.2, y: 29.6, color: "#7A9471" }, { number: 10, x: 43.5, y: 35.3, color: "#B08968" },
  { number: 8, x: 50, y: 35.3, color: "#1E1E1E" }, { number: 3, x: 56.5, y: 35.3, color: "#C97836" },
  { number: 11, x: 40.3, y: 40.9, color: "#C97836" }, { number: 4, x: 46.8, y: 40.9, color: "#5B7F9E" },
  { number: 12, x: 53.3, y: 40.9, color: "#5B7F9E" }, { number: 5, x: 59.8, y: 40.9, color: "#C9A437" },
  { number: 6, x: 37, y: 46.5, color: "#A04A3F" }, { number: 13, x: 43.5, y: 46.5, color: "#A04A3F" },
  { number: 7, x: 50, y: 46.5, color: "#7B6293" }, { number: 14, x: 56.5, y: 46.5, color: "#C9A437" },
  { number: 15, x: 63, y: 46.5, color: "#7B6293" },
];
const CUE_INIT = { x: 50, y: 72 };
const PHYS_W = 768, PHYS_H = 1376, ASPECT = PHYS_H / PHYS_W;
const BALL_RADIUS = (6.5 / 2 / 100) * PHYS_W;
const CX = 56, CY = 90, CT = 200, REST_V = 0.12, MAX_SHOT_SPEED = 42, PULLBACK_MAX = 40;
const POCKET_RADIUS = BALL_RADIUS * 1.4;
const POCKETS = [
  { x: 60, y: 100 }, { x: PHYS_W - 60, y: 100 }, { x: 60, y: PHYS_H / 2 },
  { x: PHYS_W - 60, y: PHYS_H / 2 }, { x: 60, y: PHYS_H - 100 }, { x: PHYS_W - 60, y: PHYS_H - 100 },
].map((p, i) => ({ ...p, label: `pocket-${i}` }));
const POCKETS_N = POCKETS.map((p) => [p.x / PHYS_W, p.y / PHYS_W]);
const MAX_BALLS = 16;
const hexToRgb = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/* ---- LOCKED palette (from your chrome-lab tuning) ---- */
const PAL = { envTop: "#E0752E", envBottom: "#3d2410", rim: "#E9B84A", felt: "#63978A", rail: "#E6E8D2", void: "#0b0b0e" };

const MODES = [
  { id: 0, name: "Concentric Ripples", blurb: "raindrop rings + ripples radiating from every ball" },
  { id: 1, name: "Mirror Pond", blurb: "near-still glassy water, high reflection" },
  { id: 2, name: "Caustics", blurb: "shimmering caustic light-web over the surface" },
  { id: 3, name: "Wake & Drift", blurb: "balls carve directional wakes as they move" },
  { id: 4, name: "Deep Swell", blurb: "slow undulating pond swells + dappled light" },
];

const VERT = `attribute vec2 p; void main(){ gl_Position=vec4(p,0.,1.); }`;
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime, uEnergy, uIntensity, uSpeed;
uniform int uMode, uCount;
uniform vec2 uBallPos[${MAX_BALLS}], uBallVel[${MAX_BALLS}];
uniform vec3 uBallCol[${MAX_BALLS}];
uniform float uBallScale[${MAX_BALLS}], uR, uPocketR;
uniform vec2 uPointer, uPockets[6];
uniform vec3 uEnvTop, uEnvBottom, uRim, uFelt, uRail, uVoid;
const float PI=3.14159265, ASP=${ASPECT.toFixed(5)};

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=0.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.03;a*=0.5;}return v;}
float sdRB(vec2 p, vec2 b, float r){ vec2 d=abs(p)-b+r; return length(max(d,0.))+min(max(d.x,d.y),0.)-r; }

float caustic(vec2 uv){
  vec2 p=uv*6.0; float t=uTime*(0.35+uSpeed*0.6); float k=0.0;
  for(int n=0;n<4;n++){ p+=vec2(sin(p.y*1.4+t),cos(p.x*1.4-t))*0.55; k+=0.35/length(fract(p)-0.5); }
  return k;
}

float waterH(vec2 p){
  float t=uTime*(0.35+uSpeed);
  float h=0.0;
  h += 0.30*sin(p.x*32.0 - t*1.1)*sin(p.y*28.0 + t*0.8);
  h += 0.5*fbm(p*6.0 + vec2(t*0.15,-t*0.1)) - 0.25;
  for(int i=0;i<${MAX_BALLS};i++){
    if(i>=uCount) break;
    float s=uBallScale[i]; if(s<=0.01) continue;
    vec2 d=p-uBallPos[i]; float dist=length(d);
    float ring = sin(dist*66.0 - t*4.0)*exp(-dist*9.5);
    if(uMode==3){
      float dir=dot(normalize(d+1e-5), normalize(uBallVel[i]+1e-5));
      ring *= 0.45+0.85*max(dir,0.0);
      ring += 0.7*exp(-dist*7.0)*length(uBallVel[i])*sin(dist*36.0 - t*6.0);
    }
    h += ring*1.15;
  }
  if(uMode==1) h*=0.30;
  if(uMode==2) h*=0.60;
  if(uMode==4){ h*=0.55; h += 0.55*sin(p.x*5.5 + t*0.6) + 0.45*sin(p.y*4.5 - t*0.5); }
  return h*uIntensity;
}

void main(){
  vec2 uv = vec2(gl_FragCoord.x, uRes.y-gl_FragCoord.y)/uRes.x;
  vec2 C = vec2(0.5, ASP*0.5);
  vec2 outerH = vec2(0.47, ASP*0.5-0.03);
  vec2 innerH = outerH - 0.078;
  float dOuter = sdRB(uv-C, outerH, 0.10);
  float dInner = sdRB(uv-C, innerH, 0.055);
  float pk=1e9; for(int i=0;i<6;i++){ pk=min(pk, length(uv-uPockets[i])-uPocketR); }

  vec3 col;
  if(uv.x<0.02||uv.x>0.98||dOuter>0.0){
    col=uVoid;
  } else if(pk<0.0){
    float tt=clamp((uPocketR+pk)/uPocketR,0.0,1.0);
    col=mix(uFelt*0.28, vec3(0.012,0.014,0.018), 1.0-tt)*0.6;
  } else if(dInner>0.0){
    float railT=clamp(dInner/0.078,0.0,1.0); float bevel=sin(railT*PI);
    vec3 metal=uRail*(0.85+0.15*fbm(vec2(uv.x*8.0,uv.y*60.0)));
    col=metal*(0.55+0.6*bevel)+pow(bevel,6.0)*0.25;
    if(dInner<0.008) col*=0.4;
    col*=smoothstep(-0.004,0.03,pk);
  } else {
    /* ------- WATER SURFACE ------- */
    float e=0.0035;
    float h0=waterH(uv), hx=waterH(uv+vec2(e,0.)), hy=waterH(uv+vec2(0.,e));
    vec3 N=normalize(vec3(h0-hx, h0-hy, e*5.5));
    vec3 L=normalize(vec3(-0.4,-0.55,0.8));
    vec3 water=uFelt*(0.80+0.38*h0);
    float fres=pow(1.0-clamp(N.z,0.0,1.0),3.0);
    vec3 sky=mix(uFelt*1.5, vec3(0.86,0.93,1.0), 0.6);
    float refl = uMode==1 ? 0.9 : 0.42;
    water=mix(water, sky, fres*refl);
    float spec=pow(max(dot(reflect(-L,N),vec3(0.,0.,1.)),0.0), uMode==1?140.0:90.0);
    water += spec*vec3(1.0)*0.75;
    if(uMode==2){
      float c=caustic(uv);
      water += smoothstep(2.2,3.8,c)*vec3(0.55,0.85,0.78)*0.5;
      water += pow(max(c-1.5,0.0)*0.15,2.0)*uFelt;
    }
    if(uMode==4){ water += 0.10*fbm(uv*3.0+uTime*0.1)*vec3(0.7,0.9,0.85); } // dappled
    float cushShadow=smoothstep(0.0,-0.09,dInner);
    water*=1.0-0.30*cushShadow;
    water*=0.6+0.4*smoothstep(0.0,0.02,pk); // pocket lip
    col=water;
  }

  // ball ground shadows
  for(int i=0;i<${MAX_BALLS};i++){ if(i>=uCount) break; float s=uBallScale[i]; if(s<=0.01) continue;
    float sd=length(uv-(uBallPos[i]+vec2(0.012,0.02)))/(uR*s); col*=1.0-0.4*smoothstep(1.5,0.5,sd); }

  // chrome balls (locked material)
  float bestZ=-1.0; vec3 bc=vec3(0.); vec2 bcen=vec2(0.); float br=uR, bd=0.; bool hit=false;
  for(int i=0;i<${MAX_BALLS};i++){ if(i>=uCount) break; float s=uBallScale[i]; if(s<=0.01) continue;
    float r=uR*s; float d=length(uv-uBallPos[i])/r;
    if(d<1.0){ float z=sqrt(max(0.,1.-d*d)); if(z>bestZ){bestZ=z;bc=uBallCol[i];bcen=uBallPos[i];br=r;bd=d;hit=true;} } }
  if(hit){
    vec2 q=(uv-bcen)/br; vec3 n=normalize(vec3(q,bestZ+0.001));
    float amp=0.09*(1.0+uEnergy*3.0);
    n.xy += amp*vec2(fbm(q*3.5+uTime*0.5), fbm(q*3.5-uTime*0.4)); n=normalize(n);
    vec3 V=vec3(0.,0.,1.), L=normalize(vec3(-0.4,-0.55,0.8)); vec3 rd=reflect(-V,n);
    float env=0.5+0.5*rd.y; vec3 chrome=mix(uEnvBottom,uEnvTop,env);
    chrome += pow(max(dot(reflect(-L,n),V),0.0),42.0);
    chrome = mix(chrome, bc*0.7+chrome*0.5, 0.22);
    chrome += pow(1.0-clamp(n.z,0.0,1.0),3.0)*1.1*uRim;
    col=mix(col, chrome, smoothstep(1.0,0.93,bd));
  }

  col += smoothstep(0.13,0.0,length(uv-uPointer))*uRim*0.12;
  vec2 vd=uv-C; col*=1.0-0.14*dot(vd*vec2(1.0,0.62),vd*vec2(1.0,0.62));
  gl_FragColor=vec4(col,1.0);
}`;

type BallRender = { x: number; y: number; vx: number; vy: number; col: [number, number, number]; scale: number };

export default function WaterLab() {
  const [mode, setMode] = useState(0);
  const [intensity, setIntensity] = useState(1.0);
  const [speed, setSpeed] = useState(0.6);
  const modeRef = useRef(mode); modeRef.current = mode;
  const intRef = useRef(intensity); intRef.current = intensity;
  const spdRef = useRef(speed); spdRef.current = speed;

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

  // ---- renderer ----
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: true }); if (!gl) return;
    const cs = (t: number, s: string) => { const sh = gl.createShader(t)!; gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh)); return sh; };
    const prog = gl.createProgram()!; gl.attachShader(prog, cs(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const u = {
      res: U("uRes"), time: U("uTime"), energy: U("uEnergy"), intensity: U("uIntensity"), speed: U("uSpeed"),
      mode: U("uMode"), count: U("uCount"), pos: U("uBallPos"), vel: U("uBallVel"), col: U("uBallCol"), scale: U("uBallScale"),
      r: U("uR"), pocketR: U("uPocketR"), pointer: U("uPointer"), pockets: U("uPockets"),
      envTop: U("uEnvTop"), envBottom: U("uEnvBottom"), rim: U("uRim"), felt: U("uFelt"), rail: U("uRail"), vd: U("uVoid"),
    };
    gl.uniform2fv(u.pockets, new Float32Array(POCKETS_N.flat()));
    gl.uniform3fv(u.envTop, hexToRgb(PAL.envTop)); gl.uniform3fv(u.envBottom, hexToRgb(PAL.envBottom));
    gl.uniform3fv(u.rim, hexToRgb(PAL.rim)); gl.uniform3fv(u.felt, hexToRgb(PAL.felt));
    gl.uniform3fv(u.rail, hexToRgb(PAL.rail)); gl.uniform3fv(u.vd, hexToRgb(PAL.void));
    gl.uniform1f(u.r, BALL_RADIUS / PHYS_W); gl.uniform1f(u.pocketR, 0.05);

    let raf = 0, dead = false; const t0 = performance.now();
    const render = (now: number) => {
      if (dead) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth * dpr, h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
      const balls = posRef.current; const n = Math.min(balls.length, MAX_BALLS);
      const pos = new Float32Array(MAX_BALLS * 2), vel = new Float32Array(MAX_BALLS * 2), col = new Float32Array(MAX_BALLS * 3), sc = new Float32Array(MAX_BALLS);
      for (let i = 0; i < n; i++) {
        pos[i * 2] = balls[i].x / 100; pos[i * 2 + 1] = (balls[i].y / 100) * ASPECT;
        vel[i * 2] = balls[i].vx; vel[i * 2 + 1] = balls[i].vy;
        col[i * 3] = balls[i].col[0]; col[i * 3 + 1] = balls[i].col[1]; col[i * 3 + 2] = balls[i].col[2]; sc[i] = balls[i].scale;
      }
      gl.uniform2f(u.res, canvas.width, canvas.height); gl.uniform1f(u.time, (now - t0) / 1000);
      gl.uniform1f(u.energy, energyRef.current); gl.uniform1f(u.intensity, intRef.current); gl.uniform1f(u.speed, spdRef.current);
      gl.uniform1i(u.mode, modeRef.current); gl.uniform1i(u.count, n);
      gl.uniform2fv(u.pos, pos); gl.uniform2fv(u.vel, vel); gl.uniform3fv(u.col, col); gl.uniform1fv(u.scale, sc);
      gl.uniform2f(u.pointer, pointerRef.current.x, pointerRef.current.y * ASPECT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => { dead = true; cancelAnimationFrame(raf); };
  }, []);

  const handleShoot = useCallback(({ aimAngleDeg, pullback }: ShotInfo) => {
    const cb = cueBody.current; if (!cb || shotInFlight.current) return;
    const speed = (pullback / PULLBACK_MAX) * MAX_SHOT_SPEED; const a = (aimAngleDeg * Math.PI) / 180;
    Matter.Body.setVelocity(cb, { x: Math.cos(a) * speed, y: Math.sin(a) * speed }); shotInFlight.current = true;
  }, []);
  const { cueAngle, aimAngle, pullback, isHovering, isAiming, bind } = useCueAim(tableRef, positions.cueBall.x, positions.cueBall.y, { onShoot: handleShoot });

  useEffect(() => {
    const engine = Matter.Engine.create(); engine.gravity.scale = 0; const world = engine.world; worldObj.current = world;
    const bs = RACK.map((b) => Matter.Bodies.circle((b.x / 100) * PHYS_W, (b.y / 100) * PHYS_H, BALL_RADIUS, { restitution: 0.9, friction: 0.001, frictionAir: 0.012, density: 0.001, label: `ball-${b.number}` }));
    const cb = Matter.Bodies.circle((CUE_INIT.x / 100) * PHYS_W, (CUE_INIT.y / 100) * PHYS_H, BALL_RADIUS, { restitution: 0.9, friction: 0.001, frictionAir: 0.012, density: 0.001, label: "cue-ball" });
    bodies.current = bs; cueBody.current = cb;
    const o = { isStatic: true, restitution: 0.8, friction: 0.05 }; const pw = PHYS_W - 2 * CX, ph = PHYS_H - 2 * CY;
    const cush = [
      Matter.Bodies.rectangle(PHYS_W / 2, CY - CT / 2, pw + CT * 2, CT, o), Matter.Bodies.rectangle(PHYS_W / 2, PHYS_H - CY + CT / 2, pw + CT * 2, CT, o),
      Matter.Bodies.rectangle(CX - CT / 2, PHYS_H / 2, CT, ph + CT * 2, o), Matter.Bodies.rectangle(PHYS_W - CX + CT / 2, PHYS_H / 2, CT, ph + CT * 2, o),
    ];
    const pb = POCKETS.map((p) => Matter.Bodies.circle(p.x, p.y, POCKET_RADIUS, { isStatic: true, isSensor: true, label: p.label }));
    Matter.World.add(world, [...bs, cb, ...cush, ...pb]);
    const onCol = (e: Matter.IEventCollision<Matter.Engine>) => {
      for (const pair of e.pairs) {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        const pkIdx = labels.findIndex((l) => l.startsWith("pocket-")); if (pkIdx === -1) continue;
        const pnum = parseInt(labels[pkIdx].slice(7), 10);
        const bl = labels.find((l) => l.startsWith("ball-"));
        if (bl) { const num = parseInt(bl.slice(5), 10);
          if (!pocketed.current.has(num)) { pocketed.current.add(num); const idx = RACK.findIndex((r) => r.number === num); const body = bs[idx];
            dropRef.current.push({ x: (body.position.x / PHYS_W) * 100, y: (body.position.y / PHYS_H) * 100, px: (POCKETS[pnum].x / PHYS_W) * 100, py: (POCKETS[pnum].y / PHYS_H) * 100, col: hexToRgb(RACK[idx].color), t0: performance.now() });
            Matter.Body.setVelocity(body, { x: 0, y: 0 }); Matter.World.remove(world, body); } }
        if (labels.includes("cue-ball")) { Matter.Body.setPosition(cb, { x: (CUE_INIT.x / 100) * PHYS_W, y: (CUE_INIT.y / 100) * PHYS_H }); Matter.Body.setVelocity(cb, { x: 0, y: 0 }); }
      }
    };
    Matter.Events.on(engine, "collisionStart", onCol);
    let raf = 0, dead = false, last = performance.now(); const all = [...bs, cb];
    const tick = (now: number) => {
      if (dead) return; Matter.Engine.update(engine, Math.min(now - last, 32)); last = now;
      let energy = 0; const rp: BallRender[] = [];
      bs.forEach((b, i) => { if (pocketed.current.has(RACK[i].number)) return; energy += Math.hypot(b.velocity.x, b.velocity.y);
        rp.push({ x: (b.position.x / PHYS_W) * 100, y: (b.position.y / PHYS_H) * 100, vx: b.velocity.x / MAX_SHOT_SPEED, vy: b.velocity.y / MAX_SHOT_SPEED, col: hexToRgb(RACK[i].color), scale: 1 }); });
      energy += Math.hypot(cb.velocity.x, cb.velocity.y);
      rp.push({ x: (cb.position.x / PHYS_W) * 100, y: (cb.position.y / PHYS_H) * 100, vx: cb.velocity.x / MAX_SHOT_SPEED, vy: cb.velocity.y / MAX_SHOT_SPEED, col: [0.98, 0.96, 0.93], scale: 1 });
      dropRef.current = dropRef.current.filter((d) => { const t = (now - d.t0) / 260; if (t >= 1) return false; const e = t * t;
        rp.push({ x: d.x + (d.px - d.x) * e, y: d.y + (d.py - d.y) * e, vx: 0, vy: 0, col: d.col, scale: 1 - t }); return true; });
      posRef.current = rp; energyRef.current = Math.min(1, energy / 60);
      setPositions({ cueBall: { x: (cb.position.x / PHYS_W) * 100, y: (cb.position.y / PHYS_H) * 100 } });
      if (shotInFlight.current && all.every((b) => Math.hypot(b.velocity.x, b.velocity.y) < REST_V)) shotInFlight.current = false;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { dead = true; cancelAnimationFrame(raf); Matter.Events.off(engine, "collisionStart", onCol); Matter.World.clear(world, false); Matter.Engine.clear(engine); worldObj.current = null; bodies.current = []; cueBody.current = null; pocketed.current.clear(); };
  }, []);

  const reset = () => {
    const world = worldObj.current, cb = cueBody.current; if (!world || !cb) return;
    RACK.forEach((m, i) => { const b = bodies.current[i]; Matter.Body.setPosition(b, { x: (m.x / 100) * PHYS_W, y: (m.y / 100) * PHYS_H }); Matter.Body.setVelocity(b, { x: 0, y: 0 }); if (pocketed.current.has(m.number)) Matter.World.add(world, b); });
    Matter.Body.setPosition(cb, { x: (CUE_INIT.x / 100) * PHYS_W, y: (CUE_INIT.y / 100) * PHYS_H }); Matter.Body.setVelocity(cb, { x: 0, y: 0 });
    pocketed.current.clear(); dropRef.current = []; shotInFlight.current = false;
  };

  useEffect(() => { const onKey = (e: KeyboardEvent) => { const k = Number(e.key); if (k >= 1 && k <= MODES.length) setMode(k - 1); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center py-10" style={{ background: "#0b0b0e" }}>
      <div ref={tableRef} className="relative" style={{ width: "min(390px, calc((100vh - 180px) / 1.79))", aspectRatio: "768 / 1376" }}
        onPointerMove={(e) => { const r = tableRef.current!.getBoundingClientRect(); pointerRef.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: "block" }} />
        <AimGuide aimAngle={aimAngle} visible={isAiming} cueBallX={positions.cueBall.x} cueBallY={positions.cueBall.y} />
        <CueStick angle={cueAngle} pullback={pullback} x={positions.cueBall.x} y={positions.cueBall.y} visible={!shotInFlight.current} />
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 50, touchAction: "none", cursor: isHovering ? "crosshair" : "default" }} {...bind} />
      </div>

      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-3">
        <div className="flex items-center gap-4 px-4 py-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <label className="flex items-center gap-2 text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.7)" }}>
            intensity <input type="range" min={0} max={2} step={0.02} value={intensity} onChange={(e) => setIntensity(parseFloat(e.target.value))} className="accent-[#E0965A] w-24" />
          </label>
          <label className="flex items-center gap-2 text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.7)" }}>
            speed <input type="range" min={0} max={2} step={0.02} value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="accent-[#E0965A] w-24" />
          </label>
        </div>
        <div className="flex items-center gap-1 rounded-full p-1.5" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)" }}>
          {MODES.map((m, i) => (
            <button key={m.id} onClick={() => setMode(i)} className="px-3 py-2 rounded-full text-[12.5px] font-mono transition-all"
              style={{ backgroundColor: mode === i ? "#C97836" : "transparent", color: mode === i ? "#fff" : "rgba(255,255,255,0.7)" }}>
              <span className="opacity-50 mr-1">{i + 1}</span>{m.name}
            </button>
          ))}
          <button onClick={reset} className="px-3 py-2 rounded-full text-[12.5px] font-mono ml-1" style={{ color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.14)" }}>reset ↺</button>
        </div>
        <p className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>{MODES[mode].blurb} · drag to break — the balls ripple the water</p>
      </div>
    </main>
  );
}
