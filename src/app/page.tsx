"use client";

import { motion, type Variants } from "framer-motion";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import HeadlineDrift, {
  type HeadlineSegment,
} from "@/components/HeadlineDrift";
import SnookerScene from "@/components/snooker/SnookerScene";
import HeroPendantLamp from "@/components/HeroPendantLamp";

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
  return (
    <>
      <Nav />

      <main className="flex-1 px-6 md:px-16 pt-12 md:pt-20 pb-10 md:pb-16 relative overflow-hidden">
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

            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center"
              style={{ marginTop: "36px", gap: "25px" }}
            >
              <button
                type="button"
                className="font-sans cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_6px_20px_rgba(143,75,30,0.35)]"
                style={{
                  backgroundColor: "#8F4B1E",
                  color: "#FFFFFF",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  fontSize: "14px",
                }}
              >
                Explore
              </button>
              <button
                type="button"
                className="font-sans cursor-pointer transition-colors duration-200 hover:bg-[rgba(143,75,30,0.08)]"
                style={{
                  backgroundColor: "transparent",
                  color: "#8F4B1E",
                  border: "1.5px solid #8F4B1E",
                  padding: "10px 12px",
                  borderRadius: "15px",
                  fontSize: "14px",
                }}
              >
                Skip Intro
              </button>
            </motion.div>
          </div>

          {/* RIGHT COLUMN — snooker scene, auto-sized to its natural width */}
          <div>
            <SnookerScene />
          </div>
        </motion.div>
      </main>

      <Footer />
    </>
  );
}
