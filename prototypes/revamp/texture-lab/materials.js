/* ============================================================================
 * THE MATERIALS
 *
 * The argument this lab is making is that the range is real, so the range has
 * to be the only thing that changes. Every material here is the same two
 * pieces: a HEIGHT FIELD, and a SURFACE RESPONSE to one lamp. The lamp never
 * moves, the scale never changes, the renderer is shared. What separates
 * planished tin from a pigment wash is how deep the field is cut and how the
 * surface answers the light, which is what actually separates them in life.
 *
 * That is also why this beats a row of swatches. Swatches sit in boxes and the
 * boxes do the comparing. Here nothing is in a box: the materials abut, under
 * one light, and the eye does the comparing on its own.
 *
 * Each material builds ONE seamless tile. Layout is then composition of tiles,
 * which is cheap, so a boundary can be dragged at sixty frames without any of
 * this running again.
 * ========================================================================= */

export const TILE = 512;

/* coverage of the wash, carried out of the height pass into the albedo pass */
const blobCov = new Float32Array(512 * 512);

/* the one lamp. Upper left, raking, slightly toward the viewer. Every material
   is lit by exactly this, which is the whole unity argument. */
const LAMP = norm3(-0.58, -0.66, 0.48);
const HALF = norm3(LAMP[0], LAMP[1], LAMP[2] + 1); /* view is straight on */

function norm3(x, y, z) {
  const m = Math.hypot(x, y, z) || 1;
  return [x / m, y / m, z / m];
}

/* A hash that wraps on the tile, so the speckle is seamless rather than merely
   random. A plain Math.random per pixel cannot tile and shows a seam the moment
   the pattern repeats across a wide hero. */
function hash(x, y, s) {
  const n = Math.sin((x % TILE) * 127.1 + (y % TILE) * 311.7 + s * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

/* smooth periodic noise: integer frequencies over the tile, so it closes on
   itself exactly. Cheap, and the only kind that tiles without a mask. */
function swell(x, y, f, phase) {
  const u = (x / TILE) * Math.PI * 2, v = (y / TILE) * Math.PI * 2;
  return Math.sin(u * f + phase) * Math.sin(v * f + phase * 1.7);
}

/* distance on a torus, so a bump drawn near an edge comes back on the far side
   instead of being clipped */
function wrapD(ax, ay, bx, by) {
  let dx = Math.abs(ax - bx), dy = Math.abs(ay - by);
  if (dx > TILE / 2) dx = TILE - dx;
  if (dy > TILE / 2) dy = TILE - dy;
  return Math.hypot(dx, dy);
}

const smooth = (e0, e1, x) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/* ---------------------------------------------------------------------------
 * THE SHARED RENDERER
 *
 * height -> normal by finite difference -> lambert + blinn specular. The only
 * per-material inputs are the depth of the cut (relief), how much light the
 * body returns (amb/diff), and how sharply the surface answers a highlight
 * (spec/shine). Tin and tissue are the same three lines with different numbers.
 * ------------------------------------------------------------------------ */
function shade(height, albedo, m, W, H) {
  W = W || TILE; H = H || TILE;
  const out = new ImageData(W, H);
  const d = out.data;
  const at = (x, y) => height[((y + H) % H) * W + ((x + W) % W)];

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const dx = (at(x + 1, y) - at(x - 1, y)) * m.relief;
      const dy = (at(x, y + 1) - at(x, y - 1)) * m.relief;
      const n = norm3(-dx, -dy, 1);

      const diff = Math.max(0, n[0] * LAMP[0] + n[1] * LAMP[1] + n[2] * LAMP[2]);
      const sp = Math.max(0, n[0] * HALF[0] + n[1] * HALF[1] + n[2] * HALF[2]);
      const spec = Math.pow(sp, m.shine) * m.spec;

      const lum = m.amb + m.diff * diff;
      const col = albedo(x, y, height[i], lum, spec);

      const o = i * 4;
      d[o] = Math.max(0, Math.min(255, col[0]));
      d[o + 1] = Math.max(0, Math.min(255, col[1]));
      d[o + 2] = Math.max(0, Math.min(255, col[2]));
      d[o + 3] = col.length > 3 ? col[3] : 255;
    }
  }
  return out;
}

