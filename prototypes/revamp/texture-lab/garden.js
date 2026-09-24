/* ============================================================================
 * A GARDEN, SEPARATED AND PRINTED
 *
 * The scene is nature. The printing is hers. Two jobs, kept apart:
 *   1. render a garden as continuous tone;
 *   2. separate the tone into three spot inks and screen each on its own
 *      turned grid, off register. That is what a risograph does to a
 *      photograph, so the garden arrives in her material.
 *
 * THIS FILE OWNS THE GARDEN. The planting, the tree skeletons, the wind model,
 * the petals, and the still print used as a fallback. garden-gl.js draws the
 * same data on the GPU every frame. One garden, two renderers: if they ever
 * disagreed the fallback would be a different place, which is worse than none.
 *
 * WHAT WAS LEARNED, AND WHERE IT LANDED
 *
 *   A Yoshino crown is not a cloud. It is a vase of ascending branches that
 *   arch at the tips, and the flowers come in clusters of five or six along
 *   BARE wood, before the leaves, pink in bud and near white open. So the
 *   crown here is a skeleton with blossom clusters on its twigs, and you can
 *   see the sky through it. (Oregon State, NC State plant toolboxes.)
 *
 *   A tree does not sway as one thing. The trunk moves at about 0.2 Hz; every
 *   branch has its own phase and a higher frequency; branches on the lee side
 *   flap more; twigs flutter fast and small on top. Motion is layered, and the
 *   layers are not in phase. (de Langre 2008 scaling; GPU Gems 3 ch. 6.)
 *
 *   Petals do not drizzle. A gust RELEASES them in a burst, hanafubuki, they
 *   drift like snow, and on water they float with the current. So petals are
 *   a small simulation driven by the gust envelope, not a loop.
 *
 *   Wind shows on water as cat's paws: darker patches of capillary ripple that
 *   travel with the gust. Stones in a current throw V wakes downstream.
 *
 *   The bridge over a small stream is an ishibashi: a stone slab, flanked by
 *   upright stones at each end. A drum arch belongs over still water, where
 *   its reflection completes the circle. This water moves.
 * ========================================================================= */

const LAMP = (() => { const v = [-0.58, -0.66, 0.48]; const m = Math.hypot(...v); return v.map((k) => k / m); })();
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const TAU = Math.PI * 2;

function hash(x, y, s) { const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n); }
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return (a + (b - a) * u) + ((c - a) + (d - c) * u - (b - a) * u) * v;
}
function fbm(x, y, s) { return vnoise(x, y, s) * 0.55 + vnoise(x * 2.1, y * 2.1, s + 9) * 0.3 + vnoise(x * 4.3, y * 4.3, s + 21) * 0.15; }
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return (s >>> 8) / 16777216; }; }

/* ---------------------------------------------------------------------------
 * THE PLANTING, in unit coordinates of the plate. Hand placed: a garden is
 * composed, not scattered.
 * ------------------------------------------------------------------------ */
export const PLANTING = {
  /* plain trees behind, dark and tall: the darks the plate needs, and what the
     sakura read against. Each canopy is several foliage masses with gaps. */
  woods: [
    { root: [0.09, 0.640], crown: [0.08, 0.20], r: 0.21, seed: 5 },
    { root: [0.60, 0.560], crown: [0.58, 0.11], r: 0.24, seed: 6 },
    { root: [0.95, 0.600], crown: [0.97, 0.17], r: 0.19, seed: 7 },
  ],
  /* the sakura: root, height as a share of S, lean, seed */
  sakura: [
    { root: [0.30, 0.745], height: 0.62, lean: 0.05, seed: 3 },
    { root: [0.80, 0.700], height: 0.44, lean: -0.04, seed: 8 },
  ],
  /* the stream: y of the centreline as a function of x, in units. It enters on
     the right, passes under the bridge, leaves at the foot on the left. */
  stream: { y0: 0.58, drop: 0.42, wobble: 0.025, halfWidth: 0.055 },
  /* the ishibashi: centre x, slab y, half span, camber */
  bridge: { cx: 0.55, y: 0.70, hs: 0.20, rise: 0.012 },
  /* the stones: x, y at the foot, half width, height, moss. The last two sit
     IN the stream, and throw wakes. */
  stones: [
    [0.10, 0.850, 0.070, 0.070, 0.9], [0.33, 0.800, 0.080, 0.070, 0.7],
    [0.63, 0.930, 0.065, 0.065, 1.0], [0.86, 0.935, 0.095, 0.085, 0.6],
    [0.44, 0.985, 0.075, 0.070, 0.8],
    [0.86, 0.700, 0.035, 0.040, 0.3], [0.22, 0.900, 0.030, 0.035, 0.4],
  ],
  inStream: [5, 6],
};

