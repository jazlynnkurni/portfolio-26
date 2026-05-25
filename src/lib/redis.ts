import { Redis } from "@upstash/redis";

// Singleton Redis client using Upstash REST API.
// Env vars are auto-populated by Vercel's Upstash integration with the KV_ prefix.
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// Key for the FIFO list of art gallery cards.
export const GALLERY_CARDS_KEY = "art-gallery:cards";

// Max cards stored at any one time. The 13th slot is the user's own "THAT'S YOU!" card,
// which is held in sessionStorage on the client — it's never persisted to Redis.
export const MAX_CARDS = 12;

export type GalleryCard = {
  id: string;
  name: string;
  color: "orange" | "green" | "blue" | "clay";
  drawing: string; // base64-encoded PNG data URL of the canvas
  createdAt: number; // unix ms
};
