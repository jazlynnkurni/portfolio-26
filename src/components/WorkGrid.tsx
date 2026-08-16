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
    key: "manus",
    href: "/work/manus-ai",
    numberLabel: "MANUS AI (ACQUIRED BY META) - NO. 01",
    tagline: "Designing an AI community platform to drive adoption",
    tags: ["Internship", "Approved & In Dev"],
    mediaType: "video",
    mediaSrc: "/videos/work-manus.mp4",
    caseStudyName: "Manus AI",
  },
  {
    key: "clover",
    // Links to the placeholder page until the case study is written up.
    href: "/work/in-progress?p=Clover",
    numberLabel: "CLOVER - NO. 02",
    tagline: "Designing the HUD interface + shipping the iOS companion app",
    tags: ["Founding Design Engineer", "0 to 1"],
    mediaType: "video",
    mediaSrc: "/videos/work-clover.mp4",
    caseStudyName: "Clover",
  },
  {
    key: "fostr",
    // Goes to the live site rather than a placeholder — the work is shipped.
    href: "https://fostr.page/",
    external: true,
    numberLabel: "FOSTR - NO. 03",
    tagline: "Building the brand, landing site & internal platform from 0 to 1",
    tags: ["Founding Design Engineer", "0 to 1", "Brand + Platform"],
    mediaType: "video",
    mediaSrc: "/videos/work-fostr.mp4",
    caseStudyName: "Fostr",
  },
  {
    key: "olive",
    href: "https://drive.google.com/file/d/15-mX_sIkPU_Ww4R1UueWG10Wv9CQbhEy/view",
    external: true,
    numberLabel: "OLIVE - NO. 04",
    tagline: "Designing an AI-powered carbon tracking app",
    tags: ["Hackathon Winner", "NYU UX Design-a-Thon'26"],
    mediaType: "video",
    mediaSrc: "/videos/work-olive.mp4",
    caseStudyName: "Olive",
    mediaZoom: 1.10,
  },
  {
    key: "second-self",
    href: "https://devpost.com/software/second-self-giwmxh",
    external: true,
    numberLabel: "SECOND SELF - NO. 05",
    tagline: "Building an AI Agent that lives on your own Mac",
    tags: ["Hackathon Winner", "YHacks '26"],
    mediaType: "video",
    mediaSrc: "/videos/second-self.mp4",
    caseStudyName: "Second Self",
  },
  {
    key: "halodoc",
    // Links to the placeholder page until the case study is written up.
    href: "/work/in-progress?p=Halodoc",
    numberLabel: "HALODOC - NO. 06",
    tagline: "Designing onboarding journey for AI Prescription on Mobile",
    tags: ["Internship", "Shipped", "Cut CS tickets 13%"],
    mediaType: "video",
    // Portrait onboarding recording centred on the page beige, matching how
    // the Olive clip is composed (phone at ~25% of frame width).
    mediaSrc: "/videos/work-halodoc.mp4",
    caseStudyName: "Halodoc",
  },
  {
    key: "conduit",
    href: "/work/conduit-commerce",
    numberLabel: "CONDUIT COMMERCE - NO. 07",
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
    numberLabel: "SOMIACX (MUFG BANK) - NO. 08",
    tagline: "Architecting a unified UVP system for 3 financial subsidiaries",
    tags: ["Internship", "0 to 1"],
    mediaType: "image",
    mediaSrc: "/images/work-somiacx.png",
    caseStudyName: "SomiaCX",
  },
];

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
      className="grid grid-cols-1 md:grid-cols-2 items-stretch"
      style={{ gap: 32 }}
    >
      {cards.map(({ key, ...props }) =>
        animateOnScroll ? (
          renderCard(key, <WorkCard {...props} />)
        ) : (
          <WorkCard key={key} {...props} />
        )
      )}
    </div>
  );
}
