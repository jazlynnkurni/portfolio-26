"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";

export type CursorMode = "default" | "email";

// Dispatched by interactive elements (e.g. the headline) to morph the cursor.
// Payload: { mode: "default" | "email" }
export const CURSOR_MODE_EVENT = "cursor-mode";

const EMAIL_TEXT = "jazkurnz06@gmail.com";
const DOT_SIZE = 22;
const PILL_HEIGHT = 36;
const PILL_PADDING_X = 18;
// Fallback width if the measurement ref hasn't resolved yet (rare).
const PILL_WIDTH_FALLBACK = 200;

export default function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 500, damping: 28, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 500, damping: 28, mass: 0.5 });
  // Compose: translate to cursor position, then back by half the element's
  // own size so the pill/dot stays centered on the pointer at any width.
  const transform = useMotionTemplate`translate3d(${springX}px, ${springY}px, 0) translate(-50%, -50%)`;

  const [mode, setMode] = useState<CursorMode>("default");
  const [pillWidth, setPillWidth] = useState(PILL_WIDTH_FALLBACK);
  const measureRef = useRef<HTMLSpanElement>(null);

  // Measure the email text width once (after fonts load) so the pill ↔ dot
  // animation has two numeric endpoints — animating from a number to "auto"
  // doesn't reverse smoothly in framer-motion.
  useEffect(() => {
    const measure = () => {
      const el = measureRef.current;
      if (!el) return;
      setPillWidth(Math.ceil(el.getBoundingClientRect().width) + PILL_PADDING_X * 2);
    };
    measure();
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const onModeEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ mode: CursorMode }>).detail;
      if (detail?.mode === "default" || detail?.mode === "email") {
        setMode(detail.mode);
      }
    };
    window.addEventListener("mousemove", move);
    window.addEventListener(CURSOR_MODE_EVENT, onModeEvent);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener(CURSOR_MODE_EVENT, onModeEvent);
    };
  }, [x, y]);

  const isEmail = mode === "email";

  return (
    <>
      {/* Off-screen measurement span — never visible, used only to compute
          the pill width so the morph animates between two numeric widths. */}
      <span
        ref={measureRef}
        aria-hidden
        style={{
          position: "fixed",
          top: -9999,
          left: -9999,
          visibility: "hidden",
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1,
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        {EMAIL_TEXT}
      </span>

      <motion.div
        aria-hidden
        className="custom-cursor"
        animate={{
          width: isEmail ? pillWidth : DOT_SIZE,
          height: isEmail ? PILL_HEIGHT : DOT_SIZE,
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{
          transform,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        <AnimatePresence>
          {isEmail && (
            <motion.span
              key="email-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.15,
                delay: isEmail ? 0.1 : 0,
              }}
              style={{
                color: "#FFF5EF",
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              {EMAIL_TEXT}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
