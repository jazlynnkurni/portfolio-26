"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

type NavLink = { label: string; href: string; external?: boolean };

const links: NavLink[] = [
  { label: "Work", href: "/work" },
  { label: "Art Exhibit", href: "/art-exhibit" },
  { label: "About Me", href: "/about" },
  {
    label: "Resume",
    href: "https://drive.google.com/file/u/1/d/15-mX_sIkPU_Ww4R1UueWG10Wv9CQbhEy/view",
    external: true,
  },
];

function NavItem({ link, onNavigate }: { link: NavLink; onNavigate?: () => void }) {
  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noreferrer"
        className="nav-link"
        onClick={onNavigate}
      >
        {link.label}
      </a>
    );
  }
  return (
    <Link href={link.href} className="nav-link" onClick={onNavigate}>
      {link.label}
    </Link>
  );
}

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-40 w-full flex justify-between items-center px-6 pt-5 bg-bg/95 backdrop-blur-sm"
    >
      <Link
        href="/"
        aria-label="Jazlynn Kurniandra — Home"
        className="block transition-opacity duration-200 hover:opacity-80 cursor-pointer"
      >
        <Image
          src="/images/logo.png"
          alt="Jazlynn Kurniandra"
          width={56}
          height={56}
          priority
          className="h-14 w-auto"
        />
      </Link>

      <div className="hidden md:flex items-center gap-6 bg-white rounded-full py-2.5 px-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        {links.map((link) => (
          <NavItem key={link.label} link={link} />
        ))}
      </div>

      <div className="md:hidden relative">
        <button
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex flex-col gap-[5px] w-9 h-9 items-center justify-center rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
        >
          <span className="block w-4 h-px bg-ink" />
          <span className="block w-4 h-px bg-ink" />
          <span className="block w-4 h-px bg-ink" />
        </button>
        {open && (
          <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] py-3 px-4 flex flex-col gap-3 min-w-[170px]">
            {links.map((link) => (
              <NavItem key={link.label} link={link} onNavigate={() => setOpen(false)} />
            ))}
          </div>
        )}
      </div>

      <div className="hidden md:block w-12" aria-hidden />
    </motion.nav>
  );
}
