"use client";

import WorkCard, { type WorkCardProps } from "@/components/WorkCard";

// Shared data — sourced from src/app/work/page.tsx (homepage Work section)
// Keep this in sync if the homepage cards array ever changes.
const ALL_CASE_STUDIES: Record<string, WorkCardProps & { key: string }> = {
  "manus-ai": {
    key: "manus-ai",
    href: "/work/manus-ai",
    numberLabel: "MANUS AI - NO. 01",
    tagline: "Re-architecting community for an AI agent serving 700K+ users",
    tags: ["Internship", "Shipped"],
    mediaType: "video",
    mediaSrc: "/videos/manus/hero/laptop-mockup.mp4",
    caseStudyName: "Manus AI",
    mediaZoom: 1.08,
  },
  "conduit-commerce": {
    key: "conduit-commerce",
    href: "/work/conduit-commerce",
    numberLabel: "CONDUIT COMMERCE - NO. 02",
    tagline: "Designing & Shipping B2B SaaS website for an AI-feature launch",
    tags: ["Internship", "Shipped"],
    mediaType: "video",
    mediaSrc: "/videos/work-conduit.mp4",
    caseStudyName: "Conduit Commerce",
    mediaZoom: 1.08,
  },
  "somia-cx": {
    key: "somia-cx",
    href: "/work/somia-cx",
    numberLabel: "SOMIACX (MUFG BANK) - NO. 03",
    tagline: "Architecting a unified UVP system for 3 financial subsidiaries",
    tags: ["Internship", "0 to 1"],
    mediaType: "image",
    mediaSrc: "/images/work-somiacx.png",
    caseStudyName: "SomiaCX",
  },
};

type Slug = keyof typeof ALL_CASE_STUDIES;

interface CaseStudyFooterProps {
  currentSlug: Slug;
}

export default function CaseStudyFooter({ currentSlug }: CaseStudyFooterProps) {
  // Get the other 2 case studies (excluding the current one)
  const others = Object.values(ALL_CASE_STUDIES).filter(
    (cs) => cs.key !== currentSlug
  );

  return (
    <section
      style={{
        backgroundColor: "#D4A574",
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
            color: "#FFFFFF",
            marginBottom: 32,
          }}
        >
          More of my Flibbertigibbeting!
        </h2>

        {/* 2-column grid of suggested WorkCards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {others.map(({ key, ...props }) => (
            <WorkCard key={key} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
