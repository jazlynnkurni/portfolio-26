/* ============================================================================
 * THE RISO CARD
 *
 * One postcard of stock, lying in the wall's negative space, with a riso disc
 * printed on it. It replaces the field of vellum sheets: sixteen circles all of
 * the same shape only ever varied their colour, so they read as one texture
 * repeated rather than as a range. A single made object says more.
 *
 * A risograph lays one SPOT INK at a time. Each pass is screened on its own
 * grid at its own angle, the paper goes through again for the next colour, and
 * it never lands in quite the same place twice. Everything that makes a riso
 * look like a riso falls out of those three facts:
 *
 *   the screen angles   two screens at the same angle moire into mud, so the
 *                       trade turns each one. Where the turned screens cross,
 *                       the dots wheel into the little flower printers call a
 *                       rosette. That is the texture, and it cannot be drawn,
 *                       only allowed to happen.
 *   misregistration     each pass is off by a pixel or two. The edges show the
 *                       ink underneath, which is the tell everyone knows.
 *   transmissive ink    riso ink is a thin oily layer, not paint. It multiplies,
 *                       so two inks crossing make a third colour and the stock
 *                       keeps showing through all of them.
 *
 * The card is struck at its own size rather than filled with a tiled pattern.
 * A tile stretched across a card puts one period of the ornament on the whole
 * card, which is how a bead course turns into lumps. A card carries one die.
 * ========================================================================= */

/* the one lamp: upper left, raking, slightly toward the viewer */
const LAMP = norm3(-0.58, -0.66, 0.48);
const HALF = norm3(LAMP[0], LAMP[1], LAMP[2] + 1);

function norm3(x, y, z) {
  const m = Math.hypot(x, y, z) || 1;
  return [x / m, y / m, z / m];
}

/* a hash that wraps, so the stock's grain is seamless rather than merely random */
function hash(x, y, s) {
  const n = Math.sin((x % 512) * 127.1 + (y % 512) * 311.7 + s * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function swell(x, y, f, phase) {
  const u = (x / 512) * Math.PI * 2, v = (y / 512) * Math.PI * 2;
  return Math.sin(u * f + phase) * Math.sin(v * f + phase * 1.7);
}

const smooth = (e0, e1, x) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/* height -> normal by finite difference -> lambert plus a blinn highlight. The
   stock and the ink are the same three lines with different numbers. */
function shade(height, albedo, m, W, H) {
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
      const lum = m.amb + m.diff * diff;
      const col = albedo(x, y, lum);
      const o = i * 4;
      d[o] = Math.max(0, Math.min(255, col[0]));
      d[o + 1] = Math.max(0, Math.min(255, col[1]));
      d[o + 2] = Math.max(0, Math.min(255, col[2]));
      d[o + 3] = 255;
    }
  }
  return out;
}

/* --------------------------------------------------------------------------
 * the plate
 * ----------------------------------------------------------------------- */
