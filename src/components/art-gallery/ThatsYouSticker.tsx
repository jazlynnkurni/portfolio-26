"use client";

import { motion } from "framer-motion";
import { COLORS, FONTS } from "./tokens";

// Espresso-brown sticker pill that overhangs the top-left corner of the user's card.
// Matches Figma: dark brown background, white uppercase "THAT'S YOU!" text, slight rotation.
export default function ThatsYouSticker() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: -6 }}
      transition={{ delay: 0.7, type: "spring", stiffness: 300, damping: 18 }}
      style={{
        position: "absolute",
        top: -14,
        left: -10,
        padding: "5px 10px 5px 11px",
        background: COLORS.enterButton, // #582F13 espresso brown, same as Enter button
        color: "#FFFFFF",
        fontFamily: FONTS.mono,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 0.8,
        borderRadius: 4,
        boxShadow: "0 3px 10px rgba(58, 36, 24, 0.32)",
        transformOrigin: "top left",
        whiteSpace: "nowrap",
        zIndex: 10,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      THAT&apos;S YOU!
    </motion.div>
  );
}
