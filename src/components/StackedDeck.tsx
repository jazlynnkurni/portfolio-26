"use client";

import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";

interface StackedDeckProps {
  cards: ReactNode[];
  cardWidth?: number;
  cardHeight?: number;
}

export default function StackedDeck({
  cards,
  cardWidth = 280,
  cardHeight = 320,
}: StackedDeckProps) {
  const [order, setOrder] = useState<number[]>(cards.map((_, i) => i));
  const [exitDirection, setExitDirection] = useState<number>(0);

  const cycleToNext = (direction: number = 1) => {
    setExitDirection(direction);
    setOrder((prev) => {
      const [first, ...rest] = prev;
      return [...rest, first];
    });
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number } }
  ) => {
    if (Math.abs(info.offset.x) > 100) {
      cycleToNext(info.offset.x > 0 ? 1 : -1);
    }
  };

  const handleClick = () => {
    cycleToNext(1);
  };

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: cardWidth + 60, height: cardHeight + 100 }}
    >
      <div
        className="relative"
        style={{ width: cardWidth, height: cardHeight }}
      >
        {order.map((cardIdx, stackPos) => {
          const isTop = stackPos === 0;
          const visible = stackPos < 3;
          if (!visible) return null;

          const scale = 1 - stackPos * 0.05;
          const opacity = 1 - stackPos * 0.2;
          const yOffset = stackPos * 12;
          const rotate = stackPos === 1 ? -3 : stackPos === 2 ? 4 : 0;
          const zIndex = 10 - stackPos;

          return (
            <motion.div
              key={cardIdx}
              className={`absolute top-0 left-0 ${
                isTop ? "cursor-grab active:cursor-grabbing" : ""
              }`}
              style={{
                width: cardWidth,
                height: cardHeight,
                zIndex,
              }}
              initial={{
                x: isTop ? exitDirection * 400 : 0,
                opacity: isTop ? 0 : opacity,
                scale: isTop ? 0.8 : scale,
                y: yOffset,
                rotate,
              }}
              animate={{
                x: 0,
                opacity,
                scale,
                y: yOffset,
                rotate,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              drag={isTop ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={isTop ? handleDragEnd : undefined}
              onClick={isTop ? handleClick : undefined}
              whileHover={
                isTop
                  ? {
                      y: yOffset - 8,
                      transition: { duration: 0.2 },
                    }
                  : undefined
              }
            >
              {cards[cardIdx]}
            </motion.div>
          );
        })}
      </div>

      <div className="flex gap-2 mt-8">
        {cards.map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-colors duration-300"
            style={{
              backgroundColor:
                order[0] === i ? "#C97836" : "rgba(30, 30, 30, 0.3)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
