"use client";

/**
 * CONSTELLATION-LAB (throwaway) — tune the Constellation background live.
 * Sliders + color pickers drive the same <Constellation> used on the
 * /work/in-progress page. The panel shows the current config as JSON so the
 * chosen values can be locked into DEFAULT_CONSTELLATION.
 */

import { useState } from "react";
import Constellation, {
  DEFAULT_CONSTELLATION,
  type ConstellationConfig,
} from "@/components/Constellation";

const CREAM = "#FFF5EF";

type NumKey =
  | "density"
  | "linkDist"
  | "cursorDist"
  | "speed"
  | "attract"
  | "dotSize"
  | "nodeOpacity"
  | "linkOpacity";

const SLIDERS: { key: NumKey; label: string; min: number; max: number; step: number }[] = [
  { key: "density", label: "Density", min: 1, max: 18, step: 0.5 },
  { key: "linkDist", label: "Link distance", min: 40, max: 260, step: 2 },
  { key: "cursorDist", label: "Cursor reach", min: 60, max: 320, step: 2 },
  { key: "speed", label: "Drift speed", min: 0, max: 1, step: 0.02 },
  { key: "attract", label: "Cursor pull", min: 0, max: 0.2, step: 0.005 },
  { key: "dotSize", label: "Dot size", min: 0.5, max: 5, step: 0.1 },
  { key: "nodeOpacity", label: "Dot opacity", min: 0, max: 1, step: 0.02 },
  { key: "linkOpacity", label: "Link opacity", min: 0, max: 1, step: 0.02 },
];

const COLORS: { key: "nodeColor" | "linkColor" | "accentColor"; label: string }[] = [
  { key: "nodeColor", label: "Dot color" },
  { key: "linkColor", label: "Link color" },
  { key: "accentColor", label: "Accent (cursor)" },
];

export default function ConstellationLab() {
  const [cfg, setCfg] = useState<ConstellationConfig>(DEFAULT_CONSTELLATION);
  const set = (patch: Partial<ConstellationConfig>) =>
    setCfg((c) => ({ ...c, ...patch }));

  return (
    <main className="relative min-h-screen w-full overflow-hidden" style={{ background: CREAM }}>
      <Constellation config={cfg} className="fixed inset-0 h-full w-full" />

      {/* sample content on top */}
      <div className="pointer-events-none relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-3xl font-serif text-[34px] leading-tight text-[#3A2A20] md:text-[52px]">
          Case study in the making.
        </h1>
        <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.2em] text-[#3A2A20]/50">
          move · click · tune the panel →
        </p>
      </div>

      {/* control panel */}
      <div className="fixed right-4 top-4 z-20 w-[280px] rounded-2xl border border-black/10 bg-white/80 p-4 backdrop-blur-md">
        <p className="mb-3 font-mono text-[12px] uppercase tracking-wide text-[#3A2A20]">
          Constellation
        </p>

        <div className="flex flex-col gap-3">
          {SLIDERS.map((s) => (
            <label key={s.key} className="block">
              <div className="flex justify-between font-mono text-[11px] text-[#3A2A20]/70">
                <span>{s.label}</span>
                <span>{cfg[s.key]}</span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={cfg[s.key]}
                onChange={(e) => set({ [s.key]: Number(e.target.value) } as Partial<ConstellationConfig>)}
                className="w-full accent-[#717C4D]"
              />
            </label>
          ))}

          <div className="mt-1 flex flex-col gap-2">
            {COLORS.map((c) => (
              <label key={c.key} className="flex items-center justify-between font-mono text-[11px] text-[#3A2A20]/70">
                <span>{c.label}</span>
                <span className="flex items-center gap-2">
                  <span>{cfg[c.key]}</span>
                  <input
                    type="color"
                    value={cfg[c.key]}
                    onChange={(e) => set({ [c.key]: e.target.value } as Partial<ConstellationConfig>)}
                    className="h-6 w-8 cursor-pointer rounded border border-black/10 bg-transparent"
                  />
                </span>
              </label>
            ))}
          </div>

          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setCfg(DEFAULT_CONSTELLATION)}
              className="flex-1 rounded-full border border-black/10 py-2 font-mono text-[11px] text-[#3A2A20]"
            >
              reset
            </button>
            <button
              onClick={() => navigator.clipboard?.writeText(JSON.stringify(cfg, null, 2))}
              className="flex-1 rounded-full py-2 font-mono text-[11px]"
              style={{ background: "#3A2A20", color: CREAM }}
            >
              copy config
            </button>
          </div>

          <pre className="mt-1 max-h-32 overflow-auto rounded-lg bg-black/[0.04] p-2 font-mono text-[10px] leading-relaxed text-[#3A2A20]/80">
{JSON.stringify(cfg, null, 2)}
          </pre>
        </div>
      </div>
    </main>
  );
}
