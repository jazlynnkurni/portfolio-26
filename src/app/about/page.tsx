"use client";

/**
 * About Me — src/app/about/page.tsx  (v2)
 * ---------------------------------------
 * Layout:
 *  1. Hero band       - cream, holographic licence card (/jaz.svg) in a TiltCard
 *  2. About content   - white, 2-col: prose left, portrait right
 *  3. CULTURE CAROUSEL - white, one cycling carousel:
 *       slide 1: My Toolkit                     -> toolkit.png
 *       slide 2: My Music Taste (yes i'm aware) -> albums.png
 *       slide 3: My Fav Films                   -> films.png
 *       slide 4: My Best Reads                  -> books.png
 *     ~800px wide. < > arrows on each side. Smooth slide-l/r transition.
 *     Header swaps with the slide.
 *  4. Typewriter      - WHITE band, InteractiveTypewriter centerpiece
 *
 * Typography (matches Figma source):
 *   - Section headers:  Source Serif Pro / SemiBold / 24
 *   - Body prose:       Helvetica Neue / Regular / 18 / #000
 */

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Nav from "@/components/Nav";
import MahjongFooter from "@/components/MahjongFooter";
import RisoTypewriter from "@/components/typewriter/RisoTypewriter";
import { TiltCard } from "@/components/TiltCard";

const FONTS = {
  serif: '"Source Serif Pro", "Source Serif 4", Georgia, serif',
  sans: '"Helvetica Neue", Helvetica, Arial, sans-serif',
};

const C = {
  cream: "#FFF5EF",
  burntOrange: "#C97836",
  ink: "#000000",
};

/* -------------------- shared atoms -------------------- */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: FONTS.serif,
        fontSize: 24,
        fontWeight: 600,
        color: C.ink,
        margin: 0,
        marginBottom: 28,
        letterSpacing: "-0.005em",
      }}
    >
      {children}
    </h2>
  );
}

function ProseBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        borderLeft: `3px solid ${C.burntOrange}`,
        paddingLeft: 18,
        marginBottom: 20,
      }}
    >
      <h3
        style={{
          fontFamily: FONTS.serif,
          fontSize: 24,
          fontWeight: 600,
          color: C.ink,
          margin: 0,
          marginBottom: 10,
          letterSpacing: "-0.005em",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: FONTS.sans,
          fontSize: 18,
          fontWeight: 400,
          lineHeight: 1.5,
          color: C.ink,
          margin: 0,
          textAlign: "justify",
        }}
      >
        {children}
      </p>
    </div>
  );
}

/* ------------------- CULTURE CAROUSEL ------------------ */
type Slide = {
  id: string;
  header: string;
  src: string;
  alt: string;
};

const SLIDES: Slide[] = [
  { id: "toolkit", header: "My Toolkit",                                src: "/images/about/toolkit/toolkit.png", alt: "My toolkit" },
  { id: "music",   header: "My Music Taste (yes i’m aware it matters)", src: "/images/about/music/albums.png",    alt: "Favorite albums" },
  { id: "films",   header: "My Fav Films",                              src: "/images/about/films/films.png",    alt: "Favorite films" },
  { id: "books",   header: "My Best Reads",                             src: "/images/about/books/books.png",    alt: "Best reads" },
];

/* A springy carousel: the outgoing slide is popped out of flow rather than
   unmounted, so the incoming one takes its place on the SAME frame — that gap
   is what read as a blank pause before. The frame itself animates its own
   height on a spring, so when a slide is a different shape the box stretches
   into it rather than snapping. */
// damping ratio = damping / (2*sqrt(stiffness*mass)). At 24 this sat at 0.86 —
// under 1, so it overshot and wobbled back. 30 puts it just past 1: still a
// spring's ease-out, but it settles without the bounce.
const SPRING = { type: "spring" as const, stiffness: 230, damping: 30, mass: 0.85 };

const slideVariants = {
  enter: (d: 1 | -1) => ({ x: `${d * 46}%`, opacity: 0, scale: 0.97 }),
  center: { x: "0%", opacity: 1, scale: 1 },
  exit: (d: 1 | -1) => ({ x: `${d * -46}%`, opacity: 0, scale: 0.97 }),
};

