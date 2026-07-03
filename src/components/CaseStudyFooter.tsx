"use client";

import WorkCard from "@/components/WorkCard";
import { cards } from "@/components/WorkGrid";

// Source the case-study list from WorkGrid (single source of truth).
// Filter to internal /work/ routes only — external cards (Devpost/Drive)
// and the teaser don't belong in the "More of my Flibbertigibbeting!"
// suggestion grid.
const INTERNAL_CASE_STUDIES = cards.filter((card) =>
  card.href.startsWith("/work/")
);

interface CaseStudyFooterProps {
  /** Route slug of the case study currently being viewed — used to exclude
   *  it from the suggestion grid. Examples: "manus-ai", "conduit-commerce",
   *  "somia-cx". */
  currentSlug: string;
  /** Colour scheme. "clay" (default) = tan bg + white heading, used on the
   *  case-study pages. "beige" = site cream bg + ink heading, used on the art
   *  gallery so it sits seamlessly above the mahjong footer. */
  variant?: "clay" | "beige";
}

// Cap the suggestion grid at 2 cards so it fills the 2-col layout evenly.
// On case-study pages this is a no-op (3 internal − 1 current = 2). On
// /art-gallery (currentSlug="" → excludes nothing → 3 results), the slice
// trims to 2 so the footer renders identically across surfaces.
const SUGGESTION_LIMIT = 2;

export default function CaseStudyFooter({
  currentSlug,
  variant = "clay",
}: CaseStudyFooterProps) {
  // Suggest the other internal case studies (excluding the current one),
  // capped to SUGGESTION_LIMIT for consistent layout.
  const others = INTERNAL_CASE_STUDIES.filter(
    (cs) => cs.href !== `/work/${currentSlug}`
  ).slice(0, SUGGESTION_LIMIT);

  const beige = variant === "beige";

  return (
    <section
      style={{
        backgroundColor: beige ? "#FFF5EF" : "#D4A574",
        paddingTop: 64,
        paddingBottom: 64,
        position: "relative",
        zIndex: 1,
      }}
    >
      <div className="max-w-[1228px] mx-auto px-6">
        {/* Heading */}
        <h2
          style={{
            fontFamily: "var(--font-serif), 'Source Serif Pro', serif",
            fontWeight: 600,
            fontSize: 24,
            color: beige ? "#0D0D0D" : "#FFFFFF",
            marginBottom: 32,
          }}
        >
          More of my Flibbertigibbeting!
        </h2>

        {/* Grid of suggested WorkCards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {others.map(({ key, ...props }) => (
            <WorkCard key={key} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
