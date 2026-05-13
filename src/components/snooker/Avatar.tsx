"use client";

import Image from "next/image";
import { motion, useAnimationControls } from "framer-motion";

type Props = { onClick?: () => void };

export default function Avatar({ onClick }: Props) {
  const controls = useAnimationControls();

  const handleClick = () => {
    onClick?.();
    controls.start({
      scale: [1, 1.15, 0.95, 1],
      rotate: [0, -5, 5, 0],
      transition: {
        duration: 0.45,
        times: [0, 0.3, 0.65, 1],
        ease: [0.34, 1.56, 0.64, 1],
      },
    });
  };

  return (
    <motion.div
      animate={{ y: [0, -3, 0] }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{
        filter: "drop-shadow(0 6px 12px rgba(50, 30, 20, 0.2))",
        zIndex: 30,
      }}
      className="w-full flex justify-center"
    >
      <motion.button
        type="button"
        onClick={handleClick}
        animate={controls}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        aria-label="poke the watcher"
        style={{
          cursor: "pointer",
          background: "transparent",
          border: "none",
          padding: 0,
          display: "block",
          width: "100%",
          maxWidth: "120px",
        }}
      >
        <Image
          src="/images/avatar.svg"
          alt="watching you play"
          width={101}
          height={87}
          priority
          style={{
            width: "100%",
            height: "auto",
            pointerEvents: "none",
            display: "block",
          }}
        />
      </motion.button>
    </motion.div>
  );
}
