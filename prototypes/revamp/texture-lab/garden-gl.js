/* ============================================================================
 * THE GARDEN, ON THE GPU, WITH WIND
 *
 * Two passes. The first draws the garden in continuous tone into a texture:
 * ground, woods, stream, stones, slab, the sakura skeletons, the blossom
 * clusters, the petals. The second is the press: it reads that tone three
 * times, each a pixel or two off register, and screens each reading through
 * its own turned grid in its own ink. Splitting them means the scene is
 * evaluated once per pixel, not three times, and the press stays identical
 * to the one the riso disc uses.
 *
 * The skeleton, the blossoms and the petals change every frame and there are
 * a few hundred of them, so they travel in a DATA TEXTURE rather than in
 * uniforms, which run out at a couple of hundred vectors. garden.js moves
 * them; this file only draws what it is handed.
 * ========================================================================= */
import { PLANTING, buildTree, deform, bloomPositions, gust, makePetals, stepPetals } from "./garden.js";

const DATA_W = 1024;     /* texels per row: two dense crowns run past 512 */
const ROW_SEG = 0, ROW_META = 1, ROW_BLOOM = 2, ROW_PETAL = 3;
const MAX_PETALS = 48;

const VERT = `#version 300 es
in vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

/* --- pass one: the garden in tone -------------------------------------- */
const TONE = `#version 300 es
precision highp float;
precision highp sampler2D;
out vec4 o;
uniform vec2  u_res;
uniform float u_time, u_wind, u_gust;
uniform sampler2D u_data;
uniform int   u_nseg, u_nbloom, u_npetal;
uniform vec4  u_woods[3];  uniform vec2 u_woodsR[3];
uniform vec4  u_stream, u_bridge;
uniform vec4  u_stones[7]; uniform float u_moss[7];
uniform vec2  u_dir;                    /* the current's direction */