export function streamAt(u, W, H) {
  const st = PLANTING.stream;
  return { yc: (st.y0 + (1 - u) * st.drop + Math.sin(u * 6.0) * st.wobble) * H, hw: st.halfWidth * H * (0.8 + u * 0.4) };
}
/* the current's direction: down the plate to the left, along the centreline */
export function streamDir(W, H) {
  const d = [-W, PLANTING.stream.drop * H]; const m = Math.hypot(d[0], d[1]);
  return [d[0] / m, d[1] / m];
}

/* ---------------------------------------------------------------------------
 * THE TREE SKELETON
 *
 * Vase habit: a short trunk, five primaries rising at a spread of angles and
 * arching toward the tips, secondaries off those, twigs off those. Blossom
 * clusters sit along the secondaries and twigs, spaced the way umbels are.
 * Every segment remembers its parent and where on the parent it grows, which
 * is what lets the wind move it as a hierarchy rather than as a picture.
 * ------------------------------------------------------------------------ */
export function buildTree(spec, W, H, S) {
  const R = rng(spec.seed * 7919 + 17);
  const root = [spec.root[0] * W, spec.root[1] * H];
  const hgt = spec.height * S;
  const segs = [], blooms = [];
  const add = (a, b, w, depth, parent, s0) => {
    segs.push({ a, b, w, depth, parent, s0, phase: R() * TAU,
                /* trunk 0.2 Hz, then faster with each order, as the scaling says */
                f: [0.2, 0.55 + R() * 0.3, 1.05 + R() * 0.5, 1.9 + R() * 0.9][depth] });
    return segs.length - 1;
  };
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  /* trunk, leaning a little, thick */
  const trunkTop = [root[0] + spec.lean * S * 0.45, root[1] - hgt * 0.30];
  const trunk = add(root, trunkTop, S * 0.024, 0, -1, 0);

  /* primaries: spread across the vase, ascending, with an arch toward the tip
     that grows with how far the branch leans out */
  const NP = 5;
  for (let i = 0; i < NP; i++) {
    const th = ((i / (NP - 1)) * 2 - 1) * 1.15 + (R() - 0.5) * 0.25;      /* angle from vertical, radians */
    const len = hgt * (0.40 + R() * 0.16);
    const a = lerp(root, trunkTop, 0.82 + R() * 0.18);
    const b = [a[0] + Math.sin(th) * len, a[1] - Math.cos(th) * len + len * 0.22 * Math.abs(Math.sin(th))];
    const p = add(a, b, S * 0.011, 1, trunk, 0.9);
    /* secondaries: three or four, alternating sides along the outer two thirds
       of the primary, short, the way they actually come off */
    const NS = 3 + (R() < 0.5 ? 1 : 0);
    for (let j = 0; j < NS; j++) {
      const s0 = 0.35 + (j / NS) * 0.6 + R() * 0.08;
      const a2 = lerp(a, b, s0);
      const th2 = th + (j % 2 ? -1 : 1) * (0.5 + R() * 0.4);
      const len2 = len * (0.30 + R() * 0.22);
      const b2 = [a2[0] + Math.sin(th2) * len2, a2[1] - Math.cos(th2) * len2 + len2 * 0.18];
      const s = add(a2, b2, S * 0.0055, 2, p, s0);
      /* THE CROWN IS BLOSSOM. Thousands of flowers on a real tree, so the
         clusters here are close set and generous, and the skeleton is
         something you see THROUGH the mass rather than instead of it. */
      for (let k = 0.15; k <= 1.0; k += 0.11) blooms.push({ seg: s, s: k + (R() - 0.5) * 0.05, r: S * (0.016 + R() * 0.012), tone: 0.43 + R() * 0.12 });
      /* twigs: two off each secondary, short, with their own clusters */
      for (let k = 0; k < 2; k++) {
        const s1 = 0.4 + R() * 0.5;
        const a3 = lerp(a2, b2, s1);
        const th3 = th2 + (k ? 1 : -1) * (0.5 + R() * 0.5);
        const len3 = len2 * (0.5 + R() * 0.25);
        const b3 = [a3[0] + Math.sin(th3) * len3, a3[1] - Math.cos(th3) * len3 + len3 * 0.12];
        const tw = add(a3, b3, S * 0.0028, 3, s, s1);
        for (let m = 0.2; m <= 1.0; m += 0.2) blooms.push({ seg: tw, s: m, r: S * (0.013 + R() * 0.010), tone: 0.44 + R() * 0.12 });
      }
    }
    /* clusters along the primary itself, from the middle out, and at the tip */
    for (let k = 0.5; k <= 1.0; k += 0.12) blooms.push({ seg: p, s: k, r: S * (0.015 + R() * 0.010), tone: 0.45 + R() * 0.10 });
  }
  return { segs, blooms, cur: segs.map((s) => ({ a: [...s.a], b: [...s.b] })) };
}

