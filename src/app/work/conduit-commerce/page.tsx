"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/components/Footer";
import CaseStudyFooter from "@/components/CaseStudyFooter";
import Lightbox from "@/components/Lightbox";
import StackedDeck from "@/components/StackedDeck";

const COLORS = {
  cream: "#FFF5EF",
  burntOrange: "#C97836",
  inkSoft: "#3A3A3A",
};

const FONTS = {
  serif: "var(--font-serif), 'Source Serif Pro', serif",
  sans: "var(--font-sans), 'Helvetica Neue', sans-serif",
};

function FlowStep({
  caption,
  children,
  className = "",
}: {
  caption: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <p
        style={{
          fontFamily: "'Helvetica Neue', sans-serif",
          fontSize: "16px",
          fontWeight: 500,
          color: "#1E1E1E",
          lineHeight: 1.4,
          maxWidth: 180,
          margin: 0,
          minHeight: 56,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        {caption}
      </p>
      {children}
    </div>
  );
}

function ClickToEnlargeCaption() {
  return (
    <div className="flex items-center gap-1.5 mt-2 cursor-pointer">
      <Image
        src="/images/manus/flow-icons/Pointer.svg"
        alt=""
        width={12}
        height={12}
        aria-hidden
      />
      <span
        style={{
          fontFamily: FONTS.sans,
          fontSize: 11,
          color: COLORS.inkSoft,
          fontStyle: "italic",
        }}
      >
        Click to enlarge
      </span>
    </div>
  );
}

const CASE_STUDY_NAV = [
  { label: "Overview", id: "overview" },
  { label: "Research", id: "research" },
  { label: "Development", id: "development" },
  { label: "Testing", id: "testing" },
  { label: "Solution", id: "solution" },
];

function CaseStudyNav() {
  const [active, setActive] = useState("overview");

  useEffect(() => {
    const ids = CASE_STUDY_NAV.map((item) => item.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      {
        rootMargin: "-30% 0px -50% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleClick =
    (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setActive(id);
      }
    };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-40 w-full flex justify-between items-center px-6 pt-5 pb-3"
      style={{
        backgroundColor: "transparent",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      aria-label="Manus case study navigation"
    >
      <Link
        href="/"
        aria-label="Jazlynn Kurniandra — Home"
        className="block transition-opacity duration-200 hover:opacity-80"
      >
        <Image
          src="/images/logo.png"
          alt="Jazlynn Kurniandra"
          width={56}
          height={56}
          priority
          className="h-14 w-auto"
        />
      </Link>

      <div className="hidden md:flex items-center gap-6 bg-white rounded-full py-2.5 px-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        {CASE_STUDY_NAV.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={handleClick(item.id)}
            className="nav-link"
            style={{
              color: active === item.id ? COLORS.burntOrange : undefined,
            }}
          >
            {item.label}
          </a>
        ))}
      </div>

      <div className="hidden md:block w-12" aria-hidden />
    </motion.nav>
  );
}

export default function ManusAiPage() {
  const [openVideo, setOpenVideo] = useState<string | null>(null);
  const [activeCaption, setActiveCaption] = useState(0);
  const [thanksHovered, setThanksHovered] = useState(false);

  return (
    <>
      <main className="flex-1">
        <CaseStudyNav />

        {/* OVERVIEW wrapper — covers Hero + At a Glance + Results, all on cream */}
        <div id="overview">
          {/* ============================================================ */}
          {/* SECTION 1: HERO (cream bg) — id="hero" */}
          {/* ============================================================ */}
          <section
            id="hero"
            className="w-full"
            style={{ backgroundColor: COLORS.cream, scrollMarginTop: 100 }}
          >
            <div className="mx-auto max-w-[1246px] px-6 md:px-12 lg:px-24 pt-12 md:pt-16 pb-10 md:pb-12">
              <div className="flex flex-col items-center gap-[30px]">
                {/* Logo + headline column (804 wide, centered, text-center) */}
                <div className="w-full max-w-[804px] mx-auto flex flex-col items-center gap-[3px]">
                  <Image
                    src="/images/conduit/hero/conduit-logo.svg"
                    alt="Conduit Commerce"
                    width={194}
                    height={60}
                    className="w-[194px] h-[60px]"
                    priority
                  />
                  <h1
                    className="w-full text-[30px] m-0 text-center"
                    style={{
                      fontFamily: FONTS.serif,
                      fontWeight: 600,
                      color: "#000000",
                      lineHeight: "normal",
                    }}
                  >
                    Designing & Shipping B2B SaaS website for an AI-feature launch
                  </h1>
                </div>

                {/* Laptop mockup 874×536 — centered */}
                <div className="w-full max-w-[874px] mx-auto rounded-[15px] overflow-hidden">
                  <video
                    src="/videos/conduit/hero/hero-laptop-mockup.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-auto block"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Horizontal rule — between hero and At a Glance (FIX 2), on cream */}
          <div
            className="mx-auto h-px"
            style={{ maxWidth: 1228, backgroundColor: "rgba(0, 0, 0, 0.4)" }}
          />

          {/* ============================================================ */}
          {/* SECTION 2: AT A GLANCE (cream bg) — id="at-a-glance" */}
          {/* ============================================================ */}
          <section
            id="at-a-glance"
            className="w-full"
            style={{ backgroundColor: COLORS.cream, scrollMarginTop: 100 }}
          >
            <div className="mx-auto max-w-[1228px] px-6 pt-[22px] pb-0">
              <div className="w-full">
              {/* Row 1: 12-col grid — heading-block spans 6, stats two col-span-3 */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-x-6">
                {/* LEFT: heading + body */}
                <div className="md:col-span-6">
                  <h2
                    style={{
                      fontFamily: FONTS.serif,
                      fontSize: "24px",
                      fontWeight: 600,
                      lineHeight: "1.3",
                      color: "#1E1E1E",
                      margin: 0,
                      maxWidth: "600px",
                    }}
                  >
                    At a Glance
                  </h2>
                  <p
                    className="text-[18px] mt-[11px] m-0 md:w-[502px]"
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontWeight: 500,
                      color: "#1E1E1E",
                      lineHeight: "1.5",
                    }}
                  >
                    As Product Design Lead, I led a team of 3 designers to
                    support Conduit Commerce&rsquo;s Copilot launch. Conduit
                    is a fintech backed by Dragonfly and Altos Ventures, and
                    I worked directly with the founder, recognized on Forbes
                    30 Under 30, to align the design with the product&rsquo;s
                    technical ambition and the practical needs of their B2B
                    customer base.
                  </p>
                  <p
                    className="text-[18px] mt-[11px] m-0 md:w-[502px]"
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontWeight: 500,
                      color: "#1E1E1E",
                      lineHeight: "1.5",
                    }}
                  >
                    Conduit Copilot is an AI that streamlines the entire
                    buying and selling process for wholesale and distribution
                    businesses, an industry that still ran on spreadsheets
                    and phone calls and was largely unfamiliar with AI
                    adoption. The product was a genuine leap forward. Our
                    job was to make sure their branding and website said so.
                  </p>
                </div>

                {/* My Role — spans cols 7-9 */}
                <div className="md:col-span-3">
                    <div className="flex items-start gap-[13px]">
                      <Image
                        src="/images/manus/at-a-glance/myrole.svg"
                        alt=""
                        width={24}
                        height={24}
                        aria-hidden
                        className="w-6 h-6 shrink-0"
                      />
                      <div className="flex flex-col gap-[11px] w-[148px]">
                        <p
                          className="text-[18px] m-0"
                          style={{
                            fontFamily: FONTS.sans,
                            fontWeight: 500,
                            color: "#000000",
                            lineHeight: "normal",
                          }}
                        >
                          My Role
                        </p>
                        <p
                          className="text-[18px] m-0"
                          style={{
                            fontFamily: FONTS.sans,
                            fontWeight: 500,
                            color: "#000000",
                            lineHeight: "normal",
                          }}
                        >
                          Leading product design, company branding, UX
                          strategy, design system creation, UX copywriting,
                          and usability testing.
                        </p>
                      </div>
                    </div>
                  </div>

                {/* Duration + team — spans cols 10-12 */}
                <div className="md:col-span-3 flex flex-col gap-[11px]">
                    <div className="flex items-start gap-[13px]">
                      <Image
                        src="/images/manus/at-a-glance/time.svg"
                        alt=""
                        width={24}
                        height={24}
                        aria-hidden
                        className="w-6 h-6 shrink-0"
                      />
                      <p
                        className="text-[18px] m-0"
                        style={{
                          fontFamily: FONTS.sans,
                          fontWeight: 500,
                          color: "#000000",
                          lineHeight: "normal",
                        }}
                      >
                        3 months
                      </p>
                    </div>
                    <div className="flex items-start gap-[13px]">
                      <Image
                        src="/images/manus/at-a-glance/team-members.svg"
                        alt=""
                        width={24}
                        height={24}
                        aria-hidden
                        className="w-6 h-6 shrink-0"
                      />
                      <div
                        className="text-[18px]"
                        style={{
                          fontFamily: FONTS.sans,
                          fontWeight: 500,
                          color: "#000000",
                          lineHeight: "normal",
                        }}
                      >
                        <p className="m-0">2 UX Designers (me!)</p>
                        <p className="m-0">1 UX Researcher</p>
                        <p className="m-0">1 Marketing Designer</p>
                        <p className="m-0">1 Founder</p>
                        <p className="m-0">1 PM</p>
                      </div>
                    </div>
                  </div>
                {/* /at-a-glance grid row */}
              </div>

              {/* Results — sibling of 3-col row, left-aligned, full container width */}
              <div className="mt-10">
                <div className="flex items-center gap-[5px]">
                  <Image
                    src="/images/manus/at-a-glance/results.svg"
                    alt=""
                    width={24}
                    height={24}
                    aria-hidden
                    className="w-6 h-6 shrink-0"
                  />
                  <p
                    className="text-[18px] m-0"
                    style={{
                      fontFamily: FONTS.sans,
                      fontWeight: 500,
                      color: "#000000",
                      lineHeight: "normal",
                    }}
                  >
                    Results
                  </p>
                </div>
              </div>

            </div>
          </div>
          </section>

          {/* Results pills — cream/white gradient strip, hard-split at 50% */}
          <div
            className="w-full"
            style={{
              background:
                "linear-gradient(to bottom, #FFF5EF 0%, #FFF5EF 50%, #FFFFFF 50%, #FFFFFF 100%)",
            }}
          >
            <div className="mx-auto max-w-[1228px] px-6 py-6">
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 flex flex-wrap gap-4">
                <span
                  className="bg-[#C97836] rounded-[15px] text-[18px] whitespace-nowrap"
                  style={{
                    color: "#FFFFFF",
                    fontFamily: FONTS.sans,
                    fontWeight: 500,
                    padding: "12px 15px",
                  }}
                >
                  ~40% reduction in bounce rate
                </span>
                <span
                  className="bg-[#C97836] rounded-[15px] text-[18px] whitespace-nowrap"
                  style={{
                    color: "#FFFFFF",
                    fontFamily: FONTS.sans,
                    fontWeight: 500,
                    padding: "12px 15px",
                  }}
                >
                  ~28% increase in demo requests
                </span>
                <span
                  className="bg-[#C97836] rounded-[15px] text-[18px] whitespace-nowrap"
                  style={{
                    color: "#FFFFFF",
                    fontFamily: FONTS.sans,
                    fontWeight: 500,
                    padding: "12px 15px",
                  }}
                >
                  Shipped & live
                </span>
                </div>
              </div>
            </div>
          </div>

        </div>
        {/* /OVERVIEW wrapper */}

        {/* ============================================================ */}
        {/* SECTION 3: PROBLEM (white bg) — id="problem" */}
        {/* ============================================================ */}
        <section
          id="problem"
          className="w-full"
          style={{ backgroundColor: "#FFFFFF", scrollMarginTop: 100 }}
        >
          <div className="mx-auto max-w-[1228px] px-6 py-[80px]">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

              {/* LEFT COLUMN — eyebrow + headline, spans cols 1-4 */}
              <div className="md:col-span-4">
                <p
                  className="uppercase"
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: "14px",
                    fontWeight: 500,
                    letterSpacing: "0.05em",
                    color: "#1E1E1E",
                    marginBottom: "12px",
                  }}
                >
                  Problem
                </p>
                <h2
                  style={{
                    fontFamily: FONTS.serif,
                    fontSize: "24px",
                    fontWeight: 600,
                    lineHeight: "1.3",
                    color: "#1E1E1E",
                    margin: 0,
                    maxWidth: "600px",
                  }}
                >
                  The Website Was Working Against the Product.
                </h2>
              </div>

              {/* RIGHT COLUMN — 2 body paragraphs, starts at col 6, spans cols 6-12 */}
              <div className="md:col-span-7 md:col-start-6">
                <p
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontWeight: 400,
                    fontSize: "16px",
                    lineHeight: "1.5",
                    color: "#1E1E1E",
                    margin: 0,
                  }}
                >
                  Conduit Commerce is a B2B SaaS and CaaS platform built for a specific, underserved audience: the people who buy and sell physical goods in wholesale and distribution. Think carpet sellers, materials buyers, regional distributors. Their product suite spans four pillars: Copilot, Ops, Wholesale, and Dropship.
                </p>
                <p
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontWeight: 400,
                    fontSize: "16px",
                    lineHeight: "1.5",
                    color: "#1E1E1E",
                    marginTop: "20px",
                    marginBottom: 0,
                  }}
                >
                  Conduit was looking to expand toward more tech-savvy, modern clients without losing their core base, Midwest wholesale buyers. It&rsquo;s a challenge of acquisition and retention at once, and it all comes down to how the brand, design, and copy position the product. Especially with their newly launched Copilot.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Placeholder anchors for future sections (scroll-spy + smooth-scroll targets) */}

        {/* ============================================================ */}
        {/* SECTION 4: SOLUTION PREVIEW FLOW (white bg) — id="solution-preview" */}
        {/* ============================================================ */}
        <section
          id="solution-preview"
          className="w-full"
          style={{ backgroundColor: "#FFFFFF", scrollMarginTop: 100 }}
        >
          <div className="mx-auto max-w-[1228px] px-6 py-[80px]">
            <p
              style={{
                fontFamily: "'Helvetica Neue', sans-serif",
                fontSize: "16px",
                fontWeight: 500,
                fontStyle: "normal",
                color: "#1E1E1E",
                margin: 0,
                marginBottom: "32px",
              }}
            >
              Solution Preview →
            </p>

            <div
              className="rounded-3xl"
              style={{
                backgroundColor: "#FFF5EF",
                padding: "60px 40px",
              }}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <FlowStep caption="User lands on website">
                  <div className="w-[200px] h-[200px] flex items-center justify-center">
                    <Image
                      src="/images/manus/flow-icons/laptop.svg"
                      alt=""
                      width={120}
                      height={120}
                      aria-hidden
                    />
                  </div>
                </FlowStep>

                <div className="hidden md:flex items-center justify-center" style={{ flexShrink: 0 }}>
                  <Image src="/images/manus/flow-icons/flow-arrow.svg" alt="" width={40} height={20} aria-hidden />
                </div>

