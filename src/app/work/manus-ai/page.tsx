"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
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
        className="text-center"
        style={{
          fontFamily: "'Helvetica Neue', sans-serif",
          fontSize: "16px",
          fontWeight: 500,
          color: "#1E1E1E",
          lineHeight: 1.4,
          maxWidth: 180,
          margin: 0,
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
        backgroundColor: "rgba(255, 245, 239, 0.6)",
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
            style={{ backgroundColor: COLORS.cream }}
          >
            <div className="mx-auto max-w-[1246px] px-6 md:px-12 lg:px-24 pt-12 md:pt-16 pb-10 md:pb-12">
              <div className="flex flex-col items-center gap-[30px]">
                {/* Logo + headline column (804 wide, centered, text-center) */}
                <div className="w-full max-w-[804px] mx-auto flex flex-col items-center gap-[3px]">
                  <Image
                    src="/images/manus/hero/logo.svg"
                    alt="Manus AI"
                    width={196}
                    height={57}
                    className="w-[196px] h-[57px]"
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
                    Designing an AI community platform to drive adoption.
                  </h1>
                </div>

                {/* Laptop mockup 874×536 — centered */}
                <div className="w-full max-w-[874px] mx-auto rounded-[15px] overflow-hidden">
                  <video
                    src="/images/manus/hero/laptop-mockup.mp4"
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
            style={{ backgroundColor: COLORS.cream }}
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
                    Over winter break, I interned at Manus AI, a general AI
                    agent that was growing faster than its users could keep up
                    with. As the agent became more intelligent, it became
                    harder for everyday users to understand, adopt, and
                    actually leverage it. With the newly launched version of
                    Manus 1.5 Max, feature depth was outpacing user
                    comprehension, and the existing community was a static
                    archive no one was navigating.
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
                    I led the end-to-end redesign of the Manus Community. This
                    consisted of not just a visual refresh, but a
                    re-architecture from passive content IA to an AI-guided
                    learning system that scales alongside both the product and
                    its users.
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
                          Leading user research, architecting the design
                          system, user flows, and interaction mechanisms, and
                          ideating our UI features.
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
                        <p className="m-0">1 Product Designer (me!)</p>
                        <p className="m-0">1 Co-Founder CMO</p>
                        <p className="m-0">2 Engineers</p>
                        <p className="m-0">2 PMs</p>
                        <p className="m-0">1 Business Strategist</p>
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
                  Retention increased from ~30% → 65–70%
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
                  Shipped & Handed-Off to Developers
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
          style={{ backgroundColor: "#FFFFFF" }}
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
                  The More Powerful Manus Got, the More People Struggled to Use It.
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
                  Manus AI was becoming one of the most capable AI agents on the market. But capability created a new problem: cognitive load. The more the product could do, the harder it was for non-technical users to figure out where to begin, what was possible, and how to meaningfully participate in the community surrounding it.
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
                  The community platform that existed was designed for a simpler product exploration and discovery of its features. It had static archive of past events and content with no clear pathways, no progression, and no sense of where a new user should even start.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Placeholder anchors for future sections (scroll-spy + smooth-scroll targets) */}
        <div id="development" aria-hidden style={{ minHeight: 0 }} />
        <div id="testing" aria-hidden style={{ minHeight: 0 }} />
        <div id="solution" aria-hidden style={{ minHeight: 0 }} />

        {/* ============================================================ */}
        {/* SECTION 4: SOLUTION PREVIEW FLOW (white bg) — id="solution-preview" */}
        {/* ============================================================ */}
        <section
          id="solution-preview"
          className="w-full"
          style={{ backgroundColor: "#FFFFFF" }}
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
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <FlowStep caption="User lands on community" className="md:col-span-3">
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

<FlowStep caption="AI infers role & builds their path" className="md:col-span-3">
                  <motion.div
                    layoutId="solution-preview-video-1"
                    onClick={() =>
                      setOpenVideo("/videos/manus/solution-2-paths.mp4")
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
                      src="/videos/manus/solution-2-paths.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover block"
                    />
                  </motion.div>
                  <ClickToEnlargeCaption />
                </FlowStep>

<FlowStep caption="Explores personalized recommendations" className="md:col-span-3">
                  <motion.div
                    layoutId="solution-preview-video-2"
                    onClick={() =>
                      setOpenVideo("/videos/manus/solution-3-recommendations.mp4")
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
                      src="/videos/manus/solution-3-recommendations.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover block"
                    />
                  </motion.div>
                  <ClickToEnlargeCaption />
                </FlowStep>

<FlowStep caption="Users grow alongside Manus" className="md:col-span-3">
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
          style={{ backgroundColor: "#FFFFFF" }}
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
                  Our First Two Approaches Both Failed Usability Testing.
                </h2>
              </div>
            </div>

            {/* ROW 1 — Hackathon video + Initial framing */}
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
                    src="/videos/manus/pivot-hackathon.mp4"
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
                  Our Initial Problem Framing →
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
                  We started by assuming the problem was motivation. If people weren&apos;t engaging, we thought gamification such as: points, levels, quests, would get them moving. We built toward it.
                </p>
              </div>

            </div>

            {/* ROW 2 — Lovable walkthrough video + Problem with first approach */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-[40px]">

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
                    src="/videos/manus/pivot-walkthrough.mp4"
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
                  The Problem with Our First Approach →
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
                  User testing showed that gamification was cognitively overwhelming. It added friction of top of an unclear system, as participants reported confusion around navigation, role progression, and what the game mechanics were for. This led us to pivot to a scalable, human-centered community system.
                </p>
              </div>

            </div>

            {/* FOOTNOTE — italic small, below row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-12">
                <p
                  style={{
                    fontFamily: "'Helvetica Neue', sans-serif",
                    fontSize: "14px",
                    fontWeight: 400,
                    fontStyle: "italic",
                    color: "#1E1E1E",
                    opacity: 0.7,
                    margin: 0,
                  }}
                >
                  *I built the early prototype using Lovable for rapid usability feedback.
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
          style={{ backgroundColor: "#FFFFFF" }}
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
                  Users Weren&apos;t Failing to Engage. They Were Failing to Understand.
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
                        &ldquo;I&apos;ve been using Manus for weeks, but some days I still can&apos;t figure out what new things upgraded. The community is filled with posts, but I have no idea what I missed past events.&rdquo;
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
                            color: "#C97836",
                          }}
                        >
                          Manus community member
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
                        &ldquo;I opened the community page and just scrolled. There was a lot, but I didn&apos;t know where to start or what was for me.&rdquo;
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
                            color: "#C97836",
                          }}
                        >
                          Manus community member
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
                        &ldquo;I want to <u>contribute and share</u>{" "}what I&apos;ve built, but I have no idea if anyone will see it or if it even matters. There&apos;s no feedback, <u>no signal</u>{" "}that my work is visible.&rdquo;
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
                            color: "#C97836",
                          }}
                        >
                          Manus community member
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
                  Drag or click to cycle through quotes
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
                  User interviews (13) and secondary research →
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
                    Cognitive overload averaged across non-technical users who couldn&apos;t identify what Manus could do for them specifically.
                  </p>
                </div>

                {/* Finding 2 — chat bubble */}
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
                      <path d="M17 10v4a3 3 0 01-3 3H6.83l-3.41 3.41A1 1 0 011 19V6a3 3 0 013-3h10a3 3 0 013 3v4z" />
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
                    Community structure felt like a static archive, leading users to disengage within minutes of arriving.
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
                    Users wanted to contribute but had no clear pathway to do so, leaving them passive instead of active.
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

                {/* Left group: Community Newcomers (5 participants) — cols 1-5 */}
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
                    Community Newcomers (5)
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {[1, 2, 5, 8, 9].map((num) => (
                      <div
                        key={`newcomer-${num}`}
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

                {/* Right group: Power Users (8 participants) — cols 6-12 */}
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
                    Power Users (8)
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {[3, 4, 6, 7, 10, 11, 12, 13].map((num) => (
                      <div
                        key={`poweruser-${num}`}
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

                {/* PERSONA 1 — Community Newcomer */}
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
                        src="/images/manus/research/persona-newcomer.png"
                        alt="Community Newcomer persona"
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
                        Community Newcomer
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
                        Age: 22–35
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
                        <u>Doesn&apos;t know</u> where to start or what Manus is capable of doing for them.
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
                        <u>Wants to learn fast</u>, find relevant opportunities, and get value quickly.
                      </p>
                    </div>
                  </div>
                </div>

                {/* PERSONA 2 — Power User */}
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
                        src="/images/manus/research/persona-power-user.png"
                        alt="Power User persona"
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
                        Power User
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
                        Age: 25–40+
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
                        Has <u>no structured way</u> to surface or share their work meaningfully.
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
                        <u>Wants visibility and credibility</u> for their contributions within the community.
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
          style={{ backgroundColor: "#FFFFFF" }}
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
                  Finding the Gaps in the Market →
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
                  What existed already left gaps where users needed structure, signal, and momentum.
                </h2>
              </div>
            </div>

            {/* 3-COLUMN COMPARISON GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-[100px]">

              {/* CARD 1 — Discord / Chat Communities */}
              <div
                className="rounded-2xl flex flex-col"
                style={{
                  backgroundColor: "#FFF5EF",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                  padding: "40px 32px",
                }}
              >
                <div className="flex justify-center mb-6">
                  <Image
                    src="/images/manus/gaps/icon-discord.svg"
                    alt="Discord / Chat Communities icon"
                    width={48}
                    height={48}
                  />
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
                  Discord / Chat Communities
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
                      Fast, informal interaction
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
                      Knowledge fragments instantly
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
                      No durable contribution tracking
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 2 — Gamified Builder Platforms */}
              <div
                className="rounded-2xl flex flex-col"
                style={{
                  backgroundColor: "#FFF5EF",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                  padding: "40px 32px",
                }}
              >
                <div className="flex justify-center mb-6">
                  <Image
                    src="/images/manus/gaps/icon-gamepad.svg"
                    alt="Gamified Builder Platforms icon"
                    width={48}
                    height={48}
                  />
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
                  Gamified Builder Platforms
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
                      Short-term engagement spikes
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
                      Incentivizes activity over impact
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
                      High cognitive load
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 3 — Traditional Forums & Docs */}
              <div
                className="rounded-2xl flex flex-col"
                style={{
                  backgroundColor: "#FFF5EF",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                  padding: "40px 32px",
                }}
              >
                <div className="flex justify-center mb-6">
                  <Image
                    src="/images/manus/gaps/icon-docs.svg"
                    alt="Traditional Forums & Docs icon"
                    width={48}
                    height={48}
                  />
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
                  Traditional Forums & Docs
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
                      Structured and searchable
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
                      Low participation, slow feedback
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
                      Not built for fast updates
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
                  How might we... make AI capabilities legible to everyday users?
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
                  How might we... turn passive members into active contributors?
                </p>
              </div>
            </div>

          </div>
        </section>

      </main>
      <Footer />

      <Lightbox
        isOpen={openVideo !== null}
        onClose={() => setOpenVideo(null)}
        videoSrc={openVideo || ""}
        layoutId={
          openVideo === "/videos/manus/solution-2-paths.mp4"
            ? "solution-preview-video-1"
            : "solution-preview-video-2"
        }
      />
    </>
  );
}
