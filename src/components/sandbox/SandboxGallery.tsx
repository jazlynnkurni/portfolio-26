"use client";

/**
 * SandboxGallery
 * --------------
 * A masonry "wall" of showcase clips (recent.design style). Receives a flat
 * list from the server page (which lists public/videos/SandboxVideos), so it
 * scales as more work is added. Videos autoplay muted while in view and pause
 * when scrolled away. Clicking a tile opens its linked X post in a new tab.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export type SandboxItem = {
  src: string;
  type: "video" | "image";
  project: string;
  /** External link (X post). The whole tile opens this. */
  href?: string;
};

function useAutoplayInView() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.4) {
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        }
      },
      { threshold: [0, 0.4, 1] }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return ref;
}

function TileInner({
  item,
  videoRef,
}: {
  item: SandboxItem;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  const [frameReady, setFrameReady] = useState(false);
  return (
    <>
      {/* The still is the element that defines the tile's box. Tiles are
          `h-auto` with no fixed aspect, so before this the tile had zero
          height until video metadata landed and the whole masonry reflowed
          under the reader. The image's intrinsic size settles it immediately. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        alt=""
        src={item.src.replace(/\.[^.]+$/, ".jpg")}
        className="w-full h-auto block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
      />
      <video
        ref={videoRef}
        src={item.src}
        muted
        loop
        playsInline
        // `none`, not `metadata`: the still above carries the visual, and the
        // observer calls play() when the tile comes into view, which starts
        // the fetch then. Otherwise all 13 clips hit the network on load just
        // to read their headers.
        preload="none"
        // Held invisible until a frame has actually decoded — otherwise the
        // decoder's empty surface shows through as a green flash.
        onLoadedData={() => setFrameReady(true)}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04]"
        style={{
          opacity: frameReady ? 1 : 0,
          // Both transitions declared here: an inline `transition` would
          // otherwise clobber the class-based transform easing.
          transition:
            "opacity 320ms ease, transform 500ms cubic-bezier(0.22,1,0.36,1)",
        }}
      />

      {/* Soft frosted-glass corner arrow (recent.design style). Decorative —
          the whole tile is the link. */}
      {item.href && (
        <span
          aria-hidden
          className="absolute bottom-3 right-3 grid place-items-center w-12 h-12 rounded-full transition-transform duration-200 group-hover:scale-105"
          style={{
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.6)",
            color: "#1a1a1a",
            boxShadow: "0 4px 14px -4px rgba(0,0,0,0.25)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 17L17 7M17 7H9M17 7V15"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </>
  );
}

function VideoTile({ item, index }: { item: SandboxItem; index: number }) {
  const videoRef = useAutoplayInView();

  const motionProps = {
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      delay: (index % 8) * 0.03,
    },
    className:
      "group relative mb-4 block w-full overflow-hidden rounded-[20px] bg-black/5",
    style: {
      boxShadow:
        "0 8px 24px -10px rgba(0,0,0,0.18), inset 0 1px 2px rgba(255,255,255,0.2)",
    },
    "data-cursor": "sandbox",
  } as const;

  if (item.href) {
    return (
      <motion.a
        {...motionProps}
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${motionProps.className} cursor-pointer`}
      >
        <TileInner item={item} videoRef={videoRef} />
      </motion.a>
    );
  }

  return (
    <motion.div {...motionProps}>
      <TileInner item={item} videoRef={videoRef} />
    </motion.div>
  );
}

export default function SandboxGallery({ items }: { items: SandboxItem[] }) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
      {items.map((item, i) => (
        <VideoTile key={item.src} item={item} index={i} />
      ))}
    </div>
  );
}
