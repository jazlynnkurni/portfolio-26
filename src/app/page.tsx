"use client";

import { motion, type Variants } from "framer-motion";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import HeadlineDrift from "@/components/HeadlineDrift";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Home() {
  return (
    <>
      <Nav />

      <main className="flex-1 px-6 md:px-16 py-12 md:py-20">
        <motion.div
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.08, delayChildren: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center max-w-7xl mx-auto"
        >
          {/* LEFT COLUMN ~60% */}
          <div className="md:col-span-3 flex flex-col">
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2.5 self-start bg-[rgba(201,120,54,0.08)] py-2 px-4 rounded-full"
            >
              <span className="block w-2.5 h-2.5 bg-accent-orange rounded-full pulse-dot" />
              <span className="font-mono uppercase tracking-wide text-[13px] text-ink">
                Open for full-time
              </span>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-8">
              <HeadlineDrift>
                <h1 className="font-serif italic text-3xl sm:text-5xl md:text-6xl leading-[1.15] text-ink">
                  Halo I&apos;m Jazlynn, a{" "}
                  <em className="wavy">product designer</em> who builds{" "}
                  <em className="wavy">AI-native experiences</em> with{" "}
                  <em className="wavy">
                    cognitive science, care, and taste.
                  </em>
                </h1>
              </HeadlineDrift>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-6 font-mono text-sm text-ink/70 leading-relaxed"
            >
              <p>Ambassador @ Lovable</p>
              <p>Flibbertigibbeting @ Columbia University</p>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-9 flex flex-wrap gap-3">
              <button
                type="button"
                className="bg-accent-orange text-bg px-7 py-3 rounded-full font-mono uppercase tracking-wide text-[13px] transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_6px_20px_rgba(201,120,54,0.35)] cursor-pointer"
              >
                Explore
              </button>
              <button
                type="button"
                className="border-[1.5px] border-accent-orange text-accent-orange bg-transparent px-7 py-3 rounded-full font-mono uppercase tracking-wide text-[13px] transition-colors duration-200 hover:bg-[rgba(201,120,54,0.08)] cursor-pointer"
              >
                Skip Intro
              </button>
            </motion.div>
          </div>

          {/* RIGHT COLUMN ~40% — snooker placeholder */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="md:col-span-2 flex justify-center"
          >
            <div className="w-full max-w-[340px] aspect-[1/2] border-2 border-dashed border-accent-orange rounded-3xl flex flex-col items-center justify-center transition-transform duration-[400ms] hover:rotate-[0.5deg]">
              <em className="font-serif text-3xl text-accent-orange">snooker</em>
              <p className="mt-2 font-mono text-xs text-accent-orange/60">
                coming soon (prompt 3)
              </p>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </>
  );
}
