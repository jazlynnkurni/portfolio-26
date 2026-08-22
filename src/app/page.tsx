"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import Nav from "@/components/Nav";
import MahjongFooter from "@/components/MahjongFooter";
import HeadlineDrift, {
  type HeadlineSegment,
} from "@/components/HeadlineDrift";
import SnookerScene from "@/components/snooker/ChromeSnookerScene";
import HeroPendantLamp from "@/components/ShaderPendantLamp";
import WorkGrid from "@/components/WorkGrid";
import SandboxGallery, { type SandboxItem } from "@/components/sandbox/SandboxGallery";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const headlineSegments: HeadlineSegment[] = [
  { text: "Halo I’m Jazlynn, a " },
  { text: "product designer", italic: true },
  { text: " who builds " },
  { text: "AI-native experiences", italic: true },
  { text: " with " },
  { text: "cognitive science, care, and taste.", italic: true },
];

// Sandbox clips — same order as /sandbox (names.sort()). Encoded paths + X links.
const SANDBOX_HREFS: Record<string, string> = {
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
const SANDBOX_ITEMS: SandboxItem[] = Object.keys(SANDBOX_HREFS).sort().map((file) => ({
  src: "/videos/SandboxVideos/" + encodeURIComponent(file),
  type: "video",
  project: "sandbox",
  href: SANDBOX_HREFS[file] ? `https://x.com/jazlynnkurni/status/${SANDBOX_HREFS[file]}` : undefined,
}));
const SANDBOX_FADE = "linear-gradient(to bottom, transparent 0%, #000 7%, #000 93%, transparent 100%)";

export default function Home() {
  // Always land on the hero on load — even if a "#work" hash lingers in the URL
  // from a prior visit or nav click (which would otherwise jump the browser
  // straight to the case-study section). Clearing the hash + scrolling to top
  // keeps the entry on the hero. The nav "Work" link still scrolls to #work on
  // click (that's a fresh hashchange, unaffected by this mount-only effect).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    window.scrollTo(0, 0);
  }, []);

  // Sticky sandbox scroll-box: as the page scrolls through `wrapRef`, the
  // sandbox masonry translates up inside a fixed-height, edge-faded box that
  // stays pinned — so the whole sandbox is browsable without a long page.
  const wrapRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentH, setContentH] = useState(2400);
  const [boxH, setBoxH] = useState(640);
  useEffect(() => {
    const measure = () => {
      if (contentRef.current) setContentH(contentRef.current.scrollHeight);
      setBoxH(Math.round(window.innerHeight * 0.8));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (contentRef.current) ro.observe(contentRef.current);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, []);
  const travel = Math.max(0, contentH - boxH);
  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start start", "end end"] });
  const sandboxY = useTransform(scrollYProgress, [0, 1], [0, -travel]);

  return (
    <>
      {/* Flat beige ground (site --color-bg), fixed behind all content. */}
      <div
        aria-hidden
        style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none", background: "#FFF5EF" }}
      />

      <Nav />

      <main className="flex-1 relative overflow-x-clip">
        {/* ---------------------------- HERO ---------------------------- */}
        <section className="relative px-6 md:px-16 pt-12 md:pt-20 pb-8 md:pb-12">
          <HeroPendantLamp />
          <motion.div
            initial="hidden"
            animate="show"
            transition={{ staggerChildren: 0.08, delayChildren: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-16 items-start md:items-center max-w-7xl mx-auto relative"
            style={{ zIndex: 10 }}
          >
            {/* LEFT COLUMN ~55% — order-2 on mobile so pool sits above text */}
            <div className="flex flex-col order-2 md:order-none">
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 self-start bg-[rgba(201,120,54,0.08)] py-2 px-4 rounded-full"
              >
                <span className="pulse-dot" aria-hidden />
                <span className="font-mono uppercase tracking-wide text-[13px] text-ink">
                  Open for full-time
                </span>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-8">
                <HeadlineDrift
                  segments={headlineSegments}
                  className="font-serif font-normal text-[22px] md:text-[34px] lg:text-[40px] leading-snug md:leading-[1.3] text-ink text-left max-w-[752px]"
                />
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="mt-8 font-mono text-[12px] md:text-[14px] text-ink/70 leading-relaxed text-left"
              >
                <p>Flibbertigibbeting @ Columbia University</p>
              </motion.div>
            </div>

            {/* RIGHT COLUMN — snooker scene, auto-sized to its natural width.
                order-1 on mobile so the pool table renders above the text in
                the single-column stack; order-none restores default left/right
                placement at md+ where the 2-column grid handles position.
                pt-12 on mobile pushes the scene (and its speech bubble) down
                so the bubble clears the sticky nav's backdrop-blur band. */}
            <div className="order-1 md:order-none pt-4 md:pt-0">
              <SnookerScene />
            </div>
          </motion.div>

        </section>

        {/* ------------------------- WORK SECTION ------------------------- */}
        <section
          id="work"
          className="px-6 md:px-16 pt-12 md:pt-20 pb-24"
          style={{ scrollMarginTop: 80 }}
        >
          <div className="max-w-7xl mx-auto">
            <WorkGrid animateOnScroll />
          </div>
        </section>

        {/* --------------------- SANDBOX SCROLL-BOX --------------------- */}
        <div ref={wrapRef} style={{ height: `calc(100vh + ${travel}px)` }}>
          <div className="sticky top-0 h-screen flex items-center justify-center px-6 md:px-16">
            <div
              className="w-full max-w-7xl mx-auto overflow-hidden"
              style={{ height: boxH, maskImage: SANDBOX_FADE, WebkitMaskImage: SANDBOX_FADE }}
            >
              <motion.div ref={contentRef} style={{ y: sandboxY }}>
                <SandboxGallery items={SANDBOX_ITEMS} />
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <MahjongFooter />
    </>
  );
}
