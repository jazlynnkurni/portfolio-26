"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

type NavLink = { label: string; href: string; external?: boolean };

const links: NavLink[] = [
  { label: "Work", href: "/#work" },
  { label: "Art Gallery", href: "/art-gallery" },
  { label: "About Me", href: "/about" },
  {
    label: "Resume",
    href: "https://drive.google.com/file/d/1W2XFyFbFbd1LrVWYK8Or2wfKZBIP29sg/view",
    external: true,
  },
];

const ACTIVE_COLOR = "#C97836";

function NavItem({
  link,
  active,
  onNavigate,
  onWorkClick,
}: {
  link: NavLink;
  active: boolean;
  onNavigate?: () => void;
  onWorkClick?: (e: React.MouseEvent) => void;
}) {
  const style = active ? { color: ACTIVE_COLOR } : undefined;

  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noreferrer"
        className="nav-link"
        onClick={onNavigate}
        style={style}
      >
        {link.label}
      </a>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    onWorkClick?.(e);
    onNavigate?.();
  };

  return (
    <Link
      href={link.href}
      className="nav-link"
      onClick={handleClick}
      style={style}
    >
      {link.label}
    </Link>
  );
}

interface NavProps {
  bg?: string;
}

export default function Nav({ bg }: NavProps = {}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [workInView, setWorkInView] = useState(false);

  // Watch the homepage #work section so we can mark "Work" active when in view.
  useEffect(() => {
    if (pathname !== "/") {
      setWorkInView(false);
      return;
    }
    const el = document.getElementById("work");
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setWorkInView(entry.isIntersecting),
      // Section must be meaningfully in view, not just peeking — top 20% / bottom 60%
      // is shrunk out of the viewport rect.
      { rootMargin: "-20% 0px -60% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pathname]);

  const isActive = (link: NavLink): boolean => {
    if (link.external) return false;
    if (link.href === "/#work") return pathname === "/" && workInView;
    if (link.href === "/art-gallery") return pathname === "/art-gallery";
    if (link.href === "/about") return pathname === "/about";
    return false;
  };

  // If already on /, intercept the click on Work and smooth-scroll to #work
  // instead of letting Next push a no-op route. Otherwise let Next navigate
  // to /#work — the homepage's hash-on-load effect picks up from there.
  const handleWorkClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      document
        .getElementById("work")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const wrapperStyle =
    bg === "solid"
      ? { background: "#FFF5EF" }
      : bg
      ? { background: bg }
      : {
          background: "rgba(255, 245, 239, 0.6)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          position: "sticky" as const,
          top: 0,
          zIndex: 50,
        };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-40 w-full pt-5"
      style={wrapperStyle}
    >
      {/* Inner content shares the hero's container so logo + pill align with
          the hero heading and the work grid. Background stays full-width on
          the parent <motion.nav> so the glass blur spans the viewport. */}
      <div className="max-w-7xl mx-auto px-6 md:px-16 flex justify-between items-center">
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
            <NavItem
              key={link.label}
              link={link}
              active={isActive(link)}
              onWorkClick={link.href === "/#work" ? handleWorkClick : undefined}
            />
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
                <NavItem
                  key={link.label}
                  link={link}
                  active={isActive(link)}
                  onNavigate={() => setOpen(false)}
                  onWorkClick={link.href === "/#work" ? handleWorkClick : undefined}
                />
              ))}
            </div>
          )}
        </div>

        <div className="hidden md:block w-12" aria-hidden />
      </div>
    </motion.nav>
  );
}