/* ---------------------------------------------------------------------------
 * THE WIND
 *
 * A gust envelope, slow and irregular, and under it a layered sway: the trunk
 * on a composite of two low bands, each branch on its own frequency and phase
 * with an amplitude that grows with its order, twigs with a flutter on top.
 * Every segment starts where its parent's motion put its base, so a twig
 * carries the trunk's lean and its branch's sway and its own flutter, all at
 * once and none in phase. Lee side branches, the ones pointing with the wind,
 * get more travel, because they do.
 * ------------------------------------------------------------------------ */
export function gust(t) {
  /* two incommensurate bands and a slow noise, so it never repeats visibly */
  const g = 0.5 + 0.30 * Math.sin(TAU * 0.07 * t) + 0.20 * Math.sin(TAU * 0.131 * t + 2.0) + (vnoise(t * 0.4, 0.5, 77) - 0.5) * 0.5;
  return clamp01(g);
}

export function deform(tree, t, wind, G, S) {
  const AMP = [0.004, 0.010, 0.016, 0.022];
  const drive = wind * (0.35 + 0.65 * G);
  const { segs, cur } = tree;
  const disp = new Array(segs.length);
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const base = s.parent < 0 ? [0, 0] : (() => {
      const [pa, pb] = disp[s.parent];
      return [pa[0] + (pb[0] - pa[0]) * s.s0, pa[1] + (pb[1] - pa[1]) * s.s0];
    })();
    const lee = s.b[0] > s.a[0] ? 1.35 : 0.85;
    let sway;
    if (s.depth === 0) {
      sway = Math.sin(TAU * 0.2 * t) + 0.5 * Math.sin(TAU * 0.37 * t + 1.3);
    } else {
      sway = Math.sin(TAU * s.f * t + s.phase) + 0.45 * Math.sin(TAU * s.f * 1.9 * t + s.phase * 2.1);
      if (s.depth === 3) sway += 0.5 * Math.sin(TAU * 3.3 * t + s.phase * 3.7);   /* flutter */
    }
    const A = AMP[s.depth] * S * drive * lee;
    const own = [A * sway, A * sway * (s.depth ? 0.22 : 0.05)];
    disp[i] = [base, [base[0] + own[0], base[1] + own[1]]];
    cur[i].a[0] = s.a[0] + base[0]; cur[i].a[1] = s.a[1] + base[1];
    cur[i].b[0] = s.b[0] + base[0] + own[0]; cur[i].b[1] = s.b[1] + base[1] + own[1];
  }
}

