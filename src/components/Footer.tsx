"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import AsciiConstellation from "@/components/AsciiConstellation";

type FooterLink = { label: string; href: string; external?: boolean };

interface FooterProps {
  variant?: "default" | "cream";
}

const externalLinks: FooterLink[] = [
  { label: "EMAIL", href: "mailto:jazkurnz06@gmail.com", external: true },
  { label: "LINKEDIN", href: "https://www.linkedin.com/in/jazlynn-kurniandra-a456292a8/", external: true },
  { label: "GITHUB", href: "https://github.com/jazlynnkurni", external: true },
];

const internalLinks: FooterLink[] = [
  { label: "HOME", href: "/" },
  { label: "ART GALLERY", href: "/art-gallery" },
  { label: "ABOUT ME", href: "/about" },
  {
    label: "RESUME",
    href: "https://drive.google.com/drive/folders/1B9oW_NV6AGhEP3qSGyGhonbXxEPM7KBq?usp=sharing",
    external: true,
  },
];

function FooterItem({ link, color }: { link: FooterLink; color: string }) {
  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noreferrer"
        className="footer-link"
        style={{ color }}
      >
        {link.label}
      </a>
    );
  }
  return (
    <Link href={link.href} className="footer-link" style={{ color }}>
      {link.label}
    </Link>
  );
}

export default function Footer({ variant = "default" }: FooterProps) {
  const isCream = variant === "cream";
  const bgClass = isCream ? "" : "bg-accent-orange text-bg";
  const bgStyle = isCream ? { backgroundColor: "#D4A574" } : undefined;
  const textColor = "#FFFFFF";

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className={`footer-root relative overflow-hidden w-full ${bgClass} px-6 md:px-16 pt-7 md:pt-10 pb-10 md:pb-14 ${
        isCream ? "footer-cream" : ""
      }`}
      style={bgStyle}
    >
      {isCream && (
        <style>{`
          .footer-cream .footer-link::after { background: #FFFFFF; }
        `}</style>
      )}
      <AsciiConstellation color={isCream ? "#FFFFFF" : "#FFF5EF"} opacity={isCream ? 1 : 0.7} />
      <div className="relative z-10 flex flex-col md:flex-row md:justify-between gap-8 md:gap-0 max-w-7xl mx-auto">
        <p
          className="font-serif font-semibold text-[16px] not-italic leading-normal"
          style={{ color: textColor }}
        >
          © made in NYC, with love from Indonesia
        </p>
        <div className="flex flex-col md:flex-row gap-8 md:gap-20">
          <ul className="flex flex-col gap-3">
            {externalLinks.map((link) => (
              <li key={link.label}>
                <FooterItem link={link} color={textColor} />
              </li>
            ))}
          </ul>
          <ul className="flex flex-col gap-3">
            {internalLinks.map((link) => (
              <li key={link.label}>
                <FooterItem link={link} color={textColor} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.footer>
  );
}
