"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from "framer-motion";
import { useRef, type ReactNode, type PointerEvent } from "react";

type TiltCardProps = {
  children: ReactNode;
  maxTilt?: number;
  glare?: number;
  scale?: number;
  holo?: boolean;
  aspect?: string;
  className?: string;
};

export function TiltCard({
  children,
  maxTilt = 14,
  glare = 0.45,
  scale = 1.04,
  holo = true,
  aspect = "1.58 / 1",
  className = "",
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const active = useMotionValue(0);

  const spring = { stiffness: 220, damping: 26, mass: 0.6 };
  const rxS = useSpring(rx, spring);
  const ryS = useSpring(ry, spring);
  const gxS = useSpring(gx, spring);
  const gyS = useSpring(gy, spring);
  const activeS = useSpring(active, { stiffness: 180, damping: 24 });

  const scaleV = useTransform(activeS, [0, 1], [1, scale]);

  const glareOpacity = useTransform(activeS, (a) => a * glare);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${gxS}% ${gyS}%, rgba(255,255,255,${glareOpacity}), rgba(255,255,255,0) 45%)`;

  const sweep = useTransform(ryS, [-maxTilt, maxTilt], [110, -10]);
  const sweepLo = useTransform(sweep, (s) => s - 22);
  const sweepHi = useTransform(sweep, (s) => s + 22);
  const sheenA = useTransform(activeS, (a) => a * 0.22);
  const sheenBg = useMotionTemplate`linear-gradient(105deg, rgba(255,255,255,0) ${sweepLo}%, rgba(255,255,255,${sheenA}) ${sweep}%, rgba(255,255,255,0) ${sweepHi}%)`;

  const holoOpacity = useTransform(activeS, (a) => (holo ? a * 0.22 : 0));
  const holoHue = useTransform(gxS, [0, 100], [0, 90]);
  const holoFilter = useMotionTemplate`hue-rotate(${holoHue}deg)`;
  const holoPos = useMotionTemplate`${gxS}% ${gyS}%`;

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    ry.set((px - 0.5) * 2 * maxTilt);
    rx.set(-(py - 0.5) * 2 * maxTilt);
    gx.set(px * 100);
    gy.set(py * 100);
    active.set(1);
  }

  function handleLeave() {
    rx.set(0);
    ry.set(0);
    gx.set(50);
    gy.set(50);
    active.set(0);
  }

  return (
    <div
      ref={ref}
      className="[perspective:1100px]"
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          rotateX: rxS,
          rotateY: ryS,
          scale: scaleV,
          transformStyle: "preserve-3d",
          aspectRatio: aspect,
        }}
        className={`relative w-full cursor-pointer overflow-hidden rounded-[8.17%_/_12.91%] shadow-[0_24px_50px_-28px_rgba(0,0,0,0.45)] ${className}`}
      >
        <div className="absolute inset-0 [backface-visibility:hidden]">
          {children}
        </div>

        {/* Constant gleam — a specular band that crosses the card right to left
            and simply keeps going. Two things make it seamless rather than
            stiff: it moves on `x` (a compositor transform, not a background
            position), and it travels far enough off BOTH edges that the
            wrap-around happens out of sight, so `ease: "linear"` with no
            repeatDelay reads as one continuous pass instead of a sweep that
            stops, waits, and snaps back. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen">
          <motion.div
            aria-hidden
            className="absolute"
            style={{
              top: "-60%",
              bottom: "-60%",
              width: "42%",
              rotate: 18,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.10) 34%, rgba(255,255,255,0.62) 50%, rgba(255,255,255,0.10) 66%, transparent 100%)",
            }}
            animate={{ x: ["260%", "-260%"] }}
            transition={{ duration: 4.6, ease: "linear", repeat: Infinity }}
          />
        </div>

        <motion.div
          aria-hidden
          style={{
            opacity: holoOpacity,
            filter: holoFilter,
            backgroundPosition: holoPos,
          }}
          className="pointer-events-none absolute inset-0 bg-[conic-gradient(from_0deg,#ff2cdf,#2cffd6,#ffe92c,#2c6bff,#ff2cdf)] [background-size:170%_170%] mix-blend-color-dodge"
        />
        <motion.div
          aria-hidden
          style={{ background: sheenBg }}
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        />
        <motion.div
          aria-hidden
          style={{ background: glareBg }}
          className="pointer-events-none absolute inset-0 mix-blend-overlay"
        />
      </motion.div>
    </div>
  );
}

export default TiltCard;
