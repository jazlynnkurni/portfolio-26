"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CURSOR_MODE_EVENT, type CursorMode } from "./CustomCursor";

type MediaType = "video" | "image";

export type WorkCardProps = {
  href: string;
  external?: boolean;
  numberLabel: string;
  tagline: string;
  tags: string[];
  mediaType: MediaType;
  mediaSrc: string;
  caseStudyName: string;
  /** Scale factor applied to the <video> element to crop baked-in source
   *  letterbox bars off the edges of the media box. Defaults to 1 (no zoom).
   *  Not applied to <img> elements. */
  mediaZoom?: number;
};

function setCursorMode(mode: CursorMode) {
  window.dispatchEvent(
    new CustomEvent(CURSOR_MODE_EVENT, { detail: { mode } })
  );
}

// Warm clay-toned shadows — not pure black, so the card lifts off the cream
// background without bruising it. Kept light: the card is now the same beige
// as the page, so a heavy shadow would read as a smudge under it rather than
// as depth. Both strings share a layer structure so framer-motion can
// interpolate between them smoothly.
const SHADOW_DEFAULT = `0 10px 26px -14px rgba(176, 137, 104, 0.20), 0 2px 8px -4px rgba(176, 137, 104, 0.12)`;
const SHADOW_HOVER = `0 18px 40px -14px rgba(176, 137, 104, 0.28), 0 6px 16px -4px rgba(176, 137, 104, 0.16)`;

export default function WorkCard({
  href,
  external = false,
  numberLabel,
  tagline,
  tags,
  mediaType,
  mediaSrc,
  caseStudyName,
  mediaZoom,
}: WorkCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const onEnter = () => {
    setCursorMode("case-study");
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  };

  const onLeave = () => {
    setCursorMode("default");
    const v = videoRef.current;
    if (v) v.pause();
  };

  // Mobile autoplay: on coarse-pointer / narrow-viewport devices there is no
  // hover, so play the card's video while it's at least 50% in view and
  // pause when it scrolls away. Desktop keeps the hover-driven onEnter/onLeave
  // handlers above and skips this observer entirely.
  // iOS Safari requires `muted` + `playsInline` for inline autoplay — both
  // are already set on the <video> below.
  useEffect(() => {
    if (mediaType !== "video") return;
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    const v = videoRef.current;
    if (!v) return;
    const mql = window.matchMedia("(hover: none), (pointer: coarse)");
    if (!mql.matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        }
      },
      { threshold: [0, 0.5, 1] }
    );
    observer.observe(v);
    return () => observer.disconnect();
  }, [mediaType]);

  const cardInner = (
    <motion.article
      className="relative rounded-3xl h-full"
      data-cursor="case-study"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      initial={{
        scale: 1,
        rotate: 0,
        boxShadow: SHADOW_DEFAULT,
      }}
      whileHover={{
        scale: 1.02,
        rotate: 1.5,
        boxShadow: SHADOW_HOVER,
      }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{
        // Beige rather than an orange fill: the card sits ON the page tone, so
        // only the burnt-orange outline separates it — seamless instead of a
        // block of colour.
        background: "#FFF5EF",
        border: "1.5px solid #C97836",
        // Extra headroom: the label sits ON the top border, so the first
        // child needs to start below where it straddles.
        padding: "30px 24px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        transformOrigin: "center",
        width: "100%",
      }}
    >
      {/* Top row: dot + number label. Positioned ON the top border and given
          the page background, so the rule visibly breaks around it — the
          "notched" treatment, same idea as a fieldset legend. */}
      <div
        style={{
          position: "absolute",
          top: -9,
          left: 20,
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#FFF5EF",
          padding: "0 10px",
          maxWidth: "calc(100% - 40px)",
        }}
      >
        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "#C97836",
            flexShrink: 0,
          }}
        />
        <h2
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: "0.08em",
            color: "#C97836",
            textTransform: "uppercase",
            margin: 0,
            lineHeight: 1,
          }}
        >
          {numberLabel}
        </h2>
      </div>

      {/* Media — fixed 16:9 box. object-contain so portrait or letterboxed
          source media shows in full; any unused space inside the box shows
          burnt orange (matches card bg, reads as intentional). */}
      <div
        className="relative isolate aspect-video rounded-xl overflow-hidden w-full"
        style={{ backgroundColor: "#FFF5EF" }}
      >
        {mediaType === "video" ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            src={mediaSrc}
            muted
            playsInline
            loop
            preload="metadata"
            aria-label={`preview of ${caseStudyName}`}
            style={{
              display: "block",
              backgroundColor: "transparent",
              transform: `scale(${mediaZoom ?? 1})`,
            }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="w-full h-full object-contain"
            src={mediaSrc}
            alt={`preview of ${caseStudyName}`}
            style={{ display: "block" }}
          />
        )}
      </div>

      {/* Tagline — flex-grow keeps tag row anchored to the bottom even when
          taglines wrap to different line counts across cards. */}
      <p
        className="font-medium text-[16px]"
        style={{
          fontFamily: "var(--font-sans), sans-serif",
          lineHeight: 1.3,
          color: "#16100C",
          margin: 0,
          flexGrow: 1,
        }}
      >
        {tagline}
      </p>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {tags.map((tag) => (
          <span
            key={tag}
            className="font-medium text-[14px] rounded-full"
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              color: "#C97836",
              border: "1px solid rgba(201, 120, 54, 0.45)",
              padding: "4px 11px",
              lineHeight: 1.2,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.article>
  );

  const ariaLabel = `Open ${caseStudyName} case study`;
  const wrapperStyle: React.CSSProperties = {
    display: "block",
    height: "100%",
    width: "100%",
  };
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        style={wrapperStyle}
      >
        {cardInner}
      </a>
    );
  }
  return (
    <Link href={href} aria-label={ariaLabel} style={wrapperStyle}>
      {cardInner}
    </Link>
  );
}