function CultureCarousel() {
  const [[idx, dir], setState] = useState<[number, 1 | -1]>([0, 1]);

  const goto = (next: number, direction: 1 | -1) =>
    setState([((next % SLIDES.length) + SLIDES.length) % SLIDES.length, direction]);
  const next = () => goto(idx + 1, 1);
  const prev = () => goto(idx - 1, -1);

  const slide = SLIDES[idx];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%" }}>
      {/* Header swaps with the slide, on the same spring so the two read as
          one movement rather than two separate changes. */}
      <div style={{ position: "relative", minHeight: 52, width: "100%" }}>
        <AnimatePresence initial={false} mode="popLayout" custom={dir}>
          <motion.div
            key={slide.id}
            custom={dir}
            initial={{ opacity: 0, y: dir * 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: dir * -10 }}
            transition={{ ...SPRING, stiffness: 300, damping: 34 }}
          >
            <SectionHeader>{slide.header}</SectionHeader>
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          width: "100%",
        }}
      >
        <ArrowButton dir="left" onClick={prev} ariaLabel="Previous slide" />

        {/* `layout` on the frame is what gives the size change its rubber:
            when the next slide is a different aspect, the box springs to the
            new height instead of jumping. */}
        <motion.div
          layout
          transition={SPRING}
          style={{
            position: "relative",
            flex: "0 1 800px",
            maxWidth: 800,
            width: "100%",
            overflow: "hidden",
            borderRadius: 8,
          }}
        >
          <AnimatePresence initial={false} mode="popLayout" custom={dir}>
            <motion.div
              key={slide.id}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SPRING}
              style={{ width: "100%" }}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                width={1600}
                height={600}
                priority={idx === 0}
                style={{ display: "block", width: "100%", height: "auto" }}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <ArrowButton dir="right" onClick={next} ariaLabel="Next slide" />
      </div>

      {/* dots */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18, width: "100%" }}>
        {SLIDES.map((sl, i) => (
          <button
            key={sl.id}
            type="button"
            aria-label={`Go to ${sl.header}`}
            aria-current={i === idx}
            onClick={() => goto(i, i > idx ? 1 : -1)}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              border: "none",
              padding: 0,
              cursor: "pointer",
              background: i === idx ? C.burntOrange : "rgba(0,0,0,0.18)",
              transition: "background 160ms ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ArrowButton({
  dir,
  onClick,
  ariaLabel,
}: {
  dir: "left" | "right";
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        width: 38,
        height: 38,
        borderRadius: "50%",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: C.ink,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 140ms ease, transform 140ms ease",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(0,0,0,0.05)";
        e.currentTarget.style.transform = "scale(1.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {dir === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </button>
  );
}

/* =========================== PAGE =========================== */
export default function AboutPage() {
  return (
    <>
      <Nav />
      <main style={{ background: "#FFF5EF" }}>
      {/* ------------------ 1. HERO (viewport-fit) ----------------- */}
      {/* Heading + JAZLYNN tile + photo deck centered as one group inside
          one viewport height below the nav. Prose blocks are a separate
          section below so they're scrolled to, not crammed in. */}
      {/* Deliberately NOT viewport-height: the card is sized so the "About me"
          heading and the first lines of prose clear the fold, which is what
          tells a visitor there's more below. A full-bleed 100vh hero read as
          the whole page. */}
      <section
        style={{
          background: "#FFF5EF",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 112,
          paddingBottom: 40,
        }}
      >
        <div
          className="max-w-[1228px] mx-auto px-6 w-full"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}
        >
          {/* Holographic "about me" card — tilts, gleams, and shows an
              iridescent holo sweep under the pointer. The face is the
              "Permanent License of Travel" art (/jaz.svg, 2325x1471), laid in
              full-bleed: its baked-in paper edge already carries the rounding
              TiltCard clips to (8.17% / 12.91% == rx 190 on that viewBox), so
              no inner padding — any inset would show cream through the corners
              and double the border. Held to 600px so the "About me" prose below
              clears the fold; unoptimized because the SVG carries its own
              embedded rasters and the image optimizer only adds a hop. */}
          {/* w-full (not a vw cap) so the card stays inside the section's px-6
              gutter on phones — 92vw overflowed it and pushed the document
              wider than the viewport. */}
          <div className="w-full max-w-[600px]">
            <TiltCard maxTilt={14} glare={0.45} holo aspect="2325 / 1471" className="bg-[#FFF5EF]">
              <Image
                src="/jaz.svg"
                alt="Jazlynn Kurniandra — permanent license of travel"
                width={2325}
                height={1471}
                priority
                unoptimized
                /* The artwork doesn't fill its own viewBox: measured against a
                   magenta ground it leaves ~1.3% transparent at the BOTTOM and
                   0.2% on each side, which let the card's beige show through as
                   a pale band under the gold star border. Scaling ~1.5% from the
                   top edge pushes that gap past the card's clip; the top is
                   flush already so it stays put. */
                className="h-full w-full origin-top scale-[1.015] object-cover"
              />
            </TiltCard>
          </div>
        </div>
      </section>

      {/* -------------------- 2. PROSE BLOCKS --------------------- */}
      {/* Below the hero — scrolled-to. */}
      <section style={{ background: "#FFF5EF" }}>
        <div className="max-w-[1228px] mx-auto px-6 pt-8 pb-6">
          <div style={{ width: "100%" }}>
            <ProseBlock title="About me">
              I&apos;m a student at Columbia University majoring in Cognitive Science with a specialization in Human-Computer Interaction. Growing up, I&apos;ve always been fascinated by how we encounter and make sense of objects we see and hear. This curiosity is what drives my passion. It&apos;s hard for me to not pour it into every paper and pencil I grab. What started from one medium became limitless. From paintings to products, I&apos;m constantly discovering more about how observation and interaction shape meaning and form.
            </ProseBlock>
            <ProseBlock title="Experience">
              With experience in project management, design, marketing, and (currently learning) design engineering, I&apos;m an artist without boundaries. I don&apos;t like being constrained to one medium. Taking from each of these roles with sincerity and care, I pull knowledge across disciplines and craft it into something uniquely my own. This gives me a generalist perspective that lets me understand and solve problems with a human-centered, diverse approach.
            </ProseBlock>
            <ProseBlock title="Design Thinking">
              I&apos;m a creator at heart. I enjoy the process more than the product. Whether I sketch, read, or create, you&apos;ll always find tiny scrappy notes beside the work (the handwriting isn&apos;t great). This habit has taught me to love iteration. Constant revision isn&apos;t a setback, but rather the best part.
            </ProseBlock>
            <ProseBlock title="Philosophy">
              As a first-gen student, I grew up with a family that always reminded me: &ldquo;gotong royong,&rdquo; that we rise by lifting others. This saying lives in my design philosophy. I create for people, with inclusivity and accessibility at the heart of everything I make; a habit that I can never outgrow.
            </ProseBlock>
          </div>
        </div>
      </section>

      {/* ------------------ 3. CULTURE CAROUSEL ------------------- */}
      <section style={{ background: "#FFF5EF" }}>
        <div className="max-w-[1228px] mx-auto px-6 pt-4 pb-20">
          <CultureCarousel />
        </div>
      </section>

      {/* ------------------ 4. TYPEWRITER ------------------------ */}
      {/* The sheet is absolutely positioned and grows UPWARD out of the machine,
          overhanging the rig by ~150px. At paddingTop 64 the paper collided with
          the carousel above. 190 clears the overhang AND leaves a real section
          break, so the two stop reading as one compacted block. */}
      <section style={{ background: "#FFF5EF" }}>
        <div className="max-w-[1228px] mx-auto px-6" style={{ paddingTop: 320, paddingBottom: 130 }}>
          <RisoTypewriter />
        </div>
      </section>
      </main>
      <MahjongFooter />
    </>
  );
}
