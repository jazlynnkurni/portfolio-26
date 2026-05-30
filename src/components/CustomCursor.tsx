"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";

export type CursorMode = "default" | "email" | "case-study" | "caption" | "pencil" | "artwork";

// Dispatched by interactive elements (e.g. the headline, work cards) to morph
// the cursor. Payload: { mode: CursorMode }.
export const CURSOR_MODE_EVENT = "cursor-mode";

const EMAIL_TEXT = "jazkurnz06@gmail.com";
const CASE_STUDY_TEXT = "view case study →";
const ARTWORK_TEXT = "peep my art";
const DOT_SIZE = 22;
const PILL_HEIGHT = 36;
const PILL_PADDING_X = 18;
// Fallback widths if a measurement ref hasn't resolved yet (rare).
const PILL_WIDTH_FALLBACK_EMAIL = 200;
const PILL_WIDTH_FALLBACK_CASE = 180;
const PILL_WIDTH_FALLBACK_ARTWORK = 140;

const LABEL_BY_MODE: Record<Exclude<CursorMode, "default" | "caption" | "pencil">, string> = {
  email: EMAIL_TEXT,
  "case-study": CASE_STUDY_TEXT,
  artwork: ARTWORK_TEXT,
};

export default function CustomCursor() {
  const pathname = usePathname();
  // Case-study pages (/work/<slug>) keep the plain orange circle — no morphs.
  // The /work index itself still allows morphs (card hover, hero email).
  const isCaseStudyRoute =
    typeof pathname === "string" &&
    pathname.startsWith("/work/") &&
    pathname.length > "/work/".length;

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 500, damping: 28, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 500, damping: 28, mass: 0.5 });
  // Compose: translate to cursor position, then back by half the element's
  // own size so the pill/dot stays centered on the pointer at any width.
  const transform = useMotionTemplate`translate3d(${springX}px, ${springY}px, 0) translate(-50%, -50%)`;

  // Touch/coarse-pointer devices (phones, most tablets) get NO custom cursor.
  // Default false on SSR + first client render so the markup is stable; the
  // mount effect below flips it to true on touch devices, suppressing render.
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const [mode, setMode] = useState<CursorMode>("default");
  const [captionText, setCaptionText] = useState<string>("");
  const [emailWidth, setEmailWidth] = useState(PILL_WIDTH_FALLBACK_EMAIL);
  const [caseWidth, setCaseWidth] = useState(PILL_WIDTH_FALLBACK_CASE);
  const [artworkWidth, setArtworkWidth] = useState(PILL_WIDTH_FALLBACK_ARTWORK);
  const measureEmailRef = useRef<HTMLSpanElement>(null);
  const measureCaseRef = useRef<HTMLSpanElement>(null);
  const measureArtworkRef = useRef<HTMLSpanElement>(null);

  // Measure each pill label once (after fonts load) so morph animations have
  // two numeric width endpoints — animating from a number to "auto" doesn't
  // reverse smoothly in framer-motion.
  useEffect(() => {
    const measure = () => {
      const e = measureEmailRef.current;
      const c = measureCaseRef.current;
      const a = measureArtworkRef.current;
      if (e) {
        setEmailWidth(
          Math.ceil(e.getBoundingClientRect().width) + PILL_PADDING_X * 2
        );
      }
      if (c) {
        setCaseWidth(
          Math.ceil(c.getBoundingClientRect().width) + PILL_PADDING_X * 2
        );
      }
      if (a) {
        setArtworkWidth(
          Math.ceil(a.getBoundingClientRect().width) + PILL_PADDING_X * 2
        );
      }
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
    window.addEventListener("mousemove", move);

    const onModeEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ mode: CursorMode; text?: string }>)
        .detail;
      if (
        detail?.mode !== "default" &&
        detail?.mode !== "email" &&
        detail?.mode !== "case-study" &&
        detail?.mode !== "caption" &&
        detail?.mode !== "pencil" &&
        detail?.mode !== "artwork"
      ) {
        return;
      }
      // On case-study routes, only honor "caption" and "default" — block
      // "email" and "case-study" morphs to preserve the distraction-free intent.
      if (
        isCaseStudyRoute &&
        detail.mode !== "caption" &&
        detail.mode !== "default"
      ) {
        return;
      }
      setMode(detail.mode);
      if (detail.mode === "caption" && detail.text) {
        setCaptionText(detail.text);
      }
    };
    window.addEventListener(CURSOR_MODE_EVENT, onModeEvent);

    // Self-healing safety net for the data-cursor variants: on every
    // pointermove, re-derive whether the pointer is over a tagged element.
    // Recovers from missed mouseleave events (e.g., card clicked + route
    // change). Scoped: only manages the case-study/artwork<->default
    // transitions so other modes (caption/pencil/email) keep their own
    // dispatcher semantics.
    const onPointerMove = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const onCaseStudy = target.closest('[data-cursor="case-study"]');
      const onArtwork = target.closest('[data-cursor="artwork"]');
      setMode((current) => {
        if (onCaseStudy) return "case-study";
        if (onArtwork) return "artwork";
        if (current === "case-study" || current === "artwork") return "default";
        return current;
      });
    };
    document.addEventListener("pointermove", onPointerMove);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener(CURSOR_MODE_EVENT, onModeEvent);
      document.removeEventListener("pointermove", onPointerMove);
    };
  }, [x, y, isCaseStudyRoute]);

  // Belt-and-suspenders: reset to default on any route change so a stuck
  // mode can't survive navigation even if the pointer doesn't move.
  useEffect(() => {
    setMode("default");
  }, [pathname]);

  // Detect touch / coarse-pointer devices (phones, most tablets). Re-checks
  // on plug/unplug (e.g., iPad attached to a Magic Trackpad) so hybrid
  // devices flip live. SSR-safe: matchMedia is only touched inside this effect.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(pointer: coarse)");
    setIsTouchDevice(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // On case-study routes, the only morph permitted is "caption" — block any
  // residual "email" / "case-study" mode that might have survived navigation.
  const effectiveMode: CursorMode =
    isCaseStudyRoute && mode !== "caption" ? "default" : mode;
  const isCaption = effectiveMode === "caption";
  const isPill =
    effectiveMode === "email" ||
    effectiveMode === "case-study" ||
    effectiveMode === "artwork";
  const isPencil = effectiveMode === "pencil";
  const pillWidth =
    effectiveMode === "email"
      ? emailWidth
      : effectiveMode === "case-study"
        ? caseWidth
        : effectiveMode === "artwork"
          ? artworkWidth
          : DOT_SIZE;
  const label =
    effectiveMode === "email" ||
    effectiveMode === "case-study" ||
    effectiveMode === "artwork"
      ? LABEL_BY_MODE[effectiveMode]
      : null;

  // Touch / coarse-pointer devices: render nothing. All hooks above have
  // run (rules-of-hooks safe); the early return only skips the JSX.
  // The cursor:none CSS in globals.css is also gated to fine pointers,
  // so the system cursor (where applicable) remains intact.
  if (isTouchDevice) return null;

  return (
    <>
      {/* Off-screen measurement spans — never visible, used only to compute
          pill widths so the morph animates between numeric widths. */}
      <span
        ref={measureEmailRef}
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
      <span
        ref={measureCaseRef}
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
        {CASE_STUDY_TEXT}
      </span>
      <span
        ref={measureArtworkRef}
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
        {ARTWORK_TEXT}
      </span>

      <motion.div
        aria-hidden
        className="custom-cursor"
        animate={
          isCaption
            ? { width: "auto", height: "auto" }
            : isPencil
            ? { width: 40, height: 40 }
            : {
                width: isPill ? pillWidth : DOT_SIZE,
                height: isPill ? PILL_HEIGHT : DOT_SIZE,
              }
        }
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{
          transform,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          // Caption mode gets its own pill padding (email/case-study pills
          // bake their padding into the measured width via PILL_PADDING_X).
          ...(isCaption && {
            padding: "10px 22px",
          }),
          ...(isPencil && {
            background: "transparent",
            borderRadius: 0,
            overflow: "visible",
            boxShadow: "none",
            border: "none",
          }),
        }}
      >
        <AnimatePresence mode="wait">
          {isCaption ? (
            <motion.span
              key="caption"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                fontFamily: "'Helvetica Neue', Arial, sans-serif",
                fontSize: 18,
                fontWeight: 500,
                color: "#FFFFFF",
                lineHeight: 1.4,
                whiteSpace: "pre-line",
                padding: 0,
                textAlign: "center",
              }}
            >
              {captionText}
            </motion.span>
          ) : isPencil ? (
            <svg
              key="pencil"
              width="40"
              height="40"
              viewBox="0 0 40 40"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              style={{
                transform: "translate(10px, -10px)",
                userSelect: "none",
                pointerEvents: "none",
                display: "block",
              }}
            >
              <g transform="rotate(-45 20 20)" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
                <path d="M11 17 H33 V23 H11 Z" />
                <path d="M30 17 V23" />
                <path d="M11 17 L6 20 L11 23" />
                <path d="M8.2 18.6 L6 20 L8.2 21.4" />
              </g>
            </svg>
          ) : isPill && label ? (
            <motion.span
              key={mode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, delay: 0.1 }}
              style={{
                color: "#FFF5EF",
                fontFamily:
                  '"Helvetica Neue", Helvetica, Arial, sans-serif',
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              {label}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