function risoPlate(W, H, dark) {
  const h = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      /* card stock is thick, so its grain is coarse and its light is short */
      h[y * W + x] = (hash(x, y, 6) - 0.5) * 0.2
                   + (hash(x >> 1, y >> 1, 12) - 0.5) * 0.26
                   + swell(x, y, 3, 0.2) * 0.08;
    }
  }

  const S = Math.min(W, H);
  const cx = W / 2, cy = H / 2;
  const R = S * 0.225;
  /* HOW FAR APART THE DISCS SIT IS THE WHOLE COLOUR DECISION. Closer than a
     radius and every one of the six lies across the centre AND both neighbours,
     so most of the card is three inks deep, and three inks deep is black
     whatever the inks are. Past the radius they overlap in pairs, and a pair is
     where riso makes its extra colours. */
  const ring = R * 1.16;

  /* her three, used as spot inks. On the charcoal ground the ground IS the ink,
     so the passes have to carry light instead of taking it away. */
  const INKS = dark
    ? [[214, 198, 118], [196, 128, 148], [236, 232, 224]]
    : [[169, 153, 57], [52, 4, 20], [28, 26, 23]];   /* gold, oxblood, charcoal */

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

  const pitch = Math.max(3.4, S * 0.0135);

  function coverage(px, py, inkIndex) {
    let cov = 0;
    for (const d of discs) {
      if (d.ink !== inkIndex) continue;
      const r = Math.hypot(px - d.x, py - d.y);
      if (r > R) continue;
      const t = r / R;
      /* capped below solid on purpose: a screen that closes completely stops
         being a screen, and the middle of every disc does exactly that */
      cov = Math.max(cov, Math.min(0.84, (1 - t * t) * 1.02));
    }
    return cov;
  }

  function dot(px, py, angle, cov) {
    if (cov <= 0.004) return 0;
    const ca = Math.cos(angle), sa = Math.sin(angle);
    const u = px * ca + py * sa, v = -px * sa + py * ca;
    const fu = ((u % pitch) + pitch) % pitch - pitch / 2;
    const fv = ((v % pitch) + pitch) % pitch - pitch / 2;
    /* the dot's AREA tracks the coverage, so its radius follows the square root */
    const r = Math.sqrt(Math.min(1, cov)) * pitch * 0.62;
    return Math.hypot(fu, fv) < r ? 1 : 0;
  }

  const stock = dark ? [58, 54, 48] : [236, 229, 214];

  return shade(h, (x, y, lum) => {
    const col = [stock[0] * lum, stock[1] * lum, stock[2] * lum];
    for (let i = 0; i < 3; i++) {
      const pa = PASS[i];
      const cov = coverage(x - pa.dx, y - pa.dy, i);
      if (!dot(x, y, pa.angle, cov)) continue;
      const ink = INKS[i];
      /* THE SIGN OF THE PASS FLIPS WITH THE GROUND, and it has to. On paper the
         ink is darker than the stock, so a pass TAKES light away and multiply is
         the right model. On charcoal the stock is already darker than any ink
         her palette contains, so a multiply moves it almost nowhere and the
         whole print goes to mud. There the pass has to ADD light, which is a
         screen. Same inks, same screens, opposite sign: it is the same move the
         palette already makes when oxblood hands over to gold in dark mode.
         The opacity stays low either way because riso ink IS low. */
      const a = 0.58;
      for (let ch = 0; ch < 3; ch++) {
        col[ch] = dark
          ? 255 - (255 - col[ch]) * (1 - a * (ink[ch] / 255))
          : col[ch] * (1 - a * (1 - ink[ch] / 255)) + ink[ch] * 0.10;
      }
    }
    return col;
  }, { relief: 46, amb: 0.78, diff: 0.28 }, W, H);
}

/* rebuilding the plate is the expensive part, so it is kept until the card
   changes size or the mode flips */
const cache = new Map();
function plate(w, h, dark) {
  w = Math.max(8, Math.round(w)); h = Math.max(8, Math.round(h));
  const id = `${w}x${h}:${dark ? "d" : "l"}`;
  if (cache.has(id)) return cache.get(id);
  const img = risoPlate(w, h, dark);
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  cv.getContext("2d").putImageData(img, 0, 0);
  if (cache.size > 8) cache.clear();
  cache.set(id, cv);
  return cv;
}

/* --------------------------------------------------------------------------
 * the stamp die
 *
 * Traced clockwise with every arc biting INWARD. Drawing a rectangle and
 * subtracting circles fills the half of each circle that lies outside the
 * paper, which is invisible on a pale ground and glaring on charcoal. Tracing
 * the silhouette never asks the question.
 * ----------------------------------------------------------------------- */
function perfPath(c, w, h) {
  const R = Math.min(w, h) * 0.022;
  const run = (len) => Math.max(2, Math.round((len - R * 4.4) / (R * 2)));
  /* every corner keeps a whole tooth: starting a run half a pitch in leaves a
     sliver of card at each corner, which reads as a squashed edge */
  const corner = R * 2.2;

  const nTop = run(w), stepT = (w - corner * 2) / nTop;
  const nSide = run(h), stepS = (h - corner * 2) / nSide;

  c.moveTo(corner, 0);
  for (let i = 0; i < nTop; i++) {
    const m = corner + (i + 0.5) * stepT;
    c.lineTo(m - R, 0); c.arc(m, 0, R, Math.PI, 0, true); c.lineTo(m + R, 0);
  }
  c.lineTo(w, 0);
  for (let i = 0; i < nSide; i++) {
    const m = corner + (i + 0.5) * stepS;
    c.lineTo(w, m - R); c.arc(w, m, R, -Math.PI / 2, Math.PI / 2, true); c.lineTo(w, m + R);
  }
  c.lineTo(w, h);
  for (let i = nTop - 1; i >= 0; i--) {
    const m = corner + (i + 0.5) * stepT;
    c.lineTo(m + R, h); c.arc(m, h, R, 0, Math.PI, true); c.lineTo(m - R, h);
  }
  c.lineTo(0, h);
  for (let i = nSide - 1; i >= 0; i--) {
    const m = corner + (i + 0.5) * stepS;
    c.lineTo(0, m + R); c.arc(0, m, R, Math.PI / 2, -Math.PI / 2, true); c.lineTo(0, m - R);
  }
  c.closePath();
}

