"use client";

/**
 * LAMP-LAB — interactivity + design options for the red pendant lamp.
 * -------------------------------------------------------------------
 * Reuses the real HeroPendantLamp (tap it to swing) and layers on interaction
 * ideas: a room on/off toggle that dims the whole page, a switchable glow
 * colour, and a hover-to-brighten pool of light. Pick what you like and I'll
 * build it into the hero. Not in nav.
 */

import { useState } from "react";
import HeroPendantLamp from "@/components/HeroPendantLamp";

const GLOWS = [
  { id: "red", name: "Warm Red", color: "255,120,70" },
  { id: "amber", name: "Amber", color: "255,180,90" },
  { id: "cool", name: "Cool White", color: "220,235,255" },
  { id: "sage", name: "Sage", color: "150,190,140" },
];

export default function LampLab() {
  const [on, setOn] = useState(true);
  const [glow, setGlow] = useState(GLOWS[0]);
  const [hoverBright, setHoverBright] = useState(false);

  const lit = on ? (hoverBright ? 1 : 0.8) : 0;

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: on ? "#FFF5EF" : "#171310", transition: "background 500ms ease" }}>
      {/* pool of light under the lamp */}
      <div aria-hidden style={{
        position: "absolute", top: 120, left: "50%", transform: "translateX(-50%)",
        width: 620, height: 720, pointerEvents: "none",
        background: `radial-gradient(ellipse 240px 420px at center top, rgba(${glow.color},${0.5 * lit}) 0%, rgba(${glow.color},${0.14 * lit}) 40%, transparent 72%)`,
        mixBlendMode: "screen", filter: "blur(14px)", transition: "opacity 300ms ease", opacity: on ? 1 : 0,
      }} />
      {/* room dim when off */}
      <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(120% 90% at 50% 20%, transparent 0%, rgba(10,7,5,0.72) 80%)", opacity: on ? 0 : 1, transition: "opacity 500ms ease" }} />

      {/* the lamp, centered (anchors at 9vw internally → shift to centre) */}
      <div className="relative h-[70vh]">
        <div aria-hidden className="hidden lg:block absolute top-0 bottom-0" style={{ left: "calc(50% - 9vw - 47px)", width: 0, filter: on ? "none" : "brightness(0.4) saturate(0.6)", transition: "filter 500ms ease" }}
          onMouseEnter={() => setHoverBright(true)} onMouseLeave={() => setHoverBright(false)}>
          <HeroPendantLamp />
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center gap-3">
        <div className="flex items-center gap-4 px-5 py-3 rounded-2xl" style={{ background: "rgba(30,24,18,0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)", color: "#EDE6DE" }}>
          {/* on/off */}
          <button onClick={() => setOn((v) => !v)} className="px-4 py-2 rounded-full text-[13px] font-mono transition-all" style={{ background: on ? "#C97836" : "rgba(255,255,255,0.08)", color: on ? "#fff" : "rgba(255,255,255,0.7)" }}>
            {on ? "light: on" : "light: off"}
          </button>
          <span style={{ width: 1, height: 22, background: "rgba(255,255,255,0.14)" }} />
          {/* glow color */}
          <span className="text-[11px] font-mono opacity-60">glow</span>
          <div className="flex items-center gap-1.5">
            {GLOWS.map((g) => (
              <button key={g.id} onClick={() => setGlow(g)} aria-label={g.name} title={g.name} className="w-6 h-6 rounded-full" style={{ background: `rgb(${g.color})`, border: glow.id === g.id ? "2px solid #fff" : "1px solid rgba(255,255,255,0.2)" }} />
            ))}
          </div>
        </div>
        <p className="font-mono text-[11px]" style={{ color: on ? "rgba(120,100,85,0.85)" : "rgba(200,190,180,0.7)" }}>
          tap the lamp to swing it · hover it to brighten · toggle the room on/off · {glow.name} glow
        </p>
      </div>
    </main>
  );
}