export function bloomPositions(tree, t, wind) {
  const out = [];
  for (const bl of tree.blooms) {
    const c = tree.cur[bl.seg];
    const x = c.a[0] + (c.b[0] - c.a[0]) * bl.s, y = c.a[1] + (c.b[1] - c.a[1]) * bl.s;
    /* the cluster itself flutters, fast and tiny */
    const f = Math.sin(TAU * 4.1 * t + bl.s * 9 + bl.seg) * bl.r * 0.18 * wind;
    out.push([x + f, y + f * 0.5, bl.r, bl.tone]);
  }
  return out;
}

/* ---------------------------------------------------------------------------
 * THE PETALS. Released by gusts in bursts, drifting down and across with a
 * flutter, and on reaching the stream, carried by it. Hanafubuki, at small
 * scale.
 * ------------------------------------------------------------------------ */
export function makePetals(n) {
  return { n, x: new Float32Array(n), y: new Float32Array(n), vx: new Float32Array(n), ph: new Float32Array(n),
           alive: new Uint8Array(n), afloat: new Uint8Array(n), lastG: 0, seed: 1 };
}
export function stepPetals(P, dt, t, wind, G, blooms, W, H, S) {
  const rising = G > P.lastG; P.lastG = G;
  /* a gust on the rise shakes petals loose; the harder it blows, the more */
  const release = rising && G > 0.55 ? (G - 0.5) * wind * 26 * dt : 0.6 * dt * wind;
  let budget = release;
  const dir = streamDir(W, H);
  for (let i = 0; i < P.n; i++) {
    if (!P.alive[i]) {
      if (budget > 0 && blooms.length && hash(i, t, 5) < budget) {
        const b = blooms[Math.floor(hash(i, t, 9) * blooms.length)];
        P.x[i] = b[0]; P.y[i] = b[1]; P.vx[i] = 0; P.ph[i] = hash(i, t, 13) * TAU;
        P.alive[i] = 1; P.afloat[i] = 0; budget -= 1;
      }
      continue;
    }
    if (P.afloat[i]) {
      const sp = S * 0.10 * (0.7 + 0.3 * G);
      P.x[i] += dir[0] * sp * dt; P.y[i] += dir[1] * sp * dt + Math.sin(t * 3 + P.ph[i]) * S * 0.0015;
    } else {
      /* fall, drift with the wind, and flutter side to side */
      P.y[i] += S * (0.16 + 0.04 * Math.sin(t * 2 + P.ph[i])) * dt;
      P.x[i] += (S * 0.22 * wind * (0.4 + 0.6 * G) + Math.sin(t * 5.5 + P.ph[i]) * S * 0.06) * dt;
      const { yc, hw } = streamAt(P.x[i] / W, W, H);
      if (Math.abs(P.y[i] - yc) < hw * 0.9) P.afloat[i] = 1;
    }
    if (P.x[i] < -S * 0.02 || P.x[i] > W + S * 0.02 || P.y[i] > H + S * 0.02) P.alive[i] = 0;
  }
}

/* ---------------------------------------------------------------------------
 * THE STILL PRINT. The same garden at t = 0, rasterised on the CPU: the
 * fallback, and the reference the shader is checked against.
 * ------------------------------------------------------------------------ */