function toCanvas(imageData) {
  const cv = document.createElement("canvas");
  cv.width = imageData.width; cv.height = imageData.height;
  cv.getContext("2d").putImageData(imageData, 0, 0);
  return cv;
}

/* ===========================================================================
 * 1. PIGMENT WASH
 * Almost no relief. A wash is not an object, it is a concentration, so the
 * light does nothing here except confirm the paper is flat. The variety is in
 * the ink, not the surface, and putting it beside four surfaces that DO answer
 * the light is what makes that legible.
 * ======================================================================== */
function wash(dark) {
  const h = new Float32Array(TILE * TILE);
  const ink = new Float32Array(TILE * TILE * 3);

  /* her swatches, at printing strength. A pale wash multiplied into white paper
     is nothing, so the concentration is raised while the hue is left alone. */
  const SW = dark
    ? ["#dfdcc4", "#d7d3dc", "#ece5d3", "#cdcfcb", "#e1d7c7", "#d5dacb"]
    : ["#8a7f3a", "#6f6580", "#9a8a52", "#5f6b60", "#8d7548", "#5c7355"];
  const blobs = [];
  for (let i = 0; i < 7; i++) {
    const c = SW[i % SW.length];
    const n = parseInt(c.slice(1), 16);
    blobs.push({
      x: hash(i * 37, i * 11, 3) * TILE,
      y: hash(i * 71, i * 53, 9) * TILE,
      r: TILE * (0.22 + hash(i, i, 17) * 0.2),
      c: [(n >> 16) & 255, (n >> 8) & 255, n & 255],
    });
  }

  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const i = y * TILE + x;
      let r = 0, g = 0, b = 0, a = 0;
      for (const bl of blobs) {
        const t = 1 - smooth(bl.r * 0.1, bl.r, wrapD(x, y, bl.x, bl.y));
        if (t <= 0) continue;
        const w = t * 0.5;
        r += bl.c[0] * w; g += bl.c[1] * w; b += bl.c[2] * w; a += w;
      }
      if (a > 0) { r /= a; g /= a; b /= a; }
      /* the tooth of the sheet, which is half of what a wash on paper is */
      h[i] = (hash(x, y, 1) - 0.5) * 0.09 + swell(x, y, 3, 0.4) * 0.02;
      ink[i * 3] = r; ink[i * 3 + 1] = g; ink[i * 3 + 2] = b;
      blobCov[i] = Math.min(1, a);
    }
  }

  return shade(h, (x, y, hv, lum) => {
    const i = y * TILE + x;
    const cov = blobCov[i];
    const paper = dark ? 28 : 250;
    const k = cov * (dark ? 0.55 : 0.62) * lum;
    return [
      paper + (ink[i * 3] - paper) * k,
      paper + (ink[i * 3 + 1] - paper) * k,
      paper + (ink[i * 3 + 2] - paper) * k,
    ];
  }, { relief: 40, amb: 0.86, diff: 0.18, spec: 0.0, shine: 8 });
}

/* ===========================================================================
 * 2. STRUCK TIN
 * Read off the toggle's die. Sheet metal will not take a crease: every stroke
 * rises on a rounded shoulder with a flat crown, and it is the SHOULDER that
 * catches a light as a hard line. So the ornament is cut as a height field and
 * the highlight is left to find it, rather than being drawn as a white stroke.
 * ======================================================================== */
