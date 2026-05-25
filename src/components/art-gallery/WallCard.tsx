"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ASSETS, COLORS, FONTS, CARD_SWATCHES, type CardColor } from "./tokens";

type Props = {
  name?: string;
  color: CardColor;
  drawing: string; // base64 data URL
  isYours?: boolean;
  layoutId?: string;
  showName?: boolean;
};

// Mini card in the wall grid. Hovering elevates the card via box-shadow lift.
export default function WallCard({
  name,
  color,
  drawing,
  isYours,
  layoutId,
  showName = true,
}: Props) {
  const [hovered, setHovered] = useState(false);

  // Hover-lift shadow vs resting shadow. User's own card always sits slightly elevated.
  const restShadow = isYours
    ? "0 6px 18px rgba(58, 36, 24, 0.22)"
    : "0 2px 8px rgba(30, 30, 30, 0.10)";
  const hoverShadow = "0 12px 28px rgba(58, 36, 24, 0.28)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        width: "100%",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        layoutId={layoutId}
        animate={{
          boxShadow: hovered ? hoverShadow : restShadow,
          y: hovered ? -3 : 0,
        }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "680 / 380",
          background: CARD_SWATCHES[color],
          borderRadius: 8,
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={drawing}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
        {/* JK monogram top-left */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ASSETS.jkWatermark}
          alt=""
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            width: 16,
            height: 16,
            pointerEvents: "none",
            userSelect: "none",
            opacity: 0.95,
          }}
        />
      </motion.div>
      {showName && name ? (
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 10,
            color: COLORS.ink,
            opacity: 0.7,
            textAlign: "center",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: 0.3,
          }}
          title={name}
        >
          {name}
        </span>
      ) : null}
    </div>
  );
}