/* --------------------------------------------------------------------------
 * mounting it on the hero
 * ----------------------------------------------------------------------- */
export function mountRisoCard(cv) {
  if (!cv) return;
  const dark = () => document.documentElement.getAttribute("data-theme") === "dark";

  /* unit coordinates of the hero. The wall is left aligned and ragged right, so
     the right third is already empty and the card sits in it without ever
     crowding a letter. 1.4:1, near enough a real card. */
  const card = { x: 0.600, y: 0.225, w: 0.365, rot: -0.018, lift: 0 };

  let W = 0, H = 0, dpr = 1, c = null, raf = 0;
  let hot = false, held = false, grabX = 0, grabY = 0, easing = false;

  function size() {
    const r = cv.getBoundingClientRect();
    if (!r.width) return false;
    dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr;
    c = cv.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  const rect = () => {
    const w = card.w * W;
    return { x: card.x * W, y: card.y * H, w, h: w / 1.4 };
  };

  function draw() {
    raf = 0;
    if (!c) return;
    const d = dark();
    const r = rect();
    c.clearRect(0, 0, W, H);

    /* the lift is a real one: the card rises toward the eye, so it grows a
       little and its shadow lengthens and softens together. A shadow that grows
       while the card stays put reads as a glow, not a lift. */
    const L = card.lift;
    c.save();
    c.translate(r.x + r.w / 2, r.y + r.h / 2 - L * 5);
    c.rotate(card.rot * (1 - L * 0.4));
    c.scale(1 + L * 0.016, 1 + L * 0.016);
    c.translate(-r.w / 2, -r.h / 2);

    c.beginPath();
    perfPath(c, r.w, r.h);
    c.shadowColor = d ? `rgba(0,0,0,${0.42 + L * 0.2})` : `rgba(20,23,27,${0.16 + L * 0.1})`;
    c.shadowBlur = 20 + L * 26;
    c.shadowOffsetY = 8 + L * 16;
    c.fillStyle = "#000";
    c.fill();
    c.shadowColor = "transparent";
    c.save();
    c.clip();
    c.drawImage(plate(r.w, r.h, d), 0, 0, r.w, r.h);
    c.restore();
    c.restore();
  }
  const paint = () => { if (!raf) raf = requestAnimationFrame(draw); };

  /* the lift eases toward its target and then STOPS. Nothing animates once it
     has arrived, which keeps a page that is mostly read from holding a frame
     loop open forever. */
  function ease() {
    const want = (hot || held) ? 1 : 0;
    const d = want - card.lift;
    if (Math.abs(d) > 0.004) {
      card.lift += d * 0.18;
      paint();
      requestAnimationFrame(ease);
    } else {
      card.lift = want;
      easing = false;
      paint();
    }
  }
  const kick = () => { if (!easing) { easing = true; requestAnimationFrame(ease); } };

  const at = (e) => {
    const r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const over = (p) => {
    const r = rect();
    return p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h;
  };

  cv.addEventListener("pointermove", (e) => {
    const p = at(e);
    if (held) {
      card.x = (p.x - grabX) / W;
      card.y = (p.y - grabY) / H;
      paint();
      return;
    }
    const o = over(p);
    /* the page hides the system cursor, so the bead has to say it is grabbable */
    cv.dataset.grab = o ? "1" : "0";
    if (o !== hot) { hot = o; kick(); }
  });

  cv.addEventListener("pointerdown", (e) => {
    const p = at(e);
    if (!over(p)) return;
    held = true;
    grabX = p.x - card.x * W;
    grabY = p.y - card.y * H;
    cv.setPointerCapture(e.pointerId);
    kick();
  });

  const drop = () => { if (held) { held = false; kick(); } };
  addEventListener("pointerup", drop);
  addEventListener("pointercancel", drop);
  cv.addEventListener("pointerleave", () => { if (hot) { hot = false; kick(); } });

  size();
  paint();
  new ResizeObserver(() => { if (size()) paint(); }).observe(cv);
  addEventListener("themechange", paint);
}
