"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useCueAim } from "@/hooks/useCueAim";
import Ball from "./Ball";
import CueStick from "./CueStick";
import AimGuide from "./AimGuide";
import Avatar from "./Avatar";
import SpeechBubble from "./SpeechBubble";

type RackBall = {
  number: number;
  x: number;
  y: number;
  color: string;
  isStriped?: boolean;
};

const RACK: RackBall[] = [
  // Row 1 — apex
  { number: 1, x: 50, y: 24, color: "#7A9471" },
  // Row 2
  { number: 2, x: 46.8, y: 29.6, color: "#B08968" },
  { number: 9, x: 53.2, y: 29.6, color: "#7A9471", isStriped: true },
  // Row 3 — 8-ball in center
  { number: 10, x: 43.5, y: 35.3, color: "#B08968", isStriped: true },
  { number: 8, x: 50, y: 35.3, color: "#1E1E1E" },
  { number: 3, x: 56.5, y: 35.3, color: "#C97836" },
  // Row 4
  { number: 11, x: 40.3, y: 40.9, color: "#C97836", isStriped: true },
  { number: 4, x: 46.8, y: 40.9, color: "#5B7F9E" },
  { number: 12, x: 53.3, y: 40.9, color: "#5B7F9E", isStriped: true },
  { number: 5, x: 59.8, y: 40.9, color: "#C9A437" },
  // Row 5 — widest
  { number: 6, x: 37, y: 46.5, color: "#A04A3F" },
  { number: 13, x: 43.5, y: 46.5, color: "#A04A3F", isStriped: true },
  { number: 7, x: 50, y: 46.5, color: "#7B6293" },
  { number: 14, x: 56.5, y: 46.5, color: "#C9A437", isStriped: true },
  { number: 15, x: 63, y: 46.5, color: "#7B6293", isStriped: true },
];

const CUE_BALL = { x: 50, y: 72 };

const TAUNTS = [
  "u weak af",
  "js put the fries in the bag bro",
  "even my mom plays better",
  "jk i believe in u",
  "words of affirmation",
  "u gyat tht",
];

export default function SnookerScene() {
  const [tauntIndex, setTauntIndex] = useState(0);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const { cueAngle, aimAngle, pullback, isHovering, isAiming, bind } =
    useCueAim(tableRef, CUE_BALL.x, CUE_BALL.y);

  const handleTaunt = () => {
    if (!bubbleVisible) {
      setBubbleVisible(true);
    } else {
      setTauntIndex((i) => (i + 1) % TAUNTS.length);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
      className="hidden md:block pb-12"
      style={{
        maxWidth: "min(400px, calc((100vh - 220px) / 1.79))",
        width: "100%",
      }}
    >
      <div
        ref={tableRef}
        className="relative mx-auto"
        style={{
          aspectRatio: "768 / 1376",
          width: "100%",
        }}
      >
        <Image
          src="/images/snooker-table.png"
          alt="painted snooker table"
          fill
          priority
          unoptimized
          sizes="(min-width: 768px) 360px, 0px"
          style={{
            objectFit: "contain",
            zIndex: 10,
            pointerEvents: "none",
          }}
        />
        {RACK.map((b) => (
          <Ball
            key={b.number}
            number={b.number}
            x={b.x}
            y={b.y}
            color={b.color}
            isStriped={b.isStriped}
          />
        ))}
        <AimGuide
          aimAngle={aimAngle}
          visible={isAiming}
          cueBallX={CUE_BALL.x}
          cueBallY={CUE_BALL.y}
        />
        <CueStick angle={cueAngle} pullback={pullback} />
        <Ball x={CUE_BALL.x} y={CUE_BALL.y} color="#FFF5EF" isCueBall />

        {/* Avatar + bubble — peeking from behind the top edge of the table.
            Anchored by the wrapper's BOTTOM so bubble height can grow upward
            without shifting the avatar's overlap with the table. */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "92%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            width: "25%",
            zIndex: 5,
          }}
        >
          {bubbleVisible && (
            <div style={{ zIndex: 40, position: "relative" }}>
              <SpeechBubble
                text={TAUNTS[tauntIndex]}
                visible={true}
              />
            </div>
          )}
          <Avatar onClick={handleTaunt} />
        </div>

        {/* Aim capture overlay — confined to table felt area only, so the
            avatar peeking above the table remains directly clickable. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            cursor: isHovering ? "crosshair" : "default",
            zIndex: 50,
          }}
          {...bind}
        />
      </div>
    </motion.div>
  );
}
