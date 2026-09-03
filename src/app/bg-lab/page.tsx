"use client";

/**
 * BG-LAB (throwaway) — 5 interactive-background prototypes.
 * -------------------------------------------------------------------
 * A switcher between five ways the site background can invite interaction
 * (the recent.design / trends-on-x "I care about details" feel). Each is a
 * full-viewport layer behind sample hero content so you can judge how it reads
 * with real text on top. Pick a direction; not wired into the real site.
 *
 * Palette: cream #FFF5EF · ink #3A2A20 · clover green #717C4D · burnt #C97836
 */

import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

const CREAM = "#FFF5EF";
const GREEN = "113,124,77"; // #717C4D
const BURNT = "201,120,54"; // #C97836

/* ----------------------------- helpers ----------------------------- */
function useCanvas(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void,
  handlers: {
    move?: (x: number, y: number) => void;
    down?: (x: number, y: number) => void;
    leave?: () => void;
    resize?: (w: number, h: number) => void;
  } = {}
) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const hRef = useRef(handlers);
  hRef.current = handlers;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    let raf = 0;
    let start = 0;

    const size = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      hRef.current.resize?.(w, h);
    };
    size();

    const rel = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top] as const;
    };
    const onMove = (e: PointerEvent) => hRef.current.move?.(...rel(e));
    const onDown = (e: PointerEvent) => hRef.current.down?.(...rel(e));
    const onLeave = () => hRef.current.leave?.();
    const onResize = () => size();

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", onResize);

    const loop = (ts: number) => {
      if (!start) start = ts;
      drawRef.current(ctx, w, h, (ts - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return ref;
}

/* ---------------------- 1 · Magnetic dot grid ---------------------- */
function MagneticDots() {
  const dots = useRef<{ x: number; y: number }[]>([]);
  const mouse = useRef({ x: -9999, y: -9999 });
  const ripples = useRef<{ x: number; y: number; t: number }[]>([]);
  const GAP = 32;
  const R = 150;

  const build = (w: number, h: number) => {
    const d: { x: number; y: number }[] = [];
    for (let y = GAP / 2; y < h; y += GAP)
      for (let x = GAP / 2; x < w; x += GAP) d.push({ x, y });
    dots.current = d;
  };

  const ref = useCanvas(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const rp = ripples.current;
      for (let i = rp.length - 1; i >= 0; i--) {
        rp[i].t += 1;
        if (rp[i].t > 95) rp.splice(i, 1);
      }
      const m = mouse.current;
      for (const d of dots.current) {
        let ox = 0;
        let oy = 0;
        let scale = 1;
        let alpha = 0.16;
        const dx = d.x - m.x;
        const dy = d.y - m.y;
        const dist = Math.hypot(dx, dy);
        if (dist < R) {
          const f = 1 - dist / R;
          const a = Math.atan2(dy, dx);
          ox += Math.cos(a) * f * 14;
          oy += Math.sin(a) * f * 14;
          scale += f * 1.8;
          alpha += f * 0.6;
        }
        for (const r of rp) {
          const rr = r.t * 8;
          const rd = Math.hypot(d.x - r.x, d.y - r.y);
          const band = Math.abs(rd - rr);
          if (band < 46) {
            const f = (1 - band / 46) * (1 - r.t / 95);
            const a = Math.atan2(d.y - r.y, d.x - r.x);
            ox += Math.cos(a) * f * 22;
            oy += Math.sin(a) * f * 22;
            scale += f * 1.4;
            alpha = Math.min(1, alpha + f * 0.6);
          }
        }
        ctx.beginPath();
        ctx.arc(d.x + ox, d.y + oy, 1.5 * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${GREEN},${alpha})`;
        ctx.fill();
      }
    },
    {
      resize: build,
      move: (x, y) => (mouse.current = { x, y }),
      leave: () => (mouse.current = { x: -9999, y: -9999 }),
      down: (x, y) => ripples.current.push({ x, y, t: 0 }),
    }
  );
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}

/* ---------------------- 2 · Cursor spotlight ---------------------- */
function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      el.style.setProperty("--x", `${e.clientX}px`);
      el.style.setProperty("--y", `${e.clientY}px`);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  const dots =
    `radial-gradient(circle, rgba(${GREEN},0.9) 1px, transparent 1.4px)`;
  return (
    <div ref={ref} className="absolute inset-0">
      {/* faint base texture */}
      <div
        className="absolute inset-0 opacity-[0.10]"
        style={{ backgroundImage: dots, backgroundSize: "22px 22px" }}
      />
      {/* brighter texture revealed only under the cursor */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: dots,
          backgroundSize: "22px 22px",
          opacity: 0.9,
          WebkitMaskImage:
            "radial-gradient(240px circle at var(--x,50%) var(--y,50%), #000 0%, transparent 65%)",
          maskImage:
            "radial-gradient(240px circle at var(--x,50%) var(--y,50%), #000 0%, transparent 65%)",
        }}
      />
      {/* warm glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(300px circle at var(--x,50%) var(--y,50%), rgba(${BURNT},0.16), transparent 70%)`,
        }}
      />
    </div>
  );
}

/* ---------------------- 3 · Ripple water field --------------------- */
function RippleField() {
  const ripples = useRef<{ x: number; y: number; t: number; strong: boolean }[]>(
    []
  );
  const last = useRef(0);
  const ref = useCanvas(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const rp = ripples.current;
      for (let i = rp.length - 1; i >= 0; i--) {
        const r = rp[i];
        r.t += 1;
        const life = r.strong ? 120 : 70;
        if (r.t > life) {
          rp.splice(i, 1);
          continue;
        }
        const p = r.t / life;
        const base = r.strong ? 220 : 120;
        const rings = r.strong ? 3 : 2;
        for (let k = 0; k < rings; k++) {
          const rad = p * base - k * 18;
          if (rad <= 0) continue;
          const a = (1 - p) * (r.strong ? 0.5 : 0.32) * (1 - k * 0.28);
          ctx.beginPath();
          ctx.arc(r.x, r.y, rad, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${GREEN},${a})`;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      }
    },
    {
      move: (x, y) => {
        const now = performance.now();
        if (now - last.current > 90) {
          last.current = now;
          ripples.current.push({ x, y, t: 0, strong: false });
        }
      },
      down: (x, y) => ripples.current.push({ x, y, t: 0, strong: true }),
    }
  );
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}

/* ------------------- 4 · Draggable brand objects ------------------- */
function DraggableObjects() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = canvas.clientWidth;
    let h = canvas.clientHeight;

    const engine = Matter.Engine.create();
    engine.gravity.y = 0.6;
    const world = engine.world;

    const wallOpts = { isStatic: true, render: { visible: false } };
    let walls: Matter.Body[] = [];
    const buildWalls = () => {
      Matter.World.remove(world, walls);
      walls = [
        Matter.Bodies.rectangle(w / 2, h + 40, w + 200, 80, wallOpts),
        Matter.Bodies.rectangle(-40, h / 2, 80, h * 2, wallOpts),
        Matter.Bodies.rectangle(w + 40, h / 2, 80, h * 2, wallOpts),
        Matter.Bodies.rectangle(w / 2, -400, w + 200, 80, wallOpts),
      ];
      Matter.World.add(world, walls);
    };
    buildWalls();

    type Meta = { kind: "ball" | "tile"; color: string; r?: number };
    const meta = new WeakMap<Matter.Body, Meta>();
    const palette = [
      `rgba(${GREEN},1)`,
      `rgba(${BURNT},1)`,
      "#3A2A20",
      "#B2743C",
    ];
    const bodies: Matter.Body[] = [];
    const N = 14;
    for (let i = 0; i < N; i++) {
      const x = 80 + Math.random() * Math.max(1, w - 160);
      const y = 60 + Math.random() * Math.max(1, h * 0.5);
      const color = palette[i % palette.length];
      if (i % 3 === 0) {
        const s = 46;
        const b = Matter.Bodies.rectangle(x, y, s, s * 1.35, {
          chamfer: { radius: 8 },
          restitution: 0.5,
          friction: 0.1,
        });
        meta.set(b, { kind: "tile", color });
        bodies.push(b);
      } else {
        const r = 18 + Math.random() * 16;
        const b = Matter.Bodies.circle(x, y, r, {
          restitution: 0.7,
          friction: 0.05,
        });
        meta.set(b, { kind: "ball", color, r });
        bodies.push(b);
      }
    }
    Matter.World.add(world, bodies);

    const mouse = Matter.Mouse.create(canvas);
    mouse.pixelRatio = dpr;
    const mc = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.2, render: { visible: false } },
    });
    Matter.World.add(world, mc);

    const size = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildWalls();
    };
    size();
    const onResize = () => size();
    window.addEventListener("resize", onResize);

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    let raf = 0;
    const render = () => {
      ctx.clearRect(0, 0, w, h);
      for (const b of bodies) {
        const m = meta.get(b)!;
        ctx.save();
        ctx.translate(b.position.x, b.position.y);
        ctx.rotate(b.angle);
        if (m.kind === "ball") {
          const r = m.r!;
          const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
          g.addColorStop(0, "rgba(255,255,255,0.55)");
          g.addColorStop(0.25, m.color);
          g.addColorStop(1, m.color);
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        } else {
          const s = 46;
          const hh = s * 1.35;
          ctx.fillStyle = CREAM;
          roundRect(ctx, -s / 2, -hh / 2, s, hh, 8);
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = m.color;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fillStyle = m.color;
          ctx.fill();
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      Matter.Runner.stop(runner);
      Matter.World.clear(world, false);
      Matter.Engine.clear(engine);
    };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 h-full w-full touch-none" />;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ------------------- 5 · Constellation (ambient + interactive) ----- */
type Node = { x: number; y: number; vx: number; vy: number };
function Constellation() {
  const nodes = useRef<Node[]>([]);
  const bursts = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>(
    []
  );
  const mouse = useRef({ x: -9999, y: -9999, active: false });
  const built = useRef(false);
  const LINK = 132; // node-to-node link distance
  const CURSOR = 175; // cursor link/attract distance

  const build = (w: number, h: number) => {
    const count = Math.round(Math.min(96, Math.max(28, (w * h) / 15000)));
    const arr: Node[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.24,
        vy: (Math.random() - 0.5) * 0.24,
      });
    }
    nodes.current = arr;
    built.current = true;
  };

  const ref = useCanvas(
    (ctx, w, h) => {
      if (!built.current) build(w, h);
      ctx.clearRect(0, 0, w, h);
      const arr = nodes.current;
      const m = mouse.current;

      // drift + gentle cursor attraction
      for (const p of arr) {
        if (m.active) {
          const dx = m.x - p.x;
          const dy = m.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < CURSOR && d > 1) {
            const f = (1 - d / CURSOR) * 0.045;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x += w;
        else if (p.x > w) p.x -= w;
        if (p.y < 0) p.y += h;
        else if (p.y > h) p.y -= h;
      }

      // node-to-node links
      for (let i = 0; i < arr.length; i++) {
        const a = arr[i];
        for (let j = i + 1; j < arr.length; j++) {
          const b = arr[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${GREEN},${(1 - d / LINK) * 0.26})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        // link to cursor
        if (m.active) {
          const d = Math.hypot(a.x - m.x, a.y - m.y);
          if (d < CURSOR) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = `rgba(${BURNT},${(1 - d / CURSOR) * 0.5})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // nodes
      for (const p of arr) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${GREEN},0.55)`;
        ctx.fill();
      }
      // cursor node
      if (m.active) {
        ctx.beginPath();
        ctx.arc(m.x, m.y, 3.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${BURNT},0.9)`;
        ctx.fill();
      }
      // click bursts
      const bs = bursts.current;
      for (let i = bs.length - 1; i >= 0; i--) {
        const p = bs[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.life -= 0.02;
        if (p.life <= 0) {
          bs.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${BURNT},${p.life})`;
        ctx.fill();
      }
    },
    {
      resize: () => (built.current = false),
      move: (x, y) => (mouse.current = { x, y, active: true }),
      leave: () => (mouse.current = { ...mouse.current, active: false }),
      down: (x, y) => {
        for (let i = 0; i < 14; i++) {
          const a = (Math.PI * 2 * i) / 14;
          const s = 1 + Math.random() * 2.2;
          bursts.current.push({
            x,
            y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            life: 1,
          });
        }
      },
    }
  );
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}

/* ------------------------------ page ------------------------------- */
const PROTOS = [
  { id: 1, name: "Magnetic Dots", hint: "dots pull to your cursor · click to ripple", el: <MagneticDots /> },
  { id: 2, name: "Spotlight Reveal", hint: "a warm light uncovers the texture as you move", el: <Spotlight /> },
  { id: 3, name: "Water Ripples", hint: "move to ripple · click for a big splash", el: <RippleField /> },
  { id: 4, name: "Draggable Objects", hint: "grab and throw the balls & tiles", el: <DraggableObjects /> },
  { id: 5, name: "Constellation", hint: "a living trail follows and connects", el: <Constellation /> },
];

export default function BgLab() {
  const [mode, setMode] = useState(1);
  const current = PROTOS.find((p) => p.id === mode)!;
  return (
    <main
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: CREAM }}
    >
      {/* interactive layer (remounts per mode so only one runs) */}
      <div key={mode} className="absolute inset-0">
        {current.el}
      </div>

      {/* sample hero content on top */}
      <div className="pointer-events-none relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-[#3A2A20]/50">
          {current.hint}
        </p>
        <h1 className="mt-6 max-w-3xl font-serif text-[34px] leading-tight text-[#3A2A20] md:text-[52px]">
          Halo I&rsquo;m Jazlynn, a <em>product designer</em> who builds
          <em> AI-native experiences</em>.
        </h1>
        <p className="mt-6 font-mono text-[13px] text-[#3A2A20]/60">
          try moving your cursor and clicking anywhere
        </p>
      </div>

      {/* switcher */}
      <div className="fixed inset-x-0 bottom-6 z-20 flex justify-center px-4">
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-black/5 bg-white/70 p-2 backdrop-blur-md">
          {PROTOS.map((p) => (
            <button
              key={p.id}
              onClick={() => setMode(p.id)}
              className="rounded-full px-4 py-2 font-mono text-[12px] transition-colors"
              style={
                mode === p.id
                  ? { background: "#3A2A20", color: CREAM }
                  : { color: "#3A2A20" }
              }
            >
              {p.id}. {p.name}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
