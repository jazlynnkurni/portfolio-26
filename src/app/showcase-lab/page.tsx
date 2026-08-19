"use client";

/**
 * SHOWCASE-LAB — 5 low-cognitive-load ways to present work + sandbox.
 * -------------------------------------------------------------------
 * Switch between five layout prototypes (dock / keys 1-5). Each shows the SAME
 * content (case studies + a few sandbox clips) but arranged to reduce overload
 * in a different way — one-at-a-time, sequenced, featured, indexed, or a calm
 * single-column feed. Not in nav.
 */

import { useEffect, useRef, useState } from "react";
import WorkCard from "@/components/WorkCard";
import { cards } from "@/components/WorkGrid";

const CLIPS = [
  { file: "Oranges_30s_seamless copy.mp4", id: "2070928000930214123" },
  { file: "Screen Recording 2026-07-20 at 00.51.23 2.mov", id: "2078901500030697983" },
  { file: "trim_55DBD55B-7847-44FB-9B25-F5120E152BF6 2.MP4", id: "2078901924024517033" },
  { file: "parallax copy.mp4", id: "2075280350562099455" },
].map(({ file, id }) => ({ src: "/videos/SandboxVideos/" + encodeURIComponent(file), href: `https://x.com/jazlynnkurni/status/${id}` }));

const MODES = [
  { name: "One-at-a-time", blurb: "a toggle — see Work OR Sandbox, never both at once" },
  { name: "Sequenced", blurb: "work first at full focus; sandbox in its own calm section below" },
  { name: "Featured + peek", blurb: "one hero case study + a tiny 'also on X' peek" },
  { name: "Hover index", blurb: "a quiet list; hover a title to preview just that one" },
  { name: "Focus feed", blurb: "single centered column, roughly one item per screen" },
];

function Clip({ src, href, r = "16px" }: { src: string; href: string; r?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { ref.current?.play().catch(() => {}); }, []);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="group relative block overflow-hidden" style={{ borderRadius: r, boxShadow: "0 8px 24px -12px rgba(0,0,0,0.22)" }}>
      <video ref={ref} src={src} muted loop playsInline preload="metadata" className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.04]" />
      <span className="absolute bottom-2 right-2 grid place-items-center w-8 h-8 rounded-full" style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.6)", color: "#1a1a1a" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    </a>
  );
}

function Media({ card }: { card: (typeof cards)[number] }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { ref.current?.play().catch(() => {}); }, [card]);
  return card.mediaType === "video" ? (
    <video ref={ref} key={card.mediaSrc} src={card.mediaSrc} muted loop playsInline className="w-full h-full object-cover" style={{ transform: `scale(${card.mediaZoom ?? 1})` }} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img key={card.mediaSrc} src={card.mediaSrc} alt={card.caseStudyName} className="w-full h-full object-contain" />
  );
}

