"use client";

/**
 * CHARACTER-LAB — tune the character's distance from the pool table.
 * -------------------------------------------------------------------
 * Renders the real ChromeSnookerScene and exposes its avatar position/size as
 * live sliders. "Distance" is how high the character floats above the table
 * (its `bottom` %). Copy the value you like and I'll lock it into the scene.
 * Not in nav.
 */

import { useState } from "react";
import ChromeSnookerScene from "@/components/snooker/ChromeSnookerScene";

export default function CharacterLab() {
  const [distance, setDistance] = useState(95.5); // avatar bottom %
  const [scale, setScale] = useState(1); // avatar size
  const [x, setX] = useState(50); // horizontal %

  return (
    <main className="min-h-screen flex flex-col items-center justify-center py-10" style={{ background: "#FFF5EF" }}>
      <div style={{ width: "min(400px, calc((100vh - 220px) / 1.79))" }}>
        {/* key forces a fresh mount only if you want to re-rack; here we keep it
            mounted so the physics keeps running while you tune the avatar. */}
        <ChromeSnookerScene avatarBottom={`${distance}%`} avatarScale={scale} avatarX={`${x}%`} />
      </div>

      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center gap-3">
        <div className="flex items-center gap-5 px-5 py-3 rounded-2xl"
          style={{ background: "rgba(30,24,18,0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)", color: "#EDE6DE" }}>
          <label className="flex flex-col gap-1 text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.75)" }}>
            <span className="flex justify-between gap-4"><span>distance to pool</span><span className="opacity-60 tabular-nums">{distance.toFixed(1)}%</span></span>
            <input type="range" min={88} max={102} step={0.1} value={distance} onChange={(e) => setDistance(parseFloat(e.target.value))} className="accent-[#C97836] w-44" />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.75)" }}>
            <span className="flex justify-between gap-4"><span>size</span><span className="opacity-60 tabular-nums">{scale.toFixed(2)}×</span></span>
            <input type="range" min={0.5} max={1.8} step={0.02} value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="accent-[#C97836] w-28" />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.75)" }}>
            <span className="flex justify-between gap-4"><span>horizontal</span><span className="opacity-60 tabular-nums">{x.toFixed(0)}%</span></span>
            <input type="range" min={30} max={70} step={0.5} value={x} onChange={(e) => setX(parseFloat(e.target.value))} className="accent-[#C97836] w-28" />
          </label>
          <button onClick={() => { setDistance(95.5); setScale(1); setX(50); }} className="px-3 py-1.5 rounded-full text-[12px] font-mono self-end" style={{ color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.14)" }}>reset ↺</button>
        </div>
        <p className="font-mono text-[11px]" style={{ color: "rgba(120,100,85,0.8)" }}>
          higher % = further from the pool · current: bottom {distance.toFixed(1)}%, size {scale.toFixed(2)}×
        </p>
      </div>
    </main>
  );
}