export function renderScene(W, H) {
  const L = new Float32Array(W * H);
  const S = Math.min(W, H);
  const P = PLANTING;
  const put = (x, y, v) => { if (x >= 0 && x < W && y >= 0 && y < H) L[y * W + x] = v; };

  /* the ground: bare stock with a breath of gradient toward the foot */
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
    L[y * W + x] = 1.0 - smooth(0.25, 1.0, y / H) * 0.13 + (hash(x, y, 1) - 0.5) * 0.02;

  /* the woods: a trunk, and a canopy of five foliage masses with gaps between,
     each lit on top. A canopy is masses, not a blob. */
  for (const T of P.woods) {
    const rx = T.root[0] * W, ry = T.root[1] * H, cx = T.crown[0] * W, cy = T.crown[1] * H, R = T.r * S;
    for (let y = Math.round(ry); y >= cy; y--) {
      const i = (ry - y) / (ry - cy), w = S * (0.016 - i * 0.008);
      for (let dx = -w; dx <= w; dx++) put(Math.round(rx + (cx - rx) * i + dx), y, dx < -w * 0.3 ? 0.28 : 0.12);
    }
    for (let m = 0; m < 5; m++) {
      const mx = cx + (hash(m, T.seed, 3) - 0.5) * R * 1.7, my = cy + (hash(m, T.seed, 4) - 0.5) * R * 1.2, mr = R * (0.36 + hash(m, T.seed, 5) * 0.28);
      for (let y = Math.round(my - mr); y <= Math.round(my + mr); y++) for (let x = Math.round(mx - mr); x <= Math.round(mx + mr); x++) {
        const dx = (x - mx) / mr, dy = (y - my) / mr, q = dx * dx + dy * dy;
        if (q > 1) continue;
        const n = fbm(x * 0.06 + T.seed + m * 9, y * 0.06, 61);
        if (n - smooth(0.45, 1.0, q) * 0.7 < 0.30) continue;
        put(x, y, clamp01(0.18 + n * 0.26 - dy * 0.14 + (hash(x, y, 63) - 0.5) * 0.08));
      }
    }
  }

  /* the stream: flow lines that follow the current, bent by wakes behind the
     stones that stand in it */
  const dir = streamDir(W, H);
  for (let x = 0; x < W; x++) {
    const u = x / W, { yc, hw } = streamAt(u, W, H);
    for (let y = Math.round(yc - hw); y <= Math.round(yc + hw); y++) {
      if (y < 0 || y >= H) continue;
      const v = (y - yc) / hw;
      const along = x * dir[0] + y * dir[1];
      let phase = along * 0.11 + v * 4.0;
      for (const si of P.inStream) {
        const st = P.stones[si], sx = st[0] * W, sy = st[1] * H - st[3] * S * 0.5, r = st[2] * S;
        /* a V wake opens downstream of the stone and fades with distance */
        const d = (x - sx) * dir[0] + (y - sy) * dir[1], off = -(x - sx) * dir[1] + (y - sy) * dir[0];
        if (d > 0 && Math.abs(off) < r + d * 0.36) phase += Math.sin(d * 0.25) * 1.6 * Math.exp(-d / (S * 0.25)) * (1 - Math.abs(off) / (r + d * 0.36));
      }
      let tone = 0.80 + Math.sin(phase) * 0.10 - Math.abs(v) * 0.06;
      if (v < -0.85) tone = 0.45; else if (v > 0.9) tone = 0.92;
      put(x, y, clamp01(tone + (hash(x, y, 71) - 0.5) * 0.04));
    }
  }

  /* the stones: faceted, one lit flank and one shaded; moss on the top and on
     the shaded side, and a skirt of it at the foot, which is what knits a
     stone to the ground */
  for (const st of P.stones) {
    const cx = st[0] * W, foot = st[1] * H, hw = st[2] * S, h = st[3] * S, moss = st[4];
    for (let y = Math.round(foot - h); y <= Math.round(foot + h * 0.12); y++) {
      const t = (foot - y) / h;
      if (t < 0) { /* the skirt */
        const sk = hw * 1.15 * (1 + t * 3);
        for (let x = Math.round(cx - sk); x <= Math.round(cx + sk); x++) if (hash(x, y, 91) < 0.5 * moss) put(x, y, 0.55 + (hash(x, y, 92) - 0.5) * 0.1);
        continue;
      }
      const wob = (vnoise(t * 4, st[0] * 50, 31) - 0.5) * hw * 0.4;
      const half = hw * (0.55 + (1 - t) * 0.45) + wob;
      for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
        const side = (x - cx) / (half || 1);
        let tone = side < -0.15 ? 0.58 : side < 0.3 ? 0.40 : 0.22;
        tone += (hash(x, y, 7) - 0.5) * 0.08;
        const cap = Math.max(smooth(0.55, 0.95, t), smooth(0.35, 0.85, side) * 0.7) * moss;
        if (cap > 0) {
          const nx = side, ny = -(t - 0.55) / 0.45, nz = Math.sqrt(Math.max(0, 1 - nx * nx * 0.5));
          const d = Math.max(0, nx * LAMP[0] + ny * LAMP[1] + nz * LAMP[2]);
          tone += ((0.30 + d * 0.30 + (fbm(x * 0.15, y * 0.15, 13) - 0.5) * 0.16) - tone) * cap;
        }
        put(x, y, clamp01(tone));
      }
    }
  }

  /* the ishibashi: a slab with a little camber, its front face in shade, its
     top lit, two upright stones at each end, and its shadow on the water */
  {
    const B = P.bridge, cx = B.cx * W, hs = B.hs * W, rise = B.rise * H, y0 = B.y * H, th = S * 0.022;
    for (let x = Math.round(cx - hs); x <= Math.round(cx + hs); x++) {
      const u = (x - cx) / hs, top = y0 - rise * (1 - u * u);
      for (let i = 0; i < th; i++) put(x, Math.round(top + i), clamp01((i < th * 0.35 ? 0.66 : 0.28) + (hash(x, i, 9) - 0.5) * 0.06));
      for (let i = th; i < th + S * 0.03; i++) { const y = Math.round(top + i); if (y < H) L[y * W + x] = Math.min(L[y * W + x], 0.70 + (i - th) / (S * 0.03) * 0.25); }
    }
    for (const sgn of [-1, 1]) {
      const ux = cx + sgn * hs * 1.02, uh = S * 0.075, uw = S * 0.02;
      for (let y = Math.round(y0 - uh); y <= Math.round(y0 + th * 0.4); y++) {
        const t = (y0 - y) / uh, half = uw * (0.6 + (1 - t) * 0.4);
        for (let x = Math.round(ux - half); x <= Math.round(ux + half); x++) put(x, y, (x - ux) / half < -0.1 ? 0.52 : 0.24);
      }
    }
  }

  /* the sakura: the skeleton at rest, bark dark with a lit flank and the
     horizontal lenticels Prunus bark carries, and the blossom clusters */
  for (const spec of P.sakura) {
    const tree = buildTree(spec, W, H, S);
    for (const s of tree.segs) {
      const ax = s.a[0], ay = s.a[1], bx = s.b[0], by = s.b[1], w = s.w;
      const x0 = Math.floor(Math.min(ax, bx) - w - 1), x1 = Math.ceil(Math.max(ax, bx) + w + 1);
      const y0 = Math.floor(Math.min(ay, by) - w - 1), y1 = Math.ceil(Math.max(ay, by) + w + 1);
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const h = clamp01(((x - ax) * dx + (y - ay) * dy) / l2);
        const px = ax + dx * h, py = ay + dy * h, d = Math.hypot(x - px, y - py);
        if (d > w) continue;
        const side = ((x - ax) * dy - (y - ay) * dx) < 0 ? -1 : 1;
        let tone = side < 0 ? 0.24 : 0.10;
        if (s.depth === 0 && hash(0, Math.round(y / 3), 44) < 0.18 && d < w * 0.7) tone = 0.42;   /* lenticels */
        put(x, y, tone);
      }
    }
    for (const [x, y, r, tn] of bloomPositions(tree, 0, 0)) {
      for (let yy = Math.round(y - r); yy <= Math.round(y + r); yy++) for (let xx = Math.round(x - r); xx <= Math.round(x + r); xx++) {
        const q = Math.hypot(xx - x, yy - y) / r;
        if (q > 1 || hash(xx, yy, 53) < q * 0.55) continue;      /* a cluster, not a coin */
        put(xx, yy, clamp01(tn + (hash(xx, yy, 54) - 0.5) * 0.08 - (yy - y) / r * 0.05));
      }
    }
  }
  return L;
}

