"use client";

/**
 * SANDBOX-LAB — 5 ways to present the sandbox (the X / craft work).
 * -------------------------------------------------------------------
 * Focused purely on how the sandbox reel could look. Switch modes (dock / keys
 * 1-5). Beige background so it reads like the site. Not in nav.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Nav from "@/components/Nav";

const CLIPS = [
  { file: "Oranges_30s_seamless copy.mp4", id: "2070928000930214123" },
  { file: "Screen Recording 2026-07-20 at 00.51.23 2.mov", id: "2078901500030697983" },
  { file: "trim_55DBD55B-7847-44FB-9B25-F5120E152BF6 2.MP4", id: "2078901924024517033" },
  { file: "parallax copy.mp4", id: "2075280350562099455" },
  { file: "Screen Recording 2026-06-26 at 00.19.45 2.mov", id: "2070370962168766862" },
  { file: "rad copy.mp4", id: "2072738705325060191" },
  { file: "lucky_pingpong 2.MP4", id: "2077089209052246135" },
  { file: "Screen Recording 2026-07-10 at 00.17.07 2.MOV", id: "2075279332482973831" },
  { file: "Screen Recording 2026-06-19 at 22.26.40 copy.mov", id: "2068020345442074795" },
  { file: "Screen Recording 2026-06-30 at 00.11.36 2 copy.mov", id: "2071670664919200250" },
].map(({ file, id }) => ({ src: "/videos/SandboxVideos/" + encodeURIComponent(file), href: `https://x.com/jazlynnkurni/status/${id}` }));

const MODES = [
  { name: "Filmstrip", blurb: "a single horizontal reel that ticks by — cinematic, low footprint" },
  { name: "Bento", blurb: "mixed-size tiles, editorial rhythm" },
  { name: "Hover-expand", blurb: "thin slats that widen on hover — one focus at a time" },
  { name: "Moodboard", blurb: "scattered, tilted clips — playful, matches your taste" },
  { name: "Immersive", blurb: "one big clip per screen as you scroll" },
];

function Arrow() {
  return (
    <span className="absolute bottom-2.5 right-2.5 grid place-items-center w-9 h-9 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.6)", color: "#1a1a1a" }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
  );
}
function Vid({ src, cover = false }: { src: string; cover?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { ref.current?.play().catch(() => {}); }, []);
  return <video ref={ref} src={src} muted loop playsInline preload="metadata" className={`w-full ${cover ? "h-full object-cover" : "h-auto"} block transition-transform duration-500 group-hover:scale-[1.04]`} />;
}

export default function SandboxLab() {
  const [mode, setMode] = useState(0);
  useEffect(() => { const onKey = (e: KeyboardEvent) => { const k = Number(e.key); if (k >= 1 && k <= MODES.length) setMode(k - 1); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);

  // scatter offsets for moodboard (deterministic, no Math.random at render)
  const scatter = [
    { r: -5, y: 10, s: 1.0 }, { r: 4, y: -18, s: 0.9 }, { r: -3, y: 24, s: 1.05 }, { r: 6, y: 0, s: 0.95 },
    { r: -6, y: -10, s: 1.0 }, { r: 3, y: 16, s: 0.92 }, { r: -2, y: -22, s: 1.08 }, { r: 5, y: 8, s: 0.96 },
    { r: -4, y: 20, s: 1.0 }, { r: 2, y: -6, s: 0.94 },
  ];

  return (
    <>
      <Nav />
      <main className="min-h-screen pt-32 pb-32" style={{ background: "#FFF5EF" }}>
        <div className="px-6 md:px-16 mb-10">
          <div className="max-w-7xl mx-auto flex items-baseline justify-between">
            <h1 className="font-serif text-[28px] text-ink">Sandbox</h1>
            <span className="font-mono text-[11px] uppercase tracking-wide text-ink/40">motion &amp; experiments · on X</span>
          </div>
        </div>

        {/* 1 — FILMSTRIP */}
        {mode === 0 && (
          <div className="overflow-hidden">
            <motion.div className="flex gap-5 px-6" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} style={{ width: "max-content" }}>
              {[...CLIPS, ...CLIPS].map((c, i) => (
                <a key={i} href={c.href} target="_blank" rel="noopener noreferrer" className="group relative block rounded-[18px] overflow-hidden shrink-0" style={{ width: 300, boxShadow: "0 10px 30px -14px rgba(0,0,0,0.3)" }}>
                  <Vid src={c.src} /><Arrow />
                </a>
              ))}
            </motion.div>
          </div>
        )}

        {/* 2 — BENTO */}
        {mode === 1 && (
          <div className="px-6 md:px-16">
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 auto-rows-[180px] gap-4">
              {CLIPS.map((c, i) => {
                const big = i % 5 === 0; const tall = i % 5 === 3;
                return (
                  <a key={i} href={c.href} target="_blank" rel="noopener noreferrer" className={`group relative block rounded-[18px] overflow-hidden ${big ? "col-span-2 row-span-2" : ""} ${tall ? "row-span-2" : ""}`} style={{ boxShadow: "0 10px 30px -16px rgba(0,0,0,0.28)" }}>
                    <Vid src={c.src} cover /><Arrow />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* 3 — HOVER-EXPAND */}
        {mode === 2 && (
          <div className="px-6 md:px-16">
            <div className="max-w-7xl mx-auto flex gap-3 h-[62vh]">
              {CLIPS.slice(0, 7).map((c, i) => (
                <a key={i} href={c.href} target="_blank" rel="noopener noreferrer" className="group relative block rounded-[16px] overflow-hidden transition-[flex-grow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ flex: "1 1 0%", boxShadow: "0 10px 30px -16px rgba(0,0,0,0.28)" }} onMouseEnter={(e) => (e.currentTarget.style.flexGrow = "4")} onMouseLeave={(e) => (e.currentTarget.style.flexGrow = "1")}>
                  <Vid src={c.src} cover /><Arrow />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 4 — MOODBOARD */}
        {mode === 3 && (
          <div className="px-6 md:px-16">
            <div className="max-w-6xl mx-auto columns-2 md:columns-3 gap-6">
              {CLIPS.map((c, i) => {
                const s = scatter[i % scatter.length];
                return (
                  <a key={i} href={c.href} target="_blank" rel="noopener noreferrer" className="group relative block rounded-[16px] overflow-hidden mb-6" style={{ transform: `rotate(${s.r}deg) translateY(${s.y}px) scale(${s.s})`, boxShadow: "0 14px 34px -16px rgba(0,0,0,0.3)" }}>
                    <Vid src={c.src} /><Arrow />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* 5 — IMMERSIVE */}
        {mode === 4 && (
          <div className="flex flex-col items-center gap-24 px-6">
            {CLIPS.map((c, i) => (
              <a key={i} href={c.href} target="_blank" rel="noopener noreferrer" className="group relative block rounded-[22px] overflow-hidden w-full max-w-3xl" style={{ boxShadow: "0 24px 60px -22px rgba(0,0,0,0.35)" }}>
                <Vid src={c.src} />
                <span className="absolute top-4 left-5 font-mono text-[11px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>0{i + 1} · on X</span>
                <Arrow />
              </a>
            ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center gap-3">
        <div className="flex items-center gap-1 rounded-full p-1.5" style={{ background: "rgba(30,24,18,0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)" }}>
          {MODES.map((m, i) => (
            <button key={m.name} onClick={() => setMode(i)} className="px-3 py-2 rounded-full text-[12.5px] font-mono transition-all" style={{ backgroundColor: mode === i ? "#C97836" : "transparent", color: mode === i ? "#fff" : "rgba(255,255,255,0.7)" }}>
              <span className="opacity-50 mr-1">{i + 1}</span>{m.name}
            </button>
          ))}
        </div>
        <p className="font-mono text-[11px]" style={{ color: "rgba(120,100,85,0.85)" }}>{MODES[mode].blurb}</p>
      </div>
    </>
  );
}
