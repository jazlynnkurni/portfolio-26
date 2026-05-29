"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { COLORS, FONTS, CARD_SWATCHES, ASSETS, type CardColor } from "./tokens";
import DrawingCanvas, { type DrawingCanvasHandle } from "./DrawingCanvas";

type Props = {
  onSubmit: (payload: { name: string; color: CardColor; drawing: string }) => void;
  submitting: boolean;
  errorMessage: string | null;
};

export default function IntroScreen({ onSubmit, submitting, errorMessage }: Props) {
  const canvasRef = useRef<DrawingCanvasHandle | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState<CardColor>("orange");
  const [hasDrawn, setHasDrawn] = useState(false);

  const handleClear = useCallback(() => {
    canvasRef.current?.clear();
    setHasDrawn(false);
  }, []);

  const handleEnter = useCallback(() => {
    if (!hasDrawn || submitting) return;
    const drawing = canvasRef.current?.toDataURL() ?? "";
    if (!drawing) return;
    onSubmit({ name: name.trim(), color, drawing });
  }, [hasDrawn, submitting, name, color, onSubmit]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.cream,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 24px 80px",
        fontFamily: FONTS.sans,
        color: COLORS.ink,
      }}
    >
      <p
        style={{
          fontFamily: FONTS.mono,
          fontSize: 16,
          lineHeight: 1.7,
          textAlign: "center",
          margin: "0 0 48px",
          maxWidth: 560,
        }}
      >
        Everyone has an <span style={{ textDecoration: "underline" }}>artist</span> inside of them.
        <br />
        Leave your mark and we&apos;ll give it a wall.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <label
          htmlFor="artist-name"
          style={{ fontFamily: FONTS.mono, fontSize: 14, letterSpacing: 0.5 }}
        >
          NAME:
        </label>
        <input
          id="artist-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name here"
          maxLength={60}
          style={{
            width: 480,
            padding: "12px 16px",
            fontFamily: FONTS.mono,
            fontSize: 14,
            border: "none",
            borderRadius: 8,
            background: "#FFFFFF",
            boxShadow: "0 2px 6px rgba(30,30,30,0.08)",
            color: COLORS.ink,
            outline: "none",
          }}
        />
        <button
          onClick={handleClear}
          aria-label="Clear canvas"
          title="Clear canvas"
          style={{
            width: 44,
            height: 44,
            border: "none",
            borderRadius: 8,
            background: "#EAD9CC",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: COLORS.espresso,
            fontSize: 18,
          }}
        >
          ↻
        </button>
      </div>

      <motion.div layoutId="user-card">
        <DrawingCanvas
          ref={canvasRef}
          backgroundColor={CARD_SWATCHES[color]}
          watermarkSrc={ASSETS.jkWatermark}
          onFirstStroke={() => setHasDrawn(true)}
        />
      </motion.div>

      <div style={{ display: "flex", gap: 16, marginTop: 28 }}>
        {(Object.keys(CARD_SWATCHES) as CardColor[]).map((c) => {
          const isActive = c === color;
          return (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label={`Choose ${c} card`}
              aria-pressed={isActive}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: CARD_SWATCHES[c],
                border: isActive ? `3px solid ${COLORS.espresso}` : "3px solid transparent",
                cursor: "pointer",
                padding: 0,
                boxShadow: isActive ? "0 0 0 2px rgba(0,0,0,0.05)" : "none",
                transition: "transform 0.15s",
              }}
            />
          );
        })}
      </div>

      <button
        onClick={handleEnter}
        disabled={!hasDrawn || submitting}
        style={{
          marginTop: 32,
          padding: "12px 32px",
          fontFamily: FONTS.mono,
          fontSize: 14,
          background: hasDrawn && !submitting ? COLORS.enterButton : "#B8A89A",
          color: "#FFFFFF",
          border: "none",
          borderRadius: 24,
          cursor: hasDrawn && !submitting ? "pointer" : "not-allowed",
          letterSpacing: 0.5,
          transition: "background 0.2s",
        }}
      >
        {submitting ? "Hanging your art…" : "Enter →"}
      </button>

      {errorMessage ? (
        <p style={{ marginTop: 16, fontFamily: FONTS.mono, fontSize: 13, color: COLORS.redClay }}>
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