function tin(dark) {
  const h = new Float32Array(TILE * TILE);

  /* planishing: the shallow overlapping dents a hammer leaves. This is what
     stops flat metal reading as plastic. */
  const dents = [];
  for (let i = 0; i < 46; i++) {
    dents.push({
      x: hash(i * 13, i * 29, 2) * TILE,
      y: hash(i * 91, i * 7, 5) * TILE,
      r: TILE * (0.05 + hash(i, i * 3, 8) * 0.06),
    });
  }

  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const i = y * TILE + x;
      let v = 0;
      for (const d of dents) {
        const t = 1 - smooth(0, d.r, wrapD(x, y, d.x, d.y));
        v -= t * t * 0.34;
      }
      /* the rolled grain of the sheet, fine and directional */
      v += (hash(x, y, 4) - 0.5) * 0.05 + swell(x, y, 8, 1.1) * 0.02;

      /* a raised rule top and bottom, on a rounded shoulder */
      for (const ry of [TILE * 0.14, TILE * 0.86]) {
        v += (1 - smooth(1.5, 5.5, Math.abs(y - ry))) * 0.5;
      }

      /* the bead course: a row of raised beads following the rule */
      const bp = TILE / 16;
      const bx = ((x % bp) - bp / 2), byTop = y - TILE * 0.2, byBot = y - TILE * 0.8;
      v += (1 - smooth(0, bp * 0.32, Math.hypot(bx, byTop))) * 0.55;
      v += (1 - smooth(0, bp * 0.32, Math.hypot(bx, byBot))) * 0.55;

      /* a running vine down the middle: a continuous wave with leaves
         alternating off it. A closed motif tiled along a run reads as a row of
         letters, which is why this is a wave and not a stamp. */
      const vy = TILE * 0.5 + Math.sin((x / TILE) * Math.PI * 4) * TILE * 0.075;
      v += (1 - smooth(1.2, 4.2, Math.abs(y - vy))) * 0.62;
      const per = TILE / 8;
      const lx = (x % per) - per / 2;
      const side = Math.floor(x / (per / 2)) % 2 ? 1 : -1;
      const ly = y - (vy + side * TILE * 0.055);
      v += (1 - smooth(0, per * 0.26, Math.hypot(lx * 1.5, ly))) * 0.45;

      h[i] = v;
    }
  }

  /* metal returns the room, not the page, so the body is nearly flat and almost
     everything you read is the specular. Pewter rather than chrome: the tin in
     the toggle is warm and slightly dirty. */
  const base = dark ? [128, 126, 120] : [163, 160, 152];
  return shade(h, (x, y, hv, lum, spec) => {
    const k = lum * (0.72 + hv * 0.1);
    const s = spec * 255;
    return [base[0] * k + s, base[1] * k + s * 0.99, base[2] * k + s * 0.94];
  }, { relief: 118, amb: 0.34, diff: 0.62, spec: 0.92, shine: 34 });
}

/* ===========================================================================
 * 3. POSTCARD STOCK
 * Card is thick, so its grain is coarse and its light is soft and short. The
 * printed side is a dithered halftone rather than a smooth tint, because that
 * is what a card actually carries and it is a second texture sitting ON the
 * first. Two materials in one sheet, which is the point.
 * ======================================================================== */
const BAYER = [
  [0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5],
];
function postcard(dark) {
  const h = new Float32Array(TILE * TILE);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const i = y * TILE + x;
      /* coarse stock: long fibres, felt side up */
      h[i] = (hash(x, y, 6) - 0.5) * 0.22
           + (hash(x >> 1, y >> 1, 12) - 0.5) * 0.3
           + swell(x, y, 2, 0.2) * 0.12;
    }
  }
  const card = dark ? [58, 54, 48] : [232, 224, 208];
  const ink = dark ? [206, 198, 180] : [52, 4, 20]; /* oxblood, her plate colour */

  return shade(h, (x, y, hv, lum) => {
    /* the printed image: a soft field thresholded through a 4x4 ordered dither,
       so the tone is made of dots you can count rather than a gradient */
    const g = 0.5 + 0.5 * Math.sin((x / TILE) * Math.PI * 2 + 0.6) * Math.cos((y / TILE) * Math.PI * 2);
    const cell = BAYER[y & 3][x & 3] / 16;
    const on = g * 0.9 > cell ? 1 : 0;
    const k = lum;
    return [
      (card[0] + (ink[0] - card[0]) * on * 0.82) * k,
      (card[1] + (ink[1] - card[1]) * on * 0.82) * k,
      (card[2] + (ink[2] - card[2]) * on * 0.82) * k,
    ];
  }, { relief: 52, amb: 0.7, diff: 0.36, spec: 0.06, shine: 6 });
}

/* ===========================================================================
 * 4. VELLUM
 * Translucent, so the light does not stop at the surface. Almost no specular,
 * a high ambient, and a fine even tooth. Next to tin it is the opposite end of
 * the same scale, which is why both belong in the set.
 * ======================================================================== */
