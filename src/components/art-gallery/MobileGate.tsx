"use client";

import Link from "next/link";
import { COLORS, FONTS } from "./tokens";

export default function MobileGate() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.cream,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        fontFamily: FONTS.sans,
        color: COLORS.ink,
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 360 }}>
        <p style={{ fontFamily: FONTS.mono, fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
          The art gallery is a drawing experience best enjoyed on a desktop or laptop.
          <br />
          <br />
          Come back on a bigger screen to leave your mark.
        </p>
        <Link
          href="/"
          style={{
            fontFamily: FONTS.mono,
            fontSize: 13,
            color: COLORS.ink,
            textDecoration: "underline",
            opacity: 0.8,
          }}
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
