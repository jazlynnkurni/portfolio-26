"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type FooterLink = { label: string; href: string; external?: boolean };

const externalLinks: FooterLink[] = [
  { label: "EMAIL", href: "mailto:[email protected]", external: true },
  { label: "LINKEDIN", href: "https://linkedin.com/in/jazlynnkurniandra", external: true },
  { label: "GITHUB", href: "https://github.com/jazlynnkurni", external: true },
];

const internalLinks: FooterLink[] = [
  { label: "HOME", href: "/" },
  { label: "ART GALLERY", href: "/art-exhibit" },
  { label: "ABOUT ME", href: "/about" },
  {
    label: "RESUME",
    href: "https://drive.google.com/file/u/1/d/15-mX_sIkPU_Ww4R1UueWG10Wv9CQbhEy/view",
    external: true,
  },
];

function FooterItem({ link }: { link: FooterLink }) {
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noreferrer" className="footer-link">
        {link.label}
      </a>
    );
  }
  return (
    <Link href={link.href} className="footer-link">
      {link.label}
    </Link>
  );
}

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="w-full bg-accent-orange text-bg px-6 md:px-16 py-10 md:py-14"
    >
      <div className="flex flex-col md:flex-row md:justify-between gap-8 md:gap-0 max-w-7xl mx-auto">
        <p className="font-mono text-[13px] tracking-wide">
          © made in NYC, with love from Indonesia
        </p>
        <div className="flex flex-col md:flex-row gap-8 md:gap-20">
          <ul className="flex flex-col gap-3">
            {externalLinks.map((link) => (
              <li key={link.label}>
                <FooterItem link={link} />
              </li>
            ))}
          </ul>
          <ul className="flex flex-col gap-3">
            {internalLinks.map((link) => (
              <li key={link.label}>
                <FooterItem link={link} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.footer>
  );
}