<FlowStep caption="Explores Copilot">
                  <motion.div
                    layoutId="solution-preview-video-1"
                    onClick={() =>
                      setOpenVideo("/videos/conduit/solution-4-instructional-animations.mp4")
                    }
                    className="transition-transform duration-300 ease-out hover:scale-[1.05] cursor-pointer"
                    style={{
                      width: "250px",
                      height: "200px",
                      maxWidth: "100%",
                      border: "1px solid #C97836",
                      borderRadius: "16px",
                      overflow: "hidden",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                    }}
                  >
                    <video
                      src="/videos/conduit/solution-4-instructional-animations.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover block"
                      style={{ transform: "scale(1.15)", transformOrigin: "center center" }}
                    />
                  </motion.div>
                  <ClickToEnlargeCaption />
                </FlowStep>

                <div className="hidden md:flex items-center justify-center" style={{ flexShrink: 0 }}>
                  <Image src="/images/manus/flow-icons/flow-arrow.svg" alt="" width={40} height={20} aria-hidden />
                </div>

<FlowStep caption="Understands Conduit’s Core">
                  <motion.div
                    layoutId="solution-preview-video-2"
                    onClick={() =>
                      setOpenVideo("/videos/conduit/solution-1-dashboard.mp4")
                    }
                    className="transition-transform duration-300 ease-out hover:scale-[1.05] cursor-pointer"
                    style={{
                      width: "250px",
                      height: "200px",
                      maxWidth: "100%",
                      border: "1px solid #C97836",
                      borderRadius: "16px",
                      overflow: "hidden",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                    }}
                  >
                    <video
                      src="/videos/conduit/solution-1-dashboard.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover block"
                      style={{ transform: "scale(1.15)", transformOrigin: "center center" }}
                    />
                  </motion.div>
                  <ClickToEnlargeCaption />
                </FlowStep>

                <div className="hidden md:flex items-center justify-center" style={{ flexShrink: 0 }}>
                  <Image src="/images/manus/flow-icons/flow-arrow.svg" alt="" width={40} height={20} aria-hidden />
                </div>

