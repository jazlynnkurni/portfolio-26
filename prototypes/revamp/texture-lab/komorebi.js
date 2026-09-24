/* ============================================================================
 * KOMOREBI  木漏れ日   sunlight leaking through leaves
 *
 * The nature scene that is actually hers. Her whole system is a SURFACE THAT
 * RECEIVES: paper receives ink, a plate receives a strike, stock receives a
 * screen. Dappled light is the same grammar one step out into the world, and
 * it is natively two tone, which is the move her palette already makes when
 * ground and ink swap places between modes.
 *
 * THE FACT THE WHOLE PIECE RESTS ON
 *
 * A gap in a canopy is a pinhole, so the bright patch it throws is an image of
 * the SUN, not an image of the gap. That is why dappled light is a field of
 * soft round coins whatever shape the leaves are, and why those coins turn into
 * crescents during an eclipse. Almost everything that calls itself dappled
 * light is thresholded noise, which is why it reads as camouflage instead.
 *
 * So the pipeline is literally the optics:
 *
 *   1. build the canopy as an occlusion field, layered and drifting
 *   2. CONVOLVE IT WITH THE SUN, which is a blur by a disc. This is the step
 *      that turns leaf shapes into round coins, and doing it in the right order
 *      is the entire difference.
 *   3. deeper canopy means a longer throw means a wider penumbra, so the far
 *      layer is blurred harder than the near one
 *   4. land it on her stock and let the paper carry the grain
 *
 * WHY IT IS COMPUTED SMALL AND DRAWN BIG
 *
 * Dappled light has no high frequencies in it: step 2 destroys them by
 * definition. So the field is solved on a small buffer and scaled up, and the
 * scaling filter is doing more of the sun convolution for free. Solving it at
 * full size would cost forty times as much to produce a blurrier result.
 * ========================================================================= */

/* the light field is solved here and upscaled. Small on purpose, see above. */
const LW = 176, LH = 116;

/* --- the canopy, baked once ---------------------------------------------
 *
 * The first cut evaluated the noise per pixel per frame, which came to roughly
 * 327,000 sine calls a frame and could not hold sixty. It was also the wrong
 * shape of solution: the canopy does not change, it only MOVES. So it is baked
 * once into a pair of tileable maps and sampled with an offset after that,
 * which is exactly what the same piece would do with a texture on the GPU.
 * Per frame the cost drops to two bilinear reads a pixel.
 * ---------------------------------------------------------------------- */

const MAP = 256;

function lattice(n, seed) {
  const a = new Float32Array(n * n);
  let s = seed;
  for (let i = 0; i < a.length; i++) {
    /* a plain integer hash. No trigonometry, and it repeats identically across
       reloads, so the canopy is the same canopy every time. */
    s = (s * 1664525 + 1013904223) >>> 0;
    a[i] = (s >>> 8) / 16777216;
  }
  return a;
}

/* value noise on a WRAPPING lattice, which is what makes the map tileable: the
   right edge reads the left one, so the canopy can slide for ever with no seam */
function vnTiled(lat, n, x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const x0 = ((xi % n) + n) % n, y0 = ((yi % n) + n) % n;
  const x1 = (x0 + 1) % n, y1 = (y0 + 1) % n;
  const a = lat[y0 * n + x0], b = lat[y0 * n + x1];
  const c = lat[y1 * n + x0], d = lat[y1 * n + x1];
  return (a + (b - a) * u) + ((c - a) + (d - c) * u - (b - a) * u) * v;
}

/* Leaves, not clouds. Two octaves is enough because the sun is about to soften
   all of it, and the SECOND octave is squashed along one axis so the canopy
   grows in strands and clumps the way foliage does rather than in blobs. */
