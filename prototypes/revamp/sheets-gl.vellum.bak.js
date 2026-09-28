/* ============================================================================
 * THE SHEETS, ON THE GPU: the vellum discs piece, laid across the hero.
 *
 * This is the piece from prototypes/vellum-discs, not a re-drawing of it. The
 * 2D version that sat here before was a radial gradient with a noise tile laid
 * on top, and it looked like haze because the texture in the reference is not
 * a texture at all. It is FOUR things, all of them physical:
 *
 *   stacking     every sheet has an optical depth, and the shader accumulates
 *                scatter front to back while attenuating by a TINTED
 *                transmission. Overlaps go brighter and stay chromatic because
 *                that is what light through stacked vellum does.
 *   relief       the fibre is anisotropic noise at 520 cells per frame width,
 *                and the sheen is that noise's derivative TOWARD THE LIGHT. A
 *                lit slope, not a grain. That is the frosted look.
 *   creases      a ridged field raised to the 46th, gated to where the sheet
 *                was folded, plus two scratches, all catching the lamp.
 *   the curve    pow(L, 2.6) x 62 and a tonemap with a high white point. One
 *                sheet stays dim, four stacked run to white, the fibre goes
 *                crisp. Take this away and everything softens back into fog.
 *
 * Two things change to let it live on a page instead of a black plate. The
 * frame clip is gone, so it bleeds to the hero's edges, and the ground under
 * the sheets is the page colour itself, so the hero edge is seamless. And one
 * thing is new: the reference only ever sat on black. On paper the sheets are
 * PIGMENT, so light mode swaps the emissive accumulation for Beer-Lambert
 * transmission of concentrated tints over paper, with the same fibre, sheen
 * and creases driving the density.
 *
 * The fibre frequency is pinned to DEVICE PIXELS, not to the hero width. At
 * :5480 one composition unit is about 650 CSS px, so a cell is a couple of
 * device pixels; scaled to a 1440px hero it would be twice as coarse and read
 * as sand. So the unit is fixed at 650 CSS px here and the discs are placed in
 * that space.
 * ========================================================================= */

const MAX_DISCS = 24;
const UNIT_CSS = 650;      /* composition unit in CSS px, matched to the reference */

const VERT = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

