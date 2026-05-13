"use client";

import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16 bg-bg text-ink">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center text-center"
      >
        <h1 className="font-serif italic text-5xl sm:text-7xl md:text-8xl leading-[1.05] tracking-tight text-ink">
          Jazlynn Kurniandra
        </h1>
        <p className="mt-8 font-mono text-xs sm:text-sm uppercase tracking-[0.18em] text-ink/60">
          portfolio loading — back soon.
        </p>
      </motion.div>
    </main>
  );
}