const vec3 LAMP = normalize(vec3(-0.58, -0.66, 0.48));
float hash(vec2 p, float s) { return fract(sin(dot(p, vec2(127.1, 311.7)) + s * 74.7) * 43758.5453); }
float vnoise(vec2 p, float s) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i, s), hash(i + vec2(1, 0), s), u.x), mix(hash(i + vec2(0, 1), s), hash(i + vec2(1, 1), s), u.x), u.y);
}
float fbm(vec2 p, float s) { return vnoise(p, s) * 0.55 + vnoise(p * 2.1, s + 9.0) * 0.3 + vnoise(p * 4.3, s + 21.0) * 0.15; }
float sm(float a, float b, float x) { return a < b ? smoothstep(a, b, x) : 1.0 - smoothstep(b, a, x); }
vec4 D(int i, int row) { return texelFetch(u_data, ivec2(i, row), 0); }
vec2 streamAt(float u, float W, float H) {
  return vec2((u_stream.x + (1.0 - u) * u_stream.y + sin(u * 6.0) * u_stream.z) * H, u_stream.w * H * (0.8 + u * 0.4));
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  float W = u_res.x, H = u_res.y, S = min(W, H), t = u_time, wind = u_wind, G = u_gust;
  vec2 uv = p / vec2(W, H);

  /* ground: bare stock with a breath of gradient toward the foot */
  float tone = 1.0 - sm(0.25, 1.0, uv.y) * 0.13 + (hash(p, 1.0) - 0.5) * 0.02;

  /* the woods: trunk, then five foliage masses per crown with gaps, each lit
     on top, each shearing at the crown and not the root */
  for (int i = 0; i < 3; i++) {
    vec4 T = u_woods[i]; vec2 rs = u_woodsR[i];
    vec2 root = T.xy * vec2(W, H), crown = T.zw * vec2(W, H); float R = rs.x * S;
    float hgt = clamp((root.y - p.y) / (root.y - crown.y), 0.0, 1.0);
    float lean = (sin(6.2832 * 0.2 * t + rs.y) + 0.5 * sin(6.2832 * 0.37 * t + rs.y * 2.0)) * S * 0.006 * wind * (0.35 + 0.65 * G) * hgt * hgt;
    float tx = mix(root.x, crown.x, hgt) + lean, tw = S * (0.016 - hgt * 0.008);
    if (p.y <= root.y && p.y >= crown.y && abs(p.x - tx) <= tw) tone = (p.x - tx) < -tw * 0.3 ? 0.28 : 0.12;
    for (int m = 0; m < 5; m++) {
      float fm = float(m);
      vec2 mc = crown + vec2((hash(vec2(fm, rs.y), 3.0) - 0.5) * R * 1.7, (hash(vec2(fm, rs.y), 4.0) - 0.5) * R * 1.2);
      float mr = R * (0.36 + hash(vec2(fm, rs.y), 5.0) * 0.28);
      /* each mass on its own phase, faster than the trunk, as a branch is */
      float ms = sin(6.2832 * (0.6 + fm * 0.13) * t + fm * 1.7 + rs.y) * S * 0.010 * wind * (0.35 + 0.65 * G);
      mc.x += lean + ms;
      vec2 d = (p - mc) / mr; float q = dot(d, d);
      if (q > 1.0) continue;
      float n = fbm((p + vec2(ms * 0.5, 0.0)) * 0.06 + vec2(rs.y + fm * 9.0, 0.0), 61.0);
      if (n - sm(0.45, 1.0, q) * 0.7 >= 0.30) tone = clamp(0.18 + n * 0.26 - d.y * 0.14 + (hash(p, 63.0) - 0.5) * 0.08, 0.0, 1.0);
    }
  }

  /* the stream: flow lines that travel with the current, bent by V wakes
     behind the two stones that stand in it, and a cat's paw, a darker patch
     of fast capillary ripple that crosses the water with each gust */
  {
    vec2 sw = streamAt(uv.x, W, H);
    float v = (p.y - sw.x) / sw.y;
    if (abs(v) <= 1.0) {
      float along = dot(p, u_dir);
      float phase = along * 0.11 + v * 4.0 + t * 2.4 * (0.8 + 0.2 * G);
      for (int k = 5; k < 7; k++) {
        vec4 st = u_stones[k];
        vec2 sc = vec2(st.x * W, st.y * H - st.w * S * 0.5); float r = st.z * S;
        float d = dot(p - sc, u_dir), off = -(p.x - sc.x) * u_dir.y + (p.y - sc.y) * u_dir.x;
        if (d > 0.0 && abs(off) < r + d * 0.36) phase += sin(d * 0.25 - t * 3.0) * 1.6 * exp(-d / (S * 0.25)) * (1.0 - abs(off) / (r + d * 0.36));
      }
      float wt = 0.80 + sin(phase) * 0.10 - abs(v) * 0.06;
      /* the cat's paw travels along the stream with the gust */
      vec2 paw = vec2(W * (1.0 - fract(t * 0.045 * wind)), 0.0); paw.y = streamAt(paw.x / W, W, H).x;
      float pd = 1.0 - sm(0.0, S * 0.22, distance(p, paw));
      wt += pd * G * (sin(p.x * 0.9 + p.y * 0.6 - t * 9.0) * 0.035 - 0.05);
      if (v < -0.85) wt = 0.45; else if (v > 0.9) wt = 0.92;
      tone = clamp(wt + (hash(p, 71.0) - 0.5) * 0.04, 0.0, 1.0);
    }
  }

  /* the stones: faceted; moss on the top and the shaded side and a skirt at
     the foot; the moss shimmers, the stone does not */
  for (int i = 0; i < 7; i++) {
    vec4 st = u_stones[i];
    float cx = st.x * W, foot = st.y * H, hw0 = st.z * S, h = st.w * S, moss = u_moss[i];
    float tt = (foot - p.y) / h;
    if (tt < -0.12 || tt > 1.0) continue;
    if (tt < 0.0) {
      float sk = hw0 * 1.15 * (1.0 + tt * 3.0);
      if (abs(p.x - cx) <= sk && hash(p, 91.0) < 0.5 * moss) tone = 0.55 + (hash(p, 92.0) - 0.5) * 0.1;
      continue;
    }
    float wob = (vnoise(vec2(tt * 4.0, st.x * 50.0), 31.0) - 0.5) * hw0 * 0.4;
    float hw = hw0 * (0.55 + (1.0 - tt) * 0.45) + wob;
    if (abs(p.x - cx) > hw) continue;
    float side = (p.x - cx) / max(hw, 1.0);
    float s0 = (side < -0.15 ? 0.58 : (side < 0.3 ? 0.40 : 0.22)) + (hash(p, 7.0) - 0.5) * 0.08;
    float cap = max(sm(0.55, 0.95, tt), sm(0.35, 0.85, side) * 0.7) * moss;
    if (cap > 0.0) {
      vec3 n = normalize(vec3(side, -(tt - 0.55) / 0.45, sqrt(max(0.0, 1.0 - side * side * 0.5))));
      float d = max(0.0, dot(n, LAMP));
      s0 = mix(s0, 0.30 + d * 0.30 + (fbm(p * 0.15 + vec2(t * 0.15 * wind, 0.0), 13.0) - 0.5) * 0.16, cap);
    }
    tone = clamp(s0, 0.0, 1.0);
  }

  /* the ishibashi: a cambered slab, lit top and shaded face, its shadow on
     the water, an upright stone at each end */
  {
    float cx = u_bridge.x * W, y0 = u_bridge.y * H, hs = u_bridge.z * W, rise = u_bridge.w * H, th = S * 0.022;
    float u = (p.x - cx) / hs;
    if (abs(u) <= 1.0) {
      float top = y0 - rise * (1.0 - u * u), i = p.y - top;
      if (i >= th && i < th + S * 0.03) tone = min(tone, 0.70 + (i - th) / (S * 0.03) * 0.25);
      if (i >= 0.0 && i < th) tone = clamp((i < th * 0.35 ? 0.66 : 0.28) + (hash(p, 9.0) - 0.5) * 0.06, 0.0, 1.0);
    }
    for (int k = 0; k < 2; k++) {
      float sgn = k == 0 ? -1.0 : 1.0, ux = cx + sgn * hs * 1.02, uh = S * 0.075, uw = S * 0.02;
      float tt = (y0 - p.y) / uh;
      if (tt >= -0.3 && tt <= 1.0) {
        float hw = uw * (0.6 + (1.0 - clamp(tt, 0.0, 1.0)) * 0.4);
        if (abs(p.x - ux) <= hw) tone = (p.x - ux) / hw < -0.1 ? 0.52 : 0.24;
      }
    }
  }

  /* the sakura skeletons, from the data texture: capsules with a lit flank,
     the trunk carrying lenticels. Deformed by the wind on the CPU, so every
     twig already holds its branch's sway and the trunk's lean. */
  for (int i = 0; i < 512; i++) {
    if (i >= u_nseg) break;
    vec4 sg = D(i, ${ROW_SEG}); vec4 mt = D(i, ${ROW_META});
    vec2 a = sg.xy, b = sg.zw, ba = b - a, pa = p - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1.0), 0.0, 1.0);
    float d = length(pa - ba * h);
    if (d > mt.x) continue;
    float side = (pa.x * ba.y - pa.y * ba.x) < 0.0 ? -1.0 : 1.0;
    float tn = side < 0.0 ? 0.24 : 0.10;
    if (mt.y < 0.5 && hash(vec2(0.0, floor(p.y / 3.0)), 44.0) < 0.18 && d < mt.x * 0.7) tn = 0.42;
    tone = tn;
  }
  /* the blossom clusters: a cluster, not a coin, so the disc is broken up by
     a hash that thins toward the rim */
  for (int i = 0; i < 1024; i++) {
    if (i >= u_nbloom) break;
    /* a cheap cull before the distance: most clusters are nowhere near p */
    vec4 bl = D(i, ${ROW_BLOOM});
    if (abs(p.y - bl.y) > bl.z) continue;
    float q = distance(p, bl.xy) / bl.z;
    if (q > 1.0 || hash(p, 53.0) < q * 0.55) continue;
    tone = clamp(bl.w + (hash(p, 54.0) - 0.5) * 0.08 - (p.y - bl.y) / bl.z * 0.05, 0.0, 1.0);
  }
  /* the petals */
  for (int i = 0; i < ${MAX_PETALS}; i++) {
    if (i >= u_npetal) break;
    vec4 pt = D(i, ${ROW_PETAL});
    if (pt.z < 0.5) continue;
    if (distance(p, pt.xy) < S * 0.0055) tone = pt.w > 0.5 ? 0.58 : 0.50;
  }
  o = vec4(tone, 0.0, 0.0, 1.0);
}`;

/* --- pass two: the press ------------------------------------------------ */
const PRESS = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 u_res; uniform float u_dark; uniform sampler2D u_tone;
const int BAYER[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
float sm(float a, float b, float x) { return a < b ? smoothstep(a, b, x) : 1.0 - smoothstep(b, a, x); }
/* p is in scene coordinates, y downward. The tone texture was written by a
   framebuffer whose row 0 is the BOTTOM, so the row for a scene y is H-1-y.
   Miss this and the whole garden prints upside down, which it did. */
float toneAt(vec2 p) {
  vec2 q = clamp(vec2(p.x, u_res.y - 1.0 - p.y), vec2(0.0), u_res - 1.0);
  return texelFetch(u_tone, ivec2(q), 0).r;
}
void main() {
  vec2 p = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  float S = min(u_res.x, u_res.y);
  vec3 stock = mix(vec3(236.0, 229.0, 214.0), vec3(58.0, 54.0, 48.0), u_dark) / 255.0;
  vec3 tooth = mix(vec3(206.0, 197.0, 178.0), vec3(96.0, 90.0, 80.0), u_dark) / 255.0;
  ivec2 bc = ivec2((int(p.x) >> 1) & 3, (int(p.y) >> 1) & 3);
  vec3 col = mix(stock, tooth, 0.42 > float(BAYER[bc.y * 4 + bc.x]) / 16.0 ? 1.0 : 0.0);
  float pitch = max(3.4, S * 0.0135);
  for (int i = 0; i < 3; i++) {
    float angle = (i == 0 ? 15.0 : (i == 1 ? 75.0 : 45.0)) * 3.14159265 / 180.0;
    vec2 off = i == 0 ? vec2(0.0) : (i == 1 ? vec2(2.0, -1.4) : vec2(-1.6, 1.8));
    vec3 ink = u_dark > 0.5
      ? (i == 0 ? vec3(214.0, 191.0, 106.0) : (i == 1 ? vec3(196.0, 128.0, 148.0) : vec3(236.0, 232.0, 224.0)))
      : (i == 0 ? vec3(169.0, 153.0, 57.0) : (i == 1 ? vec3(52.0, 4.0, 20.0) : vec3(28.0, 26.0, 23.0)));
    ink /= 255.0;
    /* the tone texture is in the same orientation as p, so the offset sample
       is a plain fetch: y already runs downward in both */
    float tn = toneAt(vec2(p.x - off.x, p.y - off.y));
    float cov = i == 0 ? min(0.80, sm(0.99, 0.62, tn) * sm(0.22, 0.48, tn) * 1.1)
              : i == 1 ? min(0.78, sm(0.62, 0.30, tn) * sm(0.06, 0.26, tn) * 1.3)
                       : min(0.86, sm(0.36, 0.04, tn));
    if (cov <= 0.004) continue;
    float ca = cos(angle), sa = sin(angle);
    vec2 f = mod(vec2(p.x * ca + p.y * sa, -p.x * sa + p.y * ca), pitch) - pitch * 0.5;
    if (length(f) >= sqrt(min(1.0, cov)) * pitch * 0.62) continue;
    float a = 0.58;
    col = u_dark > 0.5 ? 1.0 - (1.0 - col) * (1.0 - a * ink) : col * (1.0 - a * (1.0 - ink)) + ink * 0.10;
  }
  o = vec4(col, 1.0);
}`;

