"use client";

import { useMemo } from "react";
import { ARTWORKS, type Artwork } from "./artworks-data";

// 3-column masonry. Distributes artworks across columns by tracking column heights
// and assigning each next piece to the shortest column — produces an even visual
// distribution despite varying aspect ratios.
function distributeToColumns(items: Artwork[], colCount: number): Artwork[][] {
  const cols: Artwork[][] = Array.from({ length: colCount }, () => []);
  const heights: number[] = Array(colCount).fill(0);

  for (const item of items) {
    // Use inverse aspect ratio (1 / aspectRatio) as proxy for rendered height
    // at fixed column width.
    const itemHeight = 1 / item.aspectRatio;
    let shortest = 0;
    for (let i = 1; i < colCount; i++) {
      if (heights[i] < heights[shortest]) shortest = i;
    }
    cols[shortest].push(item);
    heights[shortest] += itemHeight;
  }
  return cols;
}

// A single tile in the masonry — image or video, native aspect ratio preserved.
function ArtworkTile({ artwork }: { artwork: Artwork }) {
  const paddingBottom = `${(1 / artwork.aspectRatio) * 100}%`;

  return (
    <div
      data-cursor="artwork"
      style={{
        position: "relative",
        width: "100%",
        paddingBottom,
        marginBottom: 14,
        overflow: "hidden",
        borderRadius: 4,
        background: "#F5F0EC",
      }}
    >
      {artwork.type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={artwork.src}
          alt=""
          loading="lazy"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            userSelect: "none",
          }}
        />
      ) : (
        <video
          src={artwork.src}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            userSelect: "none",
          }}
        />
      )}
    </div>
  );
}

export default function ArtworksGallery() {
  // Deterministic order — render the manifest as written. The array order in
  // artworks-data.ts IS the display order; no shuffling so reloads are stable.
  const columns = useMemo(() => distributeToColumns(ARTWORKS, 3), []);

  return (
    <section
      id="artworks"
      style={{
        background: "#FFFFFF",
        padding: "40px 24px 96px",
        position: "relative",
      }}
    >
      <div
        style={{
          maxWidth: 1228,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          columnGap: 14,
        }}
      >
        {columns.map((col, ci) => (
          <div key={`col-${ci}`} style={{ display: "flex", flexDirection: "column" }}>
            {col.map((art, ai) => (
              <ArtworkTile key={`${ci}-${ai}-${art.src}`} artwork={art} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
