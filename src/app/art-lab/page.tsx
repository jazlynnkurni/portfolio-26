"use client";

/**
 * ART-LAB — 5 full-experience redesigns of the art gallery.
 * -------------------------------------------------------------------
 * Uses the real ARTWORKS. Switch concepts with the dock / keys 1-5:
 *   1 Gallery walk   — stroll sideways past framed pieces on a lit wall
 *   2 Editorial zine — one piece per screen, big & calm, like an art book
 *   3 Pinboard       — drag around an infinite scattered moodboard
 *   4 Spotlight room — dark room, one piece spotlit; arrow through them
 *   5 Living masonry — a warm packed grid, hover to enlarge
 * Not in nav.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Nav from "@/components/Nav";
import { ARTWORKS, type Artwork } from "@/components/art-gallery/artworks-data";
import DrawingCanvas, { type DrawingCanvasHandle } from "@/components/art-gallery/DrawingCanvas";
import { CARD_SWATCHES, ASSETS, FONTS, COLORS, type CardColor } from "@/components/art-gallery/tokens";

const MODES = [
  { name: "Gallery walk", blurb: "stroll sideways past framed pieces on a lit wall" },
  { name: "Editorial zine", blurb: "one piece per screen, big & calm, like an art book" },
  { name: "Pinboard", blurb: "drag around a scattered moodboard" },
  { name: "Spotlight room", blurb: "dark room, one piece spotlit — arrow through them" },
  { name: "Living masonry", blurb: "a warm packed grid, hover to enlarge" },
];

function Art({ a, className, style }: { a: Artwork; className?: string; style?: React.CSSProperties }) {
  return a.type === "video" ? (
    <video src={a.src} autoPlay muted loop playsInline preload="metadata" className={className} style={style} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={a.src} alt="" loading="lazy" className={className} style={style} />
  );
}

const POS = ARTWORKS.map((_, i) => {
  const col = i % 5, row = Math.floor(i / 5);
  const jx = ((i * 37) % 13) - 6, jy = ((i * 53) % 13) - 6, r = ((i * 29) % 11) - 5;
  return { x: 100 + col * 430 + jx * 9, y: 70 + row * 430 + jy * 9, w: 210 + (i % 3) * 70, r };
});

export default function ArtLab() {
  const [mode, setMode] = useState(0);
  const [spot, setSpot] = useState(0);

  // draw-a-card entry
  const [entered, setEntered] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<CardColor>("orange");
  const [hasDrawn, setHasDrawn] = useState(false);
  const [myDrawing, setMyDrawing] = useState<string | null>(null);
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const enter = () => { setMyDrawing(canvasRef.current?.toDataURL() ?? null); setEntered(true); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = Number(e.key);
      if (k >= 1 && k <= MODES.length) setMode(k - 1);
      if (mode === 3) {
        if (e.key === "ArrowRight") setSpot((s) => (s + 1) % ARTWORKS.length);
        if (e.key === "ArrowLeft") setSpot((s) => (s - 1 + ARTWORKS.length) % ARTWORKS.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  return (
    <>
      {mode !== 3 && <Nav />}

      {/* 1 — GALLERY WALK */}
      {mode === 0 && (
        <div className="h-screen overflow-x-auto overflow-y-hidden" style={{ background: "linear-gradient(180deg, #EBDFCB 0%, #E3D4BC 60%, #D8C6A8 100%)" }}>
          <div className="flex items-center gap-20 h-full px-32" style={{ width: "max-content" }}>
            {ARTWORKS.map((a, i) => (
              <figure key={i} className="relative shrink-0 group" style={{ height: "58vh", aspectRatio: `${a.aspectRatio}` }}>
                {/* spotlight pool */}
                <div aria-hidden className="absolute -inset-x-10 -bottom-16 h-24" style={{ background: "radial-gradient(ellipse at center, rgba(255,250,235,0.7), transparent 70%)", filter: "blur(8px)" }} />
                <Art a={a} className="w-full h-full object-cover" style={{ boxShadow: "0 30px 60px -20px rgba(70,50,25,0.45), 0 2px 0 rgba(255,255,255,0.4)", border: "8px solid #FBF6EE", borderRadius: 2 }} />
                <figcaption className="mt-3 font-mono text-[10px] uppercase tracking-wide text-[#6b573a]">{String(i + 1).padStart(2, "0")}</figcaption>
              </figure>
            ))}
            <div className="shrink-0 w-24" />
          </div>
        </div>
      )}

      {/* 2 — EDITORIAL ZINE */}
      {mode === 1 && (
        <main className="pt-32 pb-40" style={{ background: "#FFF5EF" }}>
          <div className="max-w-4xl mx-auto px-6 flex flex-col gap-36">
            {ARTWORKS.map((a, i) => (
              <motion.figure key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={i % 2 ? "self-end text-right" : "self-start"} style={{ maxWidth: a.aspectRatio > 1 ? "82%" : "56%" }}>
                <span className="font-mono text-[11px] tracking-wide text-ink/40">{String(i + 1).padStart(2, "0")} / {ARTWORKS.length}</span>
                <Art a={a} className="w-full h-auto mt-3 rounded-sm" style={{ boxShadow: "0 24px 50px -24px rgba(0,0,0,0.3)" }} />
              </motion.figure>
            ))}
          </div>
        </main>
      )}

      {/* 3 — PINBOARD */}
      {mode === 2 && (
        <div className="h-screen overflow-hidden relative" style={{ background: "#EEE4D4", cursor: "grab" }}>
          <div className="absolute top-28 left-1/2 -translate-x-1/2 z-10 font-mono text-[11px] uppercase tracking-wide text-ink/40 pointer-events-none">drag to explore</div>
          <motion.div drag dragConstraints={{ left: -1400, right: 300, top: -1200, bottom: 300 }} dragElastic={0.05} className="absolute" style={{ width: 2400, height: 2000, top: 0, left: 0 }}>
            {ARTWORKS.map((a, i) => (
              <div key={i} className="absolute" style={{ left: POS[i].x, top: POS[i].y, width: POS[i].w, transform: `rotate(${POS[i].r}deg)` }}>
                <Art a={a} className="w-full h-auto rounded-md" style={{ boxShadow: "0 18px 40px -18px rgba(0,0,0,0.35)", border: "5px solid #fff" }} />
              </div>
            ))}
          </motion.div>
        </div>
      )}

      {/* 4 — SPOTLIGHT ROOM */}
      {mode === 3 && (
        <div className="h-screen flex flex-col items-center justify-center relative" style={{ background: "radial-gradient(ellipse at 50% 38%, #2a2622 0%, #141210 70%)" }}>
          <div className="relative flex items-center justify-center" style={{ height: "62vh", width: "80vw" }}>
            <AnimatePresence mode="wait">
              <motion.div key={spot} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="relative" style={{ height: "100%", aspectRatio: `${ARTWORKS[spot].aspectRatio}` }}>
                <Art a={ARTWORKS[spot]} className="w-full h-full object-contain" style={{ filter: "drop-shadow(0 40px 80px rgba(0,0,0,0.6))" }} />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="absolute bottom-24 flex items-center gap-6 text-[#EDE6DE]">
            <button onClick={() => setSpot((s) => (s - 1 + ARTWORKS.length) % ARTWORKS.length)} className="w-11 h-11 rounded-full grid place-items-center" style={{ border: "1.5px solid rgba(255,255,255,0.3)" }}>←</button>
            <span className="font-mono text-[12px] tabular-nums opacity-70">{String(spot + 1).padStart(2, "0")} / {ARTWORKS.length}</span>
            <button onClick={() => setSpot((s) => (s + 1) % ARTWORKS.length)} className="w-11 h-11 rounded-full grid place-items-center" style={{ border: "1.5px solid rgba(255,255,255,0.3)" }}>→</button>
          </div>
          <div className="absolute bottom-6 flex gap-1.5">
            {ARTWORKS.map((_, i) => <button key={i} onClick={() => setSpot(i)} className="w-2 h-2 rounded-full" style={{ background: i === spot ? "#C97836" : "rgba(255,255,255,0.25)" }} />)}
          </div>
        </div>
      )}

      {/* 5 — LIVING MASONRY */}
      {mode === 4 && (
        <main className="pt-32 pb-32 px-6 md:px-12" style={{ background: "#FFF5EF" }}>
          <div className="max-w-7xl mx-auto columns-2 md:columns-3 lg:columns-4 gap-4">
            {ARTWORKS.map((a, i) => (
              <div key={i} className="mb-4 overflow-hidden rounded-lg group" style={{ boxShadow: "0 10px 26px -14px rgba(0,0,0,0.25)" }}>
                <Art a={a} className="w-full h-auto block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]" />
              </div>
            ))}
          </div>
        </main>
      )}

      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center gap-3">
        <div className="flex items-center gap-1 rounded-full p-1.5" style={{ background: "rgba(30,24,18,0.92)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)" }}>
          {MODES.map((m, i) => (
            <button key={m.name} onClick={() => setMode(i)} className="px-3 py-2 rounded-full text-[12.5px] font-mono transition-all" style={{ backgroundColor: mode === i ? "#C97836" : "transparent", color: mode === i ? "#fff" : "rgba(255,255,255,0.7)" }}>
              <span className="opacity-50 mr-1">{i + 1}</span>{m.name}
            </button>
          ))}
        </div>
        <p className="font-mono text-[11px]" style={{ color: mode === 3 ? "rgba(220,210,200,0.7)" : "rgba(120,100,85,0.85)" }}>{MODES[mode].blurb}</p>
      </div>
    </>
  );
}
