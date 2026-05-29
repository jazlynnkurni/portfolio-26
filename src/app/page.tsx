"use client";

import { useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import HeadlineDrift, {
  type HeadlineSegment,
} from "@/components/HeadlineDrift";
import SnookerScene from "@/components/snooker/SnookerScene";
import HeroPendantLamp from "@/components/HeroPendantLamp";
import WorkGrid from "@/components/WorkGrid";

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

export default function Home() {
  // Scroll to #work if landed via /#work or redirected from /work.
  // Next App Router doesn't reliably auto-scroll to hash anchors on initial load.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#work") return;
    const t = setTimeout(() => {
      document.getElementById("work")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Nav />

      <main className="flex-1 relative overflow-x-hidden">
        {/* ---------------------------- HERO ---------------------------- */}
        <section className="relative px-6 md:px-16 pt-12 md:pt-20 pb-8 md:pb-12">
          <HeroPendantLamp />
          <motion.div
            initial="hidden"
            animate="show"
            transition={{ staggerChildren: 0.08, delayChildren: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-16 items-center max-w-7xl mx-auto relative"
            style={{ zIndex: 10 }}
          >
            {/* LEFT COLUMN ~55% */}
            <div className="flex flex-col">
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
                  className="font-serif font-normal text-[28px] md:text-[34px] lg:text-[40px] leading-[1.3] text-ink max-w-[752px]"
                />
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="mt-8 font-mono text-[14px] text-ink/70 leading-relaxed"
              >
                <p>
                  Ambassador @ Lovable
                  <span className="opacity-50 mx-3" aria-hidden>
                    |
                  </span>
                  Flibbertigibbeting @ Columbia University
                </p>
              </motion.div>
            </div>

            {/* RIGHT COLUMN — snooker scene, auto-sized to its natural width */}
            <div>
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
      </main>

      <Footer />
    </>
  );
}