function vellum(dark) {
  const h = new Float32Array(TILE * TILE);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const i = y * TILE + x;
      h[i] = (hash(x, y, 21) - 0.5) * 0.07 + swell(x, y, 5, 2.1) * 0.05;
    }
  }
  const body = dark ? [74, 72, 66] : [226, 221, 206];
  return shade(h, (x, y, hv, lum) => {
    const k = lum;
    return [body[0] * k, body[1] * k, body[2] * k];
  }, { relief: 30, amb: 0.82, diff: 0.22, spec: 0.05, shine: 10 });
}

/* ===========================================================================
 * 5. FIBRE TISSUE
 * The thinnest thing in the set. Almost all ambient, a visible directional
 * grain, no highlight at all.
 * ======================================================================== */
function tissue(dark) {
  const h = new Float32Array(TILE * TILE);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const i = y * TILE + x;
      /* drawn out along one axis, the way a laid sheet is */
      h[i] = (hash(x, y, 33) - 0.5) * 0.1
           + (hash(x >> 3, y, 41) - 0.5) * 0.24
           + swell(x, y, 4, 0.9) * 0.04;
    }
  }
  const body = dark ? [52, 50, 45] : [238, 233, 221];
  return shade(h, (x, y, hv, lum) => {
    const k = lum;
    return [body[0] * k, body[1] * k, body[2] * k];
  }, { relief: 44, amb: 0.78, diff: 0.3, spec: 0.0, shine: 8 });
}

/* the set, in the order they run left to right. Tin sits in the middle on
   purpose: it is the loudest surface, and putting it between two quiet ones is
   what makes both of them legible as choices rather than as absence. */
export const KINDS = [
  { key: "wash", name: "pigment wash", build: wash },
  { key: "tissue", name: "fibre tissue", build: tissue },
  { key: "tin", name: "struck tin", build: tin },
  { key: "postcard", name: "postcard stock", build: postcard },
  { key: "vellum", name: "vellum", build: vellum },
];



/* ===========================================================================
 * THE PLATES
 *
 * A card is not a swatch. Tiling a 512 square across a 430px card puts one
 * period of the ornament on the whole card, so the bead course reads as lumps
 * and the vine as a crack. A struck card carries ONE die fitted to it: a rim
 * following the edge, a course inside the rim, a motif in the middle. That is
 * what the toggle does and it is why the toggle reads as metal.
 *
 * So these render at card size. Same lamp, same renderer, same two lines of
 * surface response. Only the layout of the cut changes.
 * ======================================================================== */

/* a plate is expensive enough to be worth keeping, and it only changes when the
   card changes size or the mode flips */
const plateCache = new Map();

export function plate(kind, w, h, dark) {
  w = Math.max(8, Math.round(w)); h = Math.max(8, Math.round(h));
  const id = `${kind}:${w}x${h}:${dark ? "d" : "l"}`;
  if (plateCache.has(id)) return plateCache.get(id);
  const build = kind === "tin" ? tinPlate : kind === "riso" ? risoPlate : cardPlate;
  const cv = toCanvas(build(w, h, dark));
  if (plateCache.size > 24) plateCache.clear();
  plateCache.set(id, cv);
  return cv;
}

