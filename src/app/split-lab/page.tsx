"use client";

/**
 * SPLIT-LAB — "show case studies + sandbox at the same time" prototype.
 * -------------------------------------------------------------------
 * After a compact hero, one section splits: case studies stacked on the LEFT
 * (the substance, attention side), and an auto-scrolling marquee of sandbox
 * clips on the RIGHT (the craft/range), sticky so it stays in view. A recruiter
 * sees rigor + range together on the first scroll, but the work still leads the
 * eye (left + larger). Not in nav.
 */

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Nav from "@/components/Nav";
import MahjongFooter from "@/components/MahjongFooter";
import WorkCard from "@/components/WorkCard";
import { cards } from "@/components/WorkGrid";

// A few sandbox clips for the right marquee (encoded paths + X links).
const CLIPS = [
  { file: "Oranges_30s_seamless copy.mp4", id: "2070928000930214123" },
  { file: "Screen Recording 2026-07-20 at 00.51.23 2.mov", id: "2078901500030697983" },
  { file: "trim_55DBD55B-7847-44FB-9B25-F5120E152BF6 2.MP4", id: "2078901924024517033" },
  { file: "parallax copy.mp4", id: "2075280350562099455" },
  { file: "Screen Recording 2026-06-26 at 00.19.45 2.mov", id: "2070370962168766862" },
  { file: "rad copy.mp4", id: "2072738705325060191" },
  { file: "lucky_pingpong 2.MP4", id: "2077089209052246135" },
].map(({ file, id }) => ({
  src: "/videos/SandboxVideos/" + encodeURIComponent(file),
  href: `https://x.com/jazlynnkurni/status/${id}`,
}));

function Clip({ src, href }: { src: string; href: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    v.play().catch(() => {});
  }, []);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="group relative block overflow-hidden rounded-[18px] mb-4" style={{ boxShadow: "0 8px 24px -12px rgba(0,0,0,0.25)" }}>
      <video ref={ref} src={src} muted loop playsInline preload="metadata" className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.04]" />
      <span className="absolute bottom-2.5 right-2.5 grid place-items-center w-9 h-9 rounded-full" style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.6)", color: "#1a1a1a" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    </a>
  );
}

export default function SplitLab() {
  return (
    <>
      <Nav />

      {/* hero landing — fills the viewport so a refresh lands here, and the
          split feed only appears on the first scroll down. */}
      <section className="min-h-screen flex items-center px-6 md:px-16" style={{ background: "#FFF5EF" }}>
        <div className="max-w-7xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 bg-[rgba(201,120,54,0.08)] py-2 px-4 rounded-full mb-8">
            <span className="pulse-dot" aria-hidden />
            <span className="font-mono uppercase tracking-wide text-[13px] text-ink">Open for full-time</span>
          </div>
          <h1 className="font-serif text-[32px] md:text-[48px] leading-tight text-ink max-w-3xl">
            Halo I&rsquo;m Jazlynn, a <em>product designer</em> who builds <em>AI-native experiences</em>.
          </h1>
          <div className="mt-10 flex flex-col items-start gap-2 text-ink/40 font-mono text-[11px] uppercase tracking-wide">
            <span>scroll — work &amp; sandbox, side by side</span>
            <span className="animate-bounce">↓</span>
          </div>
        </div>
      </section>

      {/* SPLIT FEED */}
      <section className="px-6 md:px-16 pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-8 lg:gap-12">
          {/* LEFT — case studies */}
          <div>
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-serif text-[24px] text-ink">Selected work</h2>
              <span className="font-mono text-[11px] uppercase tracking-wide text-ink/40">case studies</span>
            </div>
            <div className="flex flex-col gap-8">
              {cards.map((c) => {
                const { key, ...props } = c;
                return (
                  <motion.div key={key} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                    <WorkCard {...props} />
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* RIGHT — sandbox marquee (sticky, auto-scrolls) */}
          <div>
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-serif text-[24px] text-ink">Sandbox</h2>
              <a href="/sandbox" className="font-mono text-[11px] uppercase tracking-wide text-[#C97836] hover:text-ink transition-colors">see all →</a>
            </div>
            <div className="sticky top-24 h-[78vh] overflow-hidden rounded-2xl"
              style={{ maskImage: "linear-gradient(to bottom, transparent, #000 8%, #000 92%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 8%, #000 92%, transparent)" }}>
              <motion.div animate={{ y: ["0%", "-50%"] }} transition={{ duration: 34, repeat: Infinity, ease: "linear" }}>
                {[...CLIPS, ...CLIPS].map((c, i) => <Clip key={i} {...c} />)}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <MahjongFooter />
    </>
  );
}
