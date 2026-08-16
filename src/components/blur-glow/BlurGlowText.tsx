"use client";

/**
 * BlurGlowText — React mount for the WebGL BlurGlow engine.
 * Renders the word ("Jazlynn") as a live multi-pass gaussian-bloom glow on the
 * site cream (seamless, no card). Pauses offscreen / when hidden; one static
 * frame under reduced motion; rebuilds metrics on resize + font load.
 */

import { useEffect, useRef } from "react";
import { BlurGlow } from "./engine";

export function BlurGlowText({ className }: { className?: string } = {}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const glow = new BlurGlow(host);
    let onScreen = false;

    const apply = () => {
      if (reduced) {
        glow.stop();
        glow.renderStill(true);
        return;
      }
      if (onScreen && !document.hidden) glow.start();
      else glow.stop();
    };

    const io = new IntersectionObserver(
      (es) => {
        onScreen = es.some((e) => e.isIntersecting);
        apply();
      },
      { rootMargin: "200px" },
    );
    io.observe(host);

    const ro = new ResizeObserver(() => glow.onResize());
    ro.observe(host);

    const onVis = () => apply();
    document.addEventListener("visibilitychange", onVis);

    const ready = document.fonts?.ready;
    if (ready) ready.then(() => glow.refreshFont()).catch(() => {});

    return () => {
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      glow.destroy();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label="Jazlynn"
      className={className ?? "relative aspect-[1344/620] w-full overflow-hidden"}
    />
  );
}

export default BlurGlowText;
