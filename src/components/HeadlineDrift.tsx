"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionValue,
} from "framer-motion";

const REPEL_RADIUS = 120;
const MAX_OFFSET = 24;
const SPRING = { stiffness: 200, damping: 22 };

export type HeadlineSegment = { text: string; italic?: boolean };

type Token = {
  key: string;
  text: string;
  italic: boolean;
  trailingSpace: boolean;
};

function tokenize(segments: HeadlineSegment[]): Token[] {
  const tokens: Token[] = [];
  let counter = 0;
  segments.forEach((seg, i) => {
    if (seg.italic) {
      const leading = seg.text.startsWith(" ");
      const trailing = seg.text.endsWith(" ");
      const text = seg.text.trim();
      if (leading && tokens.length > 0) {
        tokens[tokens.length - 1].trailingSpace = true;
      }
      if (text.length > 0) {
        tokens.push({
          key: `i-${i}`,
          text,
          italic: true,
          trailingSpace: trailing,
        });
      }
    } else {
      const parts = seg.text.split(/(\s+)/);
      parts.forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          if (tokens.length > 0) tokens[tokens.length - 1].trailingSpace = true;
        } else {
          tokens.push({
            key: `w-${counter++}`,
            text: part,
            italic: false,
            trailingSpace: false,
          });
        }
      });
    }
  });
  return tokens;
}

type WordHandle = {
  el: HTMLElement;
  cx: number;
  cy: number;
  x: MotionValue<number>;
  y: MotionValue<number>;
};

type WordContext = {
  register: (h: WordHandle) => void;
  unregister: (h: WordHandle) => void;
  disabled: boolean;
};

function Word({ token, ctx }: { token: Token; ctx: WordContext }) {
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING);
  const sy = useSpring(y, SPRING);

  useEffect(() => {
    if (ctx.disabled) return;
    const el = ref.current;
    if (!el) return;
    const handle: WordHandle = { el, cx: 0, cy: 0, x, y };
    ctx.register(handle);
    return () => ctx.unregister(handle);
  }, [ctx, x, y]);

  const content = (
    <>
      {token.text}
      {token.trailingSpace && " "}
    </>
  );

  if (token.italic) {
    return (
      <motion.em
        ref={ref as React.RefObject<HTMLElement>}
        className="wavy"
        style={{
          x: sx,
          y: sy,
          display: "inline-block",
          fontStyle: "italic",
          color: "#C97836",
          textDecoration: "none",
        }}
      >
        {content}
      </motion.em>
    );
  }

  return (
    <motion.span
      ref={ref as React.RefObject<HTMLElement>}
      style={{ x: sx, y: sy, display: "inline-block" }}
    >
      {content}
    </motion.span>
  );
}

type Props = {
  segments: HeadlineSegment[];
  className?: string;
};

export default function HeadlineDrift({ segments, className }: Props) {
  const tokens = useMemo(() => tokenize(segments), [segments]);
  const reducedMotion = useReducedMotion();
  const handlesRef = useRef<WordHandle[]>([]);

  const register = useCallback((h: WordHandle) => {
    handlesRef.current.push(h);
  }, []);
  const unregister = useCallback((h: WordHandle) => {
    handlesRef.current = handlesRef.current.filter((w) => w !== h);
  }, []);

  const ctx: WordContext = useMemo(
    () => ({ register, unregister, disabled: !!reducedMotion }),
    [register, unregister, reducedMotion]
  );

  useEffect(() => {
    if (reducedMotion) return;
    if (typeof window === "undefined") return;

    const recompute = () => {
      handlesRef.current.forEach((h) => {
        const r = h.el.getBoundingClientRect();
        h.cx = r.left + r.width / 2;
        h.cy = r.top + r.height / 2;
      });
    };

    let cancelled = false;
    const init = () => {
      if (cancelled) return;
      recompute();
    };

    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(init);
    }
    requestAnimationFrame(init);

    const onMove = (e: MouseEvent) => {
      const cx = e.clientX;
      const cy = e.clientY;
      handlesRef.current.forEach((h) => {
        const dx = h.cx - cx;
        const dy = h.cy - cy;
        const d = Math.hypot(dx, dy);
        if (d < REPEL_RADIUS) {
          const strength = ((REPEL_RADIUS - d) / REPEL_RADIUS) * MAX_OFFSET;
          const inv = 1 / (d || 1);
          h.x.set(dx * inv * strength);
          h.y.set(dy * inv * strength);
        } else {
          h.x.set(0);
          h.y.set(0);
        }
      });
    };
    const onResize = () => recompute();
    const onScroll = () => recompute();

    window.addEventListener("mousemove", onMove);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelled = true;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [reducedMotion, tokens]);

  return (
    <h1 className={className}>
      {tokens.map((tok) => (
        <Word key={tok.key} token={tok} ctx={ctx} />
      ))}
    </h1>
  );
}
