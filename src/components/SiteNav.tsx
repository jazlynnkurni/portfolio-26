"use client";

/**
 * SiteNav
 * -------
 * Mounts the nav ONCE, from the root layout, so it survives route changes.
 *
 * Every page used to render its own <Nav />. In the App Router the layout
 * persists across navigation but the page remounts — so the nav was being torn
 * down and rebuilt on every click, replaying its fade-in each time (the
 * "refresh") and giving the active-link bar nothing to animate between: it just
 * appeared, already arrived, under the new word.
 *
 * The allow-list is deliberate rather than a blanket render. Case studies
 * (/work/manus-ai and friends) have their own chrome and no site nav, and
 * putting one there would be a change nobody asked for. Two pages stay off this
 * list and keep rendering <Nav /> themselves, because whether they show it
 * depends on client state this component cannot see:
 *   /art-gallery — hidden behind a mobile gate
 *   /art-lab     — hidden in mode 3
 * They lose the cross-page slide, which costs nothing: both are immersive
 * detours you navigate away from, not part of the main circuit.
 */

import { usePathname } from "next/navigation";
import Nav from "@/components/Nav";

const NAV_ROUTES = new Set([
  "/",
  "/about",
  "/sandbox",
  "/work/in-progress",
  // labs
  "/split-lab",
  "/scroll-lab",
  "/layout-lab",
  "/sandbox-lab",
  "/lamp-position-lab",
  "/showcase-lab",
  "/home-lab",
]);

export default function SiteNav() {
  const pathname = usePathname();
  if (!NAV_ROUTES.has(pathname)) return null;
  return <Nav />;
}
