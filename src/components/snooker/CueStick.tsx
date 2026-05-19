"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  type MotionValue,
} from "framer-motion";

type Props = {
  /** Cue rotation in degrees (0 = body straight down from cue ball). */
  angle?: MotionValue<number>;
  /** Pullback distance in pixels (slides cue along its body axis). */
  pullback?: MotionValue<number>;
  /** Cue body length as % of container height. */
  length?: number;
};

/**
 * Cue stick anchored at the cue ball center, with its tip offset by the
 * ball radius (translateY(4%) of cue height ≈ ball radius) along the
 * rotated axis. Pullback adds further translation along the same axis.
 * Result: tip always touches the ball edge in the cue body direction.
 */
export default function CueStick({ angle, pullback, length = 45 }: Props) {
  const fallbackAngle = useMotionValue(0);
  const fallbackPullback = useMotionValue(0);
  const a = angle ?? fallbackAngle;
  const p = pullback ?? fallbackPullback;

  const transform = useMotionTemplate`translateX(-50%) rotate(${a}deg) translateY(calc(4% + ${p}px))`;

  return (
    <motion.div
      aria-hidden
      style={{
        position: "absolute",
        left: "50%",
        top: "72%",
        width: "4%",
        height: `${length}%`,
        transform,
        transformOrigin: "50% 0%",
        background:
          "linear-gradient(to bottom, #95704F 0%, #95704F 18%, #B08968 22%, #B08968 100%)",
        clipPath: "polygon(28% 0%, 72% 0%, 100% 100%, 0% 100%)",
        filter:
          "drop-shadow(2px 4px 6px rgba(50, 30, 20, 0.3)) blur(0.4px)",
        zIndex: 30,
        pointerEvents: "none",
      }}
    />
  );
}
