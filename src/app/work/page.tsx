"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import WorkCard, { type WorkCardProps } from "@/components/WorkCard";

const cards: (WorkCardProps & { key: string })[] = [
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
    key: "conduit",
    href: "/work/conduit-commerce",
    numberLabel: "CONDUIT COMMERCE - NO. 02",
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
    numberLabel: "SOMIACX (MUFG BANK) - NO. 03",
    tagline: "Architecting a unified UVP system for 3 financial subsidiaries",
    tags: ["Internship", "0 to 1"],
    mediaType: "image",
    mediaSrc: "/images/work-somiacx.png",
    caseStudyName: "SomiaCX",
  },
  {
    key: "olive",
    href: "https://drive.google.com/file/u/1/d/15-mX_sIkPU_Ww4R1UueWG10Wv9CQbhEy/view",
    external: true,
    numberLabel: "OLIVE - NO. 04",
    tagline: "Designing an AI-powered carbon tracking app",
    tags: ["Hackathon Winner", "NYU UX Design-a-Thon'26"],
    mediaType: "video",
    mediaSrc: "/videos/work-olive.mp4",
    caseStudyName: "Olive",
    mediaZoom: 1.10,
  },
];

export default function WorkIndexPage() {
  return (
    <>
      <Nav />
      <main
        className="flex-1 px-6 md:px-16 pt-12 md:pt-16 pb-16"
        style={{ backgroundColor: "#FFF5EF" }}
      >
        <div
          className="mx-auto grid grid-cols-2 items-stretch"
          style={{ maxWidth: 1200, gap: 32 }}
        >
          {cards.map(({ key, ...props }) => (
            <WorkCard key={key} {...props} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