function bakeCanopy(seed) {
  const l1 = lattice(8, seed), l2 = lattice(19, seed * 7 + 3);
  const m = new Float32Array(MAP * MAP);
  for (let y = 0; y < MAP; y++) {
    for (let x = 0; x < MAP; x++) {
      const u = x / MAP, v = y / MAP;
      /* the squashed octave carries the leaf structure, so it gets the larger
         share: weighted toward the round octave the canopy reads as cloud */
      m[y * MAP + x] = vnTiled(l1, 8, u * 8, v * 8) * 0.44
                     + vnTiled(l2, 19, u * 19, v * 19 * 0.55) * 0.56;
    }
  }
  return m;
}

let mapNear = null, mapFar = null;

/* bilinear, wrapping. The only per pixel work left in the whole solve. */
function sample(m, x, y) {
  const fx = x * MAP, fy = y * MAP;
  let xi = Math.floor(fx), yi = Math.floor(fy);
  const tx = fx - xi, ty = fy - yi;
  xi = ((xi % MAP) + MAP) % MAP; yi = ((yi % MAP) + MAP) % MAP;
  const x1 = (xi + 1) % MAP, y1 = (yi + 1) % MAP;
  const a = m[yi * MAP + xi], b = m[yi * MAP + x1];
  const c = m[y1 * MAP + xi], d = m[y1 * MAP + x1];
  return (a + (b - a) * tx) + ((c - a) + (d - c) * tx - (b - a) * tx) * ty;
}

/* separable box blur, run three times. Three boxes is a Gaussian to the eye,
   and a Gaussian here IS the sun: a disc of angular width convolved across the
   occlusion field. The radius is the only knob that says how high the canopy is. */
function blur(src, dst, W, H, r) {
  if (r < 1) { dst.set(src); return; }
  const tmp = blur._t && blur._t.length === src.length ? blur._t : (blur._t = new Float32Array(src.length));
  const pass = (a, b, horiz) => {
    const n = 2 * r + 1;
    if (horiz) {
      for (let y = 0; y < H; y++) {
        const o = y * W;
        let acc = 0;
        for (let i = -r; i <= r; i++) acc += a[o + Math.min(W - 1, Math.max(0, i))];
        for (let x = 0; x < W; x++) {
          b[o + x] = acc / n;
          acc -= a[o + Math.min(W - 1, Math.max(0, x - r))];
          acc += a[o + Math.min(W - 1, Math.max(0, x + r + 1))];
        }
      }
    } else {
      for (let x = 0; x < W; x++) {
        let acc = 0;
        for (let i = -r; i <= r; i++) acc += a[Math.min(H - 1, Math.max(0, i)) * W + x];
        for (let y = 0; y < H; y++) {
          b[y * W + x] = acc / n;
          acc -= a[Math.min(H - 1, Math.max(0, y - r)) * W + x];
          acc += a[Math.min(H - 1, Math.max(0, y + r + 1)) * W + x];
        }
      }
    }
  };
  pass(src, tmp, true); pass(tmp, dst, false);
  pass(dst, tmp, true); pass(tmp, dst, false);
  pass(dst, tmp, true); pass(tmp, dst, false);
}

const near = new Float32Array(LW * LH);
const far = new Float32Array(LW * LH);
const nearB = new Float32Array(LW * LH);
const farB = new Float32Array(LW * LH);

/* one buffer the light field is painted into, then scaled up over the hero */
let field = null;
function fieldCanvas() {
  if (!field) {
    const cv = document.createElement("canvas");
    cv.width = LW; cv.height = LH;
    field = cv.getContext("2d");
  }
  return field;
}

/* wind: how fast the canopy travels and how hard it shears. Named the way a
   forecast names it because that is how it is felt, not in units. */
export const WIND = { XS: 0.18, M: 0.5, L: 1.15 };

/**
 * Solve one frame of the light and paint it into the small buffer.
 * t seconds, wind a WIND value, lean the pointer parallax in unit coords.
 */
