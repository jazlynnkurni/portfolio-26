/* The "finished case study" that hides under the undeveloped stock in 02 and
   behind the torn paper in 05. Painted rather than photographed so the lab
   stays a single folder with no assets. */

import { thumbPainter } from "./thumbs";

const CREAM = "#FFF5EF";
const INK = "#16100C";
const BURNT = "#C97836";

export function paintCaseStudy(canvas: HTMLCanvasElement, project?: string) {
  const g = canvas.getContext("2d")!;
  const W = canvas.width;
  const H = canvas.height;
  const u = W / 1440; // layout unit, so it scales with the viewport

  g.fillStyle = CREAM;
  g.fillRect(0, 0, W, H);

  // Running head
  g.fillStyle = BURNT;
  g.font = `500 ${13 * u}px ui-monospace, monospace`;
  g.fillText((project ? project.toUpperCase() + " — " : "") + "CASE STUDY", 96 * u, 78 * u);
  g.fillStyle = "rgba(22,16,12,0.45)";
  g.fillText("FOUNDING DESIGN ENGINEER · 2026", W - 400 * u, 78 * u);

  // Display headline, two lines
  g.fillStyle = INK;
  g.font = `${92 * u}px Georgia, serif`;
  g.fillText("Shipping an agent people", 96 * u, 230 * u);
  g.fillText("actually keep open.", 96 * u, 330 * u);

  // Deck
  g.fillStyle = "rgba(22,16,12,0.62)";
  g.font = `${23 * u}px Georgia, serif`;
  g.fillText("Ten weeks, one designer, a glasses assistant that had to earn its", 96 * u, 400 * u);
  g.fillText("second session. Here is what moved the number.", 96 * u, 436 * u);

  // Metric row — the thing a recruiter reads first
  const metrics: [string, string][] = [
    ["+41%", "day-7 retention"],
    ["6.2s → 1.4s", "time to first answer"],
    ["3", "surfaces unified"],
  ];
  metrics.forEach(([big, small], i) => {
    const x = 96 * u + i * 340 * u;
    g.fillStyle = BURNT;
    g.font = `${46 * u}px Georgia, serif`;
    g.fillText(big, x, 540 * u);
    g.fillStyle = "rgba(22,16,12,0.5)";
    g.font = `500 ${13 * u}px ui-monospace, monospace`;
    g.fillText(small.toUpperCase(), x, 572 * u);
  });

  g.fillStyle = "rgba(22,16,12,0.14)";
  g.fillRect(96 * u, 620 * u, W - 192 * u, 1.5 * u);

  // Artefact strip — reuses the same painter as the contact sheet
  const cardW = (W - 192 * u - 48 * u) / 3;
  const cardH = cardW * 0.62;
  for (let i = 0; i < 3; i++) {
    const x = 96 * u + i * (cardW + 24 * u);
    const y = 670 * u;
    const tile = document.createElement("canvas");
    tile.width = Math.max(2, Math.round(cardW));
    tile.height = Math.max(2, Math.round(cardH));
    thumbPainter(tile, i + 1);
    g.save();
    g.shadowColor = "rgba(22,16,12,0.18)";
    g.shadowBlur = 26 * u;
    g.shadowOffsetY = 10 * u;
    g.drawImage(tile, x, y);
    g.restore();
    g.fillStyle = "rgba(22,16,12,0.45)";
    g.font = `500 ${12 * u}px ui-monospace, monospace`;
    g.fillText(["FIG 01 — TRIGGER PROOF", "FIG 02 — STITCH", "FIG 03 — LEDGER"][i], x, y + cardH + 26 * u);
  }

  // Body columns below the fold of the artwork
  const colTop = 670 * u + cardH + 70 * u;
  for (let c = 0; c < 2; c++) {
    const x = 96 * u + c * ((W - 192 * u) / 2 + 24 * u);
    const cw = (W - 192 * u) / 2 - 24 * u;
    g.fillStyle = INK;
    g.font = `${28 * u}px Georgia, serif`;
    g.fillText(c === 0 ? "The problem" : "What I changed", x, colTop);
    g.fillStyle = "rgba(22,16,12,0.22)";
    for (let i = 0; i < 7; i++) {
      const lw = cw * (i === 6 ? 0.42 : 0.86 + (i % 3) * 0.04);
      g.fillRect(x, colTop + 34 * u + i * 26 * u, Math.min(lw, cw), 9 * u);
    }
  }
}