/* the separation: darker tone, more ink; nothing at bare paper. Gold peaks
   in the mid lights and is gone by white, oxblood in the mids, charcoal only
   in the darks. */
export function separation(t) {
  return [
    Math.min(0.80, smooth(0.99, 0.62, t) * smooth(0.22, 0.48, t) * 1.1),
    Math.min(0.78, smooth(0.62, 0.30, t) * smooth(0.06, 0.26, t) * 1.3),
    Math.min(0.86, smooth(0.36, 0.04, t)),
  ];
}

export function gardenPlate(W, H, dark, passes = 3) {
  W = Math.max(8, Math.round(W)); H = Math.max(8, Math.round(H));
  const L = renderScene(W, H), S = Math.min(W, H), pitch = Math.max(3.4, S * 0.0135);
  const INKS = dark ? [[214, 191, 106], [196, 128, 148], [236, 232, 224]] : [[169, 153, 57], [52, 4, 20], [28, 26, 23]];
  const PASS = [{ angle: 15 * Math.PI / 180, dx: 0, dy: 0 }, { angle: 75 * Math.PI / 180, dx: 2.0, dy: -1.4 }, { angle: 45 * Math.PI / 180, dx: -1.6, dy: 1.8 }];
  const stock = dark ? [58, 54, 48] : [236, 229, 214], tooth = dark ? [96, 90, 80] : [206, 197, 178];
  const out = new ImageData(W, H), d = out.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const paperDot = 0.42 > BAYER[(y >> 1) & 3][(x >> 1) & 3] / 16 ? 1 : 0;
    const col = [0, 1, 2].map((c) => stock[c] + (tooth[c] - stock[c]) * paperDot);
    for (let p = 0; p < Math.min(3, passes); p++) {
      const pa = PASS[p], sx = Math.round(x - pa.dx), sy = Math.round(y - pa.dy);
      const t = (sx >= 0 && sx < W && sy >= 0 && sy < H) ? L[sy * W + sx] : 1;
      const cov = separation(t)[p];
      if (cov <= 0.004) continue;
      const ca = Math.cos(pa.angle), sa = Math.sin(pa.angle), uu = x * ca + y * sa, vv = -x * sa + y * ca;
      const fu = ((uu % pitch) + pitch) % pitch - pitch / 2, fv = ((vv % pitch) + pitch) % pitch - pitch / 2;
      if (Math.hypot(fu, fv) >= Math.sqrt(Math.min(1, cov)) * pitch * 0.62) continue;
      const ink = INKS[p], a = 0.58;
      for (let ch = 0; ch < 3; ch++) col[ch] = dark ? 255 - (255 - col[ch]) * (1 - a * (ink[ch] / 255)) : col[ch] * (1 - a * (1 - ink[ch] / 255)) + ink[ch] * 0.10;
    }
    const o = (y * W + x) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
  }
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  cv.getContext("2d").putImageData(out, 0, 0);
  return cv;
}
