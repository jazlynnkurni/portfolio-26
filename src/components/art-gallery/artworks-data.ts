// Artwork manifest. No titles, no captions — these are collage elements meant to
// speak for themselves on the wall. Aspect ratios reflect each piece's natural shape.

export type Artwork = {
  src: string;
  type: "image" | "video";
  aspectRatio: number; // width / height — used to compute display height in masonry
};

// Aspect ratios measured from actual file dimensions (magick identify / ffprobe).
// width / height — used to compute display height in the masonry layout.
export const ARTWORKS: Artwork[] = [
  // Images
  { src: "/images/art-gallery/works/ceramic-mask.jpg", type: "image", aspectRatio: 1.138 },        // 1179x1036
  { src: "/images/art-gallery/works/izakaya-sushi.png", type: "image", aspectRatio: 1.699 },       // 1138x670
  { src: "/images/art-gallery/works/metropolis-hands.png", type: "image", aspectRatio: 0.707 },    // 2480x3508
  { src: "/images/art-gallery/works/sunflower-collage.png", type: "image", aspectRatio: 0.707 },   // 3508x4961
  { src: "/images/art-gallery/works/anime-action.png", type: "image", aspectRatio: 1.415 },        // 3508x2480
  { src: "/images/art-gallery/works/fallen-angel.png", type: "image", aspectRatio: 1.415 },        // 3508x2480
  { src: "/images/art-gallery/works/die-character-sheet.png", type: "image", aspectRatio: 1.415 }, // 3508x2480
  { src: "/images/art-gallery/works/green-alien.png", type: "image", aspectRatio: 1.0 },           // 2048x2048
  { src: "/images/art-gallery/works/goggle-girl.png", type: "image", aspectRatio: 1.0 },           // 2048x2048
  { src: "/images/art-gallery/works/angel.png", type: "image", aspectRatio: 0.707 },                // 2480x3508
  { src: "/images/art-gallery/works/cat.png", type: "image", aspectRatio: 1.0 },                    // 2048x2048
  { src: "/images/art-gallery/works/police.png", type: "image", aspectRatio: 0.698 },               // 1668x2388
  { src: "/images/art-gallery/works/spider-verse.png", type: "image", aspectRatio: 0.707 },         // 2480x3508
  { src: "/images/art-gallery/works/tsk-art.png", type: "image", aspectRatio: 1.415 },              // 3508x2480
  { src: "/images/art-gallery/works/yourclothes.png", type: "image", aspectRatio: 1.0 },            // 1080x1080
  // Videos
  { src: "/videos/art-gallery/process-reel-1.mp4", type: "video", aspectRatio: 1.816 },            // 886x488
  { src: "/videos/art-gallery/process-reel-2.mp4", type: "video", aspectRatio: 1.831 },            // 886x484
  { src: "/videos/art-gallery/animation-loop.mp4", type: "video", aspectRatio: 1.778 },            // 1280x720
];
