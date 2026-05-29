"use client";

/**
 * About Me — src/app/about/page.tsx  (v2)
 * ---------------------------------------
 * Layout:
 *  1. Hero band       - cream, "Halo, I'm ____" + tile-jazlynn.png
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
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import InteractiveTypewriter from "@/components/InteractiveTypewriter";
import StackedDeck from "@/components/StackedDeck";

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

function CultureCarousel() {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1); // 1 = next (slide-in-from-right), -1 = prev
  const [animKey, setAnimKey] = useState(0); // forces re-mount so CSS animation replays

  const goto = (next: number, direction: 1 | -1) => {
    setDir(direction);
    setIdx(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
    setAnimKey((k) => k + 1);
  };
  const next = () => goto(idx + 1, 1);
  const prev = () => goto(idx - 1, -1);

  const slide = SLIDES[idx];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%" }}>
      {/* header swaps with the slide */}
      <SectionHeader>{slide.header}</SectionHeader>

      {/* carousel row: < arrow | image frame | > arrow */}
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

        {/* the image frame — fixed max width, overflow clipped for the slide animation */}
        <div
          style={{
            position: "relative",
            flex: "0 1 800px",
            maxWidth: 800,
            width: "100%",
            overflow: "hidden",
            borderRadius: 8,
          }}
        >
          <div
            key={animKey}
            style={{
              animation: `tw-slide-${dir === 1 ? "right" : "left"} 380ms ease-out`,
            }}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              width={1600}
              height={600}
              priority={idx === 0}
              style={{ display: "block", width: "100%", height: "auto" }}
            />
          </div>
        </div>

        <ArrowButton dir="right" onClick={next} ariaLabel="Next slide" />
      </div>

      {/* small dot indicators — full-width centered (matches centered image row above) */}
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          marginTop: 18,
          width: "100%",
        }}
      >
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Go to ${s.header}`}
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

      {/* slide keyframes */}
      <style>{`
        @keyframes tw-slide-right { from { transform: translateX(40px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        @keyframes tw-slide-left  { from { transform: translateX(-40px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
      `}</style>
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

/* --------------- Captioned card for about-me StackedDeck --------------- */
function CaptionedCard({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  const handleEnter = () => {
    window.dispatchEvent(new CustomEvent("cursor-mode", { detail: { mode: "caption", text: caption } }));
  };
  const handleLeave = () => {
    window.dispatchEvent(new CustomEvent("cursor-mode", { detail: { mode: "default" } }));
  };
  return (
    <div
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="w-full h-full rounded-2xl overflow-hidden bg-white"
    >
      <Image src={src} alt={alt} width={1200} height={1200} className="w-full h-full object-cover block" />
    </div>
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
      <section
        style={{
          background: "#FFF5EF",
          minHeight: "calc(100vh - 80px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 24,
          paddingBottom: 24,
        }}
      >
        <div
          className="max-w-[1228px] mx-auto px-6 w-full"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}
        >
          <p
            style={{
              fontFamily: FONTS.sans,
              fontSize: 48,
              fontWeight: 500,
              lineHeight: 1.1,
              color: C.ink,
              margin: 0,
              marginBottom: 16,
            }}
          >
            Halo, I&apos;m ________
          </p>
          <Image
            src="/images/about/hero/tile-jazlynn.png"
            alt="JAZLYNN"
            width={520}
            height={140}
            priority
            style={{ display: "block", width: "auto", maxWidth: "100%", height: "auto" }}
          />
          <div style={{ marginTop: 32 }}>
            <StackedDeck
              cardWidth={340}
              cardHeight={340}
              cards={[
                <CaptionedCard key="portrait" src="/images/about/hero/portrait.png" alt="Portrait of Jazlynn" caption="took this pic at a vintage photobooth @ amsterdam :)" />,
                <CaptionedCard key="snow" src="/images/about/about-me-stack/snowboarding.jpg" alt="Snowboarding" caption="ripped my acl from this, but i still luv snowboarding" />,
                <CaptionedCard key="bagel" src="/images/about/about-me-stack/bagels.jpg" alt="Bagels" caption="apollo bagels ftw" />,
                <CaptionedCard key="camera" src="/images/about/about-me-stack/camera.jpg" alt="Speakeasy" caption="love me a nice speak-easy bar" />,
                <CaptionedCard key="dog" src="/images/about/about-me-stack/dog-beach.jpg" alt="Beach dog" caption="im a huge dog person <3" />,
                <CaptionedCard key="mun" src="/images/about/about-me-stack/mun.jpg" alt="MUN" caption="fun fact: i was an mun gurlie" />,
                <CaptionedCard key="teach" src="/images/about/about-me-stack/teaching.jpg" alt="Teaching" caption="i teach kids ui/ux on the side — love my students" />,
              ]}
            />
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
      <section style={{ background: "#FFF5EF" }}>
        <div className="max-w-[1228px] mx-auto px-6" style={{ paddingTop: 64, paddingBottom: 96 }}>
          <InteractiveTypewriter />
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}
