"use client";

/**
 * TearAway — replaces CodeTrail on /work/in-progress.
 *
 * The premise does the explaining: a finished case-study page is already laid
 * out underneath, covered by a sheet of cream stock. Dragging RIPS the cover
 * off — jagged hole, lifted edge, and the paper you removed falls away as
 * flecks. "The work exists, the write-up doesn't" without a paragraph saying so.
 *
 * Mechanics that make a drag feel expensive, all of them here:
 *  · interpolated strokes between pointer events, so a fast drag tears a
 *    continuous band instead of a dotted line
 *  · a noisy polygon punch rather than a circle — the jag is what reads as paper
 *  · the lip shadow is the same sheet redrawn offset and blurred, clipped to
 *    itself, so the torn edge gets thickness for one extra drawImage
 */

import { useEffect, useRef, useState } from "react";
import { paintCaseStudy } from "./mock-page";

export default function TearAway({ project }: { project?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nailRef = useRef<HTMLDivElement>(null);
  const [torn, setTorn] = useState(0);
  const [nudged, setNudged] = useState(false);

  useEffect(() => {
    const host: HTMLDivElement | null = hostRef.current;
    const cv: HTMLCanvasElement | null = canvasRef.current;
    if (!host || !cv) return;
    const el = host;
    const canvas = cv;
    const g = canvas.getContext("2d");
    if (!g) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const under = document.createElement("canvas");
    const paper = document.createElement("canvas");
    const pctx = paper.getContext("2d")!;

    let W = 0, H = 0, dpr = 1;
    let tornAmt = 0;
    const flecks: { x: number; y: number; vx: number; vy: number; s: number; rot: number; vrot: number; life: number }[] = [];

    function drawPaper() {
      pctx.setTransform(1, 0, 0, 1, 0, 0);
      pctx.globalCompositeOperation = "source-over";
      pctx.clearRect(0, 0, paper.width, paper.height);
      pctx.fillStyle = "#FFF5EF";
      pctx.fillRect(0, 0, paper.width, paper.height);
      pctx.globalAlpha = 0.05;
      for (let i = 0; i < (paper.width * paper.height) / 260; i++) {
        pctx.fillStyle = Math.random() > 0.5 ? "#000" : "#fff";
        pctx.fillRect(Math.random() * paper.width, Math.random() * paper.height, 1.4, 1.4);
      }
      pctx.globalAlpha = 0.055;
      pctx.strokeStyle = "#8a6a52";
      for (let i = 0; i < 40; i++) {
        pctx.beginPath();
        const y = Math.random() * paper.height;
        pctx.moveTo(0, y);
        pctx.bezierCurveTo(paper.width * 0.3, y + 14, paper.width * 0.7, y - 14, paper.width, y);
        pctx.stroke();
      }
      pctx.globalAlpha = 1;
    }

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = el.clientWidth;
      H = el.clientHeight;
      if (!W || !H) return;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      g!.setTransform(dpr, 0, 0, dpr, 0, 0);
      under.width = Math.round(W * dpr);
      under.height = Math.round(H * dpr);
      paintCaseStudy(under, project);
      paper.width = Math.round(W);
      paper.height = Math.round(H);
      drawPaper();
    }

    function punch(x: number, y: number, r: number) {
      pctx.globalCompositeOperation = "destination-out";
      pctx.beginPath();
      const N = 22;
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2;
        const wob = 0.72 + Math.sin(a * 5.3 + x * 0.07) * 0.14 + Math.random() * 0.22;
        const rr = r * wob;
        const vx = x + Math.cos(a) * rr;
        const vy = y + Math.sin(a) * rr;
        if (i === 0) pctx.moveTo(vx, vy);
        else pctx.lineTo(vx, vy);
      }
      pctx.closePath();
      pctx.fill();
      pctx.globalCompositeOperation = "source-over";
    }

    function tear(x0: number, y0: number, x1: number, y1: number) {
      const d = Math.hypot(x1 - x0, y1 - y0);
      const steps = Math.max(1, Math.ceil(d / 9));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        punch(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 32);
      }
      tornAmt = Math.min(100, tornAmt + d * 0.022);
      setTorn(Math.round(tornAmt));
      if (tornAmt > 30) setNudged(true);

      const ang = Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2;
      for (let i = 0; i < 2; i++) {
        flecks.push({
          x: x1, y: y1,
          vx: Math.cos(ang) * (Math.random() * 2.2 - 1.1) + (x1 - x0) * 0.12,
          vy: Math.sin(ang) * (Math.random() * 1.4 - 0.7) - Math.random() * 1.6,
          s: 3 + Math.random() * 5,
          rot: Math.random() * 6.28,
          vrot: (Math.random() - 0.5) * 0.25,
          life: 1,
        });
      }
      if (flecks.length > 240) flecks.splice(0, flecks.length - 240);
    }

    let raf = 0;
    function frame() {
      g!.clearRect(0, 0, W, H);
      g!.drawImage(under, 0, 0, W, H);
      g!.drawImage(paper, 0, 0, W, H);

      g!.save();
      g!.globalCompositeOperation = "source-atop";
      g!.globalAlpha = 0.16;
      g!.filter = "blur(3px)";
      g!.drawImage(paper, -3, -4, W, H);
      g!.filter = "none";
      g!.restore();

      for (let i = flecks.length - 1; i >= 0; i--) {
        const f = flecks[i];
        f.vy += 0.16; f.vx *= 0.99;
        f.x += f.vx; f.y += f.vy; f.rot += f.vrot;
        f.life -= 0.008;
        if (f.life <= 0 || f.y > H + 40) { flecks.splice(i, 1); continue; }
        g!.save();
        g!.translate(f.x, f.y);
        g!.rotate(f.rot);
        g!.globalAlpha = Math.max(0, f.life) * 0.9;
        g!.fillStyle = "#FFF5EF";
        g!.fillRect(-f.s / 2, -f.s / 2, f.s, f.s * 0.72);
        g!.strokeStyle = "rgba(22,16,12,0.18)";
        g!.lineWidth = 0.6;
        g!.strokeRect(-f.s / 2, -f.s / 2, f.s, f.s * 0.72);
        g!.restore();
      }
      g!.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    resize();
    if (!reduced) raf = requestAnimationFrame(frame);
    else { g.drawImage(under, 0, 0, W, H); g.drawImage(paper, 0, 0, W, H); }

    let down = false, lx: number | null = null, ly = 0;
    const local = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top] as const;
    };
    const onDown = (e: PointerEvent) => {
      down = true;
      const [x, y] = local(e);
      lx = x; ly = y;
      tear(x, y, x + 0.1, y);
      el.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      const [x, y] = local(e);
      if (nailRef.current) nailRef.current.style.transform = `translate(${x}px, ${y}px)`;
      if (down && lx !== null) tear(lx, ly, x, y);
      lx = x; ly = y;
    };
    const onUp = () => { down = false; };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      ro.disconnect();
    };
  }, [project]);

  return (
    <div className="tear-host" ref={hostRef}>
      <canvas ref={canvasRef} />
      <div className="tear-nail" ref={nailRef} aria-hidden />
      <div className="tear-copy">
        <h1>Case study in the making.</h1>
        <p>
          {nudged
            ? "That page is real — built, shipped and measured. Only the writing is outstanding."
            : "There’s a finished page under this one. Drag to tear the cover sheet off it."}
        </p>
        <a className="tear-cta" href="mailto:jazkurnz06@gmail.com">
          Ask me about it
        </a>
      </div>
      <div className="tear-readout">
        <b>{torn}%</b> torn away
      </div>
    </div>
  );
}