<FlowStep caption="Books a Demo">
                  <div className="w-[200px] h-[200px] flex items-center justify-center">
                    <Image
                      src="/images/manus/flow-icons/people.svg"
                      alt=""
                      width={120}
                      height={120}
                      aria-hidden
                    />
                  </div>
                </FlowStep>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 5: INITIAL PIVOT (white bg) — id="initial-pivot" */}
        {/* ============================================================ */}
        <section
          id="initial-pivot"
          className="w-full"
          style={{ backgroundColor: "#FFFFFF", scrollMarginTop: 100 }}
        >
          <div className="mx-auto max-w-[1228px] px-6 py-[80px]">

            {/* SECTION HEADER — Eyebrow + Main Heading */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-[80px]">
              <div className="md:col-span-12">
                <p
                  className="uppercase"
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: "14px",
                    fontWeight: 500,
                    letterSpacing: "0.05em",
                    color: "#1E1E1E",
                    marginBottom: "12px",
                  }}
                >
                  Initial Pivot
                </p>
                <h2
                  style={{
                    fontFamily: FONTS.serif,
                    fontSize: "24px",
                    fontWeight: 600,
                    lineHeight: "1.3",
                    color: "#1E1E1E",
                    margin: 0,
                    maxWidth: "600px",
                  }}
                >
                  The First Design Looked Great. Users Thought We Were Selling Hiking Gear.
                </h2>
              </div>
            </div>

            {/* ROW 1 — Hackathon video + Initial framing */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-[80px]">

              {/* LoFi sketches grid — cols 1-5 */}
              <div className="md:col-span-5">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div
                    style={{
                      borderRadius: 16,
                      overflow: "hidden",
                      boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
                      lineHeight: 0,
                      fontSize: 0,
                    }}
                  >
                    <Image
                      src="/images/conduit/initial-pivot/lofi-sketch-1.jpg"
                      alt="LoFi paper sketch of initial Conduit landing page IA"
                      width={600}
                      height={750}
                      style={{
                        width: "100%",
                        height: "auto",
                        verticalAlign: "top",
                        display: "block",
                        transform: "scale(1.08)",
                        transformOrigin: "center",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      borderRadius: 16,
                      overflow: "hidden",
                      boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
                      lineHeight: 0,
                      fontSize: 0,
                    }}
                  >
                    <Image
                      src="/images/conduit/initial-pivot/lofi-sketch-2.jpg"
                      alt="LoFi paper sketch of second Conduit landing page IA variant"
                      width={600}
                      height={750}
                      style={{
                        width: "100%",
                        height: "auto",
                        verticalAlign: "top",
                        display: "block",
                        transform: "scale(1.08)",
                        transformOrigin: "center",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Text — cols 8-12 */}
              <div className="md:col-span-5 md:col-start-8">
                <h3
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#1E1E1E",
                    margin: 0,
                    marginBottom: "16px",
                  }}
                >
                  LoFi exploration →
                </h3>
                <p
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: "16px",
                    fontWeight: 400,
                    lineHeight: "1.5",
                    color: "#1E1E1E",
                    margin: 0,
                  }}
                >
                  To rapid LoFi prototype, I split my team into 2 designers each team and produced 2 prototypes for our IA architecture. Then we compared and contrast and saw what we could do better from each other. I did this so we both could come up with original ideas. Instead of having the entire team think of one basis, I wanted everyone to come up with different ones first. Then we presented it to Conduit&rsquo;s PM and then we pushed it to Claude.
                </p>
              </div>

            </div>

            {/* ROW 2 — IA Systems exploration video */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-[80px]">

              {/* Video — cols 1-5 */}
              <div className="md:col-span-5">
                <div
                  className="transition-transform duration-300 ease-out hover:scale-[1.02] cursor-pointer"
                  style={{
                    border: "1px solid #C97836",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                  }}
                >
                  <video
                    src="/videos/conduit/initial-pivot-ia-systems.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="block w-full h-auto"
                  />
                </div>
              </div>

              {/* Text — cols 8-12 */}
              <div className="md:col-span-5 md:col-start-8">
                <h3
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#1E1E1E",
                    margin: 0,
                    marginBottom: "16px",
                  }}
                >
                  Information Architecture Systems exploration →
                </h3>
                <p
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: "16px",
                    fontWeight: 400,
                    lineHeight: "1.5",
                    color: "#1E1E1E",
                    margin: 0,
                  }}
                >
                  I used Claude to expedite the IA exploration and system-level thinking in this phase for quick usability feedback.
                </p>
              </div>

            </div>

            {/* ROW 3 — Following trends (Japanese woodblock visual direction) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

              {/* Video — cols 1-5 */}
              <div className="md:col-span-5">
                <div
                  className="transition-transform duration-300 ease-out hover:scale-[1.02] cursor-pointer"
                  style={{
                    border: "1px solid #C97836",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                  }}
                >
                  <video
                    src="/images/conduit/initial-pivot/following-trends-japanese.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="block w-full h-auto"
                  />
                </div>
              </div>

              {/* Text — cols 8-12 */}
              <div className="md:col-span-5 md:col-start-8">
                <h3
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#1E1E1E",
                    margin: 0,
                    marginBottom: "16px",
                  }}
                >
                  Following trends →
                </h3>
                <p
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: "16px",
                    fontWeight: 400,
                    lineHeight: "1.5",
                    color: "#1E1E1E",
                    margin: 0,
                  }}
                >
                  After getting feedback used Framer to prototype the visual direction. The first design round drew inspiration from a design trend. Ukiyo-e Japanese woodblock prints, a nature-forward visual language with texture, warmth, and mountain landscapes. It was distinctive. Intentional. And it communicated absolutely nothing about what Conduit Commerce did for a wholesale distributor.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 5: RESEARCH (white bg) — id="research" */}
        {/* ============================================================ */}
        <section
          id="research"
          className="w-full"
          style={{ backgroundColor: "#FFFFFF", scrollMarginTop: 100 }}
        >
          <div className="mx-auto max-w-[1228px] px-6 py-[80px]">

            {/* SECTION HEADER — Eyebrow + Main Heading */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-[80px]">
              <div className="md:col-span-12">
                <p
                  className="uppercase"
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: "14px",
                    fontWeight: 500,
                    letterSpacing: "0.05em",
                    color: "#1E1E1E",
                    marginBottom: "12px",
                  }}
                >
                  Research
                </p>
                <h2
                  style={{
                    fontFamily: FONTS.serif,
                    fontSize: "24px",
                    fontWeight: 600,
                    lineHeight: "1.3",
                    color: "#1E1E1E",
                    margin: 0,
                    maxWidth: "600px",
                  }}
                >
                  Style Over Function Was Losing Our Users
                </h2>
              </div>
            </div>

            {/* CONTENT ROW — StackedDeck (left) + Findings (right) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

              {/* LEFT — StackedDeck spans cols 1-6 */}
              <div className="md:col-span-6 flex flex-col items-center">
                <StackedDeck
                  cardWidth={300}
                  cardHeight={340}
                  cards={[
                    <div
                      key="quote-1"
                      className="w-full h-full rounded-2xl flex flex-col justify-between"
                      style={{
                        backgroundColor: "#FFF5EF",
                        padding: "32px 28px",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
                        border: "1px solid rgba(201, 120, 54, 0.15)",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "'Helvetica Neue', sans-serif",
                          fontSize: "16px",
                          fontWeight: 400,
                          lineHeight: "1.5",
                          color: "#1E1E1E",
                          margin: 0,
                        }}
                      >
                        &ldquo;Sometimes, the website <u>wouldn&apos;t even load for me.</u> I think it has too much things going on there. Usually, I just prefer contacting their customer service immediately.&rdquo;
                      </p>
                      <div className="flex items-center gap-2 mt-4">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#C97836"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" />
                        </svg>
                        <span
                          style={{
                            fontFamily: "'Helvetica Neue', sans-serif",
                            fontSize: "13px",
                            fontWeight: 500,
                            fontStyle: "italic",
                            color: "#C97836",
                          }}
                        >
                          Conduit User Interviewee
                        </span>
                      </div>
                    </div>,
                    <div
                      key="quote-2"
                      className="w-full h-full rounded-2xl flex flex-col justify-between"
                      style={{
                        backgroundColor: "#FFF5EF",
                        padding: "32px 28px",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
                        border: "1px solid rgba(201, 120, 54, 0.15)",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "'Helvetica Neue', sans-serif",
                          fontSize: "16px",
                          fontWeight: 400,
                          lineHeight: "1.5",
                          color: "#1E1E1E",
                          margin: 0,
                        }}
                      >
                        &ldquo;I went straight to Copilot but I still don&apos;t know how it connects to Ops or Wholesale. <u>Is this one platform or separate tools?</u>&rdquo;
                      </p>
                      <div className="flex items-center gap-2 mt-4">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#C97836"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" />
                        </svg>
                        <span
                          style={{
                            fontFamily: "'Helvetica Neue', sans-serif",
                            fontSize: "13px",
                            fontWeight: 500,
                            fontStyle: "italic",
                            color: "#C97836",
                          }}
                        >
                          Potential User Interviewee
                        </span>
                      </div>
                    </div>,
                    <div
                      key="quote-3"
                      className="w-full h-full rounded-2xl flex flex-col justify-between"
                      style={{
                        backgroundColor: "#FFF5EF",
                        padding: "32px 28px",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
                        border: "1px solid rgba(201, 120, 54, 0.15)",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "'Helvetica Neue', sans-serif",
                          fontSize: "16px",
                          fontWeight: 400,
                          lineHeight: "1.5",
                          color: "#1E1E1E",
                          margin: 0,
                        }}
                      >
                        &ldquo;I get that it&apos;s AI for suppliers and retailers, but what does it actually do? &lsquo;Proactive outreach&rsquo; <u>doesn&apos;t tell me anything.</u>&rdquo;
                      </p>
                      <div className="flex items-center gap-2 mt-4">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#C97836"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" />
                        </svg>
                        <span
                          style={{
                            fontFamily: "'Helvetica Neue', sans-serif",
                            fontSize: "13px",
                            fontWeight: 500,
                            fontStyle: "italic",
                            color: "#C97836",
                          }}
                        >
                          Conduit User Interviewee
                        </span>
                      </div>
                    </div>,
                  ]}
                />

                {/* Drag hint */}
                <p
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: "13px",
                    fontWeight: 400,
                    fontStyle: "italic",
                    color: "#1E1E1E",
                    opacity: 0.5,
                    marginTop: "16px",
                    textAlign: "center",
                  }}
                >
                  Drag to cycle through quotes
                </p>
              </div>

              {/* RIGHT — Findings, cols 8-12 */}
              <div className="md:col-span-5 md:col-start-8">
                <h3
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#1E1E1E",
                    margin: 0,
                    marginBottom: "24px",
                  }}
                >
                  User interviews (11) and secondary research →
                </h3>

                {/* Finding 1 — clock */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="shrink-0 mt-1">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#C97836"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <p
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: "16px",
                      fontWeight: 400,
                      lineHeight: "1.5",
                      color: "#1E1E1E",
                      margin: 0,
                    }}
                  >
                    4 out of 7 current users reported the site failed to load entirely on slower connections, before they even saw the product.
                  </p>
                </div>

                {/* Finding 2 — thumbs-down */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="shrink-0 mt-1">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#C97836"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 14V3" />
                      <path d="M17 14l-4 7a2 2 0 0 1-3-2v-4H5a2 2 0 0 1-2-2.3l1.5-7A2 2 0 0 1 6.5 4H17" />
                    </svg>
                  </div>
                  <p
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: "16px",
                      fontWeight: 400,
                      lineHeight: "1.5",
                      color: "#1E1E1E",
                      margin: 0,
                    }}
                  >
                    A lot of potential users, who weren&rsquo;t used to Conduit, didn&rsquo;t understood the products they were selling.
                  </p>
                </div>

                {/* Finding 3 — hourglass */}
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-1">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#C97836"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 2v6a6 6 0 0012 0V2" />
                      <path d="M6 22v-6a6 6 0 0112 0v6" />
                      <line x1="4" y1="2" x2="20" y2="2" />
                      <line x1="4" y1="22" x2="20" y2="22" />
                    </svg>
                  </div>
                  <p
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: "16px",
                      fontWeight: 400,
                      lineHeight: "1.5",
                      color: "#1E1E1E",
                      margin: 0,
                    }}
                  >
                    8 out of 11 users in testing described the first design as a lifestyle brand, not a B2B operations tool.
                  </p>
                </div>
              </div>

            </div>

            {/* ============================================================ */}
            {/* RESEARCH — UNDERSTANDING OUR USERS subsection                 */}
            {/* ============================================================ */}
            <div className="mt-[80px]">

              {/* Sub-section heading */}
              <h3
                style={{
                  fontFamily: "'Helvetica Neue', sans-serif",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#1E1E1E",
                  margin: 0,
                  marginBottom: "40px",
                }}
              >
                Understanding our users →
              </h3>

              {/* 13 participants grid — 2 groups */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-[60px]">

                {/* Left group: Core Users (7 participants) — cols 1-7 */}
                <div className="md:col-span-7">
                  <p
                    className="uppercase"
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: "12px",
                      fontWeight: 500,
                      letterSpacing: "0.05em",
                      color: "#1E1E1E",
                      opacity: 0.6,
                      marginBottom: "16px",
                    }}
                  >
                    Core Users (7)
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {[1, 2, 4, 6, 7, 10, 11].map((num) => (
                      <div
                        key={`coreuser-${num}`}
                        className="flex flex-col items-center justify-center gap-1 rounded-2xl"
                        style={{
                          backgroundColor: "#FFF5EF",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                          width: "60px",
                          height: "60px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Helvetica Neue', sans-serif",
                            fontSize: "11px",
                            fontWeight: 500,
                            color: "#1E1E1E",
                            opacity: 0.6,
                            lineHeight: 1,
                          }}
                        >
                          {num}
                        </span>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#C97836"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" />
                        </svg>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right group: Potential Users (4 participants) — cols 8-12 */}
                <div className="md:col-span-5">
                  <p
                    className="uppercase"
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: "12px",
                      fontWeight: 500,
                      letterSpacing: "0.05em",
                      color: "#1E1E1E",
                      opacity: 0.6,
                      marginBottom: "16px",
                    }}
                  >
                    Potential Users (4)
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {[3, 5, 8, 9].map((num) => (
                      <div
                        key={`potentialuser-${num}`}
                        className="flex flex-col items-center justify-center gap-1 rounded-2xl"
                        style={{
                          backgroundColor: "#FFF5EF",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                          width: "60px",
                          height: "60px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Helvetica Neue', sans-serif",
                            fontSize: "11px",
                            fontWeight: 500,
                            color: "#1E1E1E",
                            opacity: 0.6,
                            lineHeight: 1,
                          }}
                        >
                          {num}
                        </span>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#C97836"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" />
                        </svg>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Personas row — 2 personas side by side */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* PERSONA 1 — Core User */}
                <div className="md:col-span-6">
                  <div className="flex gap-4 items-stretch mb-3">

                    {/* Avatar card */}
                    <div
                      className="shrink-0 rounded-2xl overflow-hidden flex items-center justify-center"
                      style={{
                        backgroundColor: "#FFF5EF",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                        width: "120px",
                        height: "120px",
                      }}
                    >
                      <Image
                        src="/images/conduit/users/core-user-avatar.png"
                        alt="Core User persona avatar"
                        width={100}
                        height={100}
                        className="object-contain"
                      />
                    </div>

                    {/* Info card */}
                    <div
                      className="flex-1 rounded-2xl flex flex-col justify-center"
                      style={{
                        backgroundColor: "#FFF5EF",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                        padding: "20px 24px",
                      }}
                    >
                      <h4
                        style={{
                          fontFamily: "'Helvetica Neue', sans-serif",
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#1E1E1E",
                          margin: 0,
                          marginBottom: "4px",
                        }}
                      >
                        Core User
                      </h4>
                      <p
                        style={{
                          fontFamily: "'Helvetica Neue', sans-serif",
                          fontSize: "13px",
                          fontWeight: 400,
                          color: "#1E1E1E",
                          opacity: 0.6,
                          margin: 0,
                        }}
                      >
                        Age: 35-40+
                      </p>
                    </div>
                  </div>

                  {/* Bullet card below */}
                  <div
                    className="rounded-2xl"
                    style={{
                      backgroundColor: "#FFF5EF",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                      padding: "20px 24px",
                    }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#C97836"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 mt-1"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      <p
                        style={{
                          fontFamily: "'Helvetica Neue', sans-serif",
                          fontSize: "14px",
                          fontWeight: 400,
                          lineHeight: "1.5",
                          color: "#1E1E1E",
                          margin: 0,
                        }}
                      >
                        <u>Can&apos;t load the site reliably</u> on slower connections, causing them to leave before seeing the product at all.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#C97836"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 mt-1"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <p
                        style={{
                          fontFamily: "'Helvetica Neue', sans-serif",
                          fontSize: "14px",
                          fontWeight: 400,
                          lineHeight: "1.5",
                          color: "#1E1E1E",
                          margin: 0,
                        }}
                      >
                        <u>Wants to know how to optimize</u> their Conduit subscription (majority of them didn&apos;t even know of the Copilot launch).
                      </p>
                    </div>
                  </div>
                </div>

                {/* PERSONA 2 — Potential Users */}
                <div className="md:col-span-6">
                  <div className="flex gap-4 items-stretch mb-3">

                    {/* Avatar card */}
                    <div
                      className="shrink-0 rounded-2xl overflow-hidden flex items-center justify-center"
                      style={{
                        backgroundColor: "#FFF5EF",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                        width: "120px",
                        height: "120px",
                      }}
                    >
                      <Image
                        src="/images/conduit/users/potential-user-avatar.png"
                        alt="Potential Users persona avatar"
                        width={100}
                        height={100}
                        className="object-contain"
                      />
                    </div>

                    {/* Info card */}
                    <div
                      className="flex-1 rounded-2xl flex flex-col justify-center"
                      style={{
                        backgroundColor: "#FFF5EF",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                        padding: "20px 24px",
                      }}
                    >
                      <h4
                        style={{
                          fontFamily: "'Helvetica Neue', sans-serif",
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#1E1E1E",
                          margin: 0,
                          marginBottom: "4px",
                        }}
                      >
                        Potential Users
                      </h4>
                      <p
                        style={{
                          fontFamily: "'Helvetica Neue', sans-serif",
                          fontSize: "13px",
                          fontWeight: 400,
                          color: "#1E1E1E",
                          opacity: 0.6,
                          margin: 0,
                        }}
                      >
                        Age: 25-35
                      </p>
                    </div>
                  </div>

                  {/* Bullet card below */}
                  <div
                    className="rounded-2xl"
                    style={{
                      backgroundColor: "#FFF5EF",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                      padding: "20px 24px",
                    }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#C97836"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 mt-1"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      <p
                        style={{
                          fontFamily: "'Helvetica Neue', sans-serif",
                          fontSize: "14px",
                          fontWeight: 400,
                          lineHeight: "1.5",
                          color: "#1E1E1E",
                          margin: 0,
                        }}
                      >
                        <u>Doesn&apos;t understand how Conduit&apos;s products connect,</u> whether Ops, Dropship, and Wholesale are one system or separate tools.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#C97836"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 mt-1"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <p
                        style={{
                          fontFamily: "'Helvetica Neue', sans-serif",
                          fontSize: "14px",
                          fontWeight: 400,
                          lineHeight: "1.5",
                          color: "#1E1E1E",
                          margin: 0,
                        }}
                      >
                        <u>Wants a clearer picture</u> of how everything fits together before committing to a demo.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 6: FINDING THE GAPS (white bg) — id="finding-the-gaps" */}
        {/* ============================================================ */}
        <section
          id="finding-the-gaps"
          className="w-full"
          style={{ backgroundColor: "#FFFFFF", scrollMarginTop: 100 }}
        >
          <div className="mx-auto max-w-[1228px] px-6 py-[80px]">

            {/* SECTION HEADER */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-[80px]">
              <div className="md:col-span-12">
                <p
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#1E1E1E",
                    margin: 0,
                  }}
                >
                  Finding the gaps in the market →
                </p>
              </div>
            </div>

            {/* 3-COLUMN COMPARISON GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-[100px]">

              {/* CARD 1 — Competitor #1 */}
              <div
                className="rounded-2xl flex flex-col"
                style={{
                  backgroundColor: "#FFF5EF",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                  padding: "40px 32px",
                }}
              >
                <div className="flex justify-center mb-6">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C97836" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" />
                  </svg>
                </div>
                <h3
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#1E1E1E",
                    textAlign: "center",
                    margin: 0,
                    marginBottom: "24px",
                  }}
                >
                  Competitor #1
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#7A9471"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="9 12 11 14 15 10" />
                    </svg>
                    <p
                      style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: "15px",
                        fontWeight: 400,
                        lineHeight: "1.5",
                        color: "#1E1E1E",
                        margin: 0,
                      }}
                    >
                      Strong B2B buyer focus
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#7A9471"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="9 12 11 14 15 10" />
                    </svg>
                    <p
                      style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: "15px",
                        fontWeight: 400,
                        lineHeight: "1.5",
                        color: "#1E1E1E",
                        margin: 0,
                      }}
                    >
                      Clear supplier/retailer split
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#B85042"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <p
                      style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: "15px",
                        fontWeight: 400,
                        lineHeight: "1.5",
                        color: "#1E1E1E",
                        margin: 0,
                      }}
                    >
                      Category-specific only
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#B85042"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <p
                      style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: "15px",
                        fontWeight: 400,
                        lineHeight: "1.5",
                        color: "#1E1E1E",
                        margin: 0,
                      }}
                    >
                      No story-telling components
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 2 — Competitor #2 */}
              <div
                className="rounded-2xl flex flex-col"
                style={{
                  backgroundColor: "#FFF5EF",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                  padding: "40px 32px",
                }}
              >
                <div className="flex justify-center mb-6">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C97836" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" />
                  </svg>
                </div>
                <h3
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#1E1E1E",
                    textAlign: "center",
                    margin: 0,
                    marginBottom: "24px",
                  }}
                >
                  Competitor #2
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#7A9471"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="9 12 11 14 15 10" />
                    </svg>
                    <p
                      style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: "15px",
                        fontWeight: 400,
                        lineHeight: "1.5",
                        color: "#1E1E1E",
                        margin: 0,
                      }}
                    >
                      Outcome-led copy
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#7A9471"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="9 12 11 14 15 10" />
                    </svg>
                    <p
                      style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: "15px",
                        fontWeight: 400,
                        lineHeight: "1.5",
                        color: "#1E1E1E",
                        margin: 0,
                      }}
                    >
                      Strong trust signals
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#B85042"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <p
                      style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: "15px",
                        fontWeight: 400,
                        lineHeight: "1.5",
                        color: "#1E1E1E",
                        margin: 0,
                      }}
                    >
                      No AI positioning
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#B85042"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <p
                      style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: "15px",
                        fontWeight: 400,
                        lineHeight: "1.5",
                        color: "#1E1E1E",
                        margin: 0,
                      }}
                    >
                      Not operations-focused
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 3 — Competitor #3 */}
              <div
                className="rounded-2xl flex flex-col"
                style={{
                  backgroundColor: "#FFF5EF",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                  padding: "40px 32px",
                }}
              >
                <div className="flex justify-center mb-6">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C97836" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" />
                  </svg>
                </div>
                <h3
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#1E1E1E",
                    textAlign: "center",
                    margin: 0,
                    marginBottom: "24px",
                  }}
                >
                  Competitor #3
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#7A9471"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="9 12 11 14 15 10" />
                    </svg>
                    <p
                      style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: "15px",
                        fontWeight: 400,
                        lineHeight: "1.5",
                        color: "#1E1E1E",
                        margin: 0,
                      }}
                    >
                      Feature-rich and functional
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#7A9471"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="9 12 11 14 15 10" />
                    </svg>
                    <p
                      style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: "15px",
                        fontWeight: 400,
                        lineHeight: "1.5",
                        color: "#1E1E1E",
                        margin: 0,
                      }}
                    >
                      Clear product hierarchy
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#B85042"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <p
                      style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: "15px",
                        fontWeight: 400,
                        lineHeight: "1.5",
                        color: "#1E1E1E",
                        margin: 0,
                      }}
                    >
                      Not aesthetics heavy
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#B85042"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <p
                      style={{
                        fontFamily: "'Helvetica Neue', sans-serif",
                        fontSize: "15px",
                        fontWeight: 400,
                        lineHeight: "1.5",
                        color: "#1E1E1E",
                        margin: 0,
                      }}
                    >
                      Built for technical buyers only
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* MOODBOARDS + SYNTHESIS LAYER */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-[100px]" style={{ marginTop: 80 }}>

              {/* LEFT: Moodboards StackedDeck */}
              <div className="md:col-span-7 flex flex-col items-center">
                <StackedDeck
                  cardWidth={510}
                  cardHeight={480}
                  cards={[
                    <div key="gaps-mood-1" className="w-full h-full rounded-2xl overflow-hidden bg-white" style={{ lineHeight: 0, fontSize: 0 }}>
                      <Image src="/images/conduit/gaps/moodboard-1.png" alt="Competitor research moodboard 1" width={617} height={591} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                    </div>,
                    <div key="gaps-mood-2" className="w-full h-full rounded-2xl overflow-hidden bg-white" style={{ lineHeight: 0, fontSize: 0 }}>
                      <Image src="/images/conduit/gaps/moodboard-2.png" alt="Competitor research moodboard 2" width={671} height={495} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                    </div>,
                    <div key="gaps-mood-3" className="w-full h-full rounded-2xl overflow-hidden bg-white" style={{ lineHeight: 0, fontSize: 0 }}>
                      <Image src="/images/conduit/gaps/moodboard-3.png" alt="Competitor research moodboard 3" width={635} height={608} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                    </div>,
                  ]}
                />
              </div>

              {/* RIGHT: Synthesis layer */}
              <div className="md:col-span-5 flex flex-col" style={{ gap: 48 }}>

                {/* Sub-block 1: Pattern */}
                <div>
                  <h3 style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: 18, fontWeight: 700, color: "#1E1E1E", marginBottom: 24 }}>
                    The pattern across all competitors &rarr;
                  </h3>

                  <div className="flex flex-col" style={{ gap: 16 }}>
                    {/* Bullet 1 — pencil icon */}
                    <div className="flex items-start" style={{ gap: 12 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C97836" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: 15, lineHeight: 1.6, color: "#1E1E1E", margin: 0 }}>
                        None of them were competing on aesthetics. They were competing on clarity and function.
                      </p>
                    </div>

                    {/* Bullet 2 — chat icon */}
                    <div className="flex items-start" style={{ gap: 12 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C97836" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: 15, lineHeight: 1.6, color: "#1E1E1E", margin: 0 }}>
                        The best performing B2B sites led with outcomes, not features. Plain language over industry jargon.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sub-block 2: Direction */}
                <div>
                  <h3 style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: 18, fontWeight: 700, color: "#1E1E1E", marginBottom: 24 }}>
                    The direction this revealed &rarr;
                  </h3>
                  <div className="flex flex-col" style={{ gap: 16 }}>
                    <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: 15, lineHeight: 1.6, color: "#1E1E1E", margin: 0 }}>
                      Conduit didn&apos;t need to out-design its competitors. It needed to out-communicate them. Clarity and functional UX copy were the gaps nobody in this market was filling.
                    </p>
                    <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: 15, lineHeight: 1.6, color: "#1E1E1E", margin: 0 }}>
                      Conduit is one of the first to implement AI into wholesale operations at this level. Users had no reference point for what that even meant. In situations like these, the words and the simplicity of the UI do more work than any visual treatment ever could.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* OUR DIRECTION SUB-HEADING */}
            <h3
              style={{
                fontFamily: "'Helvetica Neue', sans-serif",
                fontSize: "18px",
                fontWeight: 600,
                color: "#1E1E1E",
                margin: 0,
                marginBottom: "40px",
              }}
            >
              Our Direction →
            </h3>

            {/* 2 PULL QUOTES — How might we... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

              {/* Pull quote 1 */}
              <div
                style={{
                  borderLeft: "3px solid #C97836",
                  paddingLeft: "24px",
                }}
              >
                <p
                  style={{
                    fontFamily: FONTS.serif,
                    fontSize: "24px",
                    fontWeight: 600,
                    fontStyle: "normal",
                    lineHeight: "1.3",
                    color: "#1E1E1E",
                    margin: 0,
                  }}
                >
                  How might we... write UX copy that sells the product?
                </p>
              </div>

              {/* Pull quote 2 */}
              <div
                style={{
                  borderLeft: "3px solid #C97836",
                  paddingLeft: "24px",
                }}
              >
                <p
                  style={{
                    fontFamily: FONTS.serif,
                    fontSize: "24px",
                    fontWeight: 600,
                    fontStyle: "normal",
                    lineHeight: "1.3",
                    color: "#1E1E1E",
                    margin: 0,
                  }}
                >
                  How might we... create animations that demonstrate?
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 7: DEVELOPMENT (white bg) — id="development" */}
        {/* ============================================================ */}
        <section
          id="development"
          className="w-full"
          style={{ backgroundColor: "#FFFFFF", scrollMarginTop: 100 }}
        >
          <div className="mx-auto max-w-[1228px] px-6 py-[80px]">

            {/* SECTION HEADER */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-[80px]">
              <div className="md:col-span-12">
                <p
                  className="uppercase"
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: "14px",
                    fontWeight: 500,
                    letterSpacing: "0.05em",
                    color: "#1E1E1E",
                    marginBottom: "12px",
                  }}
                >
                  Development
                </p>
                <h2
                  style={{
                    fontFamily: FONTS.serif,
                    fontSize: "24px",
                    fontWeight: 600,
                    lineHeight: "1.3",
                    color: "#1E1E1E",
                    margin: 0,
                    maxWidth: "600px",
                  }}
                >
                  A Human-Centered Design Approach & Conversational Copy
                </h2>
              </div>
            </div>

            {/* SUB-ROW 1: Founder disagreement — figma screenshot LEFT + text RIGHT */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-[80px]">
              <div className="md:col-span-5">
                <div
                  style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    lineHeight: 0,
                    fontSize: 0,
                  }}
                >
                  <Image
                    src="/images/conduit/development/figma-design-system-screenshot.png"
                    alt="Figma file showing Conduit Commerce's finalized design system screens"
                    width={1210}
                    height={640}
                    className="w-full h-auto"
                    style={{
                      verticalAlign: "top",
                      display: "block",
                    }}
                  />
                </div>
                <p
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: 14,
                    fontWeight: 400,
                    fontStyle: "italic",
                    color: "#1E1E1E",
                    opacity: 0.6,
                    marginTop: 16,
                  }}
                >
                  I contributed to the finalized design system. Link{" "}
                  <a
                    href="https://www.figma.com/design/MWO6BMBpJPGrbyqVE9Bkby/Conduit-2.0?node-id=215-494&t=tiQ5wiwY2EwpCXkg-1"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "underline", color: "#2563EB" }}
                  >
                    here
                  </a>
                  .
                </p>
              </div>
              <div className="md:col-span-5 md:col-start-8 flex flex-col gap-10">
                <div>
                  <h3
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#1E1E1E",
                      marginBottom: 16,
                    }}
                  >
                    The founder disagreement →
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: 16,
                      fontWeight: 400,
                      color: "#1E1E1E",
                      lineHeight: 1.5,
                    }}
                  >
                    The founder wanted to mirror competitor sites. I pushed back. Not because the competitors looked bad, but because their audiences were different. B2B SaaS for coastal tech buyers has different visual expectations than a wholesale operations tool for Midwest distributors. Designing for your actual audience rather than your aspirational peer set is a harder sell internally, but it&rsquo;s the right call. The testing data backed it, and the first design failure proved the point before the argument was fully resolved.
                  </p>
                </div>
              </div>
            </div>

            {/* SUB-ROW 2: Design system exploration — 3 moodboard collage LEFT + text RIGHT */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-[80px] items-center">
              <div className="md:col-span-6 flex justify-start items-start">
                <Image
                  src="/images/conduit/development/design-system-exploration.png"
                  alt="Design system exploration — moodboards, typography, and color palette"
                  width={1108}
                  height={800}
                  style={{
                    width: "100%",
                    height: "auto",
                    maxWidth: 500,
                    display: "block",
                  }}
                />
              </div>
              <div className="md:col-span-5 md:col-start-8 flex flex-col gap-10">
                <div>
                  <h3
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#1E1E1E",
                      marginBottom: 16,
                    }}
                  >
                    Design system exploration →
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: 16,
                      fontWeight: 400,
                      color: "#1E1E1E",
                      lineHeight: 1.5,
                      marginBottom: 20,
                    }}
                  >
                    We were aiming for something original but sleek. Modern without being cold. After multiple iterations and mood board explorations, we landed on a design system built around shades of blue with soft gradients. We deliberately avoided sharp, rigid shapes. Conduit needed to feel flexible and inviting, something that pulls users in rather than presenting a wall of information.
                  </p>
                  <p
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: 16,
                      fontWeight: 400,
                      color: "#1E1E1E",
                      lineHeight: 1.5,
                      marginBottom: 20,
                    }}
                  >
                    Especially given that their clients were mainly non-tech savvy people. We didn&rsquo;t want to infer &ldquo;coldness&rdquo; with the introduction of Copilot, we wanted to introduce a new era of Conduit where it&rsquo;s become more &ldquo;modern&rdquo; and &ldquo;tech-oriented&rdquo;. Our human-centered design philosophy was malleable and breathing by intention, whilst nudging our users for AI adoption (Copilot).
                  </p>
                  <p
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: 16,
                      fontWeight: 400,
                      color: "#1E1E1E",
                      lineHeight: 1.5,
                    }}
                  >
                    This design approach was implemented throughout the animations as well. I sent this over to our marketing designer to begin designing the video assets for the website.
                  </p>
                </div>
              </div>
            </div>

            {/* SUB-ROW 3: UX Copy rewrite — 2 doc tiles LEFT + intro + bullets RIGHT */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-6 flex justify-start items-start">
                <Image
                  src="/images/conduit/development/ux-copy-wholesale-and-ops.png"
                  alt="UX copy documents — Wholesale and Ops"
                  width={1041}
                  height={950}
                  style={{
                    width: "100%",
                    height: "auto",
                    maxWidth: 460,
                    display: "block",
                  }}
                />
              </div>
              <div className="md:col-span-5 md:col-start-8 flex flex-col gap-10">
                <div>
                  <h3
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#1E1E1E",
                      marginBottom: 16,
                    }}
                  >
                    The UX copy rewrite →
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: 16,
                      fontWeight: 400,
                      color: "#1E1E1E",
                      lineHeight: 1.5,
                      marginBottom: 20,
                    }}
                  >
                    I delivered two full UX copy documents, one for Conduit{" "}
                    <a
                      href="https://docs.google.com/document/d/1fE2lH3_ExRpzFlMELd5SZf0OOJxis1jYIaE6EzIV9wo/edit?usp=sharing"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "underline", color: "#2563EB" }}
                    >
                      Wholesale
                    </a>
                    , one for Conduit{" "}
                    <a
                      href="https://docs.google.com/document/d/1a3FmszQw9Fh9WOOk6Ak7CBNGLerEF4FGV085IM0zF40/edit?tab=t.0"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "underline", color: "#2563EB" }}
                    >
                      Ops
                    </a>
                    . They each follow the same IA framework:
                  </p>
                  <ul
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: 16,
                      fontWeight: 400,
                      color: "#1E1E1E",
                      lineHeight: 1.5,
                      listStyleType: "disc",
                      paddingLeft: 20,
                      margin: 0,
                    }}
                  >
                    <li style={{ marginBottom: 12 }}>
                      The hero copy for Wholesale became: &ldquo;Order anytime, on your schedule. No calls, no emails, no waiting on anyone.&rdquo;
                    </li>
                    <li style={{ marginBottom: 12 }}>
                      For Ops: &ldquo;Your whole team, always on the same page. One live view of every order, account, and update.&rdquo;
                    </li>
                    <li>
                      The Copilot positioning shifted from vague AI claims to a concrete outcome statement: &ldquo;The assistant that handles the busywork, so you can focus on the relationship.&rdquo;
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </section>


        {/* ============================================================ */}
        {/* SECTION 9: TESTING (white bg) — id="testing" */}
        {/* ============================================================ */}
        <section
          id="testing"
          className="w-full"
          style={{ backgroundColor: "#FFFFFF", scrollMarginTop: 100 }}
        >
          <div className="mx-auto max-w-[1228px] px-6 pt-[80px] pb-[20px]">

            {/* EYEBROW */}
            <p style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#1E1E1E",
              margin: 0,
            }}>
              Testing
            </p>

            {/* WOW ICON + NOTE PARAGRAPH — flex row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 24,
            }}>
              <Image
                src="/images/conduit/testing/icon-wow.svg"
                alt="Wow icon"
                width={32}
                height={32}
                style={{
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  display: "block",
                }}
              />
              <p style={{
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: 16,
                lineHeight: 1.6,
                color: "#1E1E1E",
                margin: 0,
              }}>
                Note: Because of the founders&apos; rapid iteration timeline, there was no third round of usability testing before final dev handoff. Some you win, some you lose. With AI-accelerated product cycles, thoroughness is sometimes traded for speed. This is a real constraint that&rsquo;s becoming a reality for us product designers.
              </p>
            </div>

          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 13: SOLUTION (white bg) — id="solution" */}
        {/* ============================================================ */}
        <section
          id="solution"
          className="w-full"
          style={{ backgroundColor: "#FFFFFF", scrollMarginTop: 100 }}
        >
          <div className="mx-auto max-w-[1228px] px-6 py-[80px]">

            {/* SECTION HEADER */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-[80px]">
              <div className="md:col-span-12">
                <p
                  className="uppercase"
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: "14px",
                    fontWeight: 500,
                    letterSpacing: "0.05em",
                    color: "#1E1E1E",
                    marginBottom: "12px",
                  }}
                >
                  Solution
                </p>
                <h2
                  style={{
                    fontFamily: FONTS.serif,
                    fontSize: "24px",
                    fontWeight: 600,
                    lineHeight: "1.3",
                    color: "#1E1E1E",
                    margin: 0,
                    maxWidth: "700px",
                  }}
                >
                  A B2B SaaS Website Designed Around User Habits, While Nudging AI Adoption
                </h2>
              </div>
            </div>

            {/* ROW 1 — Centralized Product Dashboard */}
            <div className="mb-[120px]">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

                {/* LEFT: video at natural aspect */}
                <div className="md:col-span-7">
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "16 / 9",
                      border: "1px solid #C97836",
                      borderRadius: "16px",
                      overflow: "hidden",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                      lineHeight: 0,
                      fontSize: 0,
                    }}
                  >
                    <video
                      src="/videos/conduit/solution-1-dashboard.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        verticalAlign: "top",
                        transform: "scale(1.15)",
                        transformOrigin: "center center",
                      }}
                    />
                  </div>
                </div>

                {/* RIGHT: number + heading + body */}
                <div className="md:col-span-5">
                  <p
                    style={{
                      fontFamily: FONTS.serif,
                      fontSize: "96px",
                      fontWeight: 600,
                      lineHeight: "1",
                      color: "#D4A574",
                      margin: 0,
                      marginBottom: "32px",
                    }}
                  >
                    1
                  </p>
                  <h3
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: "18px",
                      fontWeight: 600,
                      lineHeight: "1.4",
                      color: "#1E1E1E",
                      margin: 0,
                      marginBottom: "16px",
                    }}
                  >
                    Centralized Product Dashboard →
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: "16px",
                      fontWeight: 400,
                      lineHeight: "1.6",
                      color: "#1E1E1E",
                      margin: 0,
                    }}
                  >
                    A single home for all of Conduit&apos;s four core products. Each showcased with their benefits, their function, and all ending with an incentivized CTA button to increase engagement.
                  </p>
                </div>

              </div>
            </div>

            {/* ROW 2 — Human-Centered Design Uniformity */}
            <div className="mb-[120px]">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

                {/* LEFT: video at natural aspect */}
                <div className="md:col-span-7">
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "16 / 9",
                      border: "1px solid #C97836",
                      borderRadius: "16px",
                      overflow: "hidden",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                      lineHeight: 0,
                      fontSize: 0,
                    }}
                  >
                    <video
                      src="/videos/conduit/solution-2-design-uniformity.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        verticalAlign: "top",
                        transform: "scale(1.15)",
                        transformOrigin: "center center",
                      }}
                    />
                  </div>
                </div>

                {/* RIGHT: number + heading + body */}
                <div className="md:col-span-5">
                  <p
                    style={{
                      fontFamily: FONTS.serif,
                      fontSize: "96px",
                      fontWeight: 600,
                      lineHeight: "1",
                      color: "#D4A574",
                      margin: 0,
                      marginBottom: "32px",
                    }}
                  >
                    2
                  </p>
                  <h3
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: "18px",
                      fontWeight: 600,
                      lineHeight: "1.4",
                      color: "#1E1E1E",
                      margin: 0,
                      marginBottom: "16px",
                    }}
                  >
                    Human-Centered Design Uniformity →
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: "16px",
                      fontWeight: 400,
                      lineHeight: "1.6",
                      color: "#1E1E1E",
                      margin: 0,
                    }}
                  >
                    All pages were designed around a cohesive visual language of gradients and soft-to-deep blues. Blue carries connotations of trust, reliability, and forward motion, which mapped directly to what a B2B audience needs to feel before making an operational decision. The gradient treatment kept it from feeling clinical, landing Conduit in the space between new-era tech and human approachability.
                  </p>
                </div>

              </div>
            </div>

            {/* ROW 3 — Conversational UX Copy */}
            <div className="mb-[120px]">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

                {/* LEFT: video at natural aspect */}
                <div className="md:col-span-7">
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "16 / 9",
                      border: "1px solid #C97836",
                      borderRadius: "16px",
                      overflow: "hidden",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                      lineHeight: 0,
                      fontSize: 0,
                    }}
                  >
                    <video
                      src="/videos/conduit/solution-3-conversational-copy.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        verticalAlign: "top",
                        transform: "scale(1.15)",
                        transformOrigin: "center center",
                      }}
                    />
                  </div>
                </div>

                {/* RIGHT: number + heading + body */}
                <div className="md:col-span-5">
                  <p
                    style={{
                      fontFamily: FONTS.serif,
                      fontSize: "96px",
                      fontWeight: 600,
                      lineHeight: "1",
                      color: "#D4A574",
                      margin: 0,
                      marginBottom: "32px",
                    }}
                  >
                    3
                  </p>
                  <h3
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: "18px",
                      fontWeight: 600,
                      lineHeight: "1.4",
                      color: "#1E1E1E",
                      margin: 0,
                      marginBottom: "16px",
                    }}
                  >
                    Conversational UX Copy →
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: "16px",
                      fontWeight: 400,
                      lineHeight: "1.6",
                      color: "#1E1E1E",
                      margin: 0,
                    }}
                  >
                    We implemented benefit-first, conversational UX copy across all product pages, written to onboard newcomers while still resonating with core users. The goal was to reduce jargon, lower the barrier to understanding what Conduit does, and give every visitor a clear reason to keep reading. By doing this, we tackled the retention problem through utilizing copy as a tool, not just a description.
                  </p>
                </div>

              </div>
            </div>

            {/* ROW 4 — Instructional Animations */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

                {/* LEFT: video at natural aspect */}
                <div className="md:col-span-7">
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "16 / 9",
                      border: "1px solid #C97836",
                      borderRadius: "16px",
                      overflow: "hidden",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                      lineHeight: 0,
                      fontSize: 0,
                    }}
                  >
                    <video
                      src="/videos/conduit/solution-4-instructional-animations.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      aria-label="Instructional micro-animation showing CoPilot drafting replies"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        verticalAlign: "top",
                        transform: "scale(1.15)",
                        transformOrigin: "center center",
                      }}
                    />
                  </div>
                </div>

                {/* RIGHT: number + heading + body */}
                <div className="md:col-span-5">
                  <p
                    style={{
                      fontFamily: FONTS.serif,
                      fontSize: "96px",
                      fontWeight: 600,
                      lineHeight: "1",
                      color: "#D4A574",
                      margin: 0,
                      marginBottom: "32px",
                    }}
                  >
                    4
                  </p>
                  <h3
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: "18px",
                      fontWeight: 600,
                      lineHeight: "1.4",
                      color: "#1E1E1E",
                      margin: 0,
                      marginBottom: "16px",
                    }}
                  >
                    Instructional Animations →
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: "16px",
                      fontWeight: 400,
                      lineHeight: "1.6",
                      color: "#1E1E1E",
                      margin: 0,
                    }}
                  >
                    We figured the best way to showcase Conduit&apos;s products, especially Copilot, was through instructional micro-animations. Instead of decorative animations that slowed load times and communicated nothing, every motion was designed to serve a function: demonstrating how the product works as users interact with it.
                  </p>
                </div>

              </div>
            </div>

            {/* THE RESULTS — sub-section of Solution */}
            <div style={{ marginTop: "80px" }}>
              <h3
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#1E1E1E",
                  margin: 0,
                  marginBottom: "32px",
                }}
              >
                The Results →
              </h3>

              {/* 3 stat cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* CARD 1 — Line chart */}
                <div
                  style={{
                    backgroundColor: "#FFF5EF",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                    borderRadius: "16px",
                    padding: "32px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C97836"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginBottom: "24px" }}
                  >
                    <path d="M3 3v18h18" />
                    <path d="M7 14l4-4 4 4 5-5" />
                  </svg>
                  <p
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: "16px",
                      fontWeight: 400,
                      lineHeight: "1.6",
                      color: "#1E1E1E",
                      margin: 0,
                    }}
                  >
                    <strong>Bounce rate increased ~40%</strong> &mdash; users can now immediately identify what Conduit does and who it&apos;s for.
                  </p>
                </div>

                {/* CARD 2 — Clock */}
                <div
                  style={{
                    backgroundColor: "#FFF5EF",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                    borderRadius: "16px",
                    padding: "32px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C97836"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginBottom: "24px" }}
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                  <p
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: "16px",
                      fontWeight: 400,
                      lineHeight: "1.6",
                      color: "#1E1E1E",
                      margin: 0,
                    }}
                  >
                    Time-on-site <strong>increased by ~3&times;</strong> &mdash; users are reading and engaging, not abandoning on slow connections.
                  </p>
                </div>

                {/* CARD 3 — Thumbs up */}
                <div
                  style={{
                    backgroundColor: "#FFF5EF",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                    borderRadius: "16px",
                    padding: "32px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C97836"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginBottom: "24px" }}
                  >
                    <path d="M7 10v11" />
                    <path d="M7 10l4-7a2 2 0 0 1 3 2v4h5a2 2 0 0 1 2 2.3l-1.5 7A2 2 0 0 1 17.5 20H7" />
                  </svg>
                  <p
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: "16px",
                      fontWeight: 400,
                      lineHeight: "1.6",
                      color: "#1E1E1E",
                      margin: 0,
                    }}
                  >
                    <strong>~28% increase in demo requests</strong> in the first month post-launch.
                  </p>
                </div>

              </div>

              {/* Body paragraph below cards */}
              <p
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: "16px",
                  fontWeight: 400,
                  lineHeight: "1.6",
                  color: "#1E1E1E",
                  margin: 0,
                  marginTop: "48px",
                }}
              >
                Following the launch, the <span style={{ color: "#8F4B1E" }}>4 current users</span> who had reported complete site failures on slower connections can now access the site reliably.
              </p>
            </div>

          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 14: FINAL THOUGHTS (white bg) — id="final-thoughts" */}
        {/* ============================================================ */}
        <section id="final-thoughts" style={{ background: "#FFFFFF", paddingTop: 24, paddingBottom: 16, scrollMarginTop: 100 }}>
          <div className="max-w-[1228px] mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

              {/* LEFT — iMessage screenshot with cursor-morph caption */}
              <div className="md:col-span-6 flex justify-start items-start">
                <div
                  onMouseEnter={() => {
                    window.dispatchEvent(
                      new CustomEvent("cursor-mode", {
                        detail: {
                          mode: "caption",
                          text: "our designers battling thru finals (and weekly syncs)",
                        },
                      })
                    );
                  }}
                  onMouseLeave={() => {
                    window.dispatchEvent(
                      new CustomEvent("cursor-mode", {
                        detail: { mode: "default" },
                      })
                    );
                  }}
                  style={{
                    width: "100%",
                    maxWidth: 520,
                    borderRadius: 16,
                    overflow: "hidden",
                    lineHeight: 0,
                    fontSize: 0,
                    cursor: "none",
                  }}
                >
                  <Image
                    src="/images/conduit/final-thoughts/imessage-screenshot.png"
                    alt="iMessage group chat with my designers during finals season"
                    width={680}
                    height={1200}
                    style={{
                      width: "100%",
                      height: "auto",
                      verticalAlign: "top",
                      display: "block",
                    }}
                  />
                </div>
              </div>

              {/* RIGHT — text spans cols 7-12 */}
              <div className="md:col-span-6">
                <div
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: "#1E1E1E",
                    marginBottom: 12,
                  }}
                >
                  Final Thoughts
                </div>

                <h2
                  style={{
                    fontFamily: FONTS.serif,
                    fontWeight: 600,
                    fontSize: 24,
                    lineHeight: 1.3,
                    color: "#1E1E1E",
                    marginBottom: 32,
                    maxWidth: 600,
                  }}
                >
                  Key Takeaways and Next Steps.
                </h2>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                  }}
                >
                  <li
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 16,
                      lineHeight: 1.6,
                      color: "#1E1E1E",
                      paddingLeft: 20,
                      position: "relative",
                    }}
                  >
                    <span style={{ position: "absolute", left: 0, top: 0 }}>•</span>
                    Following trends and mirroring competitors doesn&rsquo;t make your design effective. Your design should fit your product and your user, not the aesthetic of whoever raised a Series B last quarter.
                  </li>
                  <li
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 16,
                      lineHeight: 1.6,
                      color: "#1E1E1E",
                      paddingLeft: 20,
                      position: "relative",
                    }}
                  >
                    <span style={{ position: "absolute", left: 0, top: 0 }}>•</span>
                    Working with AI tools in a fast-paced startup means trading thoroughness for speed. You expedite the process but sometimes skip the steps that would have caught something important. It&rsquo;s a matter of which you choose to leverage more.
                  </li>
                  <li
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 16,
                      lineHeight: 1.6,
                      color: "#1E1E1E",
                      paddingLeft: 20,
                      position: "relative",
                    }}
                  >
                    <span style={{ position: "absolute", left: 0, top: 0 }}>•</span>
                    The smallest details carry the most weight. Too much animation weakened engagement before users even read a word, who would&rsquo;ve had thought.
                  </li>
                  <li
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: 16,
                      lineHeight: 1.6,
                      color: "#1E1E1E",
                      paddingLeft: 20,
                      position: "relative",
                    }}
                  >
                    <span style={{ position: "absolute", left: 0, top: 0 }}>•</span>
                    To become a product designer is to become a good teacher. Assume users know nothing when they arrive, and build an experience that teaches them as they scroll. Instructional animations, conversational copy, human-centered design, all of it is just good teaching.
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 15: NEXT STEPS (white bg) — 3-col icon row */}
        {/* ============================================================ */}
        <section style={{ background: "#FFFFFF", paddingTop: 80, paddingBottom: 80, scrollMarginTop: 100 }}>
          <div className="max-w-[1228px] mx-auto px-6">

            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 18,
                fontWeight: 700,
                color: "#1E1E1E",
                marginBottom: 48,
              }}
            >
              Next Steps →
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Col 1 — folder-up */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 96,
                    height: 96,
                    marginBottom: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    src="/images/manus/next-steps/icon-folder-up.svg"
                    alt="Folder upload"
                    width={96}
                    height={96}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </div>
                <p
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 16,
                    lineHeight: 1.6,
                    color: "#1E1E1E",
                    maxWidth: 320,
                    margin: 0,
                  }}
                >
                  Expand the design system for product surfaces beyond the Copilot landing site
                </p>
              </div>

              {/* Col 2 — doc-search */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 96,
                    height: 96,
                    marginBottom: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    src="/images/manus/next-steps/icon-doc-search.svg"
                    alt="Document with search"
                    width={96}
                    height={96}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </div>
                <p
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 16,
                    lineHeight: 1.6,
                    color: "#1E1E1E",
                    maxWidth: 320,
                    margin: 0,
                  }}
                >
                  Conduct a post-launch usability study now that the site has real traffic
                </p>
              </div>

              {/* Col 3 — laptop */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 96,
                    height: 96,
                    marginBottom: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    src="/images/manus/next-steps/icon-laptop.svg"
                    alt="Laptop"
                    width={96}
                    height={96}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </div>
                <p
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 16,
                    lineHeight: 1.6,
                    color: "#1E1E1E",
                    maxWidth: 320,
                    margin: 0,
                  }}
                >
                  Add trust signals (security badges, compliance language) for credibility
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 16: THANKS FOR VISITING — cream card with cartoon-jaz */}
        {/* ============================================================ */}
        <section style={{ background: "#FFFFFF", paddingTop: 40, paddingBottom: 80, scrollMarginTop: 100 }}>
          <div className="max-w-[1228px] mx-auto px-6">

            <motion.div
              whileHover={{ scale: 1.02, rotate: -1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              onMouseEnter={() => setThanksHovered(true)}
              onMouseLeave={() => setThanksHovered(false)}
              style={{
                background: "#FFF5EF",
                borderRadius: 16,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                padding: 20,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 24,
                maxWidth: 720,
                cursor: "pointer",
                transformOrigin: "center",
                position: "relative",
                overflow: "visible",
              }}
            >

              {/* SPARKLES — appear on hover, drift + twinkle around card edges */}
              <AnimatePresence>
                {thanksHovered && (
                  <>
                    {[
                      { top: "-8px",   left: "10%",    delay: 0,    size: 14, color: "#C97836", driftX: 4,  driftY: -3 },
                      { top: "-12px",  left: "35%",    delay: 0.15, size: 10, color: "#D4A574", driftX: -3, driftY: -5 },
                      { top: "-6px",   left: "70%",    delay: 0.3,  size: 16, color: "#C97836", driftX: 5,  driftY: -2 },
                      { top: "30%",    right: "-10px", delay: 0.1,  size: 12, color: "#D4A574", driftX: 6,  driftY: 3 },
                      { bottom: "10%", right: "-6px",  delay: 0.25, size: 14, color: "#C97836", driftX: 4,  driftY: 5 },
                      { bottom: "-10px", left: "75%",  delay: 0.05, size: 10, color: "#D4A574", driftX: -3, driftY: 4 },
                      { bottom: "-8px",  left: "45%",  delay: 0.2,  size: 14, color: "#C97836", driftX: 2,  driftY: 5 },
                      { bottom: "-6px",  left: "15%",  delay: 0.35, size: 12, color: "#D4A574", driftX: -4, driftY: 3 },
                      { top: "40%",    left: "-10px",  delay: 0.18, size: 14, color: "#C97836", driftX: -5, driftY: -2 },
                    ].map((s, i) => (
                      <motion.div
                        key={`sparkle-${i}`}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: [0, 1, 0.6, 1, 0.4],
                          scale: [0, 1, 0.8, 1.1, 0.9],
                          x: [0, s.driftX, 0, s.driftX, 0],
                          y: [0, s.driftY, 0, s.driftY, 0],
                        }}
                        exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}
                        transition={{
                          duration: 1.8,
                          delay: s.delay,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        style={{
                          position: "absolute",
                          top: s.top,
                          left: s.left,
                          right: s.right,
                          bottom: s.bottom,
                          width: s.size,
                          height: s.size,
                          pointerEvents: "none",
                        }}
                      >
                        <svg viewBox="0 0 24 24" width={s.size} height={s.size} fill={s.color}>
                          <path d="M12 0 L13.5 10.5 L24 12 L13.5 13.5 L12 24 L10.5 13.5 L0 12 L10.5 10.5 Z" />
                        </svg>
                      </motion.div>
                    ))}
                  </>
                )}
              </AnimatePresence>

              {/* LEFT — cartoon-jaz illustration */}
              <div
                style={{
                  flexShrink: 0,
                  width: 80,
                  height: 80,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  src="/images/manus/thanks/cartoon-jaz.png"
                  alt="Cartoon illustration of Jaz"
                  width={80}
                  height={80}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>

              {/* RIGHT — heading + body */}
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontFamily: FONTS.serif,
                    fontWeight: 600,
                    fontSize: 24,
                    lineHeight: 1.3,
                    color: "#1E1E1E",
                    margin: 0,
                  }}
                >
                  Thanks for visiting!
                </h3>
                <p
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 16,
                    lineHeight: 1.6,
                    color: "#1E1E1E",
                    margin: "12px 0 0 0",
                  }}
                >
                  I design better than I summarize.<br />
                  Let&apos;s fix that over a call or interview. Reach out{" "}
                  <a
                    href="mailto:jazkurnz06@gmail.com"
                    style={{ color: "#C97836", textDecoration: "underline" }}
                  >
                    here
                  </a>
                  .
                </p>
              </div>

            </motion.div>
          </div>
        </section>

      </main>
      <CaseStudyFooter currentSlug="conduit-commerce" />
      <Footer variant="cream" />

      <Lightbox
        isOpen={openVideo !== null}
        onClose={() => setOpenVideo(null)}
        videoSrc={openVideo || ""}
        layoutId={
          openVideo === "/videos/conduit/solution-4-instructional-animations.mp4"
            ? "solution-preview-video-1"
            : "solution-preview-video-2"
        }
      />
    </>
  );
}
