"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MahjongFooter from "@/components/MahjongFooter";
import CaseStudyFooter from "@/components/CaseStudyFooter";
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
  { label: "Testing", id: "testing" },
  { label: "Development", id: "development" },
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
      aria-label="SomiaCX case study navigation"
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

export default function SomiaCXCaseStudy() {
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
                    src="/images/somiacx/hero/somiacx-mufg-logo.png"
                    alt="SomiaCX × MUFG Bank"
                    width={300}
                    height={68}
                    className="w-[300px] h-[68px]"
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
                    Architecting a unified UVP system for 3 financial subsidiaries.
                  </h1>
                </div>

                {/* Laptop mockup 874×536 — centered */}
                <div className="w-full max-w-[874px] mx-auto rounded-[15px] overflow-hidden">
                  <Image
                    src="/images/somiacx/hero/phone-home.png"
                    alt="SomiaCX mobile prototype — Home and Mitra screens"
                    width={2414}
                    height={1034}
                    className="w-full h-auto block"
                    priority
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
                    My first product internship!! I interned at SomiaCX as a
                    UX Designer, embedded inside a project for MUFG. They
                    have three separate subsidiaries (a bank, an insurance
                    company, and a vehicle financing arm) that were being
                    merged into one unified financial app. Each had
                    different users, different revenue models, and different
                    internal teams who didn&apos;t always agree on what the
                    product should do.
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
                    I worked on the UVP architecture that would hold all of
                    it together, a shared value framework that made each
                    subsidiary feel coherent, not competing, and that served
                    an incredibly diverse user base, from upper-income urban
                    professionals to low-income, unbanked Indonesians with no
                    digital literacy. By the end of this project, I had the
                    chance to present to our stakeholders.
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
                          UX Designer, conducting market research, product
                          alignment, UVP architecture, LoFi &amp; MidFi
                          prototyping.
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
                        <p className="m-0">1 Founder</p>
                        <p className="m-0">1 PM</p>
                        <p className="m-0">2 UX Designers (me!)</p>
                        <p className="m-0">1 SWE</p>
                        <p className="m-0">1 UI Designer</p>
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
                    <span
                      style={{
                        fontWeight: 400,
                        fontStyle: "italic",
                        opacity: 0.7,
                        marginLeft: 6,
                        fontSize: "0.85em",
                      }}
                    >
                      — Backed by final assessment from subsidiaries&apos; report
                    </span>
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
                <div className="col-span-12 flex flex-nowrap gap-4">
                <span
                  className="bg-[#C97836] rounded-[15px] text-[18px] whitespace-nowrap"
                  style={{
                    color: "#FFFFFF",
                    fontFamily: FONTS.sans,
                    fontWeight: 500,
                    padding: "12px 15px",
                  }}
                >
                  Cutting support tickets by 18%
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
                  Increased retention rate of ~72% onboarding
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
                  Projected ~25% reduction in branch visit dependency
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
          <div className="mx-auto max-w-[1228px] px-6 py-20">
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
                  How might we design a scalable shared UVP architecture that unifies three subsidiaries, serving diverse financial users inclusively?
                </h2>
                <p style={{ fontFamily: FONTS.sans, fontSize: 14, color: "#C0392B", marginTop: 12, marginBottom: 0, fontStyle: "italic" }}>
                  *Due to tight NDA restrictions, I can&apos;t show certain end products.
                </p>
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
                  MUFG&apos;s three subsidiaries had been operating independently for years, each with its own product logic, its own users, and its own definition of what &quot;financial services&quot; meant.
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
                  These three groups had almost nothing in common: different income levels, different relationships with technology, different mental models of what a financial app was even for. Yet all three were expected to converge inside a single unified ecosystem. That&apos;s when the real problem became clear: this wasn&apos;t just a design challenge. It was a product strategy, stakeholder alignment, and cultural inclusion challenge all at once.
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
          <div className="mx-auto max-w-[1228px] px-6 pt-0 pb-20">
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
                <FlowStep caption="User discovers the app" className="md:col-span-3">
                  <div className="w-[200px] h-[200px] flex items-center justify-center">
                    <Image
                      src="/images/somiacx/hero/phone.svg"
                      alt=""
                      width={120}
                      height={120}
                      aria-hidden
                    />
                  </div>
                </FlowStep>

<FlowStep caption="UVP system shows their financial path" className="md:col-span-3">
                  <Image
                    src="/images/somiacx/problem/solution-preview-lofi-uvp-4.png"
                    alt="LoFi prototype: UVP system shows financial path"
                    width={1200}
                    height={800}
                    className="w-full h-auto block"
                  />
                </FlowStep>

<FlowStep caption="Explores personalized financial features" className="md:col-span-3">
                  <Image
                    src="/images/somiacx/problem/solution-preview-midfi-uvp-5.png"
                    alt="MidFi prototype: explores personalized financial features"
                    width={1200}
                    height={800}
                    className="w-full h-auto block"
                  />
                </FlowStep>

<FlowStep caption="Users grow financial confidence with MUFG" className="md:col-span-3">
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
        {/* ============================================================ */}
        {/* SECTION 5: RESEARCH (white bg) — id="research" */}
        <section
          id="research"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <div className="max-w-[1228px] mx-auto px-6 py-20">
            {/* Eyebrow + h2 */}
            <p style={{ fontFamily: FONTS.sans, fontSize: 14, letterSpacing: "0.05em", textTransform: "uppercase", color: "#1E1E1E", marginBottom: 16 }}>
              Research
            </p>
            <h2 style={{ fontFamily: FONTS.serif, fontSize: "24px", fontWeight: 600, lineHeight: "1.3", color: "#1E1E1E", marginBottom: 64, maxWidth: "600px" }}>
              Users were Failing to See Themselves in The Product, Given Their Diverse Needs.
            </h2>

            {/* ROW 1: StackedDeck (left) + Desk Research finding (right) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16 items-start">
              <div className="md:col-span-7">
                <div style={{ marginLeft: -30 }}>
                <StackedDeck
                  cardWidth={500}
                  cardHeight={320}
                  cards={[
                    <div key="card-1" className="w-full h-full rounded-2xl overflow-hidden bg-white">
                      <Image
                        src="/images/somiacx/research/research-card-1-comics.png"
                        alt="Research process: three customer comic panels showing different priorities, constraints, and expectations"
                        width={1123}
                        height={773}
                        className="w-full h-full object-contain block"
                      />
                    </div>,
                    <div key="card-2" className="w-full h-full rounded-2xl overflow-hidden bg-white">
                      <Image
                        src="/images/somiacx/research/research-card-2-ideas.png"
                        alt="Research process: ideation board with brainstorm sketches"
                        width={1154}
                        height={655}
                        className="w-full h-full object-contain block"
                      />
                    </div>,
                    <div key="card-3" className="w-full h-full rounded-2xl overflow-hidden bg-white">
                      <Image
                        src="/images/somiacx/research/research-card-3-ranked.png"
                        alt="Research process: ranked priorities and findings"
                        width={1152}
                        height={654}
                        className="w-full h-full object-contain block"
                      />
                    </div>,
                  ]}
                />
                </div>
              </div>

              <div className="md:col-span-5">
                <h3 style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "18px", fontWeight: 600, color: "#1E1E1E", margin: 0, marginBottom: "16px" }}>
                  Desk Research &rarr;
                </h3>
                <p style={{ fontFamily: FONTS.sans, fontSize: 16, lineHeight: 1.6, color: "#1E1E1E" }}>
                  I conducted further analysis from company-shared private datasets (marketing, financial, and customer intelligence), and extensive desk research to really understand the problem.
                </p>
              </div>
            </div>

            {/* ROW 2: news+affinity image (left) + Insight finding (right) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16 items-start">
              <div className="md:col-span-7">
                <div className="rounded-2xl overflow-hidden transition-transform duration-300 ease-out hover:scale-[1.04] cursor-pointer" style={{ maxWidth: 620 }}>
                  <Image
                    src="/images/somiacx/research/news-article-affinity-map.png"
                    alt="Jakarta vehicle news article alongside UVP affinity mapping board"
                    width={1469}
                    height={852}
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                </div>
              </div>
              <div className="md:col-span-5">
                <h3 style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "18px", fontWeight: 600, color: "#1E1E1E", margin: 0, marginBottom: "16px" }}>
                  The insight that unlocked everything &rarr;
                </h3>
                <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "16px", lineHeight: "1.6", color: "#3A3A3A", marginBottom: "16px" }}>
                  At the end of 2023, Indonesia had approximately 132.43 million motorcycles and 17.17 million passenger cars. Beyond pure numbers, vehicles in Indonesia carry deep cultural weight. Vehicles are social signals, shared family assets, and often the single largest financial commitment a household makes. Vehicle financing installments touch every one of MUFG&apos;s three subsidiaries, and every one of their user segments.
                </p>
                <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "16px", lineHeight: "1.6", color: "#3A3A3A", fontStyle: "italic", margin: 0 }}>
                  It was the cultural anchor the unified experience needed.
                </p>
              </div>
            </div>

            {/* ROW 3: field-research image (left) + Field Research (right) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-7">
                <div className="rounded-2xl overflow-hidden transition-transform duration-300 ease-out hover:scale-[1.04] cursor-pointer" style={{ maxWidth: 620 }}>
                  <Image
                    src="/images/somiacx/research/field-research.png"
                    alt="Field research collage: testing photos, branch office visits, sticky note workshops"
                    width={1307}
                    height={908}
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                </div>
              </div>
              <div className="md:col-span-5">
                <h3 style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "18px", fontWeight: 600, color: "#1E1E1E", margin: 0, marginBottom: "16px" }}>
                  Field Research &rarr;
                </h3>
                <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "16px", lineHeight: "1.6", color: "#3A3A3A", margin: 0 }}>
                  I created sacrificial lo-fi concepts and took them directly into the field and to branch offices.
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* ============================================================ */}
        {/* SECTION 7: FINDING THE GAPS (white bg) — id="finding-the-gaps" */}
        {/* ============================================================ */}
        <section
          id="finding-the-gaps"
          className="w-full"
          style={{ backgroundColor: "#FFFFFF", scrollMarginTop: 100 }}
        >
          <div className="mx-auto max-w-[1228px] px-6 py-20">

            {/* EYEBROW */}
            <p
              style={{
                fontFamily: "'Helvetica Neue', sans-serif",
                fontSize: "18px",
                fontWeight: 600,
                color: "#1E1E1E",
                margin: 0,
                marginBottom: "40px",
              }}
            >
              Finding Gaps in the Market &rarr;
            </p>

            {/* MAIN ROW — mockups (left) + 4 stacked gap cards (right) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start mb-16">

              {/* LEFT — composed BCA + BRI phone mockup, cols 1-6 */}
              <div className="md:col-span-6">
                <Image
                  src="/images/somiacx/understanding-users/bca-bri-mobile-phone.png"
                  alt="BCA mobile and BRI mobile app home screens shown side by side, each surfacing a separate set of fragmented financial features"
                  width={1400}
                  height={1000}
                  className="w-full h-auto block"
                  style={{ maxWidth: 720 }}
                />
              </div>

              {/* RIGHT — 4 stacked gap cards, cols 7-12 */}
              <div className="md:col-span-5 md:col-start-8 flex flex-col gap-6">

                {/* GAP CARD 1 — One feature per subsidiary */}
                <div
                  className="rounded-2xl"
                  style={{
                    backgroundColor: "#FFF5EF",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    padding: "24px 28px",
                  }}
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E1E1E" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
                    </svg>
                    <h3 style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "18px", fontWeight: 600, color: "#1E1E1E", margin: 0 }}>
                      One feature per subsidiary
                    </h3>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B85042" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "15px", fontWeight: 400, lineHeight: "1.5", color: "#1E1E1E", margin: 0 }}>
                        Internal conflict with no visible unity. This is not user-friendly, especially for users who are financially and digitally illiterate.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A9471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="9 12 11 14 15 10" />
                      </svg>
                      <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "15px", fontWeight: 400, lineHeight: "1.5", color: "#1E1E1E", margin: 0 }}>
                        Relevant financial services that unify all three subsidiaries into one coherent experience.
                      </p>
                    </div>
                  </div>
                </div>

                {/* GAP CARD 2 — Lacks intuition */}
                <div
                  className="rounded-2xl"
                  style={{
                    backgroundColor: "#FFF5EF",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    padding: "24px 28px",
                  }}
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E1E1E" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
                    </svg>
                    <h3 style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "18px", fontWeight: 600, color: "#1E1E1E", margin: 0 }}>
                      Lacks intuition
                    </h3>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B85042" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "15px", fontWeight: 400, lineHeight: "1.5", color: "#1E1E1E", margin: 0 }}>
                        Users couldn&apos;t figure out what to do for next steps.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A9471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="9 12 11 14 15 10" />
                      </svg>
                      <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "15px", fontWeight: 400, lineHeight: "1.5", color: "#1E1E1E", margin: 0 }}>
                        Relevant financial services that unify all three subsidiaries into one coherent experience.
                      </p>
                    </div>
                  </div>
                </div>

                {/* GAP CARD 3 — Findings lack "so what?" */}
                <div
                  className="rounded-2xl"
                  style={{
                    backgroundColor: "#FFF5EF",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    padding: "24px 28px",
                  }}
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E1E1E" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
                    </svg>
                    <h3 style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "18px", fontWeight: 600, color: "#1E1E1E", margin: 0 }}>
                      Findings lack &quot;so what?&quot;
                    </h3>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B85042" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "15px", fontWeight: 400, lineHeight: "1.5", color: "#1E1E1E", margin: 0 }}>
                        Data without meaning.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A9471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="9 12 11 14 15 10" />
                      </svg>
                      <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "15px", fontWeight: 400, lineHeight: "1.5", color: "#1E1E1E", margin: 0 }}>
                        Tie incentives to a culturally relevant commonality.
                      </p>
                    </div>
                  </div>
                </div>

                {/* GAP CARD 4 — Feels cold or mechanical */}
                <div
                  className="rounded-2xl"
                  style={{
                    backgroundColor: "#FFF5EF",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    padding: "24px 28px",
                  }}
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E1E1E" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
                    </svg>
                    <h3 style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "18px", fontWeight: 600, color: "#1E1E1E", margin: 0 }}>
                      Feels cold or mechanical
                    </h3>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B85042" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "15px", fontWeight: 400, lineHeight: "1.5", color: "#1E1E1E", margin: 0 }}>
                        Blue color schemes tested as anxiety-inducing.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A9471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="9 12 11 14 15 10" />
                      </svg>
                      <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "15px", fontWeight: 400, lineHeight: "1.5", color: "#1E1E1E", margin: 0 }}>
                        Micro-joy, cultural warmth, and human tone throughout.
                      </p>
                    </div>
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
              Our Direction &rarr;
            </h3>

            {/* 2 PULL QUOTES — How might we... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div style={{ borderLeft: "3px solid #C97836", paddingLeft: "24px" }}>
                <p style={{ fontFamily: FONTS.serif, fontSize: "24px", fontWeight: 600, fontStyle: "normal", lineHeight: "1.3", color: "#1E1E1E", margin: 0 }}>
                  How might we... utilize collectivism as a design principle?
                </p>
              </div>
              <div style={{ borderLeft: "3px solid #C97836", paddingLeft: "24px" }}>
                <p style={{ fontFamily: FONTS.serif, fontSize: "24px", fontWeight: 600, fontStyle: "normal", lineHeight: "1.3", color: "#1E1E1E", margin: 0 }}>
                  How might we... implement familiarity in innovation?
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ============================================================ */}
        {/* ============================================================ */}
        {/* SECTION 9: TESTING (white bg) — id="testing" */}
        {/* ============================================================ */}
        <section
          id="testing"
          className="w-full"
          style={{ backgroundColor: "#FFFFFF", scrollMarginTop: 100 }}
        >
          <div className="mx-auto max-w-[1228px] px-6 py-20">

            {/* ROW 1 — quote deck (left) + interviews/findings (right) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16 items-start">

              {/* LEFT — h3 + StackedDeck of 3 quote cards, cols 1-7 */}
              <div className="md:col-span-7">
                <h3 style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "18px", fontWeight: 600, color: "#1E1E1E", margin: 0, marginBottom: "80px" }}>
                  Understanding our users &rarr;
                </h3>
                <StackedDeck
                  cardWidth={400}
                  cardHeight={340}
                  cards={[
                    <div key="card-1" className="w-full h-full rounded-2xl overflow-hidden bg-white">
                      <Image
                        src="/images/somiacx/usability/quote-car-owner.png"
                        alt="User quote from a car owner: wants to save for family but has no idea where to start, and feels there is no guidance"
                        width={679}
                        height={566}
                        className="w-full h-full object-cover block"
                      />
                    </div>,
                    <div key="card-2" className="w-full h-full rounded-2xl overflow-hidden bg-white">
                      <Image
                        src="/images/somiacx/usability/quote-motorcycle-customer.png"
                        alt="User quote from a motorcycle customer: opened the app and did not know if it was for someone like them, the language felt made for people richer than them"
                        width={739}
                        height={650}
                        className="w-full h-full object-cover block"
                      />
                    </div>,
                    <div key="card-3" className="w-full h-full rounded-2xl overflow-hidden bg-white">
                      <Image
                        src="/images/somiacx/usability/quote-motorcycle-owner-2.png"
                        alt="User quote from a motorcycle owner about paying installments and not understanding what other services the app offers"
                        width={656}
                        height={536}
                        className="w-full h-full object-cover block"
                      />
                    </div>,
                  ]}
                />
              </div>

              {/* RIGHT — h3 + 3 findings, cols 8-12 */}
              <div className="md:col-span-5 md:col-start-8 md:pt-[136px]">
                <h3 style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "18px", fontWeight: 600, color: "#1E1E1E", margin: 0, marginBottom: "24px" }}>
                  User interviews (12) and secondary research &rarr;
                </h3>

                <div className="flex flex-col gap-6">

                  {/* Finding 1 — clock */}
                  <div className="flex items-start gap-3">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C97836" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                    <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "16px", fontWeight: 400, lineHeight: "1.5", color: "#1E1E1E", margin: 0 }}>
                      Users across income segments couldn&apos;t connect their installment payments to broader financial services available within the same ecosystem.
                    </p>
                  </div>

                  {/* Finding 2 — thumbs-down */}
                  <div className="flex items-start gap-3">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C97836" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                      <path d="M17 14V3" />
                      <path d="M17 14l-4 7a2 2 0 0 1-3-2v-4H5a2 2 0 0 1-2-2.3l1.5-7A2 2 0 0 1 6.5 4H17" />
                    </svg>
                    <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "16px", fontWeight: 400, lineHeight: "1.5", color: "#1E1E1E", margin: 0 }}>
                      Lower-income users felt the product tone and language created distance. It didn&apos;t feel made for someone like them.
                    </p>
                  </div>

                  {/* Finding 3 — hourglass */}
                  <div className="flex items-start gap-3">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C97836" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                      <path d="M6 2h12" />
                      <path d="M6 22h12" />
                      <path d="M6 2c0 5 6 6 6 10s-6 5-6 10" />
                      <path d="M18 2c0 5-6 6-6 10s6 5 6 10" />
                    </svg>
                    <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "16px", fontWeight: 400, lineHeight: "1.5", color: "#1E1E1E", margin: 0 }}>
                      Internal teams had no unified customer view. Each subsidiary managed users independently, making holistic service slow.
                    </p>
                  </div>

                </div>
              </div>
            </div>

            {/* ROW 2 — 3 persona columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

              {/* COLUMN 1 — Motorcycle owners */}
              <div className="flex flex-col">
                {/* 4 numbered user-icon dots */}
                <div className="flex gap-3 mb-6">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="flex flex-col items-center" style={{ width: 48 }}>
                      <span style={{ fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace", fontSize: 11, color: "#3A3A3A", marginBottom: 2 }}>{n}</span>
                      <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#F2EAE3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8A8175" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>

                {/* persona card */}
                <div className="rounded-2xl flex items-center gap-4" style={{ backgroundColor: "#FFF5EF", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", padding: "20px" }}>
                  <div style={{ flexShrink: 0, width: 72, height: 72, borderRadius: 12, overflow: "hidden" }}>
                    <Image src="/images/manus/research/persona-power-user.png" alt="Motorcycle owners persona avatar" width={72} height={72} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "18px", fontWeight: 600, color: "#1E1E1E", margin: 0 }}>Motorcycle owners</p>
                    <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "14px", fontWeight: 400, color: "#3A3A3A", margin: "4px 0 0 0" }}>Income: ~$193&ndash;$1,290/month</p>
                  </div>
                </div>

                {/* sub-points */}
                <div className="flex flex-col gap-4 mt-6">
                  <div className="flex items-start gap-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C97836" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                    <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "15px", fontWeight: 400, lineHeight: "1.5", color: "#1E1E1E", margin: 0 }}>
                      Pays installments regularly but doesn&apos;t know what other financial services they qualify for within the same app.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C97836" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "15px", fontWeight: 400, lineHeight: "1.5", color: "#1E1E1E", margin: 0 }}>
                      Wants to understand the total cost of vehicle ownership without going to a branch every time.
                    </p>
                  </div>
                </div>
              </div>

              {/* COLUMN 2 — Car owners */}
              <div className="flex flex-col">
                <div className="flex gap-3 mb-6">
                  {[5, 6, 7, 8].map((n) => (
                    <div key={n} className="flex flex-col items-center" style={{ width: 48 }}>
                      <span style={{ fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace", fontSize: 11, color: "#3A3A3A", marginBottom: 2 }}>{n}</span>
                      <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#F2EAE3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8A8175" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl flex items-center gap-4" style={{ backgroundColor: "#FFF5EF", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", padding: "20px" }}>
                  <div style={{ flexShrink: 0, width: 72, height: 72, borderRadius: 12, overflow: "hidden" }}>
                    <Image src="/images/manus/research/persona-newcomer.png" alt="Car owners persona avatar" width={72} height={72} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "18px", fontWeight: 600, color: "#1E1E1E", margin: 0 }}>Car owners</p>
                    <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "14px", fontWeight: 400, color: "#3A3A3A", margin: "4px 0 0 0" }}>Income: ~$320&ndash;$1,290+/month</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 mt-6">
                  <div className="flex items-start gap-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C97836" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                    <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "15px", fontWeight: 400, lineHeight: "1.5", color: "#1E1E1E", margin: 0 }}>
                      Manages banking and financing separately; no single view of their full financial picture.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C97836" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "15px", fontWeight: 400, lineHeight: "1.5", color: "#1E1E1E", margin: 0 }}>
                      Wants one place to track installments, insurance, and savings without switching between apps or branches.
                    </p>
                  </div>
                </div>
              </div>

              {/* COLUMN 3 — Internal subsidiary team */}
              <div className="flex flex-col">
                <div className="flex gap-3 mb-6">
                  {[9, 10, 11, 12].map((n) => (
                    <div key={n} className="flex flex-col items-center" style={{ width: 48 }}>
                      <span style={{ fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace", fontSize: 11, color: "#3A3A3A", marginBottom: 2 }}>{n}</span>
                      <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#F2EAE3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8A8175" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl flex items-center gap-4" style={{ backgroundColor: "#FFF5EF", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", padding: "20px" }}>
                  <div style={{ flexShrink: 0, width: 72, height: 72, borderRadius: 12, overflow: "hidden" }}>
                    <Image src="/images/conduit/users/core-user-avatar.png" alt="Internal subsidiary team persona avatar" width={72} height={72} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "18px", fontWeight: 600, color: "#1E1E1E", margin: 0 }}>Internal subsidiary team</p>
                    <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "14px", fontWeight: 400, color: "#3A3A3A", margin: "4px 0 0 0" }}>Income: ~$658&ndash;$1,290+/month</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 mt-6">
                  <div className="flex items-start gap-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C97836" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                    <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "15px", fontWeight: 400, lineHeight: "1.5", color: "#1E1E1E", margin: 0 }}>
                      Each subsidiary operates its own system. No shared logic, no unified customer view across the three.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C97836" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "15px", fontWeight: 400, lineHeight: "1.5", color: "#1E1E1E", margin: 0 }}>
                      Wants a platform architecture that lets them serve customers across subsidiaries.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ============================================================ */}
        {/* ============================================================ */}
        {/* SECTION 8: DEVELOPMENT (white bg) — id="development" */}
        {/* ============================================================ */}
        <section
          id="development"
          className="w-full"
          style={{ backgroundColor: "#FFFFFF", scrollMarginTop: 100 }}
        >
          <div className="mx-auto max-w-[1228px] px-6 py-20">

            {/* SECTION HEADER */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16">
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
                  Six Pillars Built Around Culture. Four Survived Stakeholder Reality.
                </h2>
              </div>
            </div>

            {/* SIX UVP ROWS — each png is a full composed row (Ideation + MidFi) */}
            <div className="flex flex-col gap-12">
              <div className="overflow-hidden rounded-2xl">
                <Image
                  src="/images/somiacx/development/uvp-1.png"
                  alt="UVP 1 — Support (Safety Net). Ideation mindmap with value enablers and pain points resolved, tagline Make the Unpredictable, Predictable, alongside MidFi prototype and user journey screens."
                  width={2687}
                  height={819}
                  className="w-full h-auto block transition-transform duration-300 ease-out hover:scale-[1.03] cursor-pointer"
                />
              </div>
              <div className="overflow-hidden rounded-2xl">
                <Image
                  src="/images/somiacx/development/uvp-2.png"
                  alt="UVP 2 — Advisor (Future Planning). Ideation mindmap with value enablers and pain points resolved, tagline Optimize your future with your own advisor, alongside MidFi user journey screens."
                  width={2664}
                  height={823}
                  className="w-full h-auto block transition-transform duration-300 ease-out hover:scale-[1.03] cursor-pointer"
                />
              </div>
              <div className="overflow-hidden rounded-2xl">
                <Image
                  src="/images/somiacx/development/uvp-3.png"
                  alt="UVP 3 — Mentor (Vehicle Understanding). Ideation mindmap with value enablers and pain points resolved, tagline Knowledgeable companionship with your own vehicle mentor, alongside MidFi prototype screens."
                  width={2694}
                  height={814}
                  className="w-full h-auto block transition-transform duration-300 ease-out hover:scale-[1.03] cursor-pointer"
                />
              </div>
              <div className="overflow-hidden rounded-2xl">
                <Image
                  src="/images/somiacx/development/uvp-4.png"
                  alt="UVP 4 — Assistant (Routine Management). Ideation mindmap with value enablers and pain points resolved, tagline Manage life chores easier with your personalized assistant, alongside MidFi prototype screens."
                  width={2710}
                  height={854}
                  className="w-full h-auto block transition-transform duration-300 ease-out hover:scale-[1.03] cursor-pointer"
                />
              </div>
              <div className="overflow-hidden rounded-2xl">
                <Image
                  src="/images/somiacx/development/uvp-5.png"
                  alt="UVP 5 — Buddy (Family and Social Savings). Ideation mindmap with value enablers and pain points resolved, tagline Better together with a Buddy, alongside MidFi prototype screens."
                  width={2783}
                  height={865}
                  className="w-full h-auto block transition-transform duration-300 ease-out hover:scale-[1.03] cursor-pointer"
                />
              </div>
              <div className="overflow-hidden rounded-2xl">
                <Image
                  src="/images/somiacx/development/uvp-6.png"
                  alt="UVP 6 — Connector (Local Inclusion). Ideation mindmap with value enablers and pain points resolved, tagline Grow together with your Local Community, alongside MidFi user journey screens."
                  width={2789}
                  height={890}
                  className="w-full h-auto block transition-transform duration-300 ease-out hover:scale-[1.03] cursor-pointer"
                />
              </div>
            </div>

          </div>
        </section>






        {/* ============================================================ */}
        {/* SECTION 9: SOLUTION (white bg) — id="solution" */}
        {/* ============================================================ */}
        <section
          id="solution"
          className="w-full"
          style={{ backgroundColor: "#FFFFFF", scrollMarginTop: 100 }}
        >
          <div className="mx-auto max-w-[1228px] px-6 py-20">

            {/* SECTION HEADER */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16">
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
                    maxWidth: "560px",
                  }}
                >
                  A Shared UVP Architecture That Unifies Subsidiaries Without Disregarding Their Users.
                </h2>
              </div>
            </div>

            {/* UVP GRID (left) + POST STAKEHOLDER (right) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start mb-16">

              {/* LEFT — 2x3 UVP tile grid, cols 1-7 */}
              <div className="md:col-span-7">
                <div className="grid grid-cols-3 gap-5">
                  {[
                    { n: "UVP 1", name: "Support", sub: "(Safety Net)", bg: "#6E9266", text: "#FFFFFF", subColor: "rgba(255,255,255,0.85)" },
                    { n: "UVP 2", name: "Advisor", sub: "(Future Planning)", bg: "#6E9266", text: "#FFFFFF", subColor: "rgba(255,255,255,0.85)" },
                    { n: "UVP 3", name: "Mentor", sub: "MERGE WITH UVP 4", bg: "#F5E1A4", text: "#7A6A2F", subColor: "rgba(122,106,47,0.75)" },
                    { n: "UVP 4", name: "Assistant", sub: "(Routine Management)", bg: "#6E9266", text: "#FFFFFF", subColor: "rgba(255,255,255,0.85)" },
                    { n: "UVP 5", name: "Shared Wallet", sub: "LOW ROI", bg: "#A8341F", text: "#FFFFFF", subColor: "rgba(255,255,255,0.85)" },
                    { n: "UVP 6", name: "Local Investment", sub: "MISALIGNED KPI", bg: "#A8341F", text: "#FFFFFF", subColor: "rgba(255,255,255,0.85)" },
                  ].map((tile) => (
                    <div
                      key={tile.n}
                      className="rounded-2xl flex flex-col items-center justify-center text-center"
                      style={{
                        backgroundColor: tile.bg,
                        aspectRatio: "1 / 1",
                        padding: "16px",
                      }}
                    >
                      <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "22px", fontWeight: 600, color: tile.text, margin: 0 }}>
                        {tile.n}
                      </p>
                      <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "14px", fontWeight: 500, color: tile.text, margin: "8px 0 0 0" }}>
                        {tile.name}
                      </p>
                      <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "12px", fontWeight: 400, color: tile.subColor, margin: "2px 0 0 0" }}>
                        {tile.sub}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT — Post Stakeholder Meeting copy, cols 8-12 */}
              <div className="md:col-span-5 md:col-start-8">
                <h3 style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "18px", fontWeight: 600, color: "#1E1E1E", margin: 0, marginBottom: "16px" }}>
                  Post Stakeholder Meeting &rarr;
                </h3>
                <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "16px", fontWeight: 400, lineHeight: "1.6", color: "#1E1E1E", margin: 0, marginBottom: "16px" }}>
                  After presenting all six pillars, stakeholder feedback forced hard prioritization.
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                  <li style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "16px", fontWeight: 400, lineHeight: "1.6", color: "#1E1E1E", paddingLeft: "20px", position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, top: 0 }}>&bull;</span>
                    UVP 3 (Mentor) was merged with UVP 4 (Assistant), their overlap was too significant to justify maintaining separately.
                  </li>
                  <li style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "16px", fontWeight: 400, lineHeight: "1.6", color: "#1E1E1E", paddingLeft: "20px", position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, top: 0 }}>&bull;</span>
                    UVP 5 (Shared Wallet) was flagged as low ROI.
                  </li>
                  <li style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "16px", fontWeight: 400, lineHeight: "1.6", color: "#1E1E1E", paddingLeft: "20px", position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, top: 0 }}>&bull;</span>
                    UVP 6 (Local Investment) was misaligned with KPIs at the subsidiary level.
                  </li>
                </ul>
                <p style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "16px", fontWeight: 400, lineHeight: "1.6", color: "#1E1E1E", margin: "16px 0 0 0" }}>
                  Four pillars moved forward. Two were cut.
                </p>
              </div>
            </div>

            {/* THE RESULTS — sub-section */}
            <h3 style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: "18px", fontWeight: 700, color: "#1E1E1E", margin: 0, marginBottom: "40px" }}>
              The Results &rarr;
            </h3>

            {/* 3 tilted result cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

              {/* CARD 1 — chart */}
              <div
                className="rounded-2xl"
                style={{ backgroundColor: "#FFF5EF", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", padding: "32px", transform: "rotate(-1.5deg)" }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C97836" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "24px" }}>
                  <path d="M3 3v18h18" />
                  <path d="M7 14l4-4 4 4 5-5" />
                </svg>
                <p style={{ fontFamily: FONTS.sans, fontSize: "16px", fontWeight: 400, lineHeight: "1.6", color: "#1E1E1E", margin: 0 }}>
                  First-round UVP testing, backed by the subsidiaries&apos; final assessment report, <strong>showed an 18% reduction in user friction and support tickets.</strong>
                </p>
              </div>

              {/* CARD 2 — clock */}
              <div
                className="rounded-2xl"
                style={{ backgroundColor: "#FFF5EF", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", padding: "32px", transform: "rotate(1deg)" }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C97836" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "24px" }}>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                <p style={{ fontFamily: FONTS.sans, fontSize: "16px", fontWeight: 400, lineHeight: "1.6", color: "#1E1E1E", margin: 0 }}>
                  Culturally grounded design choices resonated in testing across income and literacy levels, <strong>showing a retention rate of ~72% across onboarding flows.</strong>
                </p>
              </div>

              {/* CARD 3 — thumbs up */}
              <div
                className="rounded-2xl"
                style={{ backgroundColor: "#FFF5EF", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", padding: "32px", transform: "rotate(-1deg)" }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C97836" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "24px" }}>
                  <path d="M7 10v11" />
                  <path d="M7 10l4-7a2 2 0 0 1 3 2v4h5a2 2 0 0 1 2 2.3l-1.5 7A2 2 0 0 1 17.5 20H7" />
                </svg>
                <p style={{ fontFamily: FONTS.sans, fontSize: "16px", fontWeight: 400, lineHeight: "1.6", color: "#1E1E1E", margin: 0 }}>
                  <strong>Projected ~25% reduction in branch visit dependency</strong> as users reported feeling confident navigating financial decisions independently.
                </p>
              </div>
            </div>

            {/* REFLECTION paragraph */}
            <p style={{ fontFamily: FONTS.sans, fontSize: "16px", fontWeight: 400, lineHeight: "1.6", color: "#1E1E1E", margin: "60px 0 0 0" }}>
              I also learned that sometimes it&apos;s okay to say no to stakeholders. Clarity under stakeholder pressure is a design skill. When everyone is asking for more, the ability to say &quot;this specific thing, done well, serves the goal better than adding another feature&quot; requires both research grounding and confidence in the process. This is the type of skill I couldn&apos;t have learned from the books.
            </p>

          </div>
        </section>

        {/* ============================================================ */}
        {/* FINAL THOUGHTS (white bg) — id="final-thoughts" */}
        {/* ============================================================ */}
        <section id="final-thoughts" style={{ background: "#FFFFFF", paddingTop: 80, paddingBottom: 16, scrollMarginTop: 100 }}>
          <div className="max-w-[1228px] mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

              {/* LEFT — StackedDeck of 3 team photos, cols 1-6 */}
              <div className="md:col-span-6 flex justify-center">
                <StackedDeck
                  cardWidth={500}
                  cardHeight={340}
                  cards={[
                    <div
                      key="selfie"
                      style={{ width: "100%", height: "100%", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", lineHeight: 0, fontSize: 0 }}
                    >
                      <Image
                        src="/images/somiacx/final-thoughts/team-selfie.png"
                        alt="SomiaCX team selfie celebrating together"
                        width={500}
                        height={340}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", verticalAlign: "top" }}
                      />
                    </div>,
                    <div
                      key="meeting"
                      style={{ width: "100%", height: "100%", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", lineHeight: 0, fontSize: 0 }}
                    >
                      <Image
                        src="/images/somiacx/final-thoughts/meeting.png"
                        alt="SomiaCX team in a working meeting"
                        width={500}
                        height={340}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", verticalAlign: "top" }}
                      />
                    </div>,
                    <div
                      key="working"
                      style={{ width: "100%", height: "100%", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", lineHeight: 0, fontSize: 0 }}
                    >
                      <Image
                        src="/images/somiacx/final-thoughts/working.png"
                        alt="SomiaCX team working at the office"
                        width={500}
                        height={340}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", verticalAlign: "top" }}
                      />
                    </div>,
                  ]}
                />
              </div>

              {/* RIGHT — eyebrow + h2 + 3 takeaways, cols 7-12 */}
              <div className="md:col-span-6">
                <div style={{ fontFamily: FONTS.sans, fontSize: 14, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", color: "#1E1E1E", marginBottom: 12 }}>
                  Final Thoughts
                </div>

                <h2 style={{ fontFamily: FONTS.serif, fontWeight: 600, fontSize: 24, lineHeight: 1.3, color: "#1E1E1E", marginBottom: 32, maxWidth: 600 }}>
                  Key Takeaways and Next Steps.
                </h2>

                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 20 }}>
                  <li style={{ fontFamily: FONTS.sans, fontSize: 16, lineHeight: 1.6, color: "#1E1E1E", paddingLeft: 20, position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, top: 0 }}>&bull;</span>
                    Designing for financial inclusion across a diverse population taught me that systems-level thinking and cultural humility comes to the forefront, before any other product decisions.
                  </li>
                  <li style={{ fontFamily: FONTS.sans, fontSize: 16, lineHeight: 1.6, color: "#1E1E1E", paddingLeft: 20, position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, top: 0 }}>&bull;</span>
                    In-depth research is the way to go. More participants, the more inclusive design you&rsquo;re able to craft.
                  </li>
                  <li style={{ fontFamily: FONTS.sans, fontSize: 16, lineHeight: 1.6, color: "#1E1E1E", paddingLeft: 20, position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, top: 0 }}>&bull;</span>
                    I also learned that clarity, good communication, and general business knowledge under stakeholder pressure are important skills to have.
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* NEXT STEPS (white bg) — 3-col icon row */}
        {/* ============================================================ */}
        <section style={{ background: "#FFFFFF", paddingTop: 0, paddingBottom: 80, scrollMarginTop: 100 }}>
          <div className="max-w-[1228px] mx-auto px-6">

            <div style={{ fontFamily: FONTS.sans, fontSize: 18, fontWeight: 700, color: "#1E1E1E", marginBottom: 48 }}>
              Next Steps &rarr;
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Col 1 — folder-up */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div style={{ width: 96, height: 96, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Image src="/images/manus/next-steps/icon-folder-up.svg" alt="Folder upload" width={96} height={96} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <p style={{ fontFamily: FONTS.sans, fontSize: 16, lineHeight: 1.6, color: "#1E1E1E", maxWidth: 320, margin: 0 }}>
                  Hand off to design and dev team
                </p>
              </div>

              {/* Col 2 — doc-search */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div style={{ width: 96, height: 96, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Image src="/images/manus/next-steps/icon-doc-search.svg" alt="Document with search" width={96} height={96} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <p style={{ fontFamily: FONTS.sans, fontSize: 16, lineHeight: 1.6, color: "#1E1E1E", maxWidth: 320, margin: 0 }}>
                  Longitudinal testing of the personalization layer to validate UVPs
                </p>
              </div>

              {/* Col 3 — laptop */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div style={{ width: 96, height: 96, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Image src="/images/manus/next-steps/icon-laptop.svg" alt="Laptop" width={96} height={96} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <p style={{ fontFamily: FONTS.sans, fontSize: 16, lineHeight: 1.6, color: "#1E1E1E", maxWidth: 320, margin: 0 }}>
                  Realign with stakeholder needs
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
      <CaseStudyFooter currentSlug="somia-cx" variant="beige" />
      <MahjongFooter />

    </>
  );
}
