"use client";

/**
 * LAMP-POSITION-LAB — place + size the shader lamp against the real nav/logo.
 * -------------------------------------------------------------------
 * Renders the real Nav (so the JK logo is the reference) and the ShaderPendant-
 * Lamp with live size + position sliders. The left offset is added to 9vw so it
 * stays responsive. Copy the numbers you like and I'll lock them in. Not in nav.
 */

import { useState } from "react";
import ShaderPendantLamp from "@/components/ShaderPendantLamp";

export default function LampPositionLab() {
  const [width, setWidth] = useState(150);
  const [leftOffset, setLeftOffset] = useState(20); // px added to 9vw
  const [topOffset, setTopOffset] = useState(0);

  const left = `calc(9vw + ${leftOffset}px)`;
  const height = Math.round(width * 2);

  return (
    <>
      {/* mock hero — relative so the lamp's vw-based left matches the homepage */}
      <main className="relative min-h-screen" style={{ background: "#FFF5EF" }}>
        <ShaderPendantLamp width={width} height={height} left={left} top={topOffset} />

        {/* reference content roughly matching the hero */}
        <div className="px-6 md:px-16 pt-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[rgba(201,120,54,0.08)] py-2 px-4 rounded-full mb-8">
              <span className="pulse-dot" aria-hidden />
              <span className="font-mono uppercase tracking-wide text-[13px] text-ink">Open for full-time</span>
            </div>
            <p className="font-serif text-[34px] leading-snug text-ink/25">Halo I&rsquo;m Jazlynn, a product designer…</p>
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center gap-3">
        <div className="flex items-center gap-5 px-5 py-3 rounded-2xl" style={{ background: "rgba(30,24,18,0.92)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)", color: "#EDE6DE" }}>
          <label className="flex flex-col gap-1 text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.75)" }}>
            <span className="flex justify-between gap-4"><span>size</span><span className="opacity-60 tabular-nums">{width}px</span></span>
            <input type="range" min={70} max={280} step={2} value={width} onChange={(e) => setWidth(parseInt(e.target.value))} className="accent-[#C97836] w-40" />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.75)" }}>
            <span className="flex justify-between gap-4"><span>left (9vw +)</span><span className="opacity-60 tabular-nums">{leftOffset}px</span></span>
            <input type="range" min={-120} max={220} step={2} value={leftOffset} onChange={(e) => setLeftOffset(parseInt(e.target.value))} className="accent-[#C97836] w-40" />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.75)" }}>
            <span className="flex justify-between gap-4"><span>top</span><span className="opacity-60 tabular-nums">{topOffset}px</span></span>
            <input type="range" min={-60} max={160} step={2} value={topOffset} onChange={(e) => setTopOffset(parseInt(e.target.value))} className="accent-[#C97836] w-32" />
          </label>
          <button onClick={() => { setWidth(150); setLeftOffset(20); setTopOffset(0); }} className="px-3 py-1.5 rounded-full text-[12px] font-mono self-end" style={{ color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.14)" }}>reset ↺</button>
        </div>
        <p className="font-mono text-[11px]" style={{ color: "rgba(120,100,85,0.85)" }}>
          width {width} · left calc(9vw + {leftOffset}px) · top {topOffset}
        </p>
      </div>
    </>
  );
}
