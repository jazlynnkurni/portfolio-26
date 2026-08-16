/* Deterministic artefact thumbnails, painted to a 2D canvas from a seed.
   Ten looks, all drawn from the portfolio palette so a pile of them reads as
   one project rather than ten stock images. Shared by the prototypes that
   need "real work" to show. */

const CREAM = "#FFF5EF";
const PAPER = "#FBF7F2";
const INK = "#16100C";
const BURNT = "#C97836";
const SAGE = "#73A090";

function rng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function thumbPainter(canvas: HTMLCanvasElement, seed: number) {
  const g = canvas.getContext("2d")!;
  const w = canvas.width;
  const h = canvas.height;
  const r = rng(seed);
  const style = seed % 5;

  g.clearRect(0, 0, w, h);
  g.fillStyle = PAPER;
  g.fillRect(0, 0, w, h);

  if (style === 0) {
    // Wireframe: a screen skeleton, the most legible "this is design work".
    g.fillStyle = "#EFE8E1";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#FFF";
    g.fillRect(w * 0.12, h * 0.1, w * 0.76, h * 0.8);
    g.fillStyle = "rgba(22,16,12,0.1)";
    for (let i = 0; i < 5; i++) {
      const y = h * (0.2 + i * 0.13);
      g.fillRect(w * 0.18, y, w * (0.3 + r() * 0.35), h * 0.045);
    }
    g.fillStyle = BURNT;
    g.fillRect(w * 0.18, h * 0.16, w * 0.16, h * 0.05);
  } else if (style === 1) {
    // Mesh gradient — the "shader / motion" artefact.
    const blobs: [number, number, string][] = [
      [w * 0.3, h * 0.35, BURNT],
      [w * 0.75, h * 0.6, SAGE],
      [w * 0.55, h * 0.2, "#E9C48A"],
    ];
    for (const [x, y, c] of blobs) {
      const rad = g.createRadialGradient(x, y, 0, x, y, w * 0.55);
      rad.addColorStop(0, c);
      rad.addColorStop(1, "rgba(255,245,239,0)");
      g.fillStyle = rad;
      g.fillRect(0, 0, w, h);
    }
    g.globalAlpha = 0.25;
    for (let i = 0; i < 900; i++) {
      g.fillStyle = r() > 0.5 ? "#fff" : INK;
      g.fillRect(r() * w, r() * h, 1, 1);
    }
    g.globalAlpha = 1;
  } else if (style === 2) {
    // Flow map — boxes and connectors.
    g.strokeStyle = "rgba(22,16,12,0.35)";
    g.lineWidth = 1.4;
    const nodes = [];
    for (let i = 0; i < 5; i++) {
      nodes.push([w * (0.14 + r() * 0.7), h * (0.16 + r() * 0.66)]);
    }
    for (let i = 1; i < nodes.length; i++) {
      g.beginPath();
      g.moveTo(nodes[i - 1][0], nodes[i - 1][1]);
      const mx = (nodes[i - 1][0] + nodes[i][0]) / 2;
      g.bezierCurveTo(mx, nodes[i - 1][1], mx, nodes[i][1], nodes[i][0], nodes[i][1]);
      g.stroke();
    }
    for (const [x, y] of nodes) {
      g.fillStyle = CREAM;
      g.strokeStyle = INK;
      g.lineWidth = 1.6;
      const bw = w * 0.19, bh = h * 0.12;
      g.fillRect(x - bw / 2, y - bh / 2, bw, bh);
      g.strokeRect(x - bw / 2, y - bh / 2, bw, bh);
    }
    g.fillStyle = BURNT;
    g.beginPath();
    g.arc(nodes[nodes.length - 1][0], nodes[nodes.length - 1][1], 5, 0, 7);
    g.fill();
  } else if (style === 3) {
    // Type spec — a specimen block.
    g.fillStyle = INK;
    g.font = `${Math.round(h * 0.42)}px Georgia, serif`;
    g.textBaseline = "middle";
    g.fillText("Aa", w * 0.12, h * 0.42);
    g.fillStyle = BURNT;
    g.fillRect(w * 0.12, h * 0.68, w * 0.5, 2);
    g.fillStyle = "rgba(22,16,12,0.4)";
    g.font = `${Math.round(h * 0.09)}px ui-monospace, monospace`;
    g.fillText("48 / 56 · -0.02em", w * 0.12, h * 0.8);
  } else {
    // Data / usability — a small bar read.
    g.strokeStyle = "rgba(22,16,12,0.12)";
    g.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const y = h * (0.25 + i * 0.18);
      g.beginPath(); g.moveTo(w * 0.1, y); g.lineTo(w * 0.9, y); g.stroke();
    }
    const n = 6;
    for (let i = 0; i < n; i++) {
      const bh = h * (0.12 + r() * 0.5);
      const x = w * 0.13 + i * (w * 0.74 / n);
      g.fillStyle = i === n - 1 ? BURNT : "rgba(22,16,12,0.55)";
      g.fillRect(x, h * 0.82 - bh, w * 0.074, bh);
    }
  }

  // Uniform paper grain over everything — the unifier.
  g.globalAlpha = 0.05;
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = r() > 0.5 ? "#000" : "#fff";
    g.fillRect(r() * w, r() * h, 1, 1);
  }
  g.globalAlpha = 1;
}
