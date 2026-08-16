"use client";

/**
 * CloverDither — the 404 blooms into existence as a field of clovers.
 *
 * The numerals are never drawn. "404" is rasterised once to an offscreen
 * canvas and used purely as a coverage test, so every clover is planted inside
 * the letterforms and the shape arrives by growing rather than by fading in.
 *
 * Order of arrival is a 4×4 Bayer dither matrix, which is what gives it the
 * resolving-image feel and ties it to Clover's own onboarding point-cloud.
 * Leaves open in sequence rather than scaling together — that stagger is what
 * makes each mark unfurl instead of pop.
 *
 * Everything load-bearing is independent DOM: a real <h1> carries the
 * semantics, the canvas is aria-hidden, and the copy + email sit outside it.
 */

import { useCallback, useEffect, useRef } from "react";
import s from "./CloverDither.module.css";

const GREEN = "#717C4D";        // Clover brand olive
const GREEN_LIGHT = "#8FA05E";
const GREEN_DEEP = "#55613A";
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const DURATION = 2200;

type Dot = { x: number; y: number; delay: number; r: number; spin: number; tier: number };

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** One heart lobe, drawn from the clover's centre outward. */
function leaf(g: CanvasRenderingContext2D, r: number, grow: number) {
  const R = r * grow;
  g.beginPath();
  g.moveTo(0, 0);
  g.bezierCurveTo(-R * 0.95, -R * 0.3, -R * 0.72, -R * 1.15, 0, -R * 0.86);
  g.bezierCurveTo(R * 0.72, -R * 1.15, R * 0.95, -R * 0.3, 0, 0);
  g.closePath();
  g.fill();
}

function clover(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  grow: number,
  spin: number,
  color: string,
  alpha: number,
) {
  if (grow <= 0.001) return;
  g.save();
  g.globalAlpha = alpha;
  g.translate(x, y);
  g.rotate(spin);
  g.fillStyle = color;
  for (let i = 0; i < 4; i++) {
    g.save();
    g.rotate((i * Math.PI) / 2 + Math.PI / 4);
    const t = clamp01(grow * 4 - i);
    leaf(g, r, t * t * (3 - 2 * t));
    g.restore();
  }
  g.restore();
}

export default function CloverDither() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dots = useRef<Dot[]>([]);
  const t0 = useRef(0);
  const raf = useRef(0);
  const lastW = useRef(0);

  /* `restart` is deliberately separate from rebuilding. Sizing the canvas
     changes the host's height, which re-fires the ResizeObserver — if that
     path also reset the clock, the bloom would restart every frame and look
     frozen. Layout rebuilds keep the clock; only a real replay resets it. */
  const build = useCallback((restart = false) => {
    const host = hostRef.current;
    const cv = canvasRef.current;
    if (!host || !cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = host.clientWidth;
    const H = Math.round(W * 0.42);
    if (!W) return;
    if (!restart && W === lastW.current) return; // nothing actually changed
    lastW.current = W;

    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.height = `${H}px`;
    const g = cv.getContext("2d");
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Rasterise "404" once; from here it's only ever a coverage test.
    const m = document.createElement("canvas");
    m.width = W;
    m.height = H;
    const mc = m.getContext("2d", { willReadFrequently: true })!;
    mc.fillStyle = "#000";
    mc.fillRect(0, 0, W, H);
    let size = Math.round(H * 0.92);
    mc.textAlign = "center";
    mc.textBaseline = "middle";
    // The site's decided display face (tokens.ts: serif / sans / mono). The
    // mask only needs the letterform, so it reads the same token the rest of
    // the page uses rather than introducing a face of its own.
    const family =
      getComputedStyle(document.documentElement).getPropertyValue("--font-serif").trim() ||
      "Georgia, serif";
    const fit = () => {
      mc.font = `600 ${size}px ${family}, Georgia, serif`;
      return mc.measureText("404").width;
    };
    while (fit() > W * 0.86 && size > 20) size -= 4;
    mc.fillStyle = "#fff";
    mc.fillText("404", W / 2, H / 2);
    const data = mc.getImageData(0, 0, W, H).data;
    const inside = (x: number, y: number) => {
      const xi = x | 0, yi = y | 0;
      if (xi < 0 || yi < 0 || xi >= W || yi >= H) return false;
      return data[(yi * W + xi) * 4] > 127;
    };

    // Spacing vs clover size is the whole legibility dial: the marks want to
    // just touch their neighbours so the numerals read as solid letterforms
    // rather than a faint dotted texture.
    const step = Math.max(7, W * 0.015);
    const next: Dot[] = [];
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        if (!inside(x + step / 2, y + step / 2)) continue;
        const bx = Math.floor(x / step) % 4;
        const by = Math.floor(y / step) % 4;
        const tier = BAYER[by][bx] / 16;
        next.push({
          x: x + step / 2 + (Math.random() - 0.5) * step * 0.35,
          y: y + step / 2 + (Math.random() - 0.5) * step * 0.35,
          delay: tier * 0.7 + Math.random() * 0.12,
          r: step * (0.60 + Math.random() * 0.24),
          spin: Math.random() * Math.PI,
          tier,
        });
      }
    }
    dots.current = next;
    if (restart || t0.current === 0) t0.current = performance.now();
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const g = cv.getContext("2d");
    if (!g) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const paint = (now: number) => {
      const host = hostRef.current;
      if (!host) return;
      const W = host.clientWidth;
      const H = Math.round(W * 0.42);
      // Reduced motion gets the finished field, no growth.
      const T = reduced ? 99 : (now - t0.current) / DURATION;
      g.clearRect(0, 0, W, H);
      for (const d of dots.current) {
        const p = clamp01((T - d.delay) / 0.4);
        if (p <= 0) continue;
        const e = easeOut(p);
        clover(
          g, d.x, d.y, d.r, e, d.spin,
          d.tier > 0.66 ? GREEN_LIGHT : d.tier < 0.33 ? GREEN_DEEP : GREEN,
          e,
        );
      }
    };

    const frame = (now: number) => {
      paint(now);
      raf.current = requestAnimationFrame(frame);
    };

    build(true);
    if (document.fonts?.ready) document.fonts.ready.then(() => build(true));
    raf.current = requestAnimationFrame(frame);

    const ro = new ResizeObserver(() => build(false));
    if (hostRef.current) ro.observe(hostRef.current);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      ro.disconnect();
    };
  }, [build]);

  return (
    <div className={s.wrap}>
      {/* No visible "page not found" line — the numerals say it. The accessible
          name lives on the figure instead, so screen readers still get it. */}
      <div className={s.inner}>
        <div
          className={s.plot}
          ref={hostRef}
          onClick={() => build(true)}
          role="img"
          aria-label="404"
          title="replay"
        >
          <canvas ref={canvasRef} aria-hidden="true" />
        </div>

        <div className={s.copy}>
          <p>uh oh, case study in the making.</p>
          <p>
            <a className={s.reach} href="mailto:jazkurnz06@gmail.com">
              <span>reach out to</span>
              <span className={s.slot}>
                <span className={s.pill}>jazkurnz06@gmail.com</span>
              </span>
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
