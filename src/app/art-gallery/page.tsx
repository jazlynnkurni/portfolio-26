"use client";

import { useState, useEffect, useCallback } from "react";
import IntroScreen from "@/components/art-gallery/IntroScreen";
import MobileGate from "@/components/art-gallery/MobileGate";
import type { CardColor } from "@/components/art-gallery/tokens";

const SESSION_KEY = "art-gallery:my-card";

type Stage = "intro" | "wall";

type MyCard = {
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
          name: data.card.name,
          color: data.card.color,
          drawing: data.card.drawing,
          createdAt: data.card.createdAt,
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(card));
        setStage("wall");
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

  if (stage === "intro") {
    return <IntroScreen onSubmit={handleSubmit} submitting={submitting} errorMessage={errorMessage} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FFF5EF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-serif), 'Source Serif Pro', serif",
        fontSize: 24,
        color: "#1E1E1E",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p>Your card is hanging on the wall ✓</p>
        <p style={{ fontSize: 14, marginTop: 12, opacity: 0.6 }}>(Wall view coming in Phase 5b)</p>
      </div>
    </div>
  );
}
