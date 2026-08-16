"use client";

/**
 * TEXTURE-LAB — five surface textures for the playing area.
 * -------------------------------------------------------------------
 * Same locked palette + chrome balls + table (rails/pockets) as the other labs,
 * but the felt is swapped for five procedural surface textures to compare.
 * Physics kept — drag to break, balls sink into the pockets. Not in nav.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { useCueAim, type ShotInfo } from "@/hooks/useCueAim";
import CueStick from "@/components/snooker/CueStick";
import AimGuide from "@/components/snooker/AimGuide";

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
const hexToRgb = (h: string): [number, number, number] => { const n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const PAL = { envTop: "#E0752E", envBottom: "#3d2410", rim: "#E9B84A", felt: "#63978A", rail: "#E6E8D2", void: "#0b0b0e" };

const MODES = [
  { name: "Woven Felt", blurb: "realistic billiard cloth — basket weave + fuzz" },
  { name: "Brushed Velvet", blurb: "anisotropic nap, luxe directional sheen" },
  { name: "Marble", blurb: "polished veined stone, glossy" },
  { name: "Zen Sand", blurb: "raked sand ripples, matte grain" },
  { name: "Iridescent Foil", blurb: "holographic shimmer, shifting hues" },
];

const VERT = `attribute vec2 p; void main(){ gl_Position=vec4(p,0.,1.); }`;
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime, uEnergy, uScale, uSheen;
uniform int uMode, uCount;
uniform vec2 uBallPos[${MAX_BALLS}]; uniform vec3 uBallCol[${MAX_BALLS}]; uniform float uBallScale[${MAX_BALLS}];
uniform float uR, uPocketR; uniform vec2 uPointer, uPockets[6];
uniform vec3 uEnvTop, uEnvBottom, uRim, uFelt, uRail, uVoid;
const float PI=3.14159265, ASP=${ASPECT.toFixed(5)};
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=0.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.03;a*=0.5;}return v;}
float sdRB(vec2 p, vec2 b, float r){ vec2 d=abs(p)-b+r; return length(max(d,0.))+min(max(d.x,d.y),0.)-r; }

vec3 surfaceTex(vec2 p, vec2 C){
  float sc=uScale; vec3 c;
  if(uMode==0){                                  // woven felt
    vec2 g=p*(160.0*sc);
    float basket=step(0.5, fract((floor(g.x)+floor(g.y))*0.5));
    float thread=mix(sin(g.x)*0.5+0.5, sin(g.y)*0.5+0.5, basket);
    float fuzz=fbm(p*(300.0*sc));
    c=uFelt*(0.80+0.28*thread)+fuzz*0.06;
    c+=uSheen*0.05*pow(thread,3.0);
  } else if(uMode==1){                           // brushed velvet
    float nap=fbm(vec2(p.x*(240.0*sc), p.y*(22.0*sc)));
    float streak=0.5+0.5*sin(p.y*(24.0*sc));
    c=uFelt*(0.66+0.52*nap);
    c+=uSheen*0.14*pow(streak,2.0)*vec3(1.0,0.98,0.9);
  } else if(uMode==2){                           // marble
    vec2 q=p*(2.6*sc);
    float w=fbm(q+1.5*fbm(q*2.0+fbm(q*4.0)));
    float vein=smoothstep(0.35,0.66, abs(sin(w*5.5+p.x*2.0)));
    c=mix(uFelt*1.7, vec3(0.96,0.97,0.93), vein);
    float e=0.004; float wx=fbm((q+vec2(e,0.0)))-w;
    c+=uSheen*0.35*smoothstep(0.0,0.02,abs(wx));
  } else if(uMode==3){                           // zen sand
    float d=length((p-C)*vec2(1.0,0.9));
    float rake=sin(d*(150.0*sc))*0.5+0.5;
    float straight=sin(p.x*(90.0*sc))*0.5+0.5;
    float rings=mix(rake,straight,0.35);
    float grain=fbm(p*(400.0*sc));
    c=mix(uFelt*0.85, uFelt*1.18, rings)+grain*0.06;
    c*=1.0-0.15*smoothstep(0.45,0.5,rings);
  } else {                                        // iridescent foil
    float f=fbm(p*(4.0*sc))+uTime*0.08;
    vec3 irid=0.5+0.5*cos(6.2831*(f+vec3(0.0,0.33,0.67)));
    c=mix(uFelt, irid, 0.55);
    c+=uSheen*0.2*pow(0.5+0.5*sin(f*10.0),3.0);
  }
  return c;
}

void main(){
  vec2 uv=vec2(gl_FragCoord.x, uRes.y-gl_FragCoord.y)/uRes.x;
  vec2 C=vec2(0.5, ASP*0.5);
  vec2 outerH=vec2(0.47, ASP*0.5-0.03), innerH=outerH-0.078;
  float dOuter=sdRB(uv-C, outerH, 0.10), dInner=sdRB(uv-C, innerH, 0.055);
  float pk=1e9; for(int i=0;i<6;i++){ pk=min(pk, length(uv-uPockets[i])-uPocketR); }
  vec3 col;
  if(uv.x<0.02||uv.x>0.98||dOuter>0.0){ col=uVoid; }
  else if(pk<0.0){ float tt=clamp((uPocketR+pk)/uPocketR,0.0,1.0); col=mix(uFelt*0.28, vec3(0.012,0.014,0.018), 1.0-tt)*0.6; }
  else if(dInner>0.0){
    float railT=clamp(dInner/0.078,0.0,1.0); float bevel=sin(railT*PI);
    vec3 metal=uRail*(0.85+0.15*fbm(vec2(uv.x*8.0,uv.y*60.0)));
    col=metal*(0.55+0.6*bevel)+pow(bevel,6.0)*0.25;
    if(dInner<0.008) col*=0.4; col*=smoothstep(-0.004,0.03,pk);
  } else {
    vec3 c=surfaceTex(uv, C);
    float cushShadow=smoothstep(0.0,-0.09,dInner); c*=1.0-0.30*cushShadow;
    c*=0.6+0.4*smoothstep(0.0,0.02,pk);
    col=c;
  }
  for(int i=0;i<${MAX_BALLS};i++){ if(i>=uCount) break; float s=uBallScale[i]; if(s<=0.01) continue;
    float sd=length(uv-(uBallPos[i]+vec2(0.012,0.02)))/(uR*s); col*=1.0-0.4*smoothstep(1.5,0.5,sd); }
  float bestZ=-1.0; vec3 bc=vec3(0.); vec2 bcen=vec2(0.); float br=uR, bd=0.; bool hit=false;
  for(int i=0;i<${MAX_BALLS};i++){ if(i>=uCount) break; float s=uBallScale[i]; if(s<=0.01) continue;
    float r=uR*s; float d=length(uv-uBallPos[i])/r;
    if(d<1.0){ float z=sqrt(max(0.,1.-d*d)); if(z>bestZ){bestZ=z;bc=uBallCol[i];bcen=uBallPos[i];br=r;bd=d;hit=true;} } }
  if(hit){
    vec2 q=(uv-bcen)/br; vec3 n=normalize(vec3(q,bestZ+0.001));
    float amp=0.09*(1.0+uEnergy*3.0); n.xy+=amp*vec2(fbm(q*3.5+uTime*0.5), fbm(q*3.5-uTime*0.4)); n=normalize(n);
    vec3 V=vec3(0.,0.,1.), L=normalize(vec3(-0.4,-0.55,0.8)); vec3 rd=reflect(-V,n);
    float env=0.5+0.5*rd.y; vec3 chrome=mix(uEnvBottom,uEnvTop,env);
    chrome+=pow(max(dot(reflect(-L,n),V),0.0),42.0); chrome=mix(chrome, bc*0.7+chrome*0.5, 0.22);
    chrome+=pow(1.0-clamp(n.z,0.0,1.0),3.0)*1.1*uRim;
    col=mix(col, chrome, smoothstep(1.0,0.93,bd));
  }
  col+=smoothstep(0.13,0.0,length(uv-uPointer))*uRim*0.12;
  vec2 vd=uv-C; col*=1.0-0.14*dot(vd*vec2(1.0,0.62),vd*vec2(1.0,0.62));
  gl_FragColor=vec4(col,1.0);
}`;

type BallRender = { x: number; y: number; col: [number, number, number]; scale: number };

export default function TextureLab() {
  const [mode, setMode] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [sheen, setSheen] = useState(0.5);
  const modeRef = useRef(mode); modeRef.current = mode;
  const scaleRef = useRef(scale); scaleRef.current = scale;
  const sheenRef = useRef(sheen); sheenRef.current = sheen;

  const tableRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [positions, setPositions] = useState(() => ({ cueBall: { x: CUE_INIT.x, y: CUE_INIT.y } }));
  const posRef = useRef<BallRender[]>([]);
  const pointerRef = useRef({ x: 0.5, y: 0.5 });
  const energyRef = useRef(0);
  const dropRef = useRef<{ x: number; y: number; px: number; py: number; col: [number, number, number]; t0: number }[]>([]);
  const bodies = useRef<Matter.Body[]>([]); const cueBody = useRef<Matter.Body | null>(null);
  const worldObj = useRef<Matter.World | null>(null); const shotInFlight = useRef(false); const pocketed = useRef<Set<number>>(new Set());

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: true }); if (!gl) return;
    const cs = (t: number, s: string) => { const sh = gl.createShader(t)!; gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh)); return sh; };
    const prog = gl.createProgram()!; gl.attachShader(prog, cs(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const u = { res: U("uRes"), time: U("uTime"), energy: U("uEnergy"), scale: U("uScale"), sheen: U("uSheen"), mode: U("uMode"), count: U("uCount"),
      pos: U("uBallPos"), col: U("uBallCol"), bscale: U("uBallScale"), r: U("uR"), pocketR: U("uPocketR"), pointer: U("uPointer"), pockets: U("uPockets"),
      envTop: U("uEnvTop"), envBottom: U("uEnvBottom"), rim: U("uRim"), felt: U("uFelt"), rail: U("uRail"), vd: U("uVoid") };
    gl.uniform2fv(u.pockets, new Float32Array(POCKETS_N.flat()));
    gl.uniform3fv(u.envTop, hexToRgb(PAL.envTop)); gl.uniform3fv(u.envBottom, hexToRgb(PAL.envBottom)); gl.uniform3fv(u.rim, hexToRgb(PAL.rim));
    gl.uniform3fv(u.felt, hexToRgb(PAL.felt)); gl.uniform3fv(u.rail, hexToRgb(PAL.rail)); gl.uniform3fv(u.vd, hexToRgb(PAL.void));
    gl.uniform1f(u.r, BALL_RADIUS / PHYS_W); gl.uniform1f(u.pocketR, 0.05);
    let raf = 0, dead = false; const t0 = performance.now();
    const render = (now: number) => {
      if (dead) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2); const w = canvas.clientWidth * dpr, h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
      const balls = posRef.current; const n = Math.min(balls.length, MAX_BALLS);
      const pos = new Float32Array(MAX_BALLS * 2), col = new Float32Array(MAX_BALLS * 3), sc = new Float32Array(MAX_BALLS);
      for (let i = 0; i < n; i++) { pos[i * 2] = balls[i].x / 100; pos[i * 2 + 1] = (balls[i].y / 100) * ASPECT; col[i * 3] = balls[i].col[0]; col[i * 3 + 1] = balls[i].col[1]; col[i * 3 + 2] = balls[i].col[2]; sc[i] = balls[i].scale; }
      gl.uniform2f(u.res, canvas.width, canvas.height); gl.uniform1f(u.time, (now - t0) / 1000); gl.uniform1f(u.energy, energyRef.current);
      gl.uniform1f(u.scale, scaleRef.current); gl.uniform1f(u.sheen, sheenRef.current); gl.uniform1i(u.mode, modeRef.current); gl.uniform1i(u.count, n);
      gl.uniform2fv(u.pos, pos); gl.uniform3fv(u.col, col); gl.uniform1fv(u.bscale, sc);
      gl.uniform2f(u.pointer, pointerRef.current.x, pointerRef.current.y * ASPECT);
      gl.drawArrays(gl.TRIANGLES, 0, 3); raf = requestAnimationFrame(render);
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
    const cush = [Matter.Bodies.rectangle(PHYS_W / 2, CY - CT / 2, pw + CT * 2, CT, o), Matter.Bodies.rectangle(PHYS_W / 2, PHYS_H - CY + CT / 2, pw + CT * 2, CT, o), Matter.Bodies.rectangle(CX - CT / 2, PHYS_H / 2, CT, ph + CT * 2, o), Matter.Bodies.rectangle(PHYS_W - CX + CT / 2, PHYS_H / 2, CT, ph + CT * 2, o)];
    const pb = POCKETS.map((p) => Matter.Bodies.circle(p.x, p.y, POCKET_RADIUS, { isStatic: true, isSensor: true, label: p.label }));
    Matter.World.add(world, [...bs, cb, ...cush, ...pb]);
    const onCol = (e: Matter.IEventCollision<Matter.Engine>) => { for (const pair of e.pairs) { const labels = [pair.bodyA.label, pair.bodyB.label]; const pkIdx = labels.findIndex((l) => l.startsWith("pocket-")); if (pkIdx === -1) continue; const pnum = parseInt(labels[pkIdx].slice(7), 10); const bl = labels.find((l) => l.startsWith("ball-"));
      if (bl) { const num = parseInt(bl.slice(5), 10); if (!pocketed.current.has(num)) { pocketed.current.add(num); const idx = RACK.findIndex((r) => r.number === num); const body = bs[idx]; dropRef.current.push({ x: (body.position.x / PHYS_W) * 100, y: (body.position.y / PHYS_H) * 100, px: (POCKETS[pnum].x / PHYS_W) * 100, py: (POCKETS[pnum].y / PHYS_H) * 100, col: hexToRgb(RACK[idx].color), t0: performance.now() }); Matter.Body.setVelocity(body, { x: 0, y: 0 }); Matter.World.remove(world, body); } }
      if (labels.includes("cue-ball")) { Matter.Body.setPosition(cb, { x: (CUE_INIT.x / 100) * PHYS_W, y: (CUE_INIT.y / 100) * PHYS_H }); Matter.Body.setVelocity(cb, { x: 0, y: 0 }); } } };
    Matter.Events.on(engine, "collisionStart", onCol);
    let raf = 0, dead = false, last = performance.now(); const all = [...bs, cb];
    const tick = (now: number) => { if (dead) return; Matter.Engine.update(engine, Math.min(now - last, 32)); last = now; let energy = 0; const rp: BallRender[] = [];
      bs.forEach((b, i) => { if (pocketed.current.has(RACK[i].number)) return; energy += Math.hypot(b.velocity.x, b.velocity.y); rp.push({ x: (b.position.x / PHYS_W) * 100, y: (b.position.y / PHYS_H) * 100, col: hexToRgb(RACK[i].color), scale: 1 }); });
      energy += Math.hypot(cb.velocity.x, cb.velocity.y); rp.push({ x: (cb.position.x / PHYS_W) * 100, y: (cb.position.y / PHYS_H) * 100, col: [0.98, 0.96, 0.93], scale: 1 });
      dropRef.current = dropRef.current.filter((d) => { const t = (now - d.t0) / 260; if (t >= 1) return false; const e = t * t; rp.push({ x: d.x + (d.px - d.x) * e, y: d.y + (d.py - d.y) * e, col: d.col, scale: 1 - t }); return true; });
      posRef.current = rp; energyRef.current = Math.min(1, energy / 60);
      setPositions({ cueBall: { x: (cb.position.x / PHYS_W) * 100, y: (cb.position.y / PHYS_H) * 100 } });
      if (shotInFlight.current && all.every((b) => Math.hypot(b.velocity.x, b.velocity.y) < REST_V)) shotInFlight.current = false;
      raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => { dead = true; cancelAnimationFrame(raf); Matter.Events.off(engine, "collisionStart", onCol); Matter.World.clear(world, false); Matter.Engine.clear(engine); worldObj.current = null; bodies.current = []; cueBody.current = null; pocketed.current.clear(); };
  }, []);

  const reset = () => { const world = worldObj.current, cb = cueBody.current; if (!world || !cb) return;
    RACK.forEach((m, i) => { const b = bodies.current[i]; Matter.Body.setPosition(b, { x: (m.x / 100) * PHYS_W, y: (m.y / 100) * PHYS_H }); Matter.Body.setVelocity(b, { x: 0, y: 0 }); if (pocketed.current.has(m.number)) Matter.World.add(world, b); });
    Matter.Body.setPosition(cb, { x: (CUE_INIT.x / 100) * PHYS_W, y: (CUE_INIT.y / 100) * PHYS_H }); Matter.Body.setVelocity(cb, { x: 0, y: 0 }); pocketed.current.clear(); dropRef.current = []; shotInFlight.current = false; };

  useEffect(() => { const onKey = (e: KeyboardEvent) => { const k = Number(e.key); if (k >= 1 && k <= MODES.length) setMode(k - 1); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center py-10" style={{ background: "#0b0b0e" }}>
      <div ref={tableRef} className="relative" style={{ width: "min(390px, calc((100vh - 200px) / 1.79))", aspectRatio: "768 / 1376" }}
        onPointerMove={(e) => { const r = tableRef.current!.getBoundingClientRect(); pointerRef.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: "block" }} />
        <AimGuide aimAngle={aimAngle} visible={isAiming} cueBallX={positions.cueBall.x} cueBallY={positions.cueBall.y} />
        <CueStick angle={cueAngle} pullback={pullback} x={positions.cueBall.x} y={positions.cueBall.y} visible={!shotInFlight.current} />
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 50, touchAction: "none", cursor: isHovering ? "crosshair" : "default" }} {...bind} />
      </div>
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-3">
        <div className="flex items-center gap-4 px-4 py-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <label className="flex items-center gap-2 text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.7)" }}>scale <input type="range" min={0.3} max={2.2} step={0.02} value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="accent-[#E0965A] w-24" /></label>
          <label className="flex items-center gap-2 text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.7)" }}>sheen <input type="range" min={0} max={1.5} step={0.02} value={sheen} onChange={(e) => setSheen(parseFloat(e.target.value))} className="accent-[#E0965A] w-24" /></label>
        </div>
        <div className="flex items-center gap-1 rounded-full p-1.5" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)" }}>
          {MODES.map((m, i) => (
            <button key={m.name} onClick={() => setMode(i)} className="px-3 py-2 rounded-full text-[12.5px] font-mono transition-all" style={{ backgroundColor: mode === i ? "#C97836" : "transparent", color: mode === i ? "#fff" : "rgba(255,255,255,0.7)" }}>
              <span className="opacity-50 mr-1">{i + 1}</span>{m.name}
            </button>
          ))}
          <button onClick={reset} className="px-3 py-2 rounded-full text-[12.5px] font-mono ml-1" style={{ color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.14)" }}>reset ↺</button>
        </div>
        <p className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>{MODES[mode].blurb} · drag to break</p>
      </div>
    </main>
  );
}
