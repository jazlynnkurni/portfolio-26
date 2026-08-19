"use client";

/**
 * HOME-LAB — carousel exploration playground (not linked in nav).
 * -------------------------------------------------------------------
 * Explores a new landing architecture:
 *   1. Intro: the headline fades out on scroll to "hand off" to the layout.
 *   2. Architecture: snooker table LEFT, case-study carousel RIGHT.
 *   3. Five carousel variants, switchable live via the dock (keys 1–5).
 *
 * Reuses the real `cards` data from WorkGrid so this is a true preview.
 * Nothing here is wired into the live site — safe to iterate freely.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import Nav from "@/components/Nav";
import MahjongFooter from "@/components/MahjongFooter";
import SnookerScene from "@/components/snooker/ChromeSnookerScene";
import HeroPendantLamp from "@/components/HeroPendantLamp";
import HeadlineDrift, { type HeadlineSegment } from "@/components/HeadlineDrift";
import { cards, type WorkGridCard } from "@/components/WorkGrid";

// Intro copy — same as the live home page (src/app/page.tsx).
const headlineSegments: HeadlineSegment[] = [
  { text: "Halo I’m Jazlynn, a " },
  { text: "product designer", italic: true },
  { text: " who builds " },
  { text: "AI-native experiences", italic: true },
  { text: " with " },
  { text: "cognitive science, care, and taste.", italic: true },
];
import { CURSOR_MODE_EVENT } from "@/components/CustomCursor";
import SandboxGallery, {
  type SandboxItem,
} from "@/components/sandbox/SandboxGallery";

// A few showcase clips for the homepage sandbox teaser (the full wall lives at
// /sandbox). File paths are URL-encoded to survive the spaces in the names.
const SANDBOX_TEASER: SandboxItem[] = [
  { file: "Oranges_30s_seamless copy.mp4", id: "2070928000930214123" },
  { file: "Screen Recording 2026-07-20 at 00.51.23 2.mov", id: "2078901500030697983" },
  { file: "trim_55DBD55B-7847-44FB-9B25-F5120E152BF6 2.MP4", id: "2078901924024517033" },
  { file: "parallax copy.mp4", id: "2075280350562099455" },
  { file: "Screen Recording 2026-06-26 at 00.19.45 2.mov", id: "2070370962168766862" },
  { file: "rad copy.mp4", id: "2072738705325060191" },
].map(({ file, id }) => ({
  src: "/videos/SandboxVideos/" + encodeURIComponent(file),
  type: "video" as const,
  project: "sandbox",
  href: `https://x.com/jazlynnkurni/status/${id}`,
}));

// Same mechanism the live WorkCard uses to swap the global custom cursor to the
// "view case study →" pill on hover.
function setCursorMode(mode: string) {
  window.dispatchEvent(new CustomEvent(CURSOR_MODE_EVENT, { detail: { mode } }));
}

/* ============================================================== */
/*  Variant registry                                              */
/* ============================================================== */

type VariantId = "pinwheel" | "peek" | "coverflow" | "rolodex" | "fan";

const VARIANTS: { id: VariantId; label: string; blurb: string }[] = [
  { id: "pinwheel", label: "Vertical Peek", blurb: "prev peeks top, next peeks bottom, straight & in-line — scroll slides the column" },
  { id: "peek", label: "Peek Stack", blurb: "active card full; neighbors peek in top & bottom, slide up on advance" },
  { id: "coverflow", label: "Coverflow", blurb: "3D depth — active faces you, neighbors tilt back and recede" },
  { id: "rolodex", label: "Rolodex", blurb: "horizontal-axis flip; the top card rolls away as the next arrives" },
  { id: "fan", label: "Card Fan", blurb: "cards fan from a bottom pivot like a pinwheel blade" },
];

// Card dimensions matched to the LIVE site's WorkGrid math:
//   max-w-7xl (1280) − px-16 (128) = 1152 content; (1152 − gap 32) / 2 = 560 wide.
//   WorkCard internals (pad 24 + label + aspect-video media 288 + tagline + tags)
//   level out to ~476 tall under the grid's items-stretch.
const CARD_W = 560;
const CARD_H = 476;
const STAGE_W = 600;
const STAGE_H = 700;

