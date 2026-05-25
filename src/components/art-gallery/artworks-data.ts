// Artwork manifest. No titles, no captions — these are collage elements meant to
// speak for themselves on the wall. Aspect ratios reflect each piece's natural shape.

export type Artwork = {
  src: string;
  type: "image" | "video";
  aspectRatio: number; // width / height — used to compute display height in masonry
};

export const ARTWORKS: Artwork[] = [
  // Images
  { src: "/images/art-gallery/works/ceramic-mask.jpg", type: "image", aspectRatio: 1 },
  { src: "/images/art-gallery/works/studio-process.jpg", type: "image", aspectRatio: 0.75 },
  { src: "/images/art-gallery/works/izakaya-sushi.png", type: "image", aspectRatio: 1.4 },
  { src: "/images/art-gallery/works/metropolis-hands.png", type: "image", aspectRatio: 0.7 },
  { src: "/images/art-gallery/works/sunflower-collage.png", type: "image", aspectRatio: 1.2 },
  { src: "/images/art-gallery/works/anime-action.png", type: "image", aspectRatio: 1.3 },
  { src: "/images/art-gallery/works/fallen-angel.png", type: "image", aspectRatio: 0.8 },
  { src: "/images/art-gallery/works/die-character-sheet.png", type: "image", aspectRatio: 1.5 },
  { src: "/images/art-gallery/works/green-alien.png", type: "image", aspectRatio: 0.85 },
  { src: "/images/art-gallery/works/goggle-girl.png", type: "image", aspectRatio: 0.7 },
  // Videos
  { src: "/videos/art-gallery/process-reel-1.mp4", type: "video", aspectRatio: 0.56 },
  { src: "/videos/art-gallery/process-reel-2.mp4", type: "video", aspectRatio: 0.56 },
  { src: "/videos/art-gallery/animation-loop.mp4", type: "video", aspectRatio: 1 },
];

// Fisher-Yates shuffle for randomizing artwork order on each render.
export function shuffleArtworks(arr: Artwork[]): Artwork[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
