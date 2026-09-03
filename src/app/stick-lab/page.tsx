"use client";

/**
 * STICK-LAB — five cue-stick designs.
 * -------------------------------------------------------------------
 * Renders the real scene and swaps the player cue's look via the `cueDesign`
 * prop. Drag to aim/break to see the cue in motion. Not in nav.
 */

import { useState } from "react";
import ChromeSnookerScene from "@/components/snooker/ChromeSnookerScene";

const STICKS: { name: string; design: { background: string; width: string } }[] = [
  {
    name: "Classic Tan",
    design: { background: "linear-gradient(to bottom, #95704F 0%, #95704F 18%, #B08968 22%, #B08968 100%)", width: "3%" },
  },
  {
    name: "Burl Maple",
    design: { background: "linear-gradient(to bottom, #3A2416 0%, #3A2416 8%, #B2743C 13%, #8A5A2E 55%, #5C3618 100%)", width: "3%" },
  },
  {
    name: "Chrome",
    design: { background: "linear-gradient(to bottom, #7c828a 0%, #cfd6dd 10%, #9aa2ab 34%, #eef2f6 56%, #aeb6be 78%, #dfe5ea 100%)", width: "2.6%" },
  },
  {
    name: "Ebony Pro",
    design: { background: "linear-gradient(to bottom, #EDE6DE 0%, #EDE6DE 6%, #C97836 6%, #C97836 9%, #1E1B18 13%, #2A2622 100%)", width: "2.8%" },
  },
  {
    name: "Two-tone Sport",
    design: { background: "linear-gradient(to bottom, #FFF5EF 0%, #FFF5EF 8%, #C97836 12%, #C97836 20%, #9A4C19 20%, #9A4C19 24%, #C97836 26%, #B0642B 100%)", width: "3%" },
  },
];

export default function StickLab() {
  const [i, setI] = useState(0);
  return (
    <main className="min-h-screen flex flex-col items-center justify-center py-10" style={{ background: "#FFF5EF" }}>
      <div style={{ width: "min(400px, calc((100vh - 200px) / 1.79))" }}>
        <ChromeSnookerScene cueDesign={STICKS[i].design} />
      </div>
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center gap-3">
        <div className="flex items-center gap-1 rounded-full p-1.5" style={{ background: "rgba(30,24,18,0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)" }}>
          {STICKS.map((s, k) => (
            <button key={s.name} onClick={() => setI(k)} className="px-3.5 py-2 rounded-full text-[13px] font-mono transition-all" style={{ backgroundColor: i === k ? "#C97836" : "transparent", color: i === k ? "#fff" : "rgba(255,255,255,0.7)" }}>
              <span className="opacity-50 mr-1.5">{k + 1}</span>{s.name}
            </button>
          ))}
        </div>
        <p className="font-mono text-[11px]" style={{ color: "rgba(120,100,85,0.85)" }}>{STICKS[i].name} cue · drag to aim &amp; break</p>
      </div>
    </main>
  );
}
