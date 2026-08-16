"use client";

/**
 * EditableFourOhFour — the "404" as a live vector object you can pull on.
 *
 * Deliberately NOT traced off a font. A raster trace gave jagged edges, dozens
 * of anchors and stray fill artefacts; these are clean geometric numerals built
 * from a handful of points, drawn as THICK STROKED paths with round caps and
 * joins. That gets three things at once: no sharp corners anywhere, few enough
 * anchors to read as a design tool rather than confetti, and every anchor
 * sitting on an outer edge where it's obviously there to be pulled.
 *
 * Editing is the real thing — square anchors, round bezier handles, always
 * visible, no hover gate and no reset. Dragging an anchor carries its handles;
 * dragging a handle mirrors the opposite one through the anchor.
 *
 * Everything load-bearing is independent DOM: a real <h1> carries the
 * semantics, the SVG is aria-hidden, and the copy + email sit outside the
 * object — wreck the numerals and the page still does its job.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const BLUE = "#0D99FF";
const VB = { w: 440, h: 170 };
const K = 0.5523; // circle → cubic bezier constant

type Pt = { x: number; y: number };
type Anchor = { x: number; y: number; hIn?: Pt; hOut?: Pt };
type Sub = { id: string; anchors: Anchor[]; closed: boolean };

/** Three digits. Points sit only on the outer edges of each stroke. */
function initial(): Sub[] {
  const four = (ox: number, tag: string): Sub[] => [
    {
      id: `${tag}-a`, // diagonal into the crossbar
      closed: false,
      anchors: [
        { x: ox + 66, y: 22 },
        { x: ox + 12, y: 104 },
        { x: ox + 96, y: 104 },
      ],
    },
    {
      id: `${tag}-b`, // stem
      closed: false,
      anchors: [
        { x: ox + 66, y: 22 },
        { x: ox + 66, y: 148 },
      ],
    },
  ];

  const cx = 220, cy = 85, rx = 42, ry = 63;
  const zero: Sub = {
    id: "zero",
    closed: true,
    anchors: [
      { x: cx, y: cy - ry, hIn: { x: -rx * K, y: 0 }, hOut: { x: rx * K, y: 0 } },
      { x: cx + rx, y: cy, hIn: { x: 0, y: -ry * K }, hOut: { x: 0, y: ry * K } },
      { x: cx, y: cy + ry, hIn: { x: rx * K, y: 0 }, hOut: { x: -rx * K, y: 0 } },
      { x: cx - rx, y: cy, hIn: { x: 0, y: ry * K }, hOut: { x: 0, y: -ry * K } },
    ],
  };

  return [...four(24, "f1"), zero, ...four(310, "f2")];
}

function toD(s: Sub): string {
  const a = s.anchors;
  if (a.length < 2) return "";
  let d = `M ${a[0].x} ${a[0].y}`;
  const n = s.closed ? a.length : a.length - 1;
  for (let i = 0; i < n; i++) {
    const p = a[i];
    const q = a[(i + 1) % a.length];
    if (p.hOut || q.hIn) {
      const c1 = p.hOut ? { x: p.x + p.hOut.x, y: p.y + p.hOut.y } : p;
      const c2 = q.hIn ? { x: q.x + q.hIn.x, y: q.y + q.hIn.y } : q;
      d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${q.x} ${q.y}`;
    } else {
      d += ` L ${q.x} ${q.y}`;
    }
  }
  return s.closed ? d + " Z" : d;
}

type Drag =
  | { kind: "anchor"; si: number; ai: number }
  | { kind: "handle"; si: number; ai: number; which: "hIn" | "hOut" }
  | null;

export default function EditableFourOhFour() {
  const [subs, setSubs] = useState<Sub[]>(initial);
  const draft = useRef<Sub[]>(subs);
  const drag = useRef<Drag>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const raf = useRef(0);
  const ctm = useRef<DOMMatrix | null>(null);

  const toUser = useCallback((cx: number, cy: number) => {
    const m = ctm.current;
    if (!m) return null;
    const p = new DOMPoint(cx, cy).matrixTransform(m);
    return { x: p.x, y: p.y };
  }, []);

  const onDown = (e: React.PointerEvent, d: NonNullable<Drag>) => {
    const screen = svgRef.current?.getScreenCTM();
    if (!screen) return;
    ctm.current = screen.inverse();
    drag.current = d;
    draft.current = subs;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    e.stopPropagation();
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const u = toUser(e.clientX, e.clientY);
      if (!u) return;

      draft.current = draft.current.map((s, si) => {
        if (si !== d.si) return s;
        return {
          ...s,
          anchors: s.anchors.map((a, ai) => {
            if (ai !== d.ai) return a;
            if (d.kind === "anchor") return { ...a, x: u.x, y: u.y };
            const h: Pt = { x: u.x - a.x, y: u.y - a.y };
            const other = d.which === "hIn" ? "hOut" : "hIn";
            return a[other]
              ? { ...a, [d.which]: h, [other]: { x: -h.x, y: -h.y } }
              : { ...a, [d.which]: h };
          }),
        };
      });

      if (!raf.current) {
        raf.current = requestAnimationFrame(() => {
          raf.current = 0;
          setSubs(draft.current);
        });
      }
    };
    const up = () => {
      if (!drag.current) return;
      drag.current = null;
      ctm.current = null;
      setSubs(draft.current);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [toUser]);

  return (
    <div className="ohno">
      <h1 className="ohno-h1">404 — page not found</h1>

      <div className="ohno-object">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          className="ohno-svg"
          aria-hidden="true"
        >
          {subs.map((s) => (
            <path
              key={s.id}
              d={toD(s)}
              fill="none"
              stroke="#16100C"
              strokeWidth={30}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          <g className="ohno-chrome">
            {subs.map((s, si) =>
              s.anchors.map((a, ai) => (
                <g key={`${s.id}-${ai}`}>
                  {(["hIn", "hOut"] as const).map((w) =>
                    a[w] ? (
                      <g key={w}>
                        <line
                          x1={a.x} y1={a.y}
                          x2={a.x + a[w]!.x} y2={a.y + a[w]!.y}
                          stroke={BLUE} strokeWidth={1}
                          vectorEffect="non-scaling-stroke"
                        />
                        <circle
                          cx={a.x + a[w]!.x} cy={a.y + a[w]!.y} r={4}
                          fill="#fff" stroke={BLUE} strokeWidth={1.5}
                          vectorEffect="non-scaling-stroke"
                          className="ohno-hit"
                          onPointerDown={(e) => onDown(e, { kind: "handle", si, ai, which: w })}
                        />
                      </g>
                    ) : null,
                  )}
                  <rect
                    x={a.x - 5} y={a.y - 5} width={10} height={10}
                    fill="#fff" stroke={BLUE} strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                    className="ohno-hit"
                    onPointerDown={(e) => onDown(e, { kind: "anchor", si, ai })}
                  />
                </g>
              )),
            )}
          </g>
        </svg>
      </div>

      <div className="ohno-copy">
        <p>uh oh, case study in the making.</p>
        <p className="ohno-reach-line">
          <a className="ohno-reach" href="mailto:jazkurnz06@gmail.com">
            <span className="ohno-roll">
              <span className="ohno-roll-a">reach out jazkurnz06@gmail.com</span>
              <span className="ohno-roll-b" aria-hidden="true">
                reach out jazkurnz06@gmail.com
              </span>
            </span>
          </a>
        </p>
      </div>
    </div>
  );
}
