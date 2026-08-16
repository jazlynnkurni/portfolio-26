"use client";

/**
 * LAYOUT-LAB — 5 fresh ways to present CASE STUDIES + SANDBOX together.
 * -------------------------------------------------------------------
 * Different from showcase-lab. Each keeps the case studies dominant while giving
 * the sandbox a distinct, digestible home. Switch via dock / keys 1-5. Beige bg.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Nav from "@/components/Nav";
import WorkCard from "@/components/WorkCard";
import { cards } from "@/components/WorkGrid";

const CLIPS = [
  { file: "Oranges_30s_seamless copy.mp4", id: "2070928000930214123" },
  { file: "Screen Recording 2026-07-20 at 00.51.23 2.mov", id: "2078901500030697983" },
  { file: "trim_55DBD55B-7847-44FB-9B25-F5120E152BF6 2.MP4", id: "2078901924024517033" },
  { file: "parallax copy.mp4", id: "2075280350562099455" },
  { file: "Screen Recording 2026-06-26 at 00.19.45 2.mov", id: "2070370962168766862" },
  { file: "rad copy.mp4", id: "2072738705325060191" },
  { file: "lucky_pingpong 2.MP4", id: "2077089209052246135" },
].map(({ file, id }) => ({ src: "/videos/SandboxVideos/" + encodeURIComponent(file), href: `https://x.com/jazlynnkurni/status/${id}` }));

const MODES = [
  { name: "Two-tier reel", blurb: "case studies grid on top · sandbox filmstrip band below" },
  { name: "Alternating", blurb: "a case study, then a sandbox strip, repeating" },
  { name: "Docked reel", blurb: "work fills the page · a slim sandbox reel stays docked at the bottom" },
  { name: "Sandbox drawer", blurb: "work front & centre · a tab slides the sandbox in from the side" },
  { name: "Hero split", blurb: "featured case study + sandbox reel up top · grid below" },
];

function Clip({ src, href, h = 150 }: { src: string; href: string; h?: number }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { ref.current?.play().catch(() => {}); }, []);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="group relative block shrink-0 overflow-hidden rounded-[14px]" style={{ height: h, width: h * 1.5, boxShadow: "0 8px 22px -12px rgba(0,0,0,0.28)" }}>
      <video ref={ref} src={src} muted loop playsInline preload="metadata" className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-[1.06]" />
      <span className="absolute bottom-2 right-2 grid place-items-center w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.6)", color: "#1a1a1a" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    </a>
  );
}
function Filmstrip({ h = 150, dur = 36 }: { h?: number; dur?: number }) {
  return (
    <div className="overflow-hidden">
      <motion.div className="flex gap-4" animate={{ x: ["0%", "-50%"] }} transition={{ duration: dur, repeat: Infinity, ease: "linear" }} style={{ width: "max-content" }}>
        {[...CLIPS, ...CLIPS].map((c, i) => <Clip key={i} {...c} h={h} />)}
      </motion.div>
    </div>
  );
}
function WorkGridInline() {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-8">{cards.map(({ key, ...p }) => <WorkCard key={key} {...p} />)}</div>;
}
function SectionHead({ title, right }: { title: string; right?: React.ReactNode }) {
  return <div className="flex items-baseline justify-between mb-6"><h2 className="font-serif text-[24px] text-ink">{title}</h2>{right}</div>;
}

export default function LayoutLab() {
  const [mode, setMode] = useState(0);
  const [drawer, setDrawer] = useState(false);
  useEffect(() => { const onKey = (e: KeyboardEvent) => { const k = Number(e.key); if (k >= 1 && k <= MODES.length) setMode(k - 1); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);

  return (
    <>
      <Nav />
      <main className="min-h-screen pt-32" style={{ background: "#FFF5EF", paddingBottom: mode === 2 ? 200 : 120 }}>
        <div className="max-w-7xl mx-auto px-6 md:px-16">

          {/* 1 — TWO-TIER REEL */}
          {mode === 0 && (
            <div className="flex flex-col gap-20">
              <section><SectionHead title="Selected work" right={<span className="font-mono text-[11px] uppercase tracking-wide text-ink/40">case studies</span>} /><WorkGridInline /></section>
              <section><SectionHead title="Sandbox" right={<a href="/sandbox" className="font-mono text-[11px] uppercase tracking-wide text-[#C97836]">see all →</a>} /><Filmstrip h={170} /></section>
            </div>
          )}

          {/* 2 — ALTERNATING */}
          {mode === 1 && (
            <div className="flex flex-col gap-16">
              {cards.map(({ key, ...p }, i) => (
                <div key={key} className="flex flex-col gap-10">
                  <div className="max-w-2xl"><WorkCard {...p} /></div>
                  <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6" style={{ scrollbarWidth: "none" }}>
                    {CLIPS.slice(i, i + 3).concat(CLIPS.slice(0, Math.max(0, 3 - (CLIPS.length - i)))).map((c, j) => <Clip key={j} {...c} h={130} />)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3 — DOCKED REEL (grid; reel is fixed at the bottom) */}
          {mode === 2 && (
            <div><SectionHead title="Selected work" /><WorkGridInline /></div>
          )}

          {/* 4 — SANDBOX DRAWER */}
          {mode === 3 && (
            <div><SectionHead title="Selected work" /><WorkGridInline /></div>
          )}

          {/* 5 — HERO SPLIT */}
          {mode === 4 && (
            <div className="flex flex-col gap-20">
              <section className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
                <div><span className="font-mono text-[11px] uppercase tracking-wide text-ink/40">Featured</span><div className="mt-3">{(() => { const { key, ...p } = cards[1]; return <WorkCard {...p} />; })()}</div></div>
                <div><SectionHead title="Sandbox" right={<a href="/sandbox" className="font-mono text-[11px] uppercase tracking-wide text-[#C97836]">all →</a>} />
                  <div className="flex flex-col gap-4">{CLIPS.slice(0, 3).map((c, i) => <a key={i} href={c.href} target="_blank" rel="noopener noreferrer" className="group relative block overflow-hidden rounded-[16px]" style={{ boxShadow: "0 10px 26px -14px rgba(0,0,0,0.28)" }}><video src={c.src} autoPlay muted loop playsInline className="w-full h-auto block" /></a>)}</div>
                </div>
              </section>
              <section><SectionHead title="More work" /><WorkGridInline /></section>
            </div>
          )}
        </div>
      </main>

      {/* docked reel band (mode 3) */}
      {mode === 2 && (
        <div className="fixed bottom-0 left-0 right-0 z-[70] px-6 py-4" style={{ background: "rgba(255,245,239,0.82)", backdropFilter: "blur(10px)", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-wide text-ink/40 shrink-0">Sandbox ↗</span>
            <div className="flex-1"><Filmstrip h={92} dur={30} /></div>
          </div>
        </div>
      )}

      {/* sandbox drawer (mode 4) */}
      {mode === 3 && (
        <>
          <button onClick={() => setDrawer((v) => !v)} className="fixed right-0 top-1/2 -translate-y-1/2 z-[71] px-3 py-4 font-mono text-[12px] rounded-l-xl" style={{ background: "#C97836", color: "#fff", writingMode: "vertical-rl" }}>
            {drawer ? "close ✕" : "Sandbox ▸"}
          </button>
          <motion.aside initial={false} animate={{ x: drawer ? 0 : "100%" }} transition={{ type: "spring", stiffness: 260, damping: 30 }} className="fixed right-0 top-0 bottom-0 z-[70] w-[360px] max-w-[86vw] overflow-y-auto p-5" style={{ background: "#FFF5EF", boxShadow: "-20px 0 50px -20px rgba(0,0,0,0.25)" }}>
            <h3 className="font-serif text-[20px] text-ink mb-4">Sandbox</h3>
            <div className="flex flex-col gap-4">{CLIPS.map((c, i) => <a key={i} href={c.href} target="_blank" rel="noopener noreferrer" className="group relative block overflow-hidden rounded-[14px]"><video src={c.src} autoPlay muted loop playsInline className="w-full h-auto block" /></a>)}</div>
          </motion.aside>
        </>
      )}

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