export function solve(t, wind, lean, dark) {
  const w = wind;
  /* two layers at different depths. The far one travels slower and is thrown
     further, so it is both softer and lazier, which is what gives the field its
     sense of depth without any actual depth. */
  const nx = t * 0.055 * w + lean.x * 0.9;
  const ny = t * 0.020 * w + lean.y * 0.9;
  const fx = t * 0.028 * w + lean.x * 0.35;
  const fy = t * 0.011 * w + lean.y * 0.35;

  /* the shear is the wind actually moving the branch rather than the whole
     forest sliding past, so it is a slow wobble applied across the frame */
  const shear = Math.sin(t * 0.42 * w) * 0.08 * w;

  if (!mapNear) { mapNear = bakeCanopy(20260923); mapFar = bakeCanopy(77415); }

  /* how many canopy tiles cover the screen. The near layer is denser because it
     is closer, which is the only thing that makes near and far read as two
     different heights rather than two speeds. */
  const SN = 5.4, SF = 3.0;

  for (let y = 0; y < LH; y++) {
    const v = y / LH;
    const shN = v * shear, shF = v * shear * 0.5;
    for (let x = 0; x < LW; x++) {
      const u = x / LW;
      const i = y * LW + x;
      near[i] = sample(mapNear, (u + shN) * SN + nx, v * SN + ny);
      far[i] = sample(mapFar, (u + shF) * SF + fx, v * SF + fy);
    }
  }

  /* THE SUN. The near canopy is closer to the ground so its coins are tighter;
     the far one is thrown further and is nearly formless. Getting these two
     radii apart is most of what makes the field read as a canopy with depth. */
  /* THE RADIUS IS IN LOW RES PIXELS, and each of those is about eight on screen,
     so three here was a twenty four pixel disc run three times and the coins
     dissolved into haze. The sun is small. Keep it small. */
  blur(near, nearB, LW, LH, 2);
  blur(far, farB, LW, LH, 3);

  const c = fieldCanvas();
  const img = c.createImageData(LW, LH);
  const d = img.data;

  /* Ground and light. In light mode the paper is the light and the canopy takes
     it away, so the shadow is a warm grey rather than a grey grey: leaf shadow
     on paper is never neutral. In dark mode the ground already IS the ink, so
     the gaps have to CARRY light instead, and gold is the only one of her three
     that can be read on charcoal. Same field, opposite sign, which is the move
     the palette makes everywhere else. */
  /* The two modes are not mirror images and must not be tuned as if they were.
     On paper the shadow is SUBTRACTED from a bright ground, so a wide range
     still reads as calm. On charcoal the light is ADDED to a dark one, and
     added light is loud: at the same range the gold stops being sunlight and
     becomes animal print. So dark gets a dimmer gold and a much meaner curve,
     and the coins become the exception they are in life. */
  const lit = dark ? [188, 164, 96] : [253, 252, 249];
  const shade = dark ? [22, 21, 18] : [176, 167, 148];

  for (let i = 0; i < LW * LH; i++) {
    /* the canopy layers OCCLUDE, they do not average: light has to get past
       both of them, which is a product and not a sum */
    let L = nearB[i] * 0.62 + 0.38;
    L *= farB[i] * 0.55 + 0.45;

    /* the transfer curve. Sunlight through a canopy is not linear in openness:
       most of the ground sits in shade and the coins are the exception, so the
       curve is pushed until the bright patches are genuinely a minority. */
    L = dark
      ? Math.max(0, Math.min(1, (L - 0.42) * 3.2))
      : Math.max(0, Math.min(1, (L - 0.36) * 3.4));
    L = L * L * (3 - 2 * L);
    /* on charcoal the coin keeps a hot middle and a long quiet edge rather than
       a flat plateau of gold, but only just: squaring it outright put the whole
       canopy out */
    if (dark) L *= 0.55 + 0.45 * L;

    const o = i * 4;
    d[o] = shade[0] + (lit[0] - shade[0]) * L;
    d[o + 1] = shade[1] + (lit[1] - shade[1]) * L;
    d[o + 2] = shade[2] + (lit[2] - shade[2]) * L;
    d[o + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  return c.canvas;
}
