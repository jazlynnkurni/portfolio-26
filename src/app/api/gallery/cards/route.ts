import { NextRequest, NextResponse } from "next/server";
import { redis, GALLERY_CARDS_KEY, MAX_CARDS, type GalleryCard } from "@/lib/redis";

// Force dynamic — never cache this route, we always want fresh data.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/gallery/cards — returns the latest cards, newest first.
export async function GET() {
  try {
    // LRANGE returns from index 0 to MAX_CARDS-1, newest-first (since we LPUSH on insert).
    const raw = await redis.lrange<GalleryCard>(GALLERY_CARDS_KEY, 0, MAX_CARDS - 1);
    return NextResponse.json({ cards: raw ?? [] }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/gallery/cards] error:", err);
    return NextResponse.json({ cards: [], error: "Failed to load cards" }, { status: 500 });
  }
}

// POST /api/gallery/cards — adds a new card, FIFO-evicts if over MAX_CARDS.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, color, drawing } = body ?? {};

    // Basic shape validation. Strict enough to reject garbage, loose enough to not over-engineer.
    if (typeof color !== "string" || !["orange", "green", "blue", "clay"].includes(color)) {
      return NextResponse.json({ error: "Invalid color" }, { status: 400 });
    }
    if (typeof drawing !== "string" || !drawing.startsWith("data:image/png;base64,")) {
      return NextResponse.json({ error: "Invalid drawing" }, { status: 400 });
    }
    // Cap drawing size at ~500KB base64 (canvas is small, shouldn't exceed this).
    if (drawing.length > 700_000) {
      return NextResponse.json({ error: "Drawing too large" }, { status: 413 });
    }

    // Name fallback: "Mystery Artist #XXXX" with a random 4-digit suffix.
    const safeName =
      typeof name === "string" && name.trim().length > 0
        ? name.trim().slice(0, 60)
        : `Mystery Artist #${Math.floor(1000 + Math.random() * 9000)}`;

    const card: GalleryCard = {
      id: crypto.randomUUID(),
      name: safeName,
      color: color as GalleryCard["color"],
      drawing,
      createdAt: Date.now(),
    };

    // LPUSH = prepend (newest first). Then LTRIM to MAX_CARDS, evicting oldest.
    await redis.lpush(GALLERY_CARDS_KEY, card);
    await redis.ltrim(GALLERY_CARDS_KEY, 0, MAX_CARDS - 1);

    return NextResponse.json({ card }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/gallery/cards] error:", err);
    return NextResponse.json({ error: "Failed to save card" }, { status: 500 });
  }
}
