"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import {
  CANVAS_W,
  CANVAS_H,
  BRUSH_PX,
  BRUSH_COLOR,
} from "./tokens";
import { CURSOR_MODE_EVENT } from "@/components/CustomCursor";

export type DrawingCanvasHandle = {
  clear: () => void;
  toDataURL: () => string;
  hasStrokes: () => boolean;
};

type Props = {
  backgroundColor: string;
  onFirstStroke?: () => void;
  watermarkSrc: string;
};

// A single stroke is a series of points the user dragged through.
type Point = { x: number; y: number };
type Stroke = Point[];

const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(function DrawingCanvas(
  { backgroundColor, onFirstStroke, watermarkSrc },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const strokesRef = useRef<Stroke[]>([]); // all completed + in-progress strokes
  const currentStrokeRef = useRef<Stroke | null>(null);
  const dprRef = useRef(1);
  const onFirstStrokeRef = useRef(onFirstStroke);

  useEffect(() => {
    onFirstStrokeRef.current = onFirstStroke;
  }, [onFirstStroke]);

  // Helper: paint background + all strokes from scratch.
  // Called on init, color change, and clear.
  const repaint = (color: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background fill in CSS pixel space (transform already DPR-scaled).
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Replay every stroke.
    ctx.strokeStyle = BRUSH_COLOR;
    ctx.lineWidth = BRUSH_PX;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokesRef.current) {
      if (stroke.length < 2) {
        // Single-point tap: draw as a dot.
        if (stroke.length === 1) {
          ctx.beginPath();
          ctx.arc(stroke[0].x, stroke[0].y, BRUSH_PX / 2, 0, Math.PI * 2);
          ctx.fillStyle = BRUSH_COLOR;
          ctx.fill();
        }
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    }
  };

  // One-time init: scale for retina + initial paint.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width = `${CANVAS_W}px`;
    canvas.style.height = `${CANVAS_H}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    repaint(backgroundColor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Repaint whenever color changes.
  useEffect(() => {
    repaint(backgroundColor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundColor]);

  // Mouse handlers — append to current stroke, then redraw the latest segment.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPoint = (e: MouseEvent): Point => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onMouseDown = (e: MouseEvent) => {
      isDrawingRef.current = true;
      const p = getPoint(e);
      const newStroke: Stroke = [p];
      currentStrokeRef.current = newStroke;
      strokesRef.current.push(newStroke);

      // Fire first-stroke callback exactly once.
      if (strokesRef.current.length === 1) {
        onFirstStrokeRef.current?.();
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDrawingRef.current || !currentStrokeRef.current) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const next = getPoint(e);
      const prev = currentStrokeRef.current[currentStrokeRef.current.length - 1];
      currentStrokeRef.current.push(next);

      // Incremental draw: just stroke the new segment.
      ctx.strokeStyle = BRUSH_COLOR;
      ctx.lineWidth = BRUSH_PX;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(next.x, next.y);
      ctx.stroke();
    };

    const onMouseUp = () => {
      isDrawingRef.current = false;
      currentStrokeRef.current = null;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // Dispatch cursor mode swap when entering/leaving the canvas, and clean up on unmount.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const enter = () => {
      window.dispatchEvent(new CustomEvent(CURSOR_MODE_EVENT, { detail: { mode: "pencil" } }));
    };
    const leave = () => {
      window.dispatchEvent(new CustomEvent(CURSOR_MODE_EVENT, { detail: { mode: "default" } }));
    };

    canvas.addEventListener("mouseenter", enter);
    canvas.addEventListener("mouseleave", leave);

    return () => {
      canvas.removeEventListener("mouseenter", enter);
      canvas.removeEventListener("mouseleave", leave);
      // Ensure cursor is restored if user navigates away mid-hover.
      window.dispatchEvent(new CustomEvent(CURSOR_MODE_EVENT, { detail: { mode: "default" } }));
    };
  }, []);

  useImperativeHandle(ref, () => ({
    clear: () => {
      strokesRef.current = [];
      repaint(backgroundColor);
    },
    toDataURL: () => {
      const canvas = canvasRef.current;
      if (!canvas) return "";
      return canvas.toDataURL("image/png");
    },
    hasStrokes: () => strokesRef.current.length > 0,
  }));

  // Cursor is swapped via CustomCursor's pencil mode event (see useEffect above).

  return (
    <div
      style={{
        position: "relative",
        width: CANVAS_W,
        height: CANVAS_H,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(30, 30, 30, 0.18)",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          touchAction: "none",
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={watermarkSrc}
        alt=""
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          width: 48,
          height: 48,
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
    </div>
  );
});

export default DrawingCanvas;
