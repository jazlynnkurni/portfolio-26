"use client";

/**
 * SCROLL-LAB — sticky "scroll-box" sandbox architecture.
 * -------------------------------------------------------------------
 * Hero → a pinned beige box that you scroll THROUGH (the full sandbox masonry
 * translates up inside a fixed-height, edge-faded box) → case studies → footer.
 * The box is sticky so the page stays short while still showing everything.
 * Not in nav.
 */

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Nav from "@/components/Nav";
import MahjongFooter from "@/components/MahjongFooter";
import WorkGrid from "@/components/WorkGrid";
import SandboxGallery, { type SandboxItem } from "@/components/sandbox/SandboxGallery";

// Same clips as /sandbox (dancing excluded). Encoded paths + X links.
const HREFS: Record<string, string> = {
  "Oranges_30s_seamless copy.mp4": "2070928000930214123",
  "rad copy.mp4": "2072738705325060191",
  "directionspt2 copy.mp4": "2071654306747731984",
  "parallax copy.mp4": "2075280350562099455",
  "Screen Recording 2026-06-19 at 22.26.40 copy.mov": "2068020345442074795",
  "Screen Recording 2026-06-26 at 00.19.45 2.mov": "2070370962168766862",
  "Screen Recording 2026-06-30 at 00.11.36 2 copy.mov": "2071670664919200250",
  "Screen Recording 2026-07-20 at 00.51.23 2.mov": "2078901500030697983",
  "Screen Recording 2026-07-10 at 00.17.07 2.MOV": "2075279332482973831",
  "trim_55DBD55B-7847-44FB-9B25-F5120E152BF6 2.MP4": "2078901924024517033",
  "lucky_pingpong 2.MP4": "2077089209052246135",
  "sushi_30s_pingpong 2.MP4": "",
  "trim_4E3CA406-A8A5-471E-91CC-84BBD0CDFE6E 2.MP4": "",
};
// Same order as /sandbox (server does names.sort()) — don't shuffle.
const ITEMS: SandboxItem[] = Object.keys(HREFS).sort().map((file) => ({
  src: "/videos/SandboxVideos/" + encodeURIComponent(file),
  type: "video",
  project: "sandbox",
  href: HREFS[file] ? `https://x.com/jazlynnkurni/status/${HREFS[file]}` : undefined,
}));

const BOX_VH = 0.8; // scroll-box height as a fraction of the viewport

export default function ScrollLab() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentH, setContentH] = useState(2400);
  const [boxH, setBoxH] = useState(640);

  // measure the sandbox content height + box height (responsive)
  useEffect(() => {
    const measure = () => {
      if (contentRef.current) setContentH(contentRef.current.scrollHeight);
      setBoxH(Math.round(window.innerHeight * BOX_VH));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (contentRef.current) ro.observe(contentRef.current);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  const travel = Math.max(0, contentH - boxH); // how far the inner content must move

  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start start", "end end"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -travel]);

  return (
    <>
      <Nav />

      {/* HERO */}
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
            <span>scroll — the sandbox</span><span className="animate-bounce">↓</span>
          </div>
        </div>
      </section>

      {/* SANDBOX SCROLL-BOX (sticky; you scroll through it in place). Same
          max-w-7xl + px as the case studies / hero so the margins line up. */}
      <div ref={wrapRef} style={{ height: `calc(100vh + ${travel}px)`, background: "#FFF5EF" }}>
        <div className="sticky top-0 h-screen flex items-center justify-center px-6 md:px-16" style={{ background: "#FFF5EF" }}>
          {/* the box — fixed height, edge-faded, content translates inside it */}
          <div
            className="w-full max-w-7xl mx-auto overflow-hidden"
            style={{
              height: boxH,
              maskImage: "linear-gradient(to bottom, transparent 0%, #000 7%, #000 93%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 7%, #000 93%, transparent 100%)",
            }}
          >
            <motion.div ref={contentRef} style={{ y }}>
              <SandboxGallery items={ITEMS} />
            </motion.div>
          </div>
        </div>
      </div>

      {/* CASE STUDIES */}
      <section className="px-6 md:px-16 pt-16 pb-24" style={{ background: "#FFF5EF" }}>
        <div className="max-w-7xl mx-auto">
          <WorkGrid animateOnScroll />
        </div>
      </section>

      <MahjongFooter />
    </>
  );
}
