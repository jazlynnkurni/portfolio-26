"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ASSETS, COLORS, FONTS, type CardColor } from "./tokens";
import WallCard from "./WallCard";
import ThatsYouSticker from "./ThatsYouSticker";

type GalleryCard = {
  id: string;
  name: string;
  color: CardColor;
  drawing: string;
  createdAt: number;
};

type Props = {
  myCard: GalleryCard;
};

const GRID_TOTAL = 12; // 4 rows x 3 cols (user card + 11 most recent from Redis)

export default function WallScreen({ myCard }: Props) {
  const [otherCards, setOtherCards] = useState<GalleryCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/gallery/cards");
        const data = await res.json();
        if (cancelled) return;
        const others: GalleryCard[] = (data.cards ?? []).filter(
          (c: GalleryCard) => c.id !== myCard.id
        );
        setOtherCards(others.slice(0, 11));
      } catch (err) {
        console.error("Failed to load wall cards:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [myCard.id]);

  const totalCards = 1 + otherCards.length;
  const emptySlots = Math.max(0, GRID_TOTAL - totalCards);

  return (
    <section
      id="wall"
      style={{
        background: COLORS.cream,
        padding: "32px 24px 0",
        fontFamily: FONTS.sans,
        color: COLORS.ink,
        position: "relative",
      }}
    >
      {/* Top corner link (NEXT only — BACK removed in favor of site Nav) */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          maxWidth: 1228,
          margin: "0 auto",
          marginBottom: 32,
        }}
      >
        <Link
          href="/work"
          style={{
            fontFamily: FONTS.mono,
            fontSize: 13,
            color: COLORS.ink,
            textDecoration: "none",
            opacity: 0.75,
          }}
        >
          NEXT →
        </Link>
      </div>

      {/* Welcome copy */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <p
          style={{
            fontFamily: FONTS.mono,
            fontSize: 15,
            lineHeight: 1.7,
            margin: 0,
            maxWidth: 640,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Welcome to Jazlynn&apos;s Art Exhibit.
          <br />
          Thanks for being a part of it. Enjoy the rest of your stay!
        </p>
      </div>

      {/* Wall layout: chandelier | framed grid | vase — stretch so decor can align to top/bottom edges of the frame */}
      <div
        style={{
          position: "relative",
          maxWidth: 1228,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 760px 1fr",
          gap: 24,
          alignItems: "stretch",
        }}
      >
        {/* Chandelier (left) — flush to viewport left edge, vertically centered against frame.
            Two warm flame glows positioned over each candle, flickering out of sync via CSS. */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            height: "100%",
            overflow: "visible",
          }}
        >
          <div
            style={{
              position: "relative",
              marginLeft: "-80px",
              display: "inline-block",
              lineHeight: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ASSETS.chandelier}
              alt=""
              style={{
                width: "auto",
                height: 320,
                maxWidth: "none",
                pointerEvents: "none",
                userSelect: "none",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
        </div>

        {/* Framed grid: orange picture-frame border wraps the entire 4x3. */}
        <div
          style={{
            border: `2px solid ${COLORS.burntOrange}`,
            borderRadius: 4,
            padding: 12,
            background: "transparent",
            boxShadow: "0 1px 3px rgba(58, 36, 24, 0.06)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gridAutoRows: "auto",
              columnGap: 10,
              rowGap: 10,
              width: "100%",
            }}
          >
            {/* Position [0]: user card with sticker */}
            <div style={{ position: "relative", width: "100%" }}>
              <WallCard
                name={myCard.name}
                color={myCard.color}
                drawing={myCard.drawing}
                isYours
                layoutId="user-card"
              />
              <ThatsYouSticker />
            </div>

            {/* Positions [1]..[12] from Redis */}
            {loading
              ? Array.from({ length: 11 }).map((_, i) => (
                  <motion.div
                    key={`skeleton-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    transition={{ delay: 0.15 + i * 0.03 }}
                    style={{
                      width: "100%",
                      aspectRatio: "680 / 380",
                      background: "rgba(30, 30, 30, 0.04)",
                      borderRadius: 8,
                    }}
                  />
                ))
              : otherCards.map((card, i) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.04, duration: 0.35 }}
                    style={{ width: "100%" }}
                  >
                    <WallCard
                      name={card.name}
                      color={card.color}
                      drawing={card.drawing}
                    />
                  </motion.div>
                ))}

            {/* Empty slots — same-width dashed-border cells */}
            {!loading &&
              Array.from({ length: emptySlots }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  style={{
                    width: "100%",
                    aspectRatio: "680 / 380",
                    borderRadius: 8,
                    border: "1px dashed rgba(30, 30, 30, 0.18)",
                    background: "transparent",
                  }}
                />
              ))}
          </div>
        </div>

        {/* Flower vase (right) — sits flush to viewport right edge, bottom aligns with frame */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-end",
            height: "100%",
            overflow: "visible",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ASSETS.flowerVase}
            alt=""
            style={{
              width: "auto",
              height: 460,
              maxWidth: "none",
              pointerEvents: "none",
              userSelect: "none",
              objectFit: "contain",
              display: "block",
              marginRight: "-24px",
            }}
          />
        </div>
      </div>

    </section>
  );
}
