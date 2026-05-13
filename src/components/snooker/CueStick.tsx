type Props = {
  angle?: number;
  length?: number;
};

export default function CueStick({ angle = 0, length = 45 }: Props) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: "50%",
        top: "75.5%",
        width: "4%",
        height: `${length}%`,
        transform: `translateX(-50%) rotate(${angle}deg)`,
        transformOrigin: "50% 0%",
        background:
          "linear-gradient(to bottom, #95704F 0%, #95704F 18%, #B08968 22%, #B08968 100%)",
        clipPath: "polygon(28% 0%, 72% 0%, 100% 100%, 0% 100%)",
        filter:
          "drop-shadow(2px 4px 6px rgba(50, 30, 20, 0.3)) blur(0.4px)",
        zIndex: 30,
        pointerEvents: "none",
      }}
    />
  );
}