/* --- struck tin, cut as a die ------------------------------------------- */
function tinPlate(W, H, dark) {
  const h = new Float32Array(W * H);
  const S = Math.min(W, H);
  const inset = S * 0.085;          /* the rim sits inside the perforation */
  const rule = inset + S * 0.052;
  const bead = rule + S * 0.045;

  /* planishing, at a size that reads as hammer marks rather than as craters */
  const dents = [];
  const nd = Math.round((W * H) / (S * S) * 26);
  for (let i = 0; i < nd; i++) {
    dents.push({ x: hash(i * 13, i * 29, 2) * W, y: hash(i * 91, i * 7, 5) * H,
                 r: S * (0.035 + hash(i, i * 3, 8) * 0.045) });
  }

  /* distance to the rounded rectangle that each course follows. One function,
     three offsets, so every course is genuinely concentric with the card edge
     rather than four strokes that happen to meet. */
  const ring = (x, y, d) => {
    const rx = Math.max(d - x, x - (W - d), 0);
    const ry = Math.max(d - y, y - (H - d), 0);
    const outside = Math.hypot(rx, ry);
    const inside = Math.min(Math.min(x - d, W - d - x), Math.min(y - d, H - d - y));
    return outside > 0 ? outside : -inside;
  };

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let v = 0;
      for (const dd of dents) {
        const t = 1 - smooth(0, dd.r, Math.hypot(x - dd.x, y - dd.y));
        v -= t * t * 0.14;
      }
      /* A DEEP CUT AND A HARD HIGHLIGHT MULTIPLY. At relief 88 the per pixel
         grain stopped being a rolled finish and became static, and static is
         what buried the die. The grain is barely there now: on metal you want
         to know the sheet is not glass, not to read every fibre of it. */
      v += (hash(x, y, 4) - 0.5) * 0.014 + swell(x, y, 9, 1.1) * 0.012;

      /* the raised rim: a wide shoulder, flat crown. Sheet metal will not take a
         crease, and the shoulder is the thing that catches the light as a line. */
      v += (1 - smooth(0, S * 0.028, Math.abs(ring(x, y, inset)))) * 0.85;
      /* a fine rule inside it */
      v += (1 - smooth(0, S * 0.012, Math.abs(ring(x, y, rule)))) * 0.5;

      /* the bead course, beads set along the rule at a fixed pitch */
      const pitch = S * 0.062;
      const dB = ring(x, y, bead);
      if (Math.abs(dB) < pitch) {
        /* position along the perimeter, so beads march round the corners too */
        const px = Math.min(Math.max(x, bead), W - bead), py = Math.min(Math.max(y, bead), H - bead);
        const per = ((px - bead) + (py - bead) * 1.0);
        const ph = ((per % pitch) + pitch) % pitch - pitch / 2;
        v += (1 - smooth(0, pitch * 0.34, Math.hypot(ph, dB))) * 0.62;
      }

      /* the centre: a rosette on a boss, the motif the toggle carries */
      const cx = W / 2, cy = H / 2, R = S * 0.20;
      const dx = x - cx, dy = y - cy, rr = Math.hypot(dx, dy);
      if (rr < R * 1.35) {
        const a = Math.atan2(dy, dx);
        /* petals: the radius of the flower varies with angle, twelve of them */
        const petal = R * (0.62 + 0.24 * Math.abs(Math.cos(a * 6)));
        v += (1 - smooth(petal - S * 0.012, petal, rr)) * 0.55;
        /* the boss it is struck on */
        v += (1 - smooth(R * 0.2, R * 0.30, rr)) * 0.7;
      }
      h[i] = v;
    }
  }

  /* pewter, not chrome. The toggle's tin is warm and a little dirty, and most
     of what you read on metal is the highlight rather than the body. */
  /* Metal is read almost entirely off its highlight. A body that is too bright
     and a specular that is too soft is exactly how tin turns into cast stone,
     which is what the first pass did: darken the body, harden the highlight,
     and let the shoulders do the talking. Warm, because her tin is warm. */
  const base = dark ? [156, 150, 137] : [182, 177, 163];
  return shade(h, (x, y, hv, lum, spec) => {
    const k = lum;
    const sp = spec * 250;
    return [base[0] * k + sp, base[1] * k + sp * 0.97, base[2] * k + sp * 0.87];
  }, { relief: 64, amb: 0.56, diff: 0.5, spec: 1.0, shine: 44 }, W, H);
}


/* --- the riso disc, printed on the stock ---------------------------------
 *
 * A risograph lays one SPOT INK at a time. Each pass is screened on its own
 * grid at its own angle, the paper goes through again for the next colour, and
 * it never lands in quite the same place twice. Everything that makes a riso
 * look like a riso falls out of those three facts:
 *
 *   the screen angles   two screens at the same angle moire into mud, so the
 *                       trade turns each one. Where the turned screens cross,
 *                       the dots wheel into the little flower that printers
 *                       call a rosette. That is the texture, and it cannot be
 *                       drawn, only allowed to happen.
 *   misregistration     each pass is off by a pixel or two. The edges show the
 *                       ink underneath, which is the tell everyone recognises.
 *   transmissive ink    riso ink is a thin oily layer, not paint. It multiplies,
 *                       so two inks crossing make a third colour and the stock
 *                       keeps showing through all of them.
 *
 * The discs are the classic seven, a centre with six around it at one radius,
 * and the ink rotates disc by disc so every overlap is a pair of DIFFERENT
 * colours. That is where the print gets its third and fourth colour from
 * without a third and fourth pass.
 * ---------------------------------------------------------------------- */