// Prototype-only deck. Kept local to the lab so the live site's WorkGrid is
// untouched. We (a) strip the "- NO. 0X" numbering from every label, and
// (b) splice an extra social/X card in right after Manus.
// Lab card extends the real card shape with a "show full media" flag (letterbox
// the video on white so nothing is cropped).
type LabCard = WorkGridCard & { mediaContain?: boolean };

const ORANGES_CARD: LabCard = {
  key: "oranges-x",
  href: "https://x.com/jazlynnkurni",
  external: true,
  numberLabel: "Design Series",
  tagline: "Trending Designs on X",
  tags: ["173K views", "7.1K likes"],
  mediaType: "video",
  mediaSrc: "/videos/oranges-30.mp4",
  caseStudyName: "Design Series",
  mediaContain: true,
};

const stripNo = (label: string) =>
  label.replace(/\s*-\s*NO\.\s*\d+\s*$/i, "");

const LAB_CARDS: LabCard[] = cards.flatMap((c) => {
  const card = { ...c, numberLabel: stripNo(c.numberLabel) };
  return c.key === "manus" ? [card, ORANGES_CARD] : [card];
});

/* Per-variant transform for a card at signed offset `o` from the active card. */
function cardStyle(
  variant: VariantId,
  o: number
): React.CSSProperties {
  const d = Math.abs(o);
  const hidden = d > 2.2;
  const base: React.CSSProperties = {
    zIndex: 100 - Math.round(d * 10),
    opacity: hidden ? 0 : 1,
    pointerEvents: o === 0 ? "auto" : "none",
    transformOrigin: "50% 50%",
  };

  switch (variant) {
    case "pinwheel": {
      // 3-card vertical stack: prev peeks straight in at the top, next peeks
      // straight in at the bottom, active in the middle. NO tilt — every card
      // stays axis-aligned and the same width, so the peeking cards read as a
      // continuation of the active one. Advancing slides the whole column up
      // or down in one seamless motion.
      const hiddenPin = d > 1.8;
      const STEP = CARD_H + 32; // real gap between cards → emphasizes the center
      const pinScale = 1 - d * 0.2; // peeking cards shrink so the active one pops
      return {
        ...base,
        transform: `translate(-50%, -50%) translateY(${o * STEP}px) scale(${pinScale})`,
        opacity: hiddenPin ? 0 : 1 - d * 0.3, // neighbors dimmed to spotlight active
        filter: o === 0 ? "none" : `brightness(${1 - d * 0.14})`,
        zIndex: 100 - Math.round(d * 10),
      };
    }
    case "peek": {
      return {
        ...base,
        transform: `translate(-50%, -50%) translateY(${o * 150}px) scale(${o === 0 ? 1 : 0.9})`,
        opacity: hidden ? 0 : o === 0 ? 1 : Math.max(0, 0.55 - (d - 1) * 0.3),
        filter: o === 0 ? "none" : "brightness(0.82)",
      };
    }
    case "coverflow": {
      return {
        ...base,
        transform: `translate(-50%, -50%) translateY(${o * 64}px) translateZ(${-d * 170}px) rotateY(${o * -30}deg) scale(${1 - d * 0.04})`,
        opacity: hidden ? 0 : 1 - d * 0.24,
        filter: o === 0 ? "none" : `brightness(${1 - d * 0.14})`,
      };
    }
    case "rolodex": {
      return {
        ...base,
        transform: `translate(-50%, -50%) translateY(${o * 40}px) translateZ(${-d * 30}px) rotateX(${o * -34}deg) scale(${1 - d * 0.05})`,
        opacity: hidden ? 0 : 1 - d * 0.3,
        filter: o === 0 ? "none" : `brightness(${1 - d * 0.16})`,
      };
    }
    case "fan": {
      return {
        ...base,
        transformOrigin: "50% 150%",
        transform: `translate(-50%, -50%) rotate(${o * 11}deg) translateY(${d * 6}px)`,
        opacity: hidden ? 0 : 1 - d * 0.26,
        filter: o === 0 ? "none" : `brightness(${1 - d * 0.12})`,
      };
    }
  }
}

/* ============================================================== */
/*  ProtoCard — presentational clone of WorkCard (no hover anim)   */
/* ============================================================== */

