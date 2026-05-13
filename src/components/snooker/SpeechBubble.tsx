"use client";

import { motion } from "framer-motion";

type Props = { text?: string };

const BUBBLE_BG = "rgba(255, 245, 239, 0.95)";

export default function SpeechBubble({ text = "go on then" }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{
        position: "relative",
        width: "fit-content",
        backgroundColor: BUBBLE_BG,
        borderRadius: "18px",
        padding: "8px 14px",
        boxShadow: "0 4px 12px rgba(50, 30, 20, 0.15)",
        fontFamily: "var(--font-mono), monospace",
        fontSize: "11px",
        color: "rgba(40, 30, 25, 0.75)",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        zIndex: 40,
      }}
    >
      {text}
      <span
        aria-hidden
        style={{
          position: "absolute",
          bottom: "-5px",
          right: "22%",
          width: "12px",
          height: "12px",
          backgroundColor: BUBBLE_BG,
          transform: "rotate(45deg)",
          borderRadius: "2px",
          boxShadow: "2px 2px 6px rgba(50, 30, 20, 0.08)",
          zIndex: -1,
        }}
      />
    </motion.div>
  );
}
