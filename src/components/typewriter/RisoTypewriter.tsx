"use client";

/**
 * RisoTypewriter — replaces the old SVG InteractiveTypewriter on /about.
 *
 * The machine is a WebGL height field (see machine.ts): SDF body, staggered
 * arced key banks, type-bar basket, platen, knobs, ribbon spools, paper bail
 * and return lever, lit per-pixel and then screened as a two-plate riso print
 * — burnt orange over ink, each on its own rotated dot grid, deliberately out
 * of register.
 *
 * The sheet is a real DOM element sitting BEHIND the canvas, positioned from
 * the same constants the shader uses for the platen, so paper tucks into the
 * roller and the answer stays selectable text. Every typed character sinks the
 * matching key.
 */

import { useEffect, useRef } from "react";
import { mountMachine, placePaper, wireQA, type KeyParams } from "./engine";

const SHADE = `
// Rotated dot screen — one halftone cell.
float screenDot(vec2 frag, float angle, float size, float cover){
  float c = cos(angle), s = sin(angle);
  vec2 r = vec2(c * frag.x - s * frag.y, s * frag.x + c * frag.y) / size;
  vec2 cell = fract(r) - 0.5;
  float d = length(cell) * 2.0;
  return 1.0 - smoothstep(cover - 0.28, cover + 0.28, d);
}

vec3 shade(vec2 p, float h, vec3 n, float mat, float t){
  vec3 L  = normalize(vec3(-0.40, 0.68, 0.62));
  float diff = max(dot(n, L), 0.0);

  float tone = 0.0;
  if (mat < 1.5)      tone = 0.55;                        // body + side frames
  else if (mat < 2.5) tone = mix(0.16, 0.90, legend(p));  // cap, with its letter
  else if (mat < 3.5) tone = 0.44;                        // carriage rail
  else if (mat < 4.5) tone = 0.80;                        // platen, darkest mass
  else if (mat < 5.5) tone = 0.24;                        // knobs
  else if (mat < 6.5) tone = 0.62;                        // ribbon spools
  else if (mat < 7.5) tone = 0.94;                        // type-bar basket
  else if (mat < 8.5) tone = 0.34;                        // paper bail
  else if (mat < 9.5) tone = 0.38;                        // return lever
  else if (mat < 10.5) tone = 0.18;                       // space bar
  else                tone = 0.95;                        // STRUCK key — inked

  // Two plates, misregistered — that offset is the whole charm of riso.
  float lum = clamp(tone * (1.25 - 0.75 * diff), 0.0, 1.0);
  vec2 frag = gl_FragCoord.xy;
  float orange = screenDot(frag + vec2(1.6, -1.2), 0.262, 4.6, clamp(lum * 1.35, 0.0, 1.0));
  float ink    = screenDot(frag + vec2(-1.4, 0.9), 1.309, 4.6, clamp(lum * lum * 1.15, 0.0, 1.0));

  vec3 PAPER  = vec3(1.0, 0.961, 0.937);
  vec3 ORANGE = vec3(0.788, 0.471, 0.212);   // brand burnt orange
  vec3 INK    = vec3(0.086, 0.063, 0.047);

  vec3 col = PAPER;
  col = mix(col, ORANGE, orange * 0.92);
  col = mix(col, INK,    ink * 0.88);
  col -= fbm(p * 200.0) * 0.05;              // paper tooth
  return col;
}`;

export default function RisoTypewriter({ params }: { params?: KeyParams } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const qRef = useRef<HTMLParagraphElement>(null);
  const aRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const idleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const sheet = sheetRef.current;
    const chips = chipsRef.current;
    if (!canvas || !sheet || !chips || !qRef.current || !aRef.current) return;

    // Tapping a key types it onto the sheet — the machine is playable, not a
    // picture of one. Taps append to the answer line so they share the paper
    // with whatever the last question printed.
    const rig = mountMachine(canvas, SHADE, {
      params,
      onKeyTap: (ch) => {
        if (idleRef.current) idleRef.current.style.display = "none";
        const a = aRef.current;
        if (a) a.textContent = (a.textContent ?? "") + ch;
        caretRef.current?.classList.add("on");
      },
    });
    const place = () => placePaper(canvas, sheet);
    place();
    window.addEventListener("resize", place);
    // The canvas gets its size from CSS aspect-ratio, which can settle a frame
    // late; re-place once layout is final or the sheet misses the roller.
    const ro = new ResizeObserver(place);
    ro.observe(canvas);

    chips.replaceChildren();
    wireQA({
      chipHost: chips,
      qEl: qRef.current,
      aEl: aRef.current,
      caret: caretRef.current,
      machine: rig,
    });
    const hideIdle = () => {
      if (idleRef.current) idleRef.current.style.display = "none";
    };
    chips.addEventListener("click", hideIdle, { once: true });

    return () => {
      window.removeEventListener("resize", place);
      ro.disconnect();
      chips.removeEventListener("click", hideIdle);
    };
  }, [params]);

  return (
    <div className="tw-rig">
      <div className="tw-machine">
        <canvas ref={canvasRef} />
        <div className="tw-sheet" ref={sheetRef}>
          <p className="tw-idle" ref={idleRef}>
            pick a question and i&apos;ll type back&hellip;
          </p>
          <p className="tw-q" ref={qRef} />
          <p className="tw-a">
            <span ref={aRef} />
            <span className="tw-caret" ref={caretRef}>
              |
            </span>
          </p>
        </div>
      </div>

      <div className="tw-asks">
        <h3>So about Jaz&hellip;</h3>
        <div ref={chipsRef} />
      </div>
    </div>
  );
}
