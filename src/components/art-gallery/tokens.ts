// Shared design tokens for the art gallery feature.

export const COLORS = {
  cream: "#FFF5EF",
  burntOrange: "#C97836",
  darkerOrange: "#9A4C19",
  highlightedOrange: "#8F4B1E",
  mutedClay: "#D4A574",
  sageCheck: "#7A9471",
  redClay: "#B85042",
  ink: "#1E1E1E",
  espresso: "#3A2418",
  enterButton: "#582F13",
  cardOrange: "#C97836",
  cardGreen: "#7A9471",
  cardBlue: "#4A6B8A",
  cardClay: "#A87F5C",
} as const;

export const FONTS = {
  serif: "var(--font-serif), 'Source Serif Pro', serif",
  sans: "var(--font-sans), 'Helvetica Neue', sans-serif",
  mono: "var(--font-mono), 'IBM Plex Mono', 'Courier New', monospace",
} as const;

export type CardColor = "orange" | "green" | "blue" | "clay";

export const CARD_SWATCHES: Record<CardColor, string> = {
  orange: COLORS.cardOrange,
  green: COLORS.cardGreen,
  blue: COLORS.cardBlue,
  clay: COLORS.cardClay,
};

export const CANVAS_W = 680;
export const CANVAS_H = 380;
export const BRUSH_PX = 4;
export const BRUSH_COLOR = COLORS.ink;

// Path constants for decor assets.
export const ASSETS = {
  jkWatermark: "/images/art-gallery/decor/jk-watermark.png",
  chandelier: "/images/art-gallery/decor/chandelier.png",
  flowerVase: "/images/art-gallery/decor/flower-vase.png",
  peepArrow: "/images/art-gallery/decor/peep-my-art-arrow.png",
  pencilCursor: "/images/art-gallery/decor/pencil-cursor.png",
} as const;

// Pencil cursor hotspot — the pixel coordinates of the pencil tip within the 68x64 PNG.
// Tip is near top-right of the cursor image.
export const PENCIL_HOTSPOT_X = 58;
export const PENCIL_HOTSPOT_Y = 6;
