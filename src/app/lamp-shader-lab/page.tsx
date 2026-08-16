"use client";

/**
 * LAMP-SHADER-LAB — enamel-red pendant, shader-drawn, with shape + lighting
 * adjusters. Locked material (glossy enamel with a colour picker); every other
 * knob (dome shape, rim, light direction, specular, ambient, glow) is live.
 * Not in nav.
 */

import { useEffect, useRef, useState } from "react";

type P = {
  color: string;
  neck: number; rim: number; top: number; bottom: number; flare: number; lip: number;
  lightX: number; lightY: number; spec: number; ambient: number; glow: number;
};
const DEF: P = {
  color: "#A6291F",
  neck: 0.048, rim: 0.242, top: 0.168, bottom: 0.48, flare: 0.5, lip: 0.024,
  lightX: 0.66, lightY: -0.4, spec: 34, ambient: 0.28, glow: 1.24,
};
const SHAPE: { k: keyof P; label: string; min: number; max: number; step: number }[] = [
  { k: "neck", label: "Neck width", min: 0.02, max: 0.07, step: 0.001 },
  { k: "rim", label: "Rim width", min: 0.12, max: 0.28, step: 0.002 },
  { k: "top", label: "Dome top", min: 0.06, max: 0.2, step: 0.002 },
  { k: "bottom", label: "Dome bottom", min: 0.34, max: 0.6, step: 0.002 },
  { k: "flare", label: "Flare shape", min: 0.3, max: 1.3, step: 0.01 },
  { k: "lip", label: "Rim lip", min: 0, max: 0.04, step: 0.001 },
];
const LIGHT: { k: keyof P; label: string; min: number; max: number; step: number }[] = [
  { k: "lightX", label: "Light X", min: -1, max: 1, step: 0.02 },
  { k: "lightY", label: "Light Y", min: -1, max: 0.2, step: 0.02 },
  { k: "spec", label: "Specular sharpness", min: 6, max: 90, step: 1 },
  { k: "ambient", label: "Ambient", min: 0, max: 0.6, step: 0.01 },
  { k: "glow", label: "Glow", min: 0, max: 1.6, step: 0.02 },
];
const hexToRgb = (h: string): [number, number, number] => { const n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };

const VERT = `attribute vec2 p; void main(){ gl_Position=vec4(p,0.,1.); }`;
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime, uHover;
uniform float uNeck, uRim, uTop, uBottom, uFlare, uLip, uSpec, uAmbient, uGlow;
uniform vec2 uLight; uniform vec3 uColor;
float shadeHW(float t){
  if(t<0.12) return uNeck;
  float body = uNeck + (uRim-uNeck)*pow(clamp((t-0.12)/0.88,0.0,1.0), uFlare);
  body += smoothstep(0.9,1.0,t)*uLip;
  return body;
}
void main(){
  vec2 uv = vec2(gl_FragCoord.x, uRes.y-gl_FragCoord.y)/uRes.x;
  float sway=sin(uTime*0.9)*0.026;
  vec2 pv=uv-vec2(0.5,0.0); float cs=cos(sway),sn=sin(sway);
  vec2 rp=vec2(pv.x*cs-pv.y*sn, pv.x*sn+pv.y*cs)+vec2(0.5,0.0);
  float x=rp.x, y=rp.y;
  vec3 col=vec3(0.0); float alpha=0.0;
  float SY0=uTop, SY1=uBottom;
  vec2 gc=vec2(0.5, SY1+0.03); float gd=length((rp-gc)*vec2(1.0,0.62));
  float glow=smoothstep(0.5,0.0,gd)*uGlow*(0.6+0.4*uHover);
  // Light-yellow glow — bright warm colour, only the OPACITY scales with glow.
  col=vec3(1.0,0.90,0.52); alpha=clamp(glow*0.85, 0.0, 1.0);
  float t=(y-SY0)/(SY1-SY0);
  if(t>=0.0 && t<=1.0){
    float hw=shadeHW(t); float dx=x-0.5;
    if(abs(dx)<hw){
      float nx=clamp(dx/hw,-1.0,1.0); float nz=sqrt(max(0.0,1.0-nx*nx));
      vec3 N=normalize(vec3(nx*0.95,-0.35,nz));
      vec3 L=normalize(vec3(uLight, 0.72));
      float diff=clamp(dot(N,L),0.0,1.0);
      float spec=pow(max(dot(reflect(-L,N),vec3(0,0,1)),0.0), uSpec);
      float fres=pow(1.0-nz,3.0);
      vec3 sc=uColor*(uAmbient+(1.0-uAmbient)*diff)+spec*vec3(1.0);
      sc+=fres*0.3; sc*=0.86+0.14*smoothstep(0.0,0.3,t);
      sc+=smoothstep(0.93,1.0,t)*0.22;
      col=sc; alpha=1.0;
    }
  }
  if(y<SY0 && abs(x-0.5)<0.005){ col=vec3(0.16,0.13,0.11); alpha=1.0; }
  if(y>=SY0-0.02 && y<SY0+0.02 && abs(x-0.5)<0.05){ col=mix(col, vec3(0.12,0.10,0.09), 0.9); alpha=1.0; }
  gl_FragColor=vec4(col, alpha);
}`;

export default function LampShaderLab() {
  const [p, setP] = useState<P>(DEF);
  const pRef = useRef(p); pRef.current = p;
  const [hover, setHover] = useState(false);
  const hoverRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: false }); if (!gl) return;
    const cs = (t: number, s: string) => { const sh = gl.createShader(t)!; gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh)); return sh; };
    const prog = gl.createProgram()!; gl.attachShader(prog, cs(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog); gl.useProgram(prog);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const u = { res: U("uRes"), time: U("uTime"), hover: U("uHover"), neck: U("uNeck"), rim: U("uRim"), top: U("uTop"), bottom: U("uBottom"), flare: U("uFlare"), lip: U("uLip"), spec: U("uSpec"), ambient: U("uAmbient"), glow: U("uGlow"), light: U("uLight"), color: U("uColor") };
    let raf = 0, dead = false; const t0 = performance.now();
    const render = (now: number) => {
      if (dead) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2); const w = canvas.clientWidth * dpr, h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      const v = pRef.current;
      gl.uniform2f(u.res, canvas.width, canvas.height); gl.uniform1f(u.time, (now - t0) / 1000); gl.uniform1f(u.hover, hoverRef.current);
      gl.uniform1f(u.neck, v.neck); gl.uniform1f(u.rim, v.rim); gl.uniform1f(u.top, v.top); gl.uniform1f(u.bottom, v.bottom); gl.uniform1f(u.flare, v.flare); gl.uniform1f(u.lip, v.lip);
      gl.uniform1f(u.spec, v.spec); gl.uniform1f(u.ambient, v.ambient); gl.uniform1f(u.glow, v.glow); gl.uniform2f(u.light, v.lightX, v.lightY); gl.uniform3fv(u.color, hexToRgb(v.color));
      gl.drawArrays(gl.TRIANGLES, 0, 3); raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => { dead = true; cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => { let raf = 0; const tick = () => { hoverRef.current += ((hover ? 1 : 0) - hoverRef.current) * 0.12; raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf); }, [hover]);

  const set = (k: keyof P, val: number | string) => setP((s) => ({ ...s, [k]: val }));
  const Slider = ({ k, label, min, max, step }: { k: keyof P; label: string; min: number; max: number; step: number }) => (
    <label className="flex flex-col gap-1">
      <span className="flex justify-between opacity-70 text-[11px]"><span>{label}</span><span className="opacity-60 tabular-nums">{(p[k] as number).toFixed(step < 0.01 ? 3 : 2)}</span></span>
      <input type="range" min={min} max={max} step={step} value={p[k] as number} onChange={(e) => set(k, parseFloat(e.target.value))} className="accent-[#E0965A]" />
    </label>
  );

  return (
    <main className="min-h-screen flex items-start justify-center gap-8 py-6 px-6" style={{ background: "#FFF5EF" }}>
      <canvas ref={canvasRef} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ width: "min(420px, 60vh)", height: "min(760px, 96vh)", display: "block", cursor: "pointer" }} />
      <aside className="w-[270px] shrink-0 rounded-2xl p-5 text-[13px] sticky top-6" style={{ background: "rgba(30,24,18,0.92)", border: "1px solid rgba(255,255,255,0.1)", color: "#EDE6DE" }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-mono text-[13px]" style={{ color: "#E0965A" }}>ENAMEL LAMP</h1>
          <button onClick={() => setP(DEF)} className="font-mono text-[11px] px-2.5 py-1 rounded-full" style={{ border: "1px solid rgba(255,255,255,0.15)", color: "#bbb" }}>reset ↺</button>
        </div>
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input type="color" value={p.color} onChange={(e) => set("color", e.target.value)} className="w-8 h-8 rounded-md bg-transparent cursor-pointer" style={{ border: "1px solid rgba(255,255,255,0.15)" }} />
          <span className="opacity-70 text-[12px]">enamel colour</span>
        </label>
        <div className="font-mono text-[10px] uppercase tracking-wider opacity-40 mb-2">Shape</div>
        <div className="flex flex-col gap-2.5 mb-5">{SHAPE.map((s) => <Slider key={s.k} {...s} />)}</div>
        <div className="font-mono text-[10px] uppercase tracking-wider opacity-40 mb-2">Lighting</div>
        <div className="flex flex-col gap-2.5">{LIGHT.map((s) => <Slider key={s.k} {...s} />)}</div>
      </aside>
    </main>
  );
}
