/* THE LEADER, IN THE DISCS' OWN MATERIAL. The project list's leader (from the hovered title to the card,
   ending on the year) is a thin vellum pipe: the discs' shader from sheets-gl.js, run with one change, a
   sheet may be a capsule, a disc stretched along a segment. Its distance to the rim is measured from the
   nearest point on the segment, so the rim, sheen and cut edge are the discs', and the grain is read at
   the true position so it does not smear along the pipe. Picked in labs/leader-lab, 2026-11-19.

   The canvas is drawn on black and screened onto the page in dark mode (on white and multiplied in
   light), so only the pipe shows and the page under it is untouched; the post pass's scan grain is off
   for the same reason. Rows alternate sage and mauve, counted down the visible list. */
import { VERT, FRAG_SCENE, FRAG_POST, buildProgram, makeTarget, hexLin, pigment } from './sheets-gl.js';

const UNIT = 650;        /* the discs' composition unit in CSS px, so the frost is the same size */
const WIDTH = 2.4;       /* CSS px */
const DRAW_MS = 340;     /* the draw-in, as long as the old leader's */
const STYLE = { fibre: 0.35, edge: 0.240, sheen: 0.95 };   /* frosted glass, cut edge: the discs' style */
const INKS = [{ hex: '#9ba69c', op: 4.5 }, { hex: '#827a85', op: 6.5 }];   /* sage, mauve; on dark the print curve dims darker tints, so more density there */

const SCENE = FRAG_SCENE
  .replace('vec2 v = p - d0.xy;',
    'vec2 vw = p - d0.xy; vec2 v = vw;\n    if (uD2[i].w > 0.0) { vec2 ax = vec2(cos(d0.w), sin(d0.w)); v = vw - ax * clamp(dot(vw, ax), -uD2[i].w, uD2[i].w); }')
  .replace('vec2 q = inr * v + vec2(seed', 'vec2 q = inr * vw + vec2(seed');

export function mountLeaderPipe(cv) {
  const gl = cv.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false });
  if (!gl) return null;
  let scene, post;
  try { scene = buildProgram(gl, VERT, SCENE, 'leader'); post = buildProgram(gl, VERT, FRAG_POST, 'leader-post'); }
  catch (e) { console.error(e); return null; }
  const vao = gl.createVertexArray();
  const D0 = new Float32Array(4), D1 = new Float32Array(4), D2 = new Float32Array(4);
  const dark = () => document.documentElement.getAttribute('data-theme') === 'dark';
  let W = 0, H = 0, cw = 1, ch = 1, dpr = 1, target = null, seg = null, ink = 0, t0 = 0, raf = 0;

  function size() {
    const r = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
    cw = r.width; ch = r.height; W = Math.max(1, Math.round(cw * dpr)); H = Math.max(1, Math.round(ch * dpr));
    if (cv.width !== W || cv.height !== H || !target) { cv.width = W; cv.height = H; target = makeTarget(gl, W, H, target); }
  }
  const toU = (x, y) => [(x - cw / 2) / UNIT, (ch / 2 - y) / UNIT];
  function draw(k) {
    size(); if (!target || !target.ok || !seg) return;
    const d = dark(), o = cv.offsetLeft, oy = cv.offsetTop;   /* the canvas hangs past the panel; segments come in panel px */
    const w = WIDTH, x0 = seg.x0 - o + w / 2, y0 = seg.y - oy;
    const ex = seg.x0 + (seg.x1 - seg.x0) * k, ey = seg.y + (seg.cy - seg.y) * k;
    const x1 = Math.max(x0 + 0.5, ex - o - w / 2), y1 = ey - oy;
    const [ax, ay] = toU(x0, y0), [bx, by] = toU(x1, y1), tint = hexLin(d ? INKS[ink].hex : pigment(INKS[ink].hex));
    D0[0] = (ax + bx) / 2; D0[1] = (ay + by) / 2; D0[2] = w / 2 / UNIT; D0[3] = Math.atan2(by - ay, bx - ax);
    D1[0] = tint[0]; D1[1] = tint[1]; D1[2] = tint[2]; D1[3] = d ? INKS[ink].op : 1.0;   /* on paper a disc's own density already reads */
    D2[0] = 3.1; D2[1] = 0; D2[2] = 1; D2[3] = Math.max(1e-5, Math.hypot(bx - ax, by - ay) / 2);
    const ground = d ? [0, 0, 0] : [1, 1, 1];
    gl.bindVertexArray(vao); gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); gl.viewport(0, 0, W, H);
    gl.useProgram(scene.program); const u = scene.u;
    gl.uniform4f(u.uFrame, W * 0.5, H * 0.5, UNIT * dpr * 0.5, 0);
    gl.uniform1i(u.uCount, 1);
    gl.uniform4fv(u.uD0, D0); gl.uniform4fv(u.uD1, D1); gl.uniform4fv(u.uD2, D2);
    gl.uniform1f(u.uOpacity, d ? 0.115 : 1.15);
    gl.uniform1i(u.uStyle, 2);
    gl.uniform1f(u.uTintSpread, 1.0); gl.uniform1f(u.uFibre, STYLE.fibre); gl.uniform1f(u.uEdge, STYLE.edge); gl.uniform1f(u.uSheen, STYLE.sheen);
    gl.uniform1f(u.uFeather, 0.0);
    gl.uniform2f(u.uLight, D0[0], D0[1] + 0.2);
    gl.uniform1f(u.uEncode, target.encode); gl.uniform1f(u.uMode, d ? 0 : 1);
    gl.uniform3f(u.uGround, ground[0], ground[1], ground[2]); gl.uniform3f(u.uPaper, ground[0], ground[1], ground[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.useProgram(post.program);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, target.tex);
    gl.uniform1i(post.u.uTex, 0); gl.uniform2f(post.u.uRes, W, H); gl.uniform1i(post.u.uStyle, 2);
    gl.uniform1f(post.u.uGrain, 0.0); gl.uniform1f(post.u.uEncode, target.encode); gl.uniform1f(post.u.uMode, d ? 0 : 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  const ease = t => 1 - Math.pow(1 - t, 3);
  function tick(ms) {
    raf = 0; const k = Math.min(1, (ms - t0) / DRAW_MS);
    draw(ease(k)); if (k < 1) raf = requestAnimationFrame(tick);
  }
  /* g: {x0, y, x1, cy} in panel px, n: the row's place in the visible list, grow: draw in from the title */
  function show(g, n, grow) {
    if (!g) { seg = null; if (raf) cancelAnimationFrame(raf); raf = 0; size(); gl.bindFramebuffer(gl.FRAMEBUFFER, null);   /* no room for a leader: blank it */
      const c = dark() ? 0 : 1; gl.clearColor(c, c, c, 1); gl.clear(gl.COLOR_BUFFER_BIT); return; }
    seg = g; ink = n % 2;
    if (grow && !matchMedia('(prefers-reduced-motion: reduce)').matches) { t0 = performance.now(); if (!raf) raf = requestAnimationFrame(tick); }
    else if (!raf) draw(1);
  }
  /* a theme switch repaints the pipe in the other mode's tint */
  new MutationObserver(() => { if (seg && !raf) draw(1); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return { show };
}
