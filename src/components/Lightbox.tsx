"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  layoutId: string;
  // Existing prop — kept required-shape via optional + finalSrc fallback below
  // so callers that pass videoSrc (Manus, Conduit) continue to work unchanged.
  videoSrc?: string;
  // New optional props for images.
  src?: string | null;
  mediaType?: "video" | "image";
  alt?: string;
}

export default function Lightbox({
  isOpen,
  onClose,
  layoutId,
  videoSrc,
  src,
  mediaType = "video",
  alt = "",
}: LightboxProps) {
  // Unified source: prefer the new generic `src`; fall back to legacy `videoSrc`.
  const finalSrc = src ?? videoSrc ?? null;

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center cursor-zoom-out"
          style={{
            backgroundColor: "rgba(255, 245, 239, 0.7)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-6 right-6 z-[101] flex items-center justify-center w-12 h-12 rounded-full transition-colors hover:bg-black/10"
            style={{ color: "#1E1E1E" }}
            aria-label="Close lightbox"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <motion.div
            layoutId={layoutId}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[90vw] max-h-[85vh] cursor-default"
            style={{
              border: "1px solid #C97836",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
            }}
          >
            {finalSrc && mediaType === "image" ? (
              <Image
                src={finalSrc}
                alt={alt}
                width={1600}
                height={900}
                className="block w-auto h-auto max-w-full max-h-[85vh]"
                style={{ objectFit: "contain" }}
                unoptimized
              />
            ) : finalSrc ? (
              <video
                src={finalSrc}
                autoPlay
                muted
                loop
                playsInline
                className="block w-auto h-auto max-w-full max-h-[85vh]"
              />
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
