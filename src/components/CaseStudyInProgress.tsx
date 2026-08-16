"use client";

/**
 * CaseStudyInProgress — the interactive block on /work/in-progress.
 * Hovering the "Case study in the making." headline slides the email address
 * up into view (masked reveal). No persistent button.
 */

import { motion } from "framer-motion";

const EMAIL = "jazkurnz06@gmail.com";
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function CaseStudyInProgress({ project }: { project?: string }) {
  const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(
    project ? `${project} case study` : "Case study walkthrough"
  )}`;

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center text-center">
      <motion.div
        initial="rest"
        animate="rest"
        whileHover="show"
        className="flex cursor-pointer flex-col items-center"
      >
        <h1 className="font-serif text-[34px] leading-tight text-ink text-balance md:text-[52px]">
          Case study in the making.
        </h1>

        {/* masked slide-up reveal — the email rises from below on hover */}
        <div className="mt-6 overflow-hidden py-1">
          <motion.a
            href={mailto}
            variants={{
              rest: { y: "130%", opacity: 0 },
              show: { y: "0%", opacity: 1 },
            }}
            transition={{ duration: 0.55, ease: EASE }}
            className="inline-block font-sans text-[16px] font-medium text-[#C97836] underline decoration-[#C97836]/30 underline-offset-4 transition-colors hover:decoration-[#C97836] md:text-[18px]"
          >
            {EMAIL}
          </motion.a>
        </div>
      </motion.div>
    </div>
  );
}