export default function ShowcaseLab() {
  const [mode, setMode] = useState(0);
  const [tab, setTab] = useState<"work" | "sandbox">("work");
  const [sel, setSel] = useState(1); // hover-index selection (Manus)

  useEffect(() => { const onKey = (e: KeyboardEvent) => { const k = Number(e.key); if (k >= 1 && k <= MODES.length) setMode(k - 1); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);

  const featured = cards[1];

  return (
    <>
      <main className="px-6 md:px-16 pt-32 pb-28 min-h-screen" style={{ background: "#FFF5EF" }}>
        <div className="max-w-6xl mx-auto">

          {/* 1 — ONE AT A TIME */}
          {mode === 0 && (
            <div>
              <div className="flex items-center gap-2 mb-8">
                {(["work", "sandbox"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-full text-[14px] font-mono transition-all" style={{ background: tab === t ? "#C97836" : "transparent", color: tab === t ? "#fff" : "#0D0D0D", border: tab === t ? "none" : "1px solid rgba(0,0,0,0.12)" }}>
                    {t === "work" ? "Work" : "Sandbox"}
                  </button>
                ))}
              </div>
              {tab === "work" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">{cards.map(({ key, ...p }) => <WorkCard key={key} {...p} />)}</div>
              ) : (
                <div className="columns-2 md:columns-3 gap-4">{[...CLIPS, ...CLIPS].map((c, i) => <div key={i} className="mb-4"><Clip {...c} /></div>)}</div>
              )}
            </div>
          )}

          {/* 2 — SEQUENCED */}
          {mode === 1 && (
            <div className="flex flex-col gap-24">
              <section>
                <h2 className="font-serif text-[26px] text-ink mb-8">Selected work</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">{cards.map(({ key, ...p }) => <WorkCard key={key} {...p} />)}</div>
              </section>
              <section>
                <div className="flex items-baseline justify-between mb-6">
                  <h2 className="font-serif text-[26px] text-ink">Sandbox</h2>
                  <a href="/sandbox" className="font-mono text-[11px] uppercase tracking-wide text-[#C97836]">see all →</a>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{CLIPS.map((c, i) => <Clip key={i} {...c} />)}</div>
              </section>
            </div>
          )}

          {/* 3 — FEATURED + PEEK */}
          {mode === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-10 items-start">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wide text-ink/40">Featured</span>
                <div className="mt-3"><WorkCard {...(() => { const { key, ...p } = featured; return p; })()} /></div>
                <p className="mt-4 font-mono text-[12px] text-ink/50">+ {cards.length - 1} more case studies →</p>
              </div>
              <div className="lg:pt-10">
                <p className="font-serif text-[18px] text-ink mb-4">Also making things on X</p>
                <div className="grid grid-cols-2 gap-3">{CLIPS.slice(0, 4).map((c, i) => <Clip key={i} {...c} r="14px" />)}</div>
                <a href="/sandbox" className="inline-block mt-4 font-mono text-[11px] uppercase tracking-wide text-[#C97836]">the full sandbox →</a>
              </div>
            </div>
          )}

          {/* 4 — HOVER INDEX */}
          {mode === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-10 items-start">
              <ol className="flex flex-col">
                {cards.map((c, i) => (
                  <li key={c.key}>
                    <button onMouseEnter={() => setSel(i)} onFocus={() => setSel(i)} className="w-full text-left py-4 border-b transition-colors" style={{ borderColor: "rgba(0,0,0,0.08)", color: sel === i ? "#C97836" : "#0D0D0D" }}>
                      <span className="font-mono text-[11px] opacity-50 mr-3">{String(i + 1).padStart(2, "0")}</span>
                      <span className="font-serif text-[20px]">{c.caseStudyName}</span>
                      <span className="block font-mono text-[11px] opacity-50 mt-1 ml-8">{c.tags.join(" · ")}</span>
                    </button>
                  </li>
                ))}
                <a href="/sandbox" className="py-4 font-mono text-[12px] uppercase tracking-wide text-[#C97836]">Sandbox →</a>
              </ol>
              <div className="lg:sticky lg:top-28">
                <div className="relative aspect-video rounded-2xl overflow-hidden" style={{ background: "#C97836", boxShadow: "0 20px 50px -20px rgba(0,0,0,0.3)" }}>
                  <Media card={cards[sel]} />
                </div>
                <p className="mt-4 font-serif text-[18px] text-ink">{cards[sel].tagline}</p>
              </div>
            </div>
          )}

          {/* 5 — FOCUS FEED */}
          {mode === 4 && (
            <div className="max-w-2xl mx-auto flex flex-col gap-28">
              {cards.map(({ key, ...p }, i) => (
                <div key={key} className="flex flex-col gap-10">
                  <WorkCard {...p} />
                  {CLIPS[i] && (
                    <div className="max-w-md mx-auto w-full">
                      <p className="font-mono text-[11px] uppercase tracking-wide text-ink/40 mb-2">between projects · on X</p>
                      <Clip {...CLIPS[i]} r="18px" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
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