function risoPlate(W, H, dark) {
  const h = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      h[y * W + x] = (hash(x, y, 6) - 0.5) * 0.2
                   + (hash(x >> 1, y >> 1, 12) - 0.5) * 0.26
                   + swell(x, y, 3, 0.2) * 0.08;
    }
  }

  const S = Math.min(W, H);
  const cx = W / 2, cy = H / 2;
  const R = S * 0.225;                    /* disc radius */
  /* HOW FAR APART THE DISCS SIT IS THE WHOLE COLOUR DECISION. At 0.92 every one
     of the six lay across the centre AND across both its neighbours, so most of
     the card was three inks deep and three inks deep is black whatever the inks
     are. Pushed out past the radius they overlap in pairs, and a pair is where
     riso makes its extra colours. */
  const ring = R * 1.16;                  /* how far the six sit from the middle */

  /* her three, used as spot inks. On the dark ground the ground is the ink and
     the inks have to carry light instead, so they lift rather than multiply. */
  const INKS = dark
    ? [[214, 198, 118], [196, 128, 148], [236, 232, 224]]
    : [[169, 153, 57], [52, 4, 20], [28, 26, 23]];      /* gold, oxblood, charcoal */

  /* one pass per ink: its own screen angle, its own slip off register */
  const PASS = [
    { angle: 15 * Math.PI / 180, dx: 0.0, dy: 0.0 },
    { angle: 75 * Math.PI / 180, dx: 2.0, dy: -1.4 },
    { angle: 45 * Math.PI / 180, dx: -1.6, dy: 1.8 },
  ];

  const discs = [{ x: cx, y: cy, ink: 0 }];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    discs.push({ x: cx + Math.cos(a) * ring, y: cy + Math.sin(a) * ring, ink: (i + 1) % 3 });
  }

  const pitch = Math.max(3.4, S * 0.0135);  /* the screen ruling */

  /* how much ink a pass wants at this point: the union of its own discs, dense
     in the middle of each and opening out toward the edge, so the dot size has
     somewhere to travel and the disc reads as printed rather than as filled */
  function coverage(px, py, inkIndex) {
    let cov = 0;
    for (const d of discs) {
      if (d.ink !== inkIndex) continue;
      const r = Math.hypot(px - d.x, py - d.y);
      if (r > R) continue;
      const t = r / R;
      /* capped below solid on purpose: a screen that closes completely stops
         being a screen, and the middle of every disc was doing exactly that */
      cov = Math.max(cov, Math.min(0.84, (1 - t * t) * 1.02));
    }
    return cov;
  }

  /* the screen itself. Rotate into the pass's own grid, find the cell centre,
     and open a dot whose radius follows the coverage. */
  function dot(px, py, angle, cov) {
    if (cov <= 0.004) return 0;
    const ca = Math.cos(angle), sa = Math.sin(angle);
    const u = px * ca + py * sa, v = -px * sa + py * ca;
    const fu = ((u % pitch) + pitch) % pitch - pitch / 2;
    const fv = ((v % pitch) + pitch) % pitch - pitch / 2;
    /* area of the dot tracks the coverage, so radius follows its square root */
    const r = Math.sqrt(Math.min(1, cov)) * pitch * 0.62;
    return Math.hypot(fu, fv) < r ? 1 : 0;
  }

  const stock = dark ? [58, 54, 48] : [236, 229, 214];
  /* the stamp stock's own tone, laid down as an ordered dither across the whole
     sheet rather than in a panel. It is well under the inks, so it never
     competes with them: what it does is stop the paper being a flat colour, so
     the discs land on something printed instead of on a void. Two device pixels
     per dither step, because a 4x4 Bayer at one pixel is finer than the screen
     resolves and averages back into flat. */
  const tooth = dark ? [96, 90, 80] : [206, 197, 178];

  return shade(h, (x, y, hv, lum) => {
    const paperDot = 0.42 > BAYER[(y >> 1) & 3][(x >> 1) & 3] / 16 ? 1 : 0;
    const g = [
      (stock[0] + (tooth[0] - stock[0]) * paperDot) * lum,
      (stock[1] + (tooth[1] - stock[1]) * paperDot) * lum,
      (stock[2] + (tooth[2] - stock[2]) * paperDot) * lum,
    ];
    let col = [g[0], g[1], g[2]];
    for (let i = 0; i < 3; i++) {
      const pa = PASS[i];
      const cov = coverage(x - pa.dx, y - pa.dy, i);
      if (!dot(x, y, pa.angle, cov)) continue;
      const ink = INKS[i];
      /* Thin oily ink, so the pass multiplies and the stock stays visible under
         every one of them. The opacity is low because riso ink IS low: a dense
         multiply is how an overprint stops being a colour and starts being a
         hole, which is what killed the gold in the first pass. */
      /* the sign of the pass flips with the ground: multiply on paper, where the
         ink is darker than the stock, screen on charcoal, where it is lighter */
      const a = 0.58;
      for (let ch = 0; ch < 3; ch++) {
        col[ch] = dark
          ? 255 - (255 - col[ch]) * (1 - a * (ink[ch] / 255))
          : col[ch] * (1 - a * (1 - ink[ch] / 255)) + ink[ch] * 0.10;
      }
    }
    return col;
  }, { relief: 46, amb: 0.78, diff: 0.28, spec: 0.04, shine: 6 }, W, H);
}

