"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Nav from "@/components/Nav";
import IntroScreen from "@/components/art-gallery/IntroScreen";
import WallScreen from "@/components/art-gallery/WallScreen";
import ArtworksGallery from "@/components/art-gallery/ArtworksGallery";
import MobileGate from "@/components/art-gallery/MobileGate";
import type { CardColor } from "@/components/art-gallery/tokens";

const SESSION_KEY = "art-gallery:my-card";

type Stage = "intro" | "wall";

type MyCard = {
  id: string;
  name: string;
  color: CardColor;
  drawing: string;
  createdAt: number;
};

export default function ArtGalleryPage() {
  const [stage, setStage] = useState<Stage>("intro");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const [myCard, setMyCard] = useState<MyCard | null>(null);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleSubmit = useCallback(
    async ({ name, color, drawing }: { name: string; color: CardColor; drawing: string }) => {
      setSubmitting(true);
      setErrorMessage(null);
      try {
        const res = await fetch("/api/gallery/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, color, drawing }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "Couldn't save your card. Try again?");
        }
        const data = await res.json();
        const card: MyCard = {
          id: data.card.id,
          name: data.card.name,
          color: data.card.color,
          drawing: data.card.drawing,
          createdAt: data.card.createdAt,
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(card));
        setMyCard(card);
        setStage("wall");
        // Smooth scroll to wall after FLIP animation lands (~700ms).
        setTimeout(() => {
          const wall = document.getElementById("wall");
          if (wall) wall.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 700);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  if (isDesktop === null) {
    return <div style={{ minHeight: "100vh", background: "#FFF5EF" }} />;
  }

  if (!isDesktop) {
    return <MobileGate />;
  }

  return (
    <>
      <Nav />
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ position: "fixed", inset: 0, backgroundColor: "#FFF5EF", zIndex: 9999, pointerEvents: "none" }}
      />
      <AnimatePresence mode="wait">
        {stage === "intro" ? (
          <IntroScreen
            key="intro"
            onSubmit={handleSubmit}
            submitting={submitting}
            errorMessage={errorMessage}
          />
        ) : myCard ? (
          <div key="wall">
            <WallScreen myCard={myCard} />
            {/* <ArtworksGallery /> — temporarily hidden, will re-enable after wall layout is dialed in */}
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
