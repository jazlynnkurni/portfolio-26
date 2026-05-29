"use client";

/**
 * WorkGrid
 * --------
 * Single source of truth for the work cards array + 2-column layout.
 * Rendered by:
 *   - src/app/work/page.tsx                   (work index, no scroll reveal)
 *   - src/app/page.tsx                        (homepage Work section, scroll reveal)
 * The cards data is also imported by CaseStudyFooter to suggest other
 * internal case studies.
 *
 * Editing card data: change it here, in this file, in one place.
 */

import { motion } from "framer-motion";
import WorkCard, { type WorkCardProps } from "@/components/WorkCard";

export type WorkGridCard = WorkCardProps & { key: string };

export const cards: WorkGridCard[] = [
  {
    key: "second-self",
    href: "https://devpost.com/software/second-self-giwmxh",
    external: true,
    numberLabel: "SECOND SELF - NO. 01",
    tagline: "Building an AI Agent that lives on your own Mac",
    tags: ["Hackathon Winner", "YHacks '26"],
    mediaType: "video",
    mediaSrc: "/videos/second-self.mp4",
    caseStudyName: "Second Self",
  },
  {
    key: "manus",
    href: "/work/manus-ai",
    numberLabel: "MANUS AI (ACQUIRED BY META) - NO. 02",
    tagline: "Designing an AI community platform to drive adoption",
    tags: ["Internship", "Approved & In Dev"],
    mediaType: "video",
    mediaSrc: "/videos/work-manus.mp4",
    caseStudyName: "Manus AI",
  },
  {
    key: "conduit",
    href: "/work/conduit-commerce",
    numberLabel: "CONDUIT COMMERCE - NO. 03",
    tagline: "Designing & Shipping B2B SaaS website for an AI-feature launch",
    tags: ["Internship", "Shipped"],
    mediaType: "video",
    mediaSrc: "/videos/work-conduit.mp4",
    caseStudyName: "Conduit Commerce",
    mediaZoom: 1.08,
  },
  {
    key: "somia",
    href: "/work/somia-cx",
    numberLabel: "SOMIACX (MUFG BANK) - NO. 04",
    tagline: "Architecting a unified UVP system for 3 financial subsidiaries",
    tags: ["Internship", "0 to 1"],
    mediaType: "image",
    mediaSrc: "/images/work-somiacx.png",
    caseStudyName: "SomiaCX",
  },
  {
    key: "olive",
    href: "https://drive.google.com/file/d/15-mX_sIkPU_Ww4R1UueWG10Wv9CQbhEy/view",
    external: true,
    numberLabel: "OLIVE - NO. 05",
    tagline: "Designing an AI-powered carbon tracking app",
    tags: ["Hackathon Winner", "NYU UX Design-a-Thon'26"],
    mediaType: "video",
    mediaSrc: "/videos/work-olive.mp4",
    caseStudyName: "Olive",
    mediaZoom: 1.10,
  },
];

/* ------------------------------------------------------------------ */
/*  TeaserCard — non-interactive 6th card (SUMMER 2026). Mirrors the   */
/*  WorkCard visual frame but has no link, no hover anim, no media,    */
/*  no tags row, and no data-cursor attribute.                         */
/* ------------------------------------------------------------------ */
function TeaserCard() {
  return (
    <article
      className="rounded-3xl h-full"
      style={{
        background:
          "linear-gradient(180deg, #D08440 0%, #C97836 60%, #BC6E2E 100%)",
        boxShadow:
          "0 12px 32px -8px rgba(176, 137, 104, 0.25), 0 4px 12px -2px rgba(176, 137, 104, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.15), inset 0 -2px 4px rgba(0, 0, 0, 0.08)",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        width: "100%",
      }}
    >
      {/* Top row: dot + number label */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          aria-hidden
          className="shadow-[inset_0_2px_3px_rgba(0,0,0,0.35)]"
          style={{
            display: "inline-block",
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: "#FFF5EF",
            flexShrink: 0,
          }}
        />
        <h2
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: "0.08em",
            color: "#FFF5EF",
            textTransform: "uppercase",
            margin: 0,
            lineHeight: 1,
          }}
        >
          SUMMER 2026 - NO. 06
        </h2>
      </div>

      {/* Empty media box — cream panel with "incoming..." placeholder */}
      <div
        className="relative isolate aspect-video rounded-xl overflow-hidden w-full"
        style={{
          backgroundColor: "#FFF5EF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          aria-hidden
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 14,
            letterSpacing: "0.08em",
            color: "rgba(58, 42, 32, 0.5)",
          }}
        >
          incoming...
        </span>
      </div>

      {/* Tagline */}
      <p
        className="font-medium text-[16px]"
        style={{
          fontFamily: "var(--font-sans), sans-serif",
          lineHeight: 1.3,
          color: "#FFF5EF",
          margin: 0,
          flexGrow: 1,
        }}
      >
        Summer 2026, incoming...
      </p>
      {/* No tags row — intentionally omitted */}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  WorkGrid                                                           */
/* ------------------------------------------------------------------ */

interface WorkGridProps {
  /** When true, each card fades up as it scrolls into view. Used on the homepage. */
  animateOnScroll?: boolean;
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

// Matches the homepage hero's existing easing (page.tsx fadeUp).
const FADE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function WorkGrid({ animateOnScroll = false }: WorkGridProps = {}) {
  const renderCard = (key: string, child: React.ReactNode) => {
    if (!animateOnScroll) return child;
    return (
      <motion.div
        key={key}
        className="h-full"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUpVariants}
        transition={{ duration: 0.5, ease: FADE_EASE }}
      >
        {child}
      </motion.div>
    );
  };

  return (
    <div
      className="grid grid-cols-2 items-stretch"
      style={{ gap: 32 }}
    >
      {cards.map(({ key, ...props }) =>
        animateOnScroll ? (
          renderCard(key, <WorkCard {...props} />)
        ) : (
          <WorkCard key={key} {...props} />
        )
      )}
      {animateOnScroll ? renderCard("teaser", <TeaserCard />) : <TeaserCard />}
    </div>
  );
}