/* --- postcard stock ------------------------------------------------------ */
function cardPlate(W, H, dark) {
  const h = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      h[y * W + x] = (hash(x, y, 6) - 0.5) * 0.2
                   + (hash(x >> 1, y >> 1, 12) - 0.5) * 0.26
                   + swell(x, y, 3, 0.2) * 0.08;
    }
  }
  const card = dark ? [206, 198, 182] : [236, 229, 214];
  const ink = dark ? [42, 39, 34] : [52, 4, 20];   /* oxblood, her plate colour */

  /* the printed panel: inset from the edge the way a card's image is, carrying
     a tone laid down as an ordered dither so it is dots you can count rather
     than a gradient. Left deliberately quiet: this is the surface whatever the
     cards end up doing will be printed ON. */
  const S = Math.min(W, H), m = S * 0.135;
  return shade(h, (x, y, hv, lum) => {
    const k = lum;
    let on = 0;
    /* THE DITHER CELL HAS TO BE BIG ENOUGH TO SEE. A 4x4 Bayer at one device
       pixel is finer than the screen resolves, so it averages back into the
       flat block the first pass produced. Two device pixels per dither step
       makes an 8px cell, which is a dot you can count, and the tone then has
       somewhere to put its gradient. */
    if (x > m && x < W - m && y > m && y < H - m) {
      const u = (x - m) / (W - 2 * m), v = (y - m) / (H - 2 * m);
      /* raking light across the panel plus a soft corner fall, so dot size runs
         the whole way from open to solid and the screen is legible as a screen */
      const g = Math.max(0, Math.min(1,
        1.05 - u * 0.85 + v * 0.55 - Math.hypot(u - 0.5, v - 0.5) * 0.45));
      on = g > BAYER[(y >> 1) & 3][(x >> 1) & 3] / 16 ? 1 : 0;
    }
    const a = on * 0.78;
    return [
      (card[0] + (ink[0] - card[0]) * a) * k,
      (card[1] + (ink[1] - card[1]) * a) * k,
      (card[2] + (ink[2] - card[2]) * a) * k,
    ];
  }, { relief: 46, amb: 0.76, diff: 0.3, spec: 0.05, shine: 6 }, W, H);
}

const cache = new Map();
export function tile(key, dark) {
  const id = key + (dark ? ":d" : ":l");
  if (cache.has(id)) return cache.get(id);
  const k = KINDS.find((m) => m.key === key);
  const cv = toCanvas(k.build(dark));
  cache.set(id, cv);
  return cv;
}
