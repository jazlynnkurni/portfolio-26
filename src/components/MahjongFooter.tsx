"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import MahjongTiles from "@/components/MahjongTiles";

// Smooth underline that grows left → right on hover (mirrors the site's
// .footer-link animation, in the footer's own text colour). Instant for
// visitors who prefer reduced motion.
const linkClass =
  "relative inline-block after:absolute after:left-0 after:-bottom-0.5 " +
  "after:h-px after:w-0 after:bg-current after:transition-[width] " +
  "after:duration-[250ms] after:ease-out hover:after:w-full " +
  "motion-reduce:after:transition-none";

// Cascade order for the fade-in-down entrance (see .footer-reveal in globals).
const rise = (i: number) => ({ ["--i" as string]: i }) as CSSProperties;

// An emoji that "peeps out" from the preceding word on hover of the phrase:
// clipped to zero width, it slides in left → right when the phrase (.group) is
// hovered and retracts right → left when it isn't — same ease-out bezier both
// ways. Decorative, so hidden from the a11y tree.
function Peek({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="inline-flex max-w-0 overflow-hidden align-middle transition-[max-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:max-w-[1.8em] motion-reduce:transition-none"
    >
      <span className="translate-x-[-0.7em] pl-1 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none">
        {children}
      </span>
    </span>
  );
}

/**
 * Beige mahjong-tile footer: the links row (with hover underline + peeking
 * NYC/Indonesia emojis) over the interactive physics tile band. The whole
 * block cascades in (fade-in-down, per item) the first time it scrolls into
 * view.
 */
export default function MahjongFooter() {
  const rootRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  // Play the entrance cascade once the footer scrolls into view.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true); // no observer support → just show it
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <footer
      ref={rootRef}
      className={`footer-reveal ${inView ? "is-in" : ""} flex flex-col overflow-x-hidden pb-14`}
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      {/* Divider + links share the work section's exact grid (px on the outer
          wrapper, max-w-7xl on the inner) so the rule and © line up with the
          left case-study card and the right edge of the cards. */}
      <div className="px-6 md:px-16">
        <div className="mx-auto max-w-7xl">
          {/* 2px burnt-orange rule splitting the footer from the case studies */}
          <div
            className="rise h-0.5 w-full bg-accent-orange"
            style={rise(0)}
          />

          <div className="flex flex-col gap-8 pt-12 md:flex-row md:justify-between md:pt-14">
            <p
              className="rise group cursor-default font-serif text-lg font-semibold text-ink"
              style={rise(1)}
            >
              © made in NYC<Peek>🗽</Peek>, with love from Indonesia
              <Peek>🇮🇩</Peek>
            </p>
            <div className="flex gap-16 font-mono text-sm uppercase tracking-wide text-ink">
              <ul className="flex flex-col gap-5">
                <li className="rise" style={rise(2)}>
                  <a href="mailto:jazkurnz06@gmail.com" className={linkClass}>
                    EMAIL
                  </a>
                </li>
                <li className="rise" style={rise(3)}>
                  <a
                    href="https://x.com/jazlynnkurni"
                    target="_blank"
                    rel="noreferrer"
                    className={linkClass}
                  >
                    X
                  </a>
                </li>
                <li className="rise" style={rise(4)}>
                  <a
                    href="https://www.linkedin.com/in/jazlynn-kurniandra-a456292a8/"
                    target="_blank"
                    rel="noreferrer"
                    className={linkClass}
                  >
                    LINKEDIN
                  </a>
                </li>
              </ul>
              <ul className="flex flex-col gap-5">
                <li className="rise" style={rise(2)}>
                  <Link href="/" className={linkClass}>
                    HOME
                  </Link>
                </li>
                <li className="rise" style={rise(3)}>
                  <Link href="/art-gallery" className={linkClass}>
                    ART GALLERY
                  </Link>
                </li>
                <li className="rise" style={rise(4)}>
                  <Link href="/about" className={linkClass}>
                    ABOUT ME
                  </Link>
                </li>
                <li className="rise" style={rise(5)}>
                  <a
                    href="https://drive.google.com/file/d/1W2XFyFbFbd1LrVWYK8Or2wfKZBIP29sg/view"
                    target="_blank"
                    rel="noreferrer"
                    className={linkClass}
                  >
                    RESUME
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive physics tile band — contained to the same grid as the rule
          so the row fits within the orange line. Rises in last. */}
      <div className="mt-16 px-6 md:px-16">
        <div className="rise mx-auto max-w-7xl" style={rise(7)}>
          <MahjongTiles height={230} />
        </div>
      </div>
    </footer>
  );
}