export function createGarden() {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false, alpha: false });
  if (!gl) return { error: "WebGL2 is not available in this browser" };

  const build = (fsSrc, name) => {
    const mk = (type, src) => {
      const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { const log = gl.getShaderInfoLog(sh); gl.deleteShader(sh); throw new Error(name + " " + (type === gl.VERTEX_SHADER ? "vertex: " : "fragment: ") + log); }
      return sh;
    };
    const pr = gl.createProgram(); gl.attachShader(pr, mk(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, fsSrc)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(name + " link: " + gl.getProgramInfoLog(pr));
    return pr;
  };
  let tone, press;
  try { tone = build(TONE, "tone"); press = build(PRESS, "press"); }
  catch (e) { return { error: String(e.message || e) }; }

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  for (const pr of [tone, press]) { const loc = gl.getAttribLocation(pr, "a"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0); }

  /* the data texture: four rows of 256 RGBA floats, fetched by texel */
  const data = new Float32Array(DATA_W * 4 * 4);
  const dataTex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, dataTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, DATA_W, 4, 0, gl.RGBA, gl.FLOAT, data);

  /* the tone target */
  const toneTex = gl.createTexture(), fbo = gl.createFramebuffer();
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, toneTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const U = (pr, n) => gl.getUniformLocation(pr, n);
  const P = PLANTING;
  gl.useProgram(tone);
  gl.uniform1i(U(tone, "u_data"), 0);
  gl.uniform4fv(U(tone, "u_woods"), new Float32Array(P.woods.flatMap((w) => [...w.root, ...w.crown])));
  gl.uniform2fv(U(tone, "u_woodsR"), new Float32Array(P.woods.flatMap((w) => [w.r, w.seed])));
  gl.uniform4f(U(tone, "u_stream"), P.stream.y0, P.stream.drop, P.stream.wobble, P.stream.halfWidth);
  gl.uniform4f(U(tone, "u_bridge"), P.bridge.cx, P.bridge.y, P.bridge.hs, P.bridge.rise);
  gl.uniform4fv(U(tone, "u_stones"), new Float32Array(P.stones.flatMap((s) => s.slice(0, 4))));
  gl.uniform1fv(U(tone, "u_moss"), new Float32Array(P.stones.map((s) => s[4])));
  const ut = { res: U(tone, "u_res"), time: U(tone, "u_time"), wind: U(tone, "u_wind"), gust: U(tone, "u_gust"),
               nseg: U(tone, "u_nseg"), nbloom: U(tone, "u_nbloom"), npetal: U(tone, "u_npetal"), dir: U(tone, "u_dir") };
  gl.useProgram(press);
  gl.uniform1i(U(press, "u_tone"), 1);
  const up = { res: U(press, "u_res"), dark: U(press, "u_dark") };

  let sized = "", trees = [], petals = makePetals(MAX_PETALS), last = 0;

  return {
    canvas, error: null,
    render(w, h, dark, wind, t) {
      w = Math.max(8, Math.round(w)); h = Math.max(8, Math.round(h));
      const S = Math.min(w, h);
      const key = `${w}x${h}`;
      if (sized !== key) {
        sized = key;
        canvas.width = w; canvas.height = h;
        trees = P.sakura.map((s) => buildTree(s, w, h, S));
        petals = makePetals(MAX_PETALS);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, toneTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, toneTex, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(tone); gl.uniform2f(ut.res, w, h);
        const dir = (() => { const d = [-w, P.stream.drop * h]; const m = Math.hypot(d[0], d[1]); return [d[0] / m, d[1] / m]; })();
        gl.uniform2f(ut.dir, dir[0], dir[1]);
        gl.useProgram(press); gl.uniform2f(up.res, w, h);
      }

      /* the wind, on the CPU, into the data texture */
      const dt = Math.min(0.05, last ? t - last : 0.016); last = t;
      const G = gust(t);
      let nseg = 0, nbloom = 0;
      const blooms = [];
      for (const tr of trees) {
        deform(tr, t, wind, G, S);
        for (let i = 0; i < tr.segs.length && nseg < DATA_W; i++, nseg++) {
          const c = tr.cur[i], o = (ROW_SEG * DATA_W + nseg) * 4, m = (ROW_META * DATA_W + nseg) * 4;
          data[o] = c.a[0]; data[o + 1] = c.a[1]; data[o + 2] = c.b[0]; data[o + 3] = c.b[1];
          data[m] = tr.segs[i].w; data[m + 1] = tr.segs[i].depth; data[m + 2] = 0; data[m + 3] = 0;
        }
        for (const b of bloomPositions(tr, t, wind)) { if (nbloom >= DATA_W) break; blooms.push(b); const o = (ROW_BLOOM * DATA_W + nbloom++) * 4; data[o] = b[0]; data[o + 1] = b[1]; data[o + 2] = b[2]; data[o + 3] = b[3]; }
      }
      stepPetals(petals, dt, t, wind, G, blooms, w, h, S);
      for (let i = 0; i < MAX_PETALS; i++) { const o = (ROW_PETAL * DATA_W + i) * 4; data[o] = petals.x[i]; data[o + 1] = petals.y[i]; data[o + 2] = petals.alive[i]; data[o + 3] = petals.afloat[i]; }
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, dataTex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, DATA_W, 4, gl.RGBA, gl.FLOAT, data);

      /* pass one */
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, w, h);
      gl.useProgram(tone);
      gl.uniform1f(ut.time, t); gl.uniform1f(ut.wind, wind); gl.uniform1f(ut.gust, G);
      gl.uniform1i(ut.nseg, nseg); gl.uniform1i(ut.nbloom, nbloom); gl.uniform1i(ut.npetal, MAX_PETALS);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      /* pass two */
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      gl.useProgram(press);
      gl.uniform1f(up.dark, dark ? 1 : 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, toneTex);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
