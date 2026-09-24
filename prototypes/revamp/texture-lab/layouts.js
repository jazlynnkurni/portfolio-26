/* ============================================================================
 * THE THREE ARRANGEMENTS
 *
 * All three composite the same five tiles under the same lamp. They differ only
 * in WHERE a material stops and the next one starts, which is the actual
 * question: what carries the range without putting anything in a box.
 * ========================================================================= */
import { tile, plate } from "./materials.js";
import { gardenPlate } from "./garden.js";
import { createGarden } from "./garden-gl.js";

const ORDER = ["wash", "tissue", "tin", "postcard", "vellum"];

/* ---------------------------------------------------------------------------
 * A. ONE SHEET, BANDS ACROSS IT
 *
 * A printer's make-ready. One sheet runs the full bleed and the material changes
 * as it crosses, with the boundaries soft so nothing reads as an edge. The
 * comparison is built in because the materials abut: you never see one alone.
 * Drag a boundary and the two either side trade width.
 * ------------------------------------------------------------------------ */
export const bands = {
  name: "One sheet, bands across it",
  note: "materials abut, no edges anywhere. drag a seam to retrade the width",
  /* fractions of the width, the seams between the five bands */
  seams: [0.2, 0.4, 0.6, 0.8],

  draw(c, W, H, dark) {
    const stops = [0, ...this.seams, 1];
    /* FEATHER. A hard seam would be a frame by another name, so each boundary
       is a short crossfade: the outgoing band is painted full width and the
       incoming one is masked in over about forty pixels. */
    const F = Math.max(24, W * 0.035);

    for (let i = 0; i < ORDER.length; i++) {
      const x0 = stops[i] * W, x1 = stops[i + 1] * W;
      const t = tile(ORDER[i], dark);
      c.save();
      c.beginPath();
      /* the band plus its feather on both sides, so the fade has something to
         fade from */
      c.rect(x0 - (i ? F : 0), 0, (x1 - x0) + (i ? F : 0) + (i < 4 ? F : 0), H);
      c.clip();
      const g = c.createLinearGradient(x0 - F, 0, x1 + F, 0);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(Math.min(0.49, F / (x1 - x0 + 2 * F)), "rgba(0,0,0,1)");
      g.addColorStop(Math.max(0.51, 1 - F / (x1 - x0 + 2 * F)), "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      const p = c.createPattern(t, "repeat");
      if (i === 0) { c.fillStyle = p; c.fillRect(x0, 0, x1 - x0 + F, H); }
      else {
        /* mask the incoming band with its own feather */
        const buf = scratch(W, H);
        buf.fillStyle = p;
        buf.fillRect(x0 - F, 0, x1 - x0 + 2 * F, H);
        buf.globalCompositeOperation = "destination-in";
        buf.fillStyle = g;
        buf.fillRect(x0 - F, 0, x1 - x0 + 2 * F, H);
        buf.globalCompositeOperation = "source-over";
        c.drawImage(buf.canvas, 0, 0);
      }
      c.restore();
    }
  },

  /* the seam nearest the pointer, if the hand is close enough to mean it */
  pick(px, W) {
    let best = -1, d = 22;
    this.seams.forEach((s, i) => {
      const dd = Math.abs(s * W - px);
      if (dd < d) { d = dd; best = i; }
    });
    return best;
  },
  move(i, px, W) {
    const lo = i === 0 ? 0.06 : this.seams[i - 1] + 0.06;
    const hi = i === this.seams.length - 1 ? 0.94 : this.seams[i + 1] - 0.06;
    this.seams[i] = Math.max(lo, Math.min(hi, px / W));
  },
};

let _s = null;
function scratch(W, H) {
  if (!_s || _s.canvas.width !== W || _s.canvas.height !== H) {
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    _s = cv.getContext("2d");
  }
  _s.clearRect(0, 0, W, H);
  return _s;
}

/* ---------------------------------------------------------------------------
 * B. THE WALL CARRIES THEM, ROW BY ROW
 *
 * The name is the only container, so there are no others. Each row of the
 * letter grid is printed on a different stock, and the band is cut to the row
 * rather than to the page. Reads as a press proof of one plate on five papers.
 * ------------------------------------------------------------------------ */
export const rows = {
  name: "The wall carries them, row by row",
  note: "every line is a different stock. the name is the only container",
  /* filled by the page: the rects of each word row, in canvas coordinates */
  bands: [],
  offset: 0,

  draw(c, W, H, dark) {
    this.bands.forEach((b, i) => {
      const t = tile(ORDER[(i + this.offset) % ORDER.length], dark);
      /* the band runs past both ends of its row so the material is a sheet the
         word sits on, not a highlight behind it */
      const pad = b.h * 0.18;
      c.save();
      c.beginPath();
      c.rect(0, b.y - pad, W, b.h + pad * 2);
      c.clip();
      c.fillStyle = c.createPattern(t, "repeat");
      c.fillRect(0, b.y - pad, W, b.h + pad * 2);
      /* the sheet runs out rather than ending, on the right only, so the ragged
         right of the wall stays the thing that ends the line */
      const fade = c.createLinearGradient(b.w * 0.72, 0, Math.min(W, b.w * 1.5), 0);
      fade.addColorStop(0, "rgba(0,0,0,1)");
      fade.addColorStop(1, "rgba(0,0,0,0)");
      c.globalCompositeOperation = "destination-in";
      c.fillStyle = fade;
      c.fillRect(0, b.y - pad, W, b.h + pad * 2);
      c.restore();
    });
  },
  pick() { return -1; },
  move() {},
};

/* ---------------------------------------------------------------------------
 * C. TORN SHEETS, OVERLAPPING
 *
 * Real sheets of different stock laid over each other. The edge does the work
 * the disc was throwing away: a deckle is a torn fibre edge, a perforation is a
 * die, a trimmed edge is a knife. Three different ways of ending a sheet is a
 * range claim on its own, before the surfaces are even counted.
 * ------------------------------------------------------------------------ */
export const torn = {
  name: "Torn sheets, overlapping",
  note: "stock and edge both vary. drag a sheet, it comes to the top",
  sheets: [
    { k: "wash", x: 0.30, y: 0.26, w: 0.40, h: 0.34, edge: "deckle", rot: -0.03 },
    { k: "postcard", x: 0.56, y: 0.14, w: 0.34, h: 0.46, edge: "perf", rot: 0.02 },
    { k: "tin", x: 0.48, y: 0.52, w: 0.26, h: 0.26, edge: "cut", rot: -0.01 },
    { k: "tissue", x: 0.72, y: 0.46, w: 0.34, h: 0.30, edge: "deckle", rot: 0.04 },
    { k: "vellum", x: 0.38, y: 0.62, w: 0.30, h: 0.24, edge: "cut", rot: 0.01 },
  ],

  draw(c, W, H, dark) {
    for (const s of this.sheets) {
      const x = s.x * W, y = s.y * H, w = s.w * W, h = s.h * H;
      c.save();
      c.translate(x + w / 2, y + h / 2);
      c.rotate(s.rot);
      c.translate(-w / 2, -h / 2);
      c.beginPath();
      edgePath(c, w, h, s.edge);
      /* the sheet is a real object here, so it casts. Drop shadow rather than a
         border: the lift is what says it is on top of the one beneath it. */
      c.shadowColor = dark ? "rgba(0,0,0,.55)" : "rgba(20,23,27,.20)";
      c.shadowBlur = 26;
      c.shadowOffsetY = 10;
      c.fillStyle = "#000";
      c.fill();
      c.shadowColor = "transparent";
      c.clip();
      c.fillStyle = c.createPattern(tile(s.k, dark), "repeat");
      c.fillRect(0, 0, w, h);
      c.restore();
    }
  },

  pick(px, py, W, H) {
    for (let i = this.sheets.length - 1; i >= 0; i--) {
      const s = this.sheets[i];
      if (px > s.x * W && px < (s.x + s.w) * W && py > s.y * H && py < (s.y + s.h) * H) return i;
    }
    return -1;
  },
};

/* the three ways a sheet can end. Every one of them is a shape, never a stroke,
   so the material shows through the edge rather than being outlined by it. */
export function edgePath(c, w, h, kind) {
  if (kind === "cut") { c.rect(0, 0, w, h); return; }

  if (kind === "perf") {
    /* the stamp die, traced clockwise with the arcs biting INWARD. Drawing a
       rect and subtracting circles fills the half of every circle that lies
       outside the paper, which on a dark ground shows as discs bulging into the
       page. Tracing the silhouette avoids the question entirely. */
    const R = Math.min(w, h) * 0.022;
    const run = (len) => Math.max(2, Math.round((len - R * 4.4) / (R * 2)));
    /* every corner keeps a whole tooth: starting a run half a pitch in leaves a
       sliver of paper at each corner, which reads as a squashed edge */
    const corner = R * 2.2;
    c.moveTo(corner, 0);
    const nTop = run(w), stepT = (w - corner * 2) / nTop;
    for (let i = 0; i < nTop; i++) {
      const m = corner + (i + 0.5) * stepT;
      c.lineTo(m - R, 0); c.arc(m, 0, R, Math.PI, 0, true); c.lineTo(m + R, 0);
    }
    c.lineTo(w, 0);
    const nR = run(h), stepR = (h - corner * 2) / nR;
    for (let i = 0; i < nR; i++) {
      const m = corner + (i + 0.5) * stepR;
      c.lineTo(w, m - R); c.arc(w, m, R, -Math.PI / 2, Math.PI / 2, true); c.lineTo(w, m + R);
    }
    c.lineTo(w, h);
    for (let i = nTop - 1; i >= 0; i--) {
      const m = corner + (i + 0.5) * stepT;
      c.lineTo(m + R, h); c.arc(m, h, R, 0, Math.PI, true); c.lineTo(m - R, h);
    }
    c.lineTo(0, h);
    for (let i = nR - 1; i >= 0; i--) {
      const m = corner + (i + 0.5) * stepR;
      c.lineTo(0, m + R); c.arc(0, m, R, Math.PI / 2, -Math.PI / 2, true); c.lineTo(0, m - R);
    }
    c.closePath();
    return;
  }

  /* deckle: a torn fibre edge. Not noise on a line, which reads as a bad
     antialias, but a slow wander with a fine tremble riding on it, which is
     what a fibre tear actually is. */
  const n = 90;
  const amp = Math.min(w, h) * 0.018;
  const wob = (t, seed) =>
    Math.sin(t * 7.3 + seed) * amp + Math.sin(t * 23.1 + seed * 2.3) * amp * 0.45
    + Math.sin(t * 61.7 + seed * 5.1) * amp * 0.18;
  c.moveTo(0, wob(0, 1));
  for (let i = 1; i <= n; i++) c.lineTo((i / n) * w, wob((i / n) * 9, 1));
  for (let i = 1; i <= n; i++) c.lineTo(w - wob((i / n) * 9, 4), (i / n) * h);
  for (let i = 1; i <= n; i++) c.lineTo(w - (i / n) * w, h - wob((i / n) * 9, 7));
  for (let i = 1; i <= n; i++) c.lineTo(wob((i / n) * 9, 11), h - (i / n) * h);
  c.closePath();
}


/* ---------------------------------------------------------------------------
 * D. TWO POSTCARDS BESIDE THE WALL
 *
 * The two materials that survived, in the format they were made for. A stamp
 * die is cut into all four edges, so these are cards you could actually tear
 * from a sheet rather than rectangles with a decorative border.
 *
 * They sit in the wall's negative space, which is the right third: the rows are
 * left aligned and ragged right, so that column is already empty and the cards
 * fill it without ever crowding a letter. Offset and counter rotated, the way
 * two cards land when you put one down and then the other.
 *
 * THE INTERACTION IS DELIBERATELY THIN FOR NOW. They lift to the hand and can be
 * moved, and the one you touch comes to the top. Whatever they end up DOING
 * hangs off pick() and the held card in the page, so nothing here has to be
 * unpicked to add it.
 * ------------------------------------------------------------------------ */
export const postcards = {
  name: "One card, the riso disc printed on it",
  note: "postcard stock, three spot inks on turned screens. drag it, it lifts",
  uses: ["riso"],

  /* ONE visual, not a set. The wall is left aligned and ragged right, so the
     right third is already empty and the card sits in it without ever crowding
     a letter. 1.4:1, near enough a real card, and big enough that the screen
     rosettes in the overlaps are legible rather than implied. */
  cards: [
    { k: "riso", x: 0.600, y: 0.225, w: 0.365, rot: -0.018, lift: 0 },
  ],
  hot: -1,

  rect(card, W, H) {
    const w = card.w * W, h = w / 1.4;
    return { x: card.x * W, y: card.y * H, w, h };
  },

  draw(c, W, H, dark) {
    for (const card of this.cards) {
      const r = this.rect(card, W, H);
      /* the lift is a real one: the card rises toward the eye, so it grows a
         little and its shadow lengthens and softens together. A shadow that
         grows while the card stays put reads as a glow, not a lift. */
      const L = card.lift;
      const grow = 1 + L * 0.016;
      c.save();
      c.translate(r.x + r.w / 2, r.y + r.h / 2 - L * 5);
      c.rotate(card.rot * (1 - L * 0.4));
      c.scale(grow, grow);
      c.translate(-r.w / 2, -r.h / 2);

      c.beginPath();
      edgePath(c, r.w, r.h, "perf");
      c.shadowColor = dark ? `rgba(0,0,0,${0.42 + L * 0.2})` : `rgba(20,23,27,${0.16 + L * 0.1})`;
      c.shadowBlur = 20 + L * 26;
      c.shadowOffsetY = 8 + L * 16;
      c.fillStyle = "#000";
      c.fill();
      c.shadowColor = "transparent";
      c.save();
      c.clip();
      /* struck at the card's own size, so the screens are at the ruling they
         were designed at rather than a resampled version of it */
      c.drawImage(plate(card.k, r.w, r.h, dark), 0, 0, r.w, r.h);
      c.restore();
      c.restore();
    }
  },

  pick(px, py, W, H) {
    for (let i = this.cards.length - 1; i >= 0; i--) {
      const r = this.rect(this.cards[i], W, H);
      if (px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.h) return i;
    }
    return -1;
  },
};


/* ---------------------------------------------------------------------------
 * E. KOMOREBI
 *
 * Full bleed, behind the wall, because that is what dappled light DOES: it
 * falls on the whole page rather than sitting in a frame on it. This is also
 * the honest answer to the containers problem, since there is no container
 * anywhere in it.
 *
 * The field is solved small and drawn big (see komorebi.js), and the browser's
 * own scaling filter finishes the sun convolution for nothing. Her stock is
 * then laid over the top so the light lands ON paper rather than in a void,
 * which is the whole reason this belongs to her system and not to a forest.
 * ------------------------------------------------------------------------ */
/* ---------------------------------------------------------------------------
 * F. THE RISO PLATE
 *
 * The riso disc at full height beside the wall, printed on stamp stock so the
 * paper carries a screen of its own under the inks.
 *
 * ITS HEIGHT IS NOT ITS OWN. The plate runs from the top of the first row to
 * the foot of the last, so it is measured off the type rather than guessed at
 * in page fractions. That is what makes the pair read as one composition, and
 * it holds at every viewport with no breakpoints, because the wall already
 * rescales itself and the plate now follows it. The right edge sits on the
 * page's own gutter for the same reason.
 * ------------------------------------------------------------------------ */
export const risoWall = {
  name: "A garden, separated and printed",
  note: "rendered, split into three spot inks, screened on turned grids, off register. the edge dissolves",
  uses: ["riso"],
  span: null,
  box: { w: 0.255 },
  wind: 1.0,
  t0: 0,
  error: null,
  /* it animates, so the page keeps it fed */
  live: true,

  rect(W, H) {
    const s = this.span;
    /* before the wall has been measured, fall back to something sane rather
       than drawing nothing */
    if (!s) return { x: W * 0.62, y: H * 0.22, w: this.box.w * W, h: H * 0.5 };

    /* THE PLATE YIELDS TO THE TYPE, ALWAYS.
     *
     * The wall's reach is set by its ROW HEIGHT, which follows the viewport's
     * height. The column left over for the plate is set by the viewport's
     * WIDTH. Those two are independent, so any fixed width for the plate
     * collides on some window: a tall one grows the letters until they run
     * straight into it. Parking it further right only changes which window
     * breaks.
     *
     * So the right edge is fixed to the page gutter and the LEFT edge is
     * whichever is further right, the width it would like or the wall's
     * furthest reach plus a gutter. The plate gets thinner instead of
     * overlapping, and the type never has to give up anything. */
    const right = s.right;
    const left = Math.max(right - this.box.w * W, s.clear);
    return { x: left, y: s.top, w: Math.max(40, right - left), h: s.bottom - s.top };
  },

  draw(c, W, H, dark) {
    const r = this.rect(W, H);

    /* THE EDGE IS A DISSOLVE, NOT A CUT.
     *
     * A hard rectangle makes this an IMAGE of a print: a photograph, with a
     * frame and a border where it stops. Feathered, the same field becomes ink
     * that happens to be sitting here, and the page carries on past it.
     *
     * It also means the plate cannot cast a shadow or sit on a backing any
     * more: both of those are edges by another name, and an object with no edge
     * cannot have either. */
    const b = scratch(W, H);
    /* the shader if it compiled, the still print if it did not. Either way the
       plate is never blank, and the reason it is still is written on the page. */
    const g = gardenGL();
    /* stamped on the body so a DOM dump can prove which path drew this */
    document.body.dataset.gl = g.error ? "error" : "ok";
    if (g.error) {
      this.error = g.error;
      b.drawImage(gardenCached(r.w, r.h, dark), r.x, r.y, r.w, r.h);
    } else {
      this.error = null;
      const dpr = Math.min(2, devicePixelRatio || 1);
      if (!this.t0) this.t0 = performance.now();
      g.render(r.w * dpr, r.h * dpr, dark, this.wind, (performance.now() - this.t0) / 1000);
      b.drawImage(g.canvas, r.x, r.y, r.w, r.h);
    }

    b.save();
    const F = Math.max(12, Math.min(r.w, r.h) * 0.13);
    b.globalCompositeOperation = "destination-in";
    /* the blur IS the feather, and the inset has to match it or the dissolve
       eats into the print instead of growing outward from where the edge was */
    b.filter = `blur(${F.toFixed(1)}px)`;
    b.fillStyle = "#000";
    b.fillRect(r.x + F, r.y + F, r.w - F * 2, r.h - F * 2);
    b.restore();

    c.drawImage(b.canvas, 0, 0);
  },

  pick() { return -1; },
  move() {},
};

/* the garden is expensive to print, so it is kept until the plate changes size
   or the mode flips */
let _gl = null;
function gardenGL() { if (!_gl) _gl = createGarden(); return _gl; }

let _g = null, _gk = "";
function gardenCached(w, h, dark) {
  const k = `${Math.round(w)}x${Math.round(h)}:${dark ? "d" : "l"}`;
  if (_gk !== k) { _g = gardenPlate(w, h, dark); _gk = k; }
  return _g;
}

export const LAYOUTS = { risoWall, bands, rows, torn, postcards };
export { ORDER };