function ProtoCard({
  card,
  active,
}: {
  card: LabCard;
  active: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [active]);

  return (
    <article
      className="rounded-3xl"
      style={{
        background:
          "linear-gradient(180deg, #D08440 0%, #C97836 60%, #BC6E2E 100%)",
        boxShadow: active
          ? "0 24px 56px -8px rgba(176,137,104,0.4), 0 8px 20px -2px rgba(176,137,104,0.22), inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.08)"
          : "0 12px 32px -8px rgba(176,137,104,0.25), inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.08)",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        width: "100%",
        height: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          aria-hidden
          className="shadow-[inset_0_2px_3px_rgba(0,0,0,0.35)]"
          style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FFF5EF", flexShrink: 0 }}
        />
        <h2
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            letterSpacing: "0.08em",
            color: "#FFF5EF",
            textTransform: "uppercase",
            margin: 0,
            lineHeight: 1,
          }}
        >
          {card.numberLabel}
        </h2>
      </div>

      {/* Media grows to fill the card's slack so the tagline + tags stay
          grouped tightly together at the bottom (no big gap between them). */}
      <div
        className="relative isolate rounded-xl overflow-hidden w-full"
        style={{
          // Full-media cards letterbox on white so nothing is cropped; others
          // fill the box on the card's orange.
          backgroundColor: card.mediaContain ? "#FFFFFF" : "#C97836",
          flexGrow: 1,
          minHeight: 0,
        }}
      >
        {card.mediaType === "video" ? (
          <video
            ref={videoRef}
            className={`w-full h-full ${card.mediaContain ? "object-contain" : "object-cover"}`}
            src={card.mediaSrc}
            muted
            playsInline
            loop
            preload="metadata"
            style={{
              display: "block",
              transform: card.mediaContain ? undefined : `scale(${card.mediaZoom ?? 1})`,
            }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="w-full h-full object-contain"
            src={card.mediaSrc}
            alt={card.caseStudyName}
            style={{ display: "block" }}
          />
        )}
      </div>

      {/* Tagline + tags — tight group with a small gap between them. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 16,
            fontWeight: 500,
            lineHeight: 1.3,
            color: "#FFF5EF",
            margin: 0,
          }}
        >
          {card.tagline}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#9A4C19]"
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: "#FFF5EF",
                padding: "4px 11px",
                lineHeight: 1.2,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

/* ============================================================== */
/*  Carousel                                                       */
/* ============================================================== */

function Carousel({
  variant,
  active,
  onJump,
}: {
  variant: VariantId;
  /** Which card is centered — driven by the page's scroll position. */
  active: number;
  /** Jump to a card (smooth-scrolls the page to its scroll offset). */
  onJump: (index: number) => void;
}) {
  const perspective =
    variant === "coverflow" || variant === "rolodex" ? 1200 : undefined;

  return (
    <div className="flex items-center gap-4 select-none">
      {/* Stage */}
      <div
        className="relative"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          perspective: perspective ? `${perspective}px` : undefined,
        }}
      >
        {LAB_CARDS.map((card, i) => {
          // Finite deck (no wrap): first card sits at the top of the pin, last
          // card releases the scroll to the footer.
          const o = i - active;
          return (
            <div
              key={card.key}
              onClick={() => o !== 0 && onJump(i)}
              className="absolute left-1/2 top-1/2 transition-all duration-[600ms] ease-[cubic-bezier(0.34,1.4,0.5,1)]"
              style={{
                width: CARD_W,
                height: CARD_H,
                cursor: o === 0 ? "default" : "pointer",
                ...cardStyle(variant, o),
              }}
            >
              {o === 0 ? (
                <Link
                  href={card.href}
                  target={card.external ? "_blank" : undefined}
                  rel={card.external ? "noopener noreferrer" : undefined}
                  data-cursor="case-study"
                  onMouseEnter={() => setCursorMode("case-study")}
                  onMouseLeave={() => setCursorMode("default")}
                  style={{ display: "block", height: "100%" }}
                >
                  <ProtoCard card={card} active />
                </Link>
              ) : (
                <ProtoCard card={card} active={false} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================== */
/*  Intro headline (fades on scroll)                              */
/* ============================================================== */

/* ============================================================== */
/*  Page                                                          */
/* ============================================================== */

export default function HomeLab() {
  const variant: VariantId = "pinwheel";
  const [active, setActive] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const n = LAB_CARDS.length;

  // HERO (scroll-controlled): headline + lamp centered at top; as the visitor
  // scrolls it fades and lifts away, revealing the work. No timer, no lock.
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(heroProgress, [0, 0.55], [1, 0]);
  const heroY = useTransform(heroProgress, [0, 1], [0, -120]);

  // PIN-THEN-RELEASE: the snooker + carousel is one tall section whose inner
  // panel is `sticky`. As the page scrolls through the section, scroll
  // progress (0→1) maps to the active card. Reaching the last card lets the
  // pin release so the page scrolls on to the Mahjong footer; scrolling back up
  // past the first card releases to the nav. Card advance == real page scroll.
  const { scrollYProgress } = useScroll({
    target: pinRef,
    offset: ["start start", "end end"],
  });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const idx = Math.round(p * (n - 1));
    setActive(Math.min(n - 1, Math.max(0, idx)));
  });

  // Click a peeking card → smooth-scroll the page to that card's scroll offset.
  const jumpTo = useCallback(
    (index: number) => {
      const el = pinRef.current;
      if (!el) return;
      const scrollable = el.offsetHeight - window.innerHeight;
      const y = el.offsetTop + (index / (n - 1)) * scrollable;
      window.scrollTo({ top: y, behavior: "smooth" });
    },
    [n]
  );

  return (
    <>
      <Nav />

      {/* ------------------------- HERO (top) ------------------------- */}
      <section ref={heroRef} className="relative h-screen overflow-hidden">
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="absolute inset-0 flex items-center justify-center px-6"
        >
          {/* Pendant lamp — anchored at 9vw internally; shift it to hang
              centered (body half-width ≈ 47px) above the text. */}
          <div
            aria-hidden
            className="hidden lg:block absolute top-0 bottom-0"
            style={{ left: "calc(50% - 9vw - 47px)", width: 0 }}
          >
            <HeroPendantLamp />
          </div>

          {/* Capsule + headline, vertically centered (balanced whitespace). */}
          <motion.div
            className="relative max-w-3xl w-full text-center"
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 bg-[rgba(201,120,54,0.08)] py-2 px-4 rounded-full mb-8">
              <span className="pulse-dot" aria-hidden />
              <span className="font-mono uppercase tracking-wide text-[13px] text-ink">
                Open for full-time
              </span>
            </div>
            <HeadlineDrift
              segments={headlineSegments}
              className="font-serif font-normal text-[24px] md:text-[38px] lg:text-[44px] leading-snug md:leading-[1.3] text-ink text-center"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Pin track: tall enough to give each card a slice of scroll. */}
      <div
        ref={pinRef}
        className="relative"
        style={{ height: `${100 + (n - 1) * 70}vh` }}
      >
        <section className="sticky top-0 h-screen flex items-center">
          <div className="w-full max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-[minmax(0,440px)_1fr] gap-8 items-center">
            {/* LEFT — snooker. The scene is designed to fill 100vh; the fixed
                nav eats the top, so scale the whole thing down uniformly (avatar
                + table + cue together) so nothing clips and it sits fully in
                view under the nav. */}
            <div
              className="hidden lg:flex justify-center"
              style={{ transform: "scale(0.8)", transformOrigin: "center center" }}
            >
              <SnookerScene />
            </div>
            {/* RIGHT — carousel, pushed toward the right edge */}
            <div className="flex justify-center lg:justify-end lg:pr-4">
              <Carousel variant={variant} active={active} onJump={jumpTo} />
            </div>
          </div>
        </section>
      </div>

      {/* -------------------- SANDBOX TEASER -------------------- */}
      <section className="px-6 md:px-16 py-20 md:py-28">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-[rgba(201,120,54,0.08)] py-2 px-4 rounded-full mb-5">
                <span className="pulse-dot" aria-hidden />
                <span className="font-mono uppercase tracking-wide text-[13px] text-ink">
                  Sandbox
                </span>
              </div>
              <h2 className="font-serif text-[28px] md:text-[40px] leading-tight text-ink">
                Motion &amp; experiments
              </h2>
            </div>
            <Link
              href="/sandbox"
              className="font-mono text-[13px] uppercase tracking-wide text-[#C97836] hover:text-ink transition-colors whitespace-nowrap pb-2"
            >
              See all →
            </Link>
          </div>

          <SandboxGallery items={SANDBOX_TEASER} />
        </div>
      </section>

      <MahjongFooter />
    </>
  );
}
