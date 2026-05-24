"use client";

import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { useEffect, useState } from "react";

// Painterly red pendant lamp.
//
// First page load:
//   0.0s   — drop in (y: -300 → 0, 0.7s ease-out)
//   0.8s   — light wind-blown swing begins (2.2s, 12 keyframes, decaying)
//   3.0s   — swing settles
//   3.0s   — bulb flickers on (2s irregular brightness)
//   ~5.0s  — bulb solid lit, warm glow steady
//
// Tap interaction:
//   - cursor: pointer, hover scale 1.03, tap scale 0.97
//   - onClick fires a quick 1.4s wobble: 4 oscillations decaying
//   - Tapping during pre-flicker phase jumps lamp to lit instantly
//
// Warm glow:
//   - Translates horizontally with rotation (light follows lamp)
//   - Brightens on hard swings (rotation magnitude → opacity boost)
//
// SSR: all motion values + state initialize to identical values on server
// and client first render (no localStorage gating during render).

const CORD_W_DESKTOP = 24;
const CORD_W_MOBILE = 16;
const BODY_W_DESKTOP = 95;
const BODY_W_MOBILE = 65;
const CORD_BODY_OVERLAP = 12;

const CORD_VISIBLE_H_DESKTOP = 80;
const CORD_VISIBLE_H_MOBILE = 50;

const BODY_H_DESKTOP = Math.round(BODY_W_DESKTOP / 0.875);
const BODY_H_MOBILE = Math.round(BODY_W_MOBILE / 0.875);

const LAMP_BODY_BOTTOM_DESKTOP =
  CORD_VISIBLE_H_DESKTOP + BODY_H_DESKTOP - CORD_BODY_OVERLAP;
const LAMP_BODY_BOTTOM_MOBILE =
  CORD_VISIBLE_H_MOBILE + BODY_H_MOBILE - CORD_BODY_OVERLAP;

const SPILL_W_DESKTOP = 480;
const SPILL_H_DESKTOP = 540;
const SPILL_W_MOBILE = 320;
const SPILL_H_MOBILE = 360;

const LAMP_LEFT_ANCHOR_DESKTOP = "9vw";

// Initial wind-blown swing — lighter than before (max ±14°), quick decay
const INITIAL_SWING_KF = [0, -14, 11, -4, -8, 6, -2, 4, -3, 1, -0.5, 0];
const INITIAL_SWING_TIMES = [
  0, 0.06, 0.14, 0.22, 0.3, 0.42, 0.54, 0.64, 0.74, 0.85, 0.94, 1,
];

// Tap-to-swing — 4 visible oscillations, settles in 1.4s
const TAP_SWING_KF = [0, -12, 9, -6, 4, -2, 1, -0.5, 0];
const TAP_SWING_TIMES = [0, 0.08, 0.2, 0.34, 0.48, 0.62, 0.76, 0.88, 1];

const DROP_DURATION_S = 0.7;
const SWING_DELAY_MS = 800;
const SWING_DURATION_MS = 2200;

