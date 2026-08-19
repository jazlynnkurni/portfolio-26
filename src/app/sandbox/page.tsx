/**
 * /sandbox — a wall of the design videos I want to showcase.
 *
 * Server component: it lists public/videos/SandboxVideos at render time and
 * hands the clips to the client masonry gallery. Drop a new video into that
 * folder and it appears here automatically — no code change needed.
 */

import fs from "node:fs";
import path from "node:path";
import Nav from "@/components/Nav";
import MahjongFooter from "@/components/MahjongFooter";
import SandboxGallery, {
  type SandboxItem,
} from "@/components/sandbox/SandboxGallery";

const VIDEO_DIR = "videos/SandboxVideos";
const VIDEO_EXT = new Set([".mp4", ".mov", ".m4v", ".webm"]);
// Clips to hide from the wall (file stays in the folder).
const EXCLUDE = new Set(["Screen Recording 2026-07-09 at 16.10.28 copy.mov"]);

// Each clip → the X post it links out to (corner arrow). Files not listed here
// simply show no arrow.
const HREF_BY_FILE: Record<string, string> = {
  "Oranges_30s_seamless copy.mp4":
    "https://x.com/jazlynnkurni/status/2070928000930214123",
  "rad copy.mp4":
    "https://x.com/jazlynnkurni/status/2072738705325060191",
  "directionspt2 copy.mp4":
    "https://x.com/jazlynnkurni/status/2071654306747731984",
  "parallax copy.mp4":
    "https://x.com/jazlynnkurni/status/2075280350562099455",
  "Screen Recording 2026-06-19 at 22.26.40 copy.mov":
    "https://x.com/jazlynnkurni/status/2068020345442074795",
  "Screen Recording 2026-06-26 at 00.19.45 2.mov":
    "https://x.com/jazlynnkurni/status/2070370962168766862",
  "Screen Recording 2026-06-30 at 00.11.36 2 copy.mov":
    "https://x.com/jazlynnkurni/status/2071670664919200250",
  "Screen Recording 2026-07-20 at 00.51.23 2.mov":
    "https://x.com/jazlynnkurni/status/2078901500030697983",
  "Screen Recording 2026-07-10 at 00.17.07 2.MOV":
    "https://x.com/jazlynnkurni/status/2075279332482973831",
  "trim_55DBD55B-7847-44FB-9B25-F5120E152BF6 2.MP4":
    "https://x.com/jazlynnkurni/status/2078901924024517033",
  "lucky_pingpong 2.MP4":
    "https://x.com/jazlynnkurni/status/2077089209052246135",
};

function collectItems(): SandboxItem[] {
  const absDir = path.join(process.cwd(), "public", VIDEO_DIR);
  let names: string[];
  try {
    names = fs.readdirSync(absDir);
  } catch {
    return [];
  }
  return names
    .filter(
      (name) =>
        VIDEO_EXT.has(path.extname(name).toLowerCase()) && !EXCLUDE.has(name)
    )
    .sort()
    .map((name) => ({
      // Encode each path segment so spaces / special chars resolve as URLs.
      src:
        "/" +
        [...VIDEO_DIR.split("/"), name]
          .map(encodeURIComponent)
          .join("/"),
      type: "video" as const,
      project: "sandbox",
      href: HREF_BY_FILE[name],
    }));
}

export default function SandboxPage() {
  const items = collectItems();

  return (
    <>
      <Nav />
      <main className="flex-1 px-6 md:px-16 pt-28 md:pt-32 pb-24">
        <div className="max-w-7xl mx-auto">
          <SandboxGallery items={items} />
        </div>
      </main>
      <MahjongFooter />
    </>
  );
}