/* ---------------------------------------------------------------- scene pass */
const FRAG_SCENE = `#version 300 es
precision highp float;
#define MAXD ${MAX_DISCS}
out vec4 outColor;

uniform vec4  uFrame;        // cx, cy, halfUnit, unused (device px)
uniform int   uCount;
uniform vec4  uD0[MAXD];     // centre.xy, radius, rotation
uniform vec4  uD1[MAXD];     // tint.rgb (linear), per sheet opacity scale
uniform vec4  uD2[MAXD];     // seed, emphasis, alive, spare
uniform float uOpacity, uTintSpread, uFibre, uEdge, uSheen, uEncode, uMode;
uniform vec2  uLight;
uniform vec3  uGround;       // the page, linear
uniform vec3  uPaper;        // the page in light mode, linear

const mat2 M2 = mat2(0.8, 0.6, -0.6, 0.8);
float h11(float n) { n = fract(n * 0.1031); n *= n + 33.33; return fract(n * (n + n)); }
float h21(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  float a = h21(i), b = h21(i + vec2(1.0, 0.0)), c = h21(i + vec2(0.0, 1.0)), d = h21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm2(vec2 p) { float s = vnoise(p) * 0.62; s += vnoise(M2 * p * 2.07 + 5.3) * 0.31; return s / 0.93; }
float scratchLine(vec2 q, float r, float sd0, vec2 lv) {
  float a = h11(sd0) * 3.14159265;
  vec2 dir = vec2(cos(a), sin(a)), nrm = vec2(-dir.y, dir.x);
  vec2 o = (vec2(h11(sd0 + 1.7), h11(sd0 + 3.3)) - 0.5) * r * 1.45;
  vec2 w = q - o;
  float t = dot(w, dir), u = dot(w, nrm);
  float hw = 0.0010 + 0.0017 * h11(sd0 + 5.1);
  float len = r * (0.32 + 0.62 * h11(sd0 + 7.9));
  float core = exp(-(u * u) / (hw * hw));
  float along = smoothstep(len, len * 0.22, abs(t));
  float lit = 0.28 + 0.72 * abs(dot(nrm, lv));
  return core * along * lit;
}

void main() {
  vec2 rel = gl_FragCoord.xy - uFrame.xy;
  float inv = 0.5 / uFrame.z;
  vec2 p = rel * inv;
  vec2 pw = fwidth(p);
  float px = 0.5 * (pw.x + pw.y);

  vec2 toL = uLight - p;
  float ldist = length(toL);
  vec2 lv = toL / max(ldist, 1e-4);
  float lamp = 0.80 + 0.52 / (1.0 + 3.4 * ldist * ldist);

  vec3 L = vec3(0.0);
  vec3 T = vec3(1.0);

  for (int i = MAXD - 1; i >= 0; i--) {
    if (i >= uCount) { continue; }
    vec4 d0 = uD0[i];
    vec2 v = p - d0.xy;
    float r = d0.z;
    float dist = length(v);
    if (dist > r + 0.006) { continue; }
    float sd = dist - r;
    float aa = max(px * (abs(v.x) + abs(v.y)) / max(dist, 1e-5), px * 0.75);
    float cov = 1.0 - smoothstep(-aa, aa, sd);
    cov *= uD2[i].z;
    if (cov <= 0.0012) { continue; }

    float rot = d0.w, cs = cos(rot), sn = sin(rot);
    mat2 inr = mat2(cs, sn, -sn, cs);
    float seed = uD2[i].x;
    vec2 q = inr * v + vec2(seed * 7.31, seed * 4.17);
    vec2 lloc = inr * lv;

    vec2 fq = q * vec2(1.0, 0.42) * 520.0;
    float n1 = vnoise(fq);
    float n2 = vnoise(M2 * fq * 2.09 + 11.0);
    float fib = (n1 * 0.66 + n2 * 0.34) - 0.5;
    float n1s = vnoise(fq + lloc * vec2(1.0, 0.42) * 1.55);
    float slope = n1s - n1;

    float cl = fbm2(q * 5.6 + 3.1);
    float crf = fbm2(q * 4.4 + 21.3);
    float ridge = 1.0 - abs(2.0 * crf - 1.0);
    float crease = pow(clamp(ridge, 0.0, 1.0), 46.0);
    crease *= smoothstep(0.46, 0.78, fbm2(q * 1.35 + 61.0));

    vec3 traw = uD1[i].rgb;
    float g = dot(traw, vec3(0.2126, 0.7152, 0.0722));
    vec3 tint = mix(vec3(g), traw, uTintSpread);

    float tau = uOpacity * uD1[i].w * (0.70 + 0.56 * cl) * (1.0 + uFibre * fib * 0.38);
    tau = max(tau, 0.0);

    float shade = lamp * (1.0 + uSheen * (slope * 2.2 + (cl - 0.5) * 0.26));
    float scr = scratchLine(q, r, seed * 91.7, lloc) + scratchLine(q, r, seed * 91.7 + 19.3, lloc);
    float lw = max(aa * 1.10, 0.0011);
    float eb = smoothstep(-lw, -lw * 0.10, sd);

    if (uMode < 0.5) {
      /* on charcoal: the reference, unchanged. The sheet scatters light back. */
      vec3 ext = vec3(1.0) - 2.0 * (tint - vec3(g));
      vec3 Tr = exp(-tau * ext);
      float Tg = exp(-tau);
      vec3 sct = tint * (1.0 - Tg) * 0.85 * shade;
      sct += tint * crease * (0.030 + 0.062 * uFibre) * lamp;
      sct += tint * scr * (0.028 + 0.058 * uFibre) * lamp;
      sct += tint * eb * uEdge * (1.0 + 0.65 * uD2[i].y) * lamp;
      L += T * sct * cov;
      T *= vec3(1.0) - cov * (vec3(1.0) - Tr);
    } else {
      /* on paper: the sheet is PIGMENT. Beer-Lambert through the tint, with the
         same fibre and clouding driving how much pigment sits at this point,
         and the sheen, creases and scratches THINNING the ink where the light
         catches a slope, which is what a lit relief does to a translucent wash. */
      float dens = tau * (1.0 - uSheen * 0.55 * (slope * 2.2 + (cl - 0.5) * 0.26));
      dens *= 1.0 - (crease * 0.9 + scr * 0.8) * 0.6;
      dens *= 1.0 + eb * uEdge * 6.0;                    /* the cut edge is where the wash pools */
      dens = max(dens, 0.0);
      vec3 Tr = pow(max(tint, vec3(0.002)), vec3(dens));
      T *= vec3(1.0) - cov * (vec3(1.0) - Tr);
    }
  }

  vec3 outc = uMode < 0.5 ? (L + T * uGround) : (uPaper * T);
  outc = max(outc, vec3(0.0));
  outColor = vec4(uEncode > 0.5 ? sqrt(outc) : outc, 1.0);
}`;

