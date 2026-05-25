import { NextRequest, NextResponse } from "next/server";
import { redis, GALLERY_CARDS_KEY } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// DELETE /api/gallery/clear?key=<ADMIN_CLEAR_KEY>
// Wipes the entire gallery cards list. Gated by env-secret query param.
// Usage (local): curl -X DELETE "http://localhost:3000/api/gallery/clear?key=YOUR_KEY"
// Usage (prod):  curl -X DELETE "https://portfolio-one-lyart-34.vercel.app/api/gallery/clear?key=YOUR_KEY"
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const providedKey = url.searchParams.get("key");
  const expectedKey = process.env.ADMIN_CLEAR_KEY;

  if (!expectedKey) {
    // Misconfiguration safety: if no admin key set, refuse rather than letting anyone wipe.
    return NextResponse.json({ error: "Admin key not configured" }, { status: 500 });
  }

  if (providedKey !== expectedKey) {
    // 404 instead of 401 so the endpoint's existence isn't advertised to scanners.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await redis.del(GALLERY_CARDS_KEY);
    return NextResponse.json({ cleared: true }, { status: 200 });
  } catch (err) {
    console.error("[DELETE /api/gallery/clear] error:", err);
    return NextResponse.json({ error: "Failed to clear" }, { status: 500 });
  }
}