export default function HeroPendantLamp() {
  const shouldReduceMotion = useReducedMotion();

  // SSR-stable: false on both server and client first render.
  const [hasFinishedSwinging, setHasFinishedSwinging] = useState(false);

  // Rotation drives the lamp wrapper rotate transform.
  const rotation = useMotionValue(0);

  // Light follows lamp: rotation degrees → horizontal pixel offset.
  const lightOffsetX = useTransform(rotation, (deg) => (deg / 14) * 40);

  // Base opacity 0 → 1 when bulb flickers on.
  const baseOpacity = useMotionValue(0);

  // Final glow opacity = base * (0.28 baseline + swing-magnitude boost up to +0.4)
  const glowOpacity = useTransform(
    [rotation, baseOpacity],
    (values) => {
      const [deg, base] = values as [number, number];
      return base * (0.28 + Math.min(0.4, (Math.abs(deg) / 14) * 0.4));
    }
  );

  // Drop in → wind-blown swing → flicker. Runs once on mount.
  useEffect(() => {
    if (shouldReduceMotion) {
      setHasFinishedSwinging(true);
      baseOpacity.set(1);
      return;
    }

    const swingTimer = setTimeout(() => {
      animate(rotation, INITIAL_SWING_KF, {
        duration: SWING_DURATION_MS / 1000,
        times: INITIAL_SWING_TIMES,
        ease: "easeOut",
      });
    }, SWING_DELAY_MS);

    const flickerTimer = setTimeout(() => {
      setHasFinishedSwinging(true);
      animate(baseOpacity, 1, { duration: 1.6, ease: "easeOut" });
    }, SWING_DELAY_MS + SWING_DURATION_MS);

    return () => {
      clearTimeout(swingTimer);
      clearTimeout(flickerTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tap-to-swing: quick 4-oscillation wobble. Re-triggers on each tap.
  const handleTap = () => {
    if (!hasFinishedSwinging) {
      setHasFinishedSwinging(true);
      animate(baseOpacity, 1, { duration: 0.4, ease: "easeOut" });
    }
    animate(rotation, TAP_SWING_KF, {
      duration: 1.4,
      times: TAP_SWING_TIMES,
      ease: "easeOut",
    });
  };

  const lampBodyClass = hasFinishedSwinging
    ? "lamp-flicker-active"
    : "lamp-dimmed";

  const dropInitial = { y: -300 };
  const dropAnimate = { y: 0 };
  const dropTransition = { duration: DROP_DURATION_S, ease: "easeOut" as const };

  return (
    <>
      <style>{`
        .lamp-dimmed {
          filter: brightness(0.35);
        }
        .lamp-flicker-active {
          animation: lamp-flicker 2s ease-in forwards;
        }
        @keyframes lamp-flicker {
          0%   { filter: brightness(0.35); }
          3%   { filter: brightness(0.9); }
          6%   { filter: brightness(0.3); }
          9%   { filter: brightness(0.7); }
          14%  { filter: brightness(0.2); }
          18%  { filter: brightness(0.95); }
          23%  { filter: brightness(0.4); }
          28%  { filter: brightness(1); }
          35%  { filter: brightness(0.7); }
          42%  { filter: brightness(1); }
          50%  { filter: brightness(0.85); }
          60%  { filter: brightness(1); }
          100% { filter: brightness(1); }
        }
      `}</style>

      {/* WARM GLOW — desktop. x translates with lamp swing; opacity boosts on hard swings */}
      <motion.div
        aria-hidden
        className="hidden md:block pointer-events-none absolute"
        style={{
          zIndex: 17,
          top: LAMP_BODY_BOTTOM_DESKTOP - 30,
          left: `calc(${LAMP_LEFT_ANCHOR_DESKTOP} - ${(SPILL_W_DESKTOP - BODY_W_DESKTOP) / 2}px)`,
          width: SPILL_W_DESKTOP,
          height: SPILL_H_DESKTOP,
          mixBlendMode: "screen",
          filter: "blur(12px)",
          background: `radial-gradient(
            ellipse 220px 380px at center top,
            rgba(255, 220, 150, 0.28) 0%,
            rgba(255, 200, 110, 0.18) 25%,
            rgba(255, 180, 80, 0.08) 50%,
            rgba(255, 160, 60, 0.03) 70%,
            transparent 90%
          )`,
          x: lightOffsetX,
          opacity: glowOpacity,
        }}
      />

      {/* WARM GLOW — mobile */}
      <motion.div
        aria-hidden
        className="md:hidden pointer-events-none absolute"
        style={{
          zIndex: 17,
          top: LAMP_BODY_BOTTOM_MOBILE - 20,
          left: "50%",
          width: SPILL_W_MOBILE,
          height: SPILL_H_MOBILE,
          marginLeft: -(SPILL_W_MOBILE / 2),
          mixBlendMode: "screen",
          filter: "blur(10px)",
          background: `radial-gradient(
            ellipse 130px 220px at center top,
            rgba(255, 220, 150, 0.28) 0%,
            rgba(255, 200, 110, 0.18) 25%,
            rgba(255, 180, 80, 0.08) 50%,
            rgba(255, 160, 60, 0.03) 70%,
            transparent 90%
          )`,
          x: lightOffsetX,
          opacity: glowOpacity,
        }}
      />

      {/* LAMP WRAPPER — desktop. pointer-events: none on outer so cord doesn't
          block CTAs; lamp body re-enables pointer events for tap. */}
      <div
        aria-hidden
        className="hidden md:block pointer-events-none absolute"
        style={{
          zIndex: 30,
          top: 0,
          left: LAMP_LEFT_ANCHOR_DESKTOP,
          width: BODY_W_DESKTOP,
        }}
      >
        <motion.div
          initial={dropInitial}
          animate={dropAnimate}
          transition={dropTransition}
          style={{
            rotate: rotation,
            transformOrigin: "50% 0%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* CORD — non-interactive */}
          <div
            style={{
              width: CORD_W_DESKTOP,
              height: CORD_VISIBLE_H_DESKTOP,
              position: "relative",
              pointerEvents: "none",
            }}
          >
            <Image
              src="/images/hero/lamp/lamp-cord.png"
              alt=""
              fill
              priority
              style={{ objectFit: "fill" }}
              sizes="40px"
            />
          </div>

          {/* LAMP BODY — TAP-TO-SWING */}
          <motion.div
            className={lampBodyClass}
            style={{
              marginTop: -CORD_BODY_OVERLAP,
              width: BODY_W_DESKTOP,
              cursor: "pointer",
              pointerEvents: "auto",
            }}
            onClick={handleTap}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Image
              src="/images/hero/lamp/lamp-body.png"
              alt=""
              width={1076}
              height={1230}
              priority
              draggable={false}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                userSelect: "none",
                WebkitUserDrag: "none",
              } as React.CSSProperties}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* LAMP WRAPPER — mobile (centered) */}
      <div
        aria-hidden
        className="md:hidden pointer-events-none absolute"
        style={{
          zIndex: 30,
          top: 0,
          left: "50%",
          marginLeft: -(BODY_W_MOBILE / 2),
          width: BODY_W_MOBILE,
        }}
      >
        <motion.div
          initial={dropInitial}
          animate={dropAnimate}
          transition={dropTransition}
          style={{
            rotate: rotation,
            transformOrigin: "50% 0%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: CORD_W_MOBILE,
              height: CORD_VISIBLE_H_MOBILE,
              position: "relative",
              pointerEvents: "none",
            }}
          >
            <Image
              src="/images/hero/lamp/lamp-cord.png"
              alt=""
              fill
              priority
              style={{ objectFit: "fill" }}
              sizes="30px"
            />
          </div>

          <motion.div
            className={lampBodyClass}
            style={{
              marginTop: -CORD_BODY_OVERLAP,
              width: BODY_W_MOBILE,
              cursor: "pointer",
              pointerEvents: "auto",
            }}
            onClick={handleTap}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Image
              src="/images/hero/lamp/lamp-body.png"
              alt=""
              width={1076}
              height={1230}
              priority
              draggable={false}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                userSelect: "none",
                WebkitUserDrag: "none",
              } as React.CSSProperties}
            />
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