/* ----------------------------------------------------------------- post pass */
const FRAG_POST = `#version 300 es
precision highp float;
out vec4 outColor;
uniform sampler2D uTex;
uniform vec2  uRes;
uniform float uGrain, uEncode, uMode;
float h21(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main() {
  vec2 fc = gl_FragCoord.xy;
  vec3 col = texture(uTex, fc / uRes).rgb;
  if (uEncode > 0.5) col = col * col;
  if (uMode < 0.5) {
    /* the print response. a single sheet stays dim, four stacked run up to near
       white. the sheets accumulate on their own in the scene pass, this only
       grades them. */
    const float EXPO = 62.0, CURVE = 2.6, W = 3.4;
    col = pow(max(col, vec3(0.0)), vec3(CURVE)) * EXPO;
    col = (col * (1.0 + col / (W * W))) / (1.0 + col);
    float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(vec3(lum), col, 1.06);
  }
  col = pow(max(col, vec3(0.0)), vec3(1.0 / 2.2));
  /* static scan grain, fixed to the pixel so it does not crawl */
  float n = h21(floor(fc)) - 0.5;
  col += n * uGrain * 0.085;
  col *= 1.0 + n * uGrain * 0.10;
  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

/* ------------------------------------------------------------------ helpers */
function buildProgram(gl, vs, fs, name) {
  const mk = (type, src) => {
    const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(`[${name}] ${type === gl.VERTEX_SHADER ? "vertex" : "fragment"}: ${gl.getShaderInfoLog(sh)}`);
    return sh;
  };
  const pr = gl.createProgram(); gl.attachShader(pr, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(`[${name}] link: ${gl.getProgramInfoLog(pr)}`);
  const u = Object.create(null), n = gl.getProgramParameter(pr, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(pr, i); u[info.name.replace(/\[0\]$/, "")] = gl.getUniformLocation(pr, info.name); }
  return { program: pr, u };
}
function makeTarget(gl, w, h, prev) {
  if (prev) { gl.deleteFramebuffer(prev.fbo); gl.deleteTexture(prev.tex); }
  const hasFloat = !!gl.getExtension("EXT_color_buffer_half_float") || !!gl.getExtension("EXT_color_buffer_float");
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  let encode = 0;
  if (hasFloat) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
  else { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); encode = 1; }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.bindTexture(gl.TEXTURE_2D, null);
  return { fbo, tex, w, h, encode, ok };
}
const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const hexLin = (hex) => { const n = parseInt(hex.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map(srgbToLinear); };
function mulberry(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* THE PAPER TINT IS NOT DARKENED HERE. The 2D version concentrated each swatch
   (x3.25 from white, chroma x2.6) because it then laid it down at 17 to 47%
   alpha. Beer-Lambert already concentrates by exponent, so feeding it a
   pre-concentrated tint printed every sheet at full strength and sent every
   overlap to mud. So the paper tint is the swatch with a mild chroma lift and
   nothing else, and the density does the concentrating. */
function pigment(hex) {
  const n = parseInt(hex.slice(1), 16), S = 1.7;
  let ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const g = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  ch = ch.map((v) => Math.max(0, Math.min(255, Math.round(g + (v - g) * S))));
  return "#" + ch.map((v) => v.toString(16).padStart(2, "0")).join("");
}

/* ------------------------------------------------------------------- mount */
/**
 * @param cv      the #sheets canvas, full bleed in the hero
 * @param sheets  [{x, y, r}] in unit hero coordinates (x, y of width/height, r of width)
 * @param swatch  her eight hex swatches
 * @param opts    { paper, ground } hex page colours for light and dark
 */
export function mountSheets(cv, sheets, swatch, opts) {
  const gl = cv.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  if (!gl) { cv.dataset.gl = "error"; cv.dataset.glLog = "WebGL2 is not available"; return null; }
  let scene, post;
  try { scene = buildProgram(gl, VERT, FRAG_SCENE, "scene"); post = buildProgram(gl, VERT, FRAG_POST, "post"); }
  catch (e) { cv.dataset.gl = "error"; cv.dataset.glLog = String(e.message || e); console.error(e); return null; }
  cv.dataset.gl = "ok";
  const vao = gl.createVertexArray();

  const dark = () => document.documentElement.getAttribute("data-theme") === "dark";
  const P = { opacity: 0.115, opacityLight: 1.15, tintSpread: 1.0, fibre: 0.55, edge: 0.105, sheen: 0.50, grain: 0.5, grainLight: 0.22 };

  /* the discs, in composition space. A fixed unit, so the fibre is the same
     size in device pixels as it is at :5480 whatever the hero's width. */
  let W = 0, H = 0, dpr = 1, unit = 1, cssW = 1, cssH = 1, target = null;
  const rnd = mulberry(20260913);
  const discs = sheets.map((s, i) => ({
    ux: s.x, uy: s.y, ur: s.r,                 /* unit hero coords, the source of truth for layout */
    x: 0, y: 0, r: 0, tx: 0, ty: 0, vx: 0, vy: 0,
    rot: rnd() * Math.PI * 2, rotV: (rnd() - 0.5) * 0.010,
    ink: i % swatch.length, op: 0.84 + rnd() * 0.38, seed: rnd() * 100,
    emph: 0, alive: 1,
  }));
  const toComp = (ux, uy) => [((ux * cssW) - cssW / 2) / unit, (cssH / 2 - uy * cssH) / unit];

  function resize() {
    const r = cv.getBoundingClientRect(); if (!r.width) return false;
    dpr = Math.min(2, devicePixelRatio || 1); cssW = r.width; cssH = r.height;
    W = Math.round(cssW * dpr); H = Math.round(cssH * dpr); cv.width = W; cv.height = H;
    unit = UNIT_CSS;
    for (const d of discs) { const [x, y] = toComp(d.ux, d.uy); d.x = d.tx = x; d.y = d.ty = y; d.r = (d.ur * cssW) / unit; d.vx = d.vy = 0; }
    target = makeTarget(gl, W, H, target);
    return true;
  }

  /* pointer light, spring drag, hover emphasis: the reference's feel */
  const ptr = { x: 0, y: 0.15, inside: false };
  const light = { x: 0, y: 0.15 };
  let hover = null, drag = null, grab = { x: 0, y: 0 }, lastInput = -999, now = 0;
  const at = (e) => { const r = cv.getBoundingClientRect(); return toComp((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); };
  const pick = (x, y) => { for (let i = discs.length - 1; i >= 0; i--) { const d = discs[i], dx = x - d.x, dy = y - d.y; if (dx * dx + dy * dy <= d.r * d.r) return d; } return null; };

  cv.addEventListener("pointermove", (e) => {
    const [x, y] = at(e); ptr.x = x; ptr.y = y; ptr.inside = true; lastInput = now;
    if (drag) { drag.tx = x + grab.x; drag.ty = y + grab.y; }
    else { hover = pick(x, y); cv.dataset.grab = hover ? "1" : "0"; }
    wake();
  });
  cv.addEventListener("pointerleave", () => { ptr.inside = false; hover = null; cv.dataset.grab = "0"; });
  cv.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const [x, y] = at(e); const d = pick(x, y); if (!d) return;
    /* the one the hand is on comes to the top of the stack, as a sheet would */
    discs.splice(discs.indexOf(d), 1); discs.push(d);
    drag = d; grab.x = d.x - x; grab.y = d.y - y; cv.setPointerCapture(e.pointerId); lastInput = now; wake();
  });
  const drop = () => { if (drag) { drag.ux = (drag.x * unit + cssW / 2) / cssW; drag.uy = (cssH / 2 - drag.y * unit) / cssH; } drag = null; lastInput = now; };
  addEventListener("pointerup", drop); addEventListener("pointercancel", drop);

  function step(dt) {
    const k = 58, c = 2 * Math.sqrt(58) * 0.95;
    let moving = false;
    for (const d of discs) {
      d.emph += (((d === hover && !drag) || d === drag ? 1 : 0) - d.emph) * (1 - Math.exp(-dt / 0.22));
      d.vx += ((d.tx - d.x) * k - d.vx * c) * dt; d.vy += ((d.ty - d.y) * k - d.vy * c) * dt;
      d.x += d.vx * dt; d.y += d.vy * dt;
      d.rot += d.rotV * dt * 0.22;
      if (Math.abs(d.vx) + Math.abs(d.vy) > 1e-4) moving = true;
    }
    const lx = ptr.inside ? ptr.x : Math.cos(now * 0.13) * 0.42, ly = ptr.inside ? ptr.y : Math.sin(now * 0.09) * 0.42;
    light.x += (lx - light.x) * (1 - Math.exp(-dt * 3.4)); light.y += (ly - light.y) * (1 - Math.exp(-dt * 3.4));
    return moving;
  }

  const D0 = new Float32Array(MAX_DISCS * 4), D1 = new Float32Array(MAX_DISCS * 4), D2 = new Float32Array(MAX_DISCS * 4);
  function draw() {
    if (!target || !target.ok) return;
    const d = dark();
    const tints = swatch.map((h) => hexLin(d ? h : pigment(h)));
    const n = Math.min(discs.length, MAX_DISCS);
    for (let i = 0; i < n; i++) {
      const s = discs[i], o = i * 4, t = tints[s.ink];
      D0[o] = s.x; D0[o + 1] = s.y; D0[o + 2] = s.r; D0[o + 3] = s.rot;
      D1[o] = t[0]; D1[o + 1] = t[1]; D1[o + 2] = t[2]; D1[o + 3] = s.op;
      D2[o] = s.seed; D2[o + 1] = s.emph; D2[o + 2] = s.alive; D2[o + 3] = 0;
    }
    const ground = hexLin(opts.ground), paper = hexLin(opts.paper);
    gl.bindVertexArray(vao); gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); gl.viewport(0, 0, W, H);
    gl.useProgram(scene.program);
    const u = scene.u;
    gl.uniform4f(u.uFrame, W * 0.5, H * 0.5, unit * dpr * 0.5, 0);
    gl.uniform1i(u.uCount, n);
    gl.uniform4fv(u.uD0, D0); gl.uniform4fv(u.uD1, D1); gl.uniform4fv(u.uD2, D2);
    gl.uniform1f(u.uOpacity, d ? P.opacity : P.opacityLight);
    gl.uniform1f(u.uTintSpread, P.tintSpread); gl.uniform1f(u.uFibre, P.fibre); gl.uniform1f(u.uEdge, P.edge); gl.uniform1f(u.uSheen, P.sheen);
    gl.uniform2f(u.uLight, light.x, light.y);
    gl.uniform1f(u.uEncode, target.encode); gl.uniform1f(u.uMode, d ? 0 : 1);
    gl.uniform3f(u.uGround, ground[0], ground[1], ground[2]); gl.uniform3f(u.uPaper, paper[0], paper[1], paper[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.useProgram(post.program);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, target.tex);
    gl.uniform1i(post.u.uTex, 0); gl.uniform2f(post.u.uRes, W, H);
    gl.uniform1f(post.u.uGrain, d ? P.grain : P.grainLight); gl.uniform1f(post.u.uEncode, target.encode); gl.uniform1f(post.u.uMode, d ? 0 : 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* THE LOOP SLEEPS. The light follows the pointer and the springs settle, and
     both need frames, but a page that is mostly read should not hold a frame
     loop open for ever. It runs while a hand is on it or something is still
     moving, and stops a few seconds after. */
  let raf = 0, prev = 0;
  function frame(ms) {
    raf = 0; now = ms / 1000;
    const dt = Math.min(1 / 30, Math.max(1 / 480, prev ? now - prev : 1 / 60)); prev = now;
    const moving = step(dt);
    draw();
    if (ptr.inside || drag || moving || now - lastInput < 4) raf = requestAnimationFrame(frame);
    else prev = 0;
  }
  function wake() { if (!raf) raf = requestAnimationFrame(frame); }

  resize(); draw();
  new ResizeObserver(() => { if (resize()) draw(); }).observe(cv);
  addEventListener("themechange", () => draw());
  wake();
  return { discs, draw, P };
}
