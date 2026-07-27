"use client";

/**
 * ShaderPendantLamp
 * -----------------
 * Hero pendant lamp rendered in a WebGL fragment shader (cord + enamel dome +
 * warm cast glow). Behaviour:
 *   • longer cord so the shade hangs just above the "open for full-time" chip
 *   • fades in with a swing on load
 *   • hover → a damped spring swing (real oscillation that settles to still)
 * The swing angle comes from a damped-harmonic simulation in JS, fed to the
 * shader as uSway each frame. Transparent outside the lamp; hangs top-left.
 */

import { useEffect, useRef, useState } from "react";

const hexToRgb = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

// Locked look (from lamp-shader-lab), with a longer cord (top/bottom raised).
const LAMP = {
  color: "#A6291F",
  neck: 0.048, rim: 0.242, top: 0.4, bottom: 0.712, flare: 0.5, lip: 0.024,
  lightX: 0.66, lightY: -0.4, spec: 34, ambient: 0.28, glow: 0.92,
  scale: 0.68, // lamp drawn at 0.68 of the (larger) canvas → room for the glow to swing
};

const VERT = `attribute vec2 p; void main(){ gl_Position=vec4(p,0.,1.); }`;
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uSway;
uniform float uNeck, uRim, uTop, uBottom, uFlare, uLip, uSpec, uAmbient, uGlow, uScale;
uniform vec2 uLight; uniform vec3 uColor;
float shadeHW(float t){
  if(t<0.12) return uNeck;
  float body = uNeck + (uRim-uNeck)*pow(clamp((t-0.12)/0.88,0.0,1.0), uFlare);
  body += smoothstep(0.9,1.0,t)*uLip; return body;
}
void main(){
  vec2 uv = vec2(gl_FragCoord.x, uRes.y-gl_FragCoord.y)/uRes.x;
  vec2 pv=uv-vec2(0.5,0.0); float cs=cos(uSway),sn=sin(uSway);
  vec2 rp=vec2(pv.x*cs-pv.y*sn, pv.x*sn+pv.y*cs)+vec2(0.5,0.0);
  // scale into lamp-space around the top pivot so the lamp occupies only part
  // of the (bigger) canvas — leaving room for the glow to swing.
  float x=(rp.x-0.5)/uScale+0.5, y=rp.y/uScale;
  vec3 col=vec3(0.0); float alpha=0.0;
  float SY0=uTop, SY1=uBottom;
  vec2 gc=vec2(0.5, SY1+0.03); float gd=length((vec2(x,y)-gc)*vec2(1.45,0.58));
  float glow=smoothstep(0.5,0.0,gd)*uGlow*0.6;
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
  // dissolve anything reaching the canvas edges so there's no box — computed in
  // FIXED canvas space (uv), not the rotated lamp space, so the swing can't push
  // the glow past the fade into a hard edge.
  float H = uRes.y/uRes.x;
  alpha *= smoothstep(0.0,0.09,uv.x) * smoothstep(1.0,0.91,uv.x) * smoothstep(H, H-0.16, uv.y);
  gl_FragColor=vec4(col, alpha);
}`;

type Props = { width?: number; height?: number; left?: string; top?: number; color?: string };
export default function ShaderPendantLamp({
  width = 300,
  height = 520,
  left = "calc(9vw - 79px)",
  top = 6,
  color = LAMP.color,
}: Props = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorRef = useRef(color);
  colorRef.current = color;
  // damped-harmonic swing state: a = angle (rad), v = angular velocity
  const phys = useRef({ a: 0, v: 0, last: 0 });
  const [visible, setVisible] = useState(false);

  // entrance: fade in + initial swing impulse
  useEffect(() => {
    setVisible(true);
    phys.current.v = 1.4; // kick on load → swings, then settles
  }, []);

  const kick = () => { phys.current.v += 1.1; }; // hover impulse
  const bigKick = () => { phys.current.v += phys.current.v >= 0 ? 2.4 : -2.4; }; // click: stronger swing (adds in current direction)

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: false }); if (!gl) return;
    const cs = (t: number, s: string) => { const sh = gl.createShader(t)!; gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh)); return sh; };
    const prog = gl.createProgram()!; gl.attachShader(prog, cs(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog); gl.useProgram(prog);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const u = { res: U("uRes"), sway: U("uSway"), neck: U("uNeck"), rim: U("uRim"), top: U("uTop"), bottom: U("uBottom"), flare: U("uFlare"), lip: U("uLip"), spec: U("uSpec"), ambient: U("uAmbient"), glow: U("uGlow"), scale: U("uScale"), light: U("uLight"), color: U("uColor") };
    gl.uniform1f(u.scale, LAMP.scale);
    gl.uniform1f(u.neck, LAMP.neck); gl.uniform1f(u.rim, LAMP.rim); gl.uniform1f(u.top, LAMP.top); gl.uniform1f(u.bottom, LAMP.bottom); gl.uniform1f(u.flare, LAMP.flare); gl.uniform1f(u.lip, LAMP.lip);
    gl.uniform1f(u.spec, LAMP.spec); gl.uniform1f(u.ambient, LAMP.ambient); gl.uniform1f(u.glow, LAMP.glow); gl.uniform2f(u.light, LAMP.lightX, LAMP.lightY); gl.uniform3fv(u.color, hexToRgb(LAMP.color));
    let raf = 0, dead = false;
    const render = (now: number) => {
      if (dead) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2); const w = canvas.clientWidth * dpr, h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
      // integrate the damped spring (stiffness k, damping c) → underdamped swing
      const p = phys.current;
      const dt = p.last ? Math.min((now - p.last) / 1000, 0.033) : 0.016; p.last = now;
      const k = 52, c = 3.8;
      const acc = -k * p.a - c * p.v;
      p.v += acc * dt; p.a += p.v * dt;
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(u.res, canvas.width, canvas.height); gl.uniform1f(u.sway, p.a);
      gl.uniform3fv(u.color, hexToRgb(colorRef.current)); // enamel colour (live)
      gl.drawArrays(gl.TRIANGLES, 0, 3); raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => { dead = true; cancelAnimationFrame(raf); };
  }, []);

  // hover hit-area sits only over the shade so it never blocks page content
  const shadeTop = LAMP.top * LAMP.scale * width;
  const shadeH = (LAMP.bottom - LAMP.top) * LAMP.scale * width;

  return (
    <div
      aria-hidden
      className="hidden lg:block absolute"
      style={{ top, left, width, height, zIndex: 18, pointerEvents: "none", opacity: visible ? 1 : 0, transition: "opacity 900ms ease" }}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      <div
        onMouseEnter={kick}
        onPointerDown={bigKick}
        style={{ position: "absolute", left: "20%", width: "60%", top: shadeTop - 6, height: shadeH + 12, pointerEvents: "auto", cursor: "pointer" }}
      />
    </div>
  );
}
