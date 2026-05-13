"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 500, damping: 28, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 500, damping: 28, mass: 0.5 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      x.set(e.clientX - 4);
      y.set(e.clientY - 4);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      className="custom-cursor"
      style={{ translateX: springX, translateY: springY }}
    />
  );
}
