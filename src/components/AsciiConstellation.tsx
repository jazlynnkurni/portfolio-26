"use client";

import { motion, useReducedMotion, type TargetAndTransition } from "framer-motion";

type Star = {
  glyph: string;
  top: number;
  left: number;
  delay: number;
  duration: number;
  bigDipper?: boolean;
};

const STARS: Star[] = [
  // Big Dipper anchor (7) — left-center, slightly larger glyphs, pulsing scale
  { glyph: "+**.", top: 50, left: 18, delay: 0.0, duration: 3.2, bigDipper: true },
  { glyph: ":*+",  top: 70, left: 18, delay: 0.8, duration: 2.5, bigDipper: true },
  { glyph: ".**+", top: 50, left: 30, delay: 1.5, duration: 3.1, bigDipper: true },
  { glyph: "+*.",  top: 70, left: 30, delay: 2.3, duration: 2.7, bigDipper: true },
  { glyph: "*+*",  top: 38, left: 38, delay: 0.4, duration: 2.9, bigDipper: true },
  { glyph: ":·+",  top: 22, left: 45, delay: 1.9, duration: 2.4, bigDipper: true },
  { glyph: ".*.",  top: 8,  left: 53, delay: 2.7, duration: 2.2, bigDipper: true },

  // Below © text region (top 30-100%, left 0-32%)
  { glyph: ".",    top: 45, left: 5,  delay: 0.3, duration: 1.8 },
  { glyph: "·",    top: 55, left: 12, delay: 1.1, duration: 2.4 },
  { glyph: "+",    top: 75, left: 5,  delay: 2.0, duration: 1.6 },
  { glyph: ".",    top: 85, left: 22, delay: 0.6, duration: 3.0 },
  { glyph: "·",    top: 65, left: 28, delay: 1.7, duration: 2.2 },
  { glyph: "*",    top: 88, left: 8,  delay: 2.5, duration: 2.0 },

  // Center empty band (left 35-65%)
  { glyph: ".",    top: 12, left: 40, delay: 0.2, duration: 2.7 },
  { glyph: "·",    top: 28, left: 35, delay: 1.4, duration: 1.9 },
  { glyph: "+",    top: 42, left: 55, delay: 0.5, duration: 1.7 },
  { glyph: ".",    top: 58, left: 48, delay: 1.6, duration: 2.5 },
  { glyph: "+",    top: 82, left: 42, delay: 0.8, duration: 2.1 },
  { glyph: "·",    top: 15, left: 58, delay: 2.6, duration: 2.4 },
  { glyph: ".",    top: 78, left: 55, delay: 0.9, duration: 1.6 },
  { glyph: "+",    top: 88, left: 38, delay: 1.8, duration: 2.8 },
  { glyph: "·",    top: 5,  left: 45, delay: 2.0, duration: 2.0 },
  { glyph: ".",    top: 50, left: 62, delay: 0.7, duration: 2.6 },
  { glyph: "+",    top: 72, left: 35, delay: 1.5, duration: 1.9 },

  // Above/below link columns (top 0-8% or 92-100%, left 65-95%)
  { glyph: ".",    top: 2,  left: 70, delay: 0.7, duration: 2.0 },
  { glyph: "·",    top: 4,  left: 88, delay: 1.5, duration: 1.6 },
  { glyph: "+",    top: 96, left: 68, delay: 2.2, duration: 2.4 },
  { glyph: ".",    top: 98, left: 85, delay: 0.4, duration: 2.0 },
  { glyph: ".",    top: 5,  left: 80, delay: 1.2, duration: 1.8 },
  { glyph: "·",    top: 95, left: 92, delay: 2.4, duration: 2.2 },

  // Far top/bottom mid band
  { glyph: ".",    top: 3,  left: 50, delay: 0.5, duration: 2.0 },
  { glyph: "·",    top: 97, left: 50, delay: 2.0, duration: 1.8 },
];

const BASELINE_OPACITY = 0.7;
const WAVE_SWEEP_SECONDS = 2;
const WAVE_CYCLE_SECONDS = 3;
const WAVE_REST_SECONDS = 1;

export default function AsciiConstellation() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden
      className="hidden md:block pointer-events-none select-none font-mono absolute inset-0"
      style={{
        color: "#FFF5EF",
        opacity: BASELINE_OPACITY,
        fontSize: "13px",
        lineHeight: 1,
        zIndex: 0,
      }}
    >
      {STARS.map((star, i) => {
        const waveDelay = (star.left / 100) * WAVE_SWEEP_SECONDS;
        const peakOpacity = star.bigDipper ? 1.0 : 0.9;

        const waveInitial: TargetAndTransition = star.bigDipper
          ? { opacity: 0.2, scale: 0.9 }
          : { opacity: 0.2 };

        const waveAnimate: TargetAndTransition = reducedMotion
          ? star.bigDipper
            ? { opacity: 1, scale: 1 }
            : { opacity: 1 }
          : star.bigDipper
            ? {
                opacity: [0.2, peakOpacity, 0.2],
                scale: [0.9, 1.1, 0.9],
              }
            : { opacity: [0.2, peakOpacity, 0.2] };

        const waveTransition = reducedMotion
          ? { duration: 0 }
          : {
              duration: WAVE_CYCLE_SECONDS,
              delay: waveDelay,
              repeat: Infinity,
              repeatDelay: WAVE_REST_SECONDS,
              ease: "easeInOut" as const,
            };

        const flickerAnimate: TargetAndTransition = reducedMotion
          ? { opacity: 1 }
          : { opacity: [1, 0.92, 1, 0.96, 1] };

        const flickerTransition = reducedMotion
          ? { duration: 0 }
          : {
              duration: star.duration + 3,
              delay: star.delay,
              repeat: Infinity,
              ease: "easeInOut" as const,
            };

        return (
          <motion.span
            key={i}
            className="absolute whitespace-pre"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
            }}
            initial={waveInitial}
            animate={waveAnimate}
            transition={waveTransition}
          >
            <motion.span
              style={{ display: "inline-block" }}
              initial={{ opacity: 1 }}
              animate={flickerAnimate}
              transition={flickerTransition}
            >
              {star.glyph}
            </motion.span>
          </motion.span>
        );
      })}
    </div>
  );
}
