"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import Matter from "matter-js";
import { useCueAim, type ShotInfo } from "@/hooks/useCueAim";
import Ball from "./Ball";
import CueStick from "./CueStick";
import AimGuide from "./AimGuide";
import Avatar from "./Avatar";
import SpeechBubble from "./SpeechBubble";

type RackBall = {
  number: number;
  x: number;
  y: number;
  color: string;
  isStriped?: boolean;
};

const RACK: RackBall[] = [
  // Row 1 — apex
  { number: 1, x: 50, y: 24, color: "#7A9471" },
  // Row 2
  { number: 2, x: 46.8, y: 29.6, color: "#B08968" },
  { number: 9, x: 53.2, y: 29.6, color: "#7A9471", isStriped: true },
  // Row 3 — 8-ball in center
  { number: 10, x: 43.5, y: 35.3, color: "#B08968", isStriped: true },
  { number: 8, x: 50, y: 35.3, color: "#1E1E1E" },
  { number: 3, x: 56.5, y: 35.3, color: "#C97836" },
  // Row 4
  { number: 11, x: 40.3, y: 40.9, color: "#C97836", isStriped: true },
  { number: 4, x: 46.8, y: 40.9, color: "#5B7F9E" },
  { number: 12, x: 53.3, y: 40.9, color: "#5B7F9E", isStriped: true },
  { number: 5, x: 59.8, y: 40.9, color: "#C9A437" },
  // Row 5 — widest
  { number: 6, x: 37, y: 46.5, color: "#A04A3F" },
  { number: 13, x: 43.5, y: 46.5, color: "#A04A3F", isStriped: true },
  { number: 7, x: 50, y: 46.5, color: "#7B6293" },
  { number: 14, x: 56.5, y: 46.5, color: "#C9A437", isStriped: true },
  { number: 15, x: 63, y: 46.5, color: "#7B6293", isStriped: true },
];

const CUE_BALL_INITIAL = { x: 50, y: 72 };

const TAUNTS = [
  "u weak af",
  "js put the fries in the bag bro",
  "even my mom plays better",
  "jk i believe in u",
  "words of affirmation",
  "u gyat tht",
];

// --- Physics constants (in painted-PNG coordinate space: 768 × 1376) ---
const PHYS_W = 768;
const PHYS_H = 1376;
const BALL_RADIUS = (6.5 / 2 / 100) * PHYS_W; // ≈ 25
const CUSHION_INSET_X = 56;
const CUSHION_INSET_Y = 90;
const CUSHION_THICKNESS = 200;
const REST_VELOCITY_THRESHOLD = 0.05;
const MAX_SHOT_SPEED = 28;
const PULLBACK_MAX = 40;

const POCKET_RADIUS = BALL_RADIUS * 1.4;
const POCKETS: Array<{ x: number; y: number; label: string }> = [
  { x: 60, y: 100, label: "pocket-tl" },
  { x: PHYS_W - 60, y: 100, label: "pocket-tr" },
  { x: 60, y: PHYS_H / 2, label: "pocket-ml" },
  { x: PHYS_W - 60, y: PHYS_H / 2, label: "pocket-mr" },
  { x: 60, y: PHYS_H - 100, label: "pocket-bl" },
  { x: PHYS_W - 60, y: PHYS_H - 100, label: "pocket-br" },
];

const DROP_ANIM_MS = 200;

type Vec = { x: number; y: number };
type Positions = { balls: Vec[]; cueBall: Vec };
type CueBallStatus = "active" | "dropping" | "respawning";
type Turn = "player" | "avatar";
const AVATAR_PLACEHOLDER_DELAY_MS = 1200;

const INITIAL_POSITIONS: Positions = {
  balls: RACK.map((b) => ({ x: b.x, y: b.y })),
  cueBall: { x: CUE_BALL_INITIAL.x, y: CUE_BALL_INITIAL.y },
};

export default function SnookerScene() {
  const [tauntIndex, setTauntIndex] = useState(0);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [cueVisible, setCueVisible] = useState(true);
  const [positions, setPositions] = useState<Positions>(INITIAL_POSITIONS);
  const [droppingNumbers, setDroppingNumbers] = useState<Set<number>>(
    () => new Set()
  );
  const [pocketedNumbers, setPocketedNumbers] = useState<Set<number>>(
    () => new Set()
  );
  const [cueBallStatus, setCueBallStatus] =
    useState<CueBallStatus>("active");
  const [gameOver, setGameOver] = useState(false);
  const [gameOverShooter, setGameOverShooter] = useState<Turn | null>(null);
  // Player ALWAYS breaks the rack. No coin flip.
  const [turn, setTurn] = useState<Turn>("player");

  const tableRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<Matter.World | null>(null);
  const ballBodiesRef = useRef<Matter.Body[]>([]);
  const cueBallBodyRef = useRef<Matter.Body | null>(null);
  const shotInFlightRef = useRef(false);
  const removedFromPhysicsRef = useRef<Set<number>>(new Set());
  const cueBallStatusRef = useRef<CueBallStatus>("active");
  const gameOverPendingRef = useRef(false);
  const turnRef = useRef<Turn>("player");
  const dropTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const cueDropTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleShoot = useCallback(({ aimAngleDeg, pullback }: ShotInfo) => {
    if (turnRef.current !== "player") return;
    if (shotInFlightRef.current) return;
    const cueBall = cueBallBodyRef.current;
    if (!cueBall || cueBallStatusRef.current !== "active") return;
    const speed = (pullback / PULLBACK_MAX) * MAX_SHOT_SPEED;
    const aimRad = (aimAngleDeg * Math.PI) / 180;
    Matter.Body.setVelocity(cueBall, {
      x: Math.cos(aimRad) * speed,
      y: Math.sin(aimRad) * speed,
    });
    setCueVisible(false);
    shotInFlightRef.current = true;
  }, []);

  // Avatar placeholder turn: when it's avatar's turn and game isn't over,
  // wait ~1200ms then pass back to player. Real AI ships next prompt.
  useEffect(() => {
    if (turn !== "avatar" || gameOver) return;
    const t = setTimeout(() => {
      console.log("avatar would shoot now (placeholder)");
      turnRef.current = "player";
      setTurn("player");
    }, AVATAR_PLACEHOLDER_DELAY_MS);
    return () => clearTimeout(t);
  }, [turn, gameOver]);

  // Debug: log turn whenever it changes.
  useEffect(() => {
    console.log("[snooker]", `turn=${turn}`);
  }, [turn]);

  const { cueAngle, aimAngle, pullback, isHovering, isAiming, bind } =
    useCueAim(
      tableRef,
      positions.cueBall.x,
      positions.cueBall.y,
      { onShoot: handleShoot }
    );

  const handleTaunt = () => {
    if (!bubbleVisible) {
      setBubbleVisible(true);
    } else {
      setTauntIndex((i) => (i + 1) % TAUNTS.length);
    }
  };

  // Matter.js engine setup
  useEffect(() => {
    const engine = Matter.Engine.create();
    engine.gravity.scale = 0;
    const world = engine.world;
    worldRef.current = world;

    const ballBodies = RACK.map((b) =>
      Matter.Bodies.circle(
        (b.x / 100) * PHYS_W,
        (b.y / 100) * PHYS_H,
        BALL_RADIUS,
        {
          restitution: 0.9,
          friction: 0.001,
          frictionAir: 0.015,
          density: 0.001,
          label: `ball-${b.number}`,
        }
      )
    );
    const cueBallBody = Matter.Bodies.circle(
      (CUE_BALL_INITIAL.x / 100) * PHYS_W,
      (CUE_BALL_INITIAL.y / 100) * PHYS_H,
      BALL_RADIUS,
      {
        restitution: 0.9,
        friction: 0.001,
        frictionAir: 0.015,
        density: 0.001,
        label: "cue-ball",
      }
    );
    ballBodiesRef.current = ballBodies;
    cueBallBodyRef.current = cueBallBody;

    const cushionOpts = { isStatic: true, restitution: 0.8, friction: 0.05 };
    const playW = PHYS_W - 2 * CUSHION_INSET_X;
    const playH = PHYS_H - 2 * CUSHION_INSET_Y;
    const cushionTop = Matter.Bodies.rectangle(
      PHYS_W / 2,
      CUSHION_INSET_Y - CUSHION_THICKNESS / 2,
      playW + CUSHION_THICKNESS * 2,
      CUSHION_THICKNESS,
      cushionOpts
    );
    const cushionBottom = Matter.Bodies.rectangle(
      PHYS_W / 2,
      PHYS_H - CUSHION_INSET_Y + CUSHION_THICKNESS / 2,
      playW + CUSHION_THICKNESS * 2,
      CUSHION_THICKNESS,
      cushionOpts
    );
    const cushionLeft = Matter.Bodies.rectangle(
      CUSHION_INSET_X - CUSHION_THICKNESS / 2,
      PHYS_H / 2,
      CUSHION_THICKNESS,
      playH + CUSHION_THICKNESS * 2,
      cushionOpts
    );
    const cushionRight = Matter.Bodies.rectangle(
      PHYS_W - CUSHION_INSET_X + CUSHION_THICKNESS / 2,
      PHYS_H / 2,
      CUSHION_THICKNESS,
      playH + CUSHION_THICKNESS * 2,
      cushionOpts
    );

    // Pocket sensors — invisible, do not block balls, just detect entry.
    const pocketBodies = POCKETS.map((p) =>
      Matter.Bodies.circle(p.x, p.y, POCKET_RADIUS, {
        isStatic: true,
        isSensor: true,
        label: p.label,
      })
    );

    Matter.World.add(world, [
      ...ballBodies,
      cueBallBody,
      cushionTop,
      cushionBottom,
      cushionLeft,
      cushionRight,
      ...pocketBodies,
    ]);

    // --- Pocket helpers ---
    const pocketNumberedBall = (num: number, body: Matter.Body) => {
      if (removedFromPhysicsRef.current.has(num)) return;
      removedFromPhysicsRef.current.add(num);
      if (num === 8) {
        gameOverPendingRef.current = true;
      }
      Matter.Body.setVelocity(body, { x: 0, y: 0 });
      Matter.World.remove(world, body);
      setDroppingNumbers((prev) => {
        const next = new Set(prev);
        next.add(num);
        return next;
      });
      const t = setTimeout(() => {
        setDroppingNumbers((prev) => {
          const next = new Set(prev);
          next.delete(num);
          return next;
        });
        setPocketedNumbers((prev) => {
          const next = new Set(prev);
          next.add(num);
          return next;
        });
        dropTimeoutsRef.current.delete(num);
      }, DROP_ANIM_MS);
      dropTimeoutsRef.current.set(num, t);
    };

    const pocketCueBall = (body: Matter.Body) => {
      if (cueBallStatusRef.current !== "active") return;
      cueBallStatusRef.current = "dropping";
      Matter.Body.setVelocity(body, { x: 0, y: 0 });
      Matter.World.remove(world, body);
      setCueBallStatus("dropping");
      cueDropTimeoutRef.current = setTimeout(() => {
        cueBallStatusRef.current = "respawning";
        setCueBallStatus("respawning");
        cueDropTimeoutRef.current = null;
        // Actual respawn (teleport + re-add to world) happens in the RAF loop
        // once all other balls have come to rest.
      }, DROP_ANIM_MS);
    };

    // --- Collision detection ---
    const onCollisionStart = (event: Matter.IEventCollision<Matter.Engine>) => {
      for (const pair of event.pairs) {
        const { bodyA, bodyB } = pair;
        const a = bodyA.label;
        const b = bodyB.label;
        const aIsPocket = a.startsWith("pocket-");
        const bIsPocket = b.startsWith("pocket-");
        if (aIsPocket === bIsPocket) continue;
        const pocketBody = aIsPocket ? bodyA : bodyB;
        const ballBody = aIsPocket ? bodyB : bodyA;
        const ballLabel = ballBody.label;
        if (ballLabel === "cue-ball") {
          pocketCueBall(ballBody);
        } else if (ballLabel.startsWith("ball-")) {
          const num = parseInt(ballLabel.slice(5), 10);
          pocketNumberedBall(num, ballBody);
        }
        // Silence unused var warning
        void pocketBody;
      }
    };
    Matter.Events.on(engine, "collisionStart", onCollisionStart);

    // --- RAF loop ---
    let rafId = 0;
    let cancelled = false;
    let lastT = performance.now();

    const allBodies = [...ballBodies, cueBallBody];
    const isAtRest = () =>
      allBodies.every((b) => {
        const v = b.velocity;
        return Math.hypot(v.x, v.y) < REST_VELOCITY_THRESHOLD;
      });

    const respawnCueBall = () => {
      const cb = cueBallBodyRef.current;
      if (!cb || !worldRef.current) return;
      Matter.Body.setPosition(cb, {
        x: (CUE_BALL_INITIAL.x / 100) * PHYS_W,
        y: (CUE_BALL_INITIAL.y / 100) * PHYS_H,
      });
      Matter.Body.setVelocity(cb, { x: 0, y: 0 });
      Matter.World.add(worldRef.current, cb);
      cueBallStatusRef.current = "active";
      setCueBallStatus("active");
    };

    const tick = (now: number) => {
      if (cancelled) return;
      const dt = Math.min(now - lastT, 32);
      lastT = now;
      Matter.Engine.update(engine, dt);

      setPositions({
        balls: ballBodies.map((b) => ({
          x: (b.position.x / PHYS_W) * 100,
          y: (b.position.y / PHYS_H) * 100,
        })),
        cueBall: {
          x: (cueBallBody.position.x / PHYS_W) * 100,
          y: (cueBallBody.position.y / PHYS_H) * 100,
        },
      });

      if (shotInFlightRef.current && isAtRest()) {
        const status = cueBallStatusRef.current;
        if (status === "dropping") {
          // Wait until the drop animation marks the cue ball as 'respawning'.
        } else {
          if (status === "respawning") {
            respawnCueBall();
          }
          shotInFlightRef.current = false;
          const shooter = turnRef.current;

          if (gameOverPendingRef.current) {
            // 8-ball was pocketed this shot — overlay text uses shooter.
            setGameOverShooter(shooter);
            setGameOver(true);
          } else {
            // Strict alternation: turn ALWAYS swaps after any non-game-over
            // shot. No conditions.
            const nextTurn: Turn = shooter === "player" ? "avatar" : "player";
            turnRef.current = nextTurn;
            setTurn(nextTurn);
            setCueVisible(true);
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      Matter.Events.off(engine, "collisionStart", onCollisionStart);
      dropTimeoutsRef.current.forEach((t) => clearTimeout(t));
      dropTimeoutsRef.current.clear();
      if (cueDropTimeoutRef.current) clearTimeout(cueDropTimeoutRef.current);
      cueDropTimeoutRef.current = null;
      removedFromPhysicsRef.current.clear();
      cueBallStatusRef.current = "active";
      gameOverPendingRef.current = false;
      Matter.World.clear(world, false);
      Matter.Engine.clear(engine);
      worldRef.current = null;
      ballBodiesRef.current = [];
      cueBallBodyRef.current = null;
    };
  }, []);

  const handleReset = useCallback(() => {
    const world = worldRef.current;
    const cueBall = cueBallBodyRef.current;
    if (!world || !cueBall) return;

    // Re-rack all 15 numbered balls at their original positions.
    RACK.forEach((meta, i) => {
      const body = ballBodiesRef.current[i];
      if (!body) return;
      Matter.Body.setPosition(body, {
        x: (meta.x / 100) * PHYS_W,
        y: (meta.y / 100) * PHYS_H,
      });
      Matter.Body.setVelocity(body, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(body, 0);
      if (removedFromPhysicsRef.current.has(meta.number)) {
        Matter.World.add(world, body);
      }
    });

    // Respawn cue ball at its original starting position.
    Matter.Body.setPosition(cueBall, {
      x: (CUE_BALL_INITIAL.x / 100) * PHYS_W,
      y: (CUE_BALL_INITIAL.y / 100) * PHYS_H,
    });
    Matter.Body.setVelocity(cueBall, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(cueBall, 0);
    if (cueBallStatusRef.current !== "active") {
      Matter.World.add(world, cueBall);
      cueBallStatusRef.current = "active";
      setCueBallStatus("active");
    }

    // Clear all pocket/shot/game-over state.
    removedFromPhysicsRef.current.clear();
    gameOverPendingRef.current = false;
    shotInFlightRef.current = false;
    setPocketedNumbers(new Set());
    setDroppingNumbers(new Set());
    setGameOver(false);
    setGameOverShooter(null);
    setCueVisible(true);
    // Player always breaks the rack.
    turnRef.current = "player";
    setTurn("player");
  }, []);

  const showCueBall = cueBallStatus !== "respawning";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
      className="hidden md:block pb-12"
      style={{
        maxWidth: "min(400px, calc((100vh - 220px) / 1.79))",
        width: "100%",
      }}
    >
      <div
        ref={tableRef}
        className="relative mx-auto"
        style={{
          aspectRatio: "768 / 1376",
          width: "100%",
        }}
      >
        <Image
          src="/images/snooker-table.png"
          alt="painted snooker table"
          fill
          priority
          unoptimized
          sizes="(min-width: 768px) 360px, 0px"
          style={{
            objectFit: "contain",
            zIndex: 10,
            pointerEvents: "none",
          }}
        />
        {positions.balls.map((pos, i) => {
          const meta = RACK[i];
          if (pocketedNumbers.has(meta.number)) return null;
          return (
            <Ball
              key={meta.number}
              number={meta.number}
              x={pos.x}
              y={pos.y}
              color={meta.color}
              isStriped={meta.isStriped}
              dropping={droppingNumbers.has(meta.number)}
            />
          );
        })}
        <AimGuide
          aimAngle={aimAngle}
          visible={isAiming}
          cueBallX={positions.cueBall.x}
          cueBallY={positions.cueBall.y}
        />
        <CueStick
          angle={cueAngle}
          pullback={pullback}
          x={positions.cueBall.x}
          y={positions.cueBall.y}
          visible={cueVisible && turn === "player" && !gameOver}
        />
        {showCueBall && (
          <Ball
            x={positions.cueBall.x}
            y={positions.cueBall.y}
            color="#FFF5EF"
            isCueBall
            dropping={cueBallStatus === "dropping"}
          />
        )}

        {/* Avatar + bubble */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "92%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            width: "25%",
            zIndex: 5,
          }}
        >
          {bubbleVisible && (
            <div style={{ zIndex: 40, position: "relative" }}>
              <SpeechBubble
                text={TAUNTS[tauntIndex]}
                visible={true}
              />
            </div>
          )}
          <Avatar onClick={handleTaunt} />
        </div>

        {/* Aim capture overlay — disabled when it's not the player's turn
            or when the game-over overlay is showing. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            cursor:
              turn === "player" && !gameOver && isHovering
                ? "crosshair"
                : "default",
            pointerEvents:
              turn === "player" && !gameOver ? "auto" : "none",
            zIndex: 50,
          }}
          {...bind}
        />

        {/* GAME OVER overlay — appears when 8-ball is pocketed and balls rest */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "14px",
                padding: "24px",
                zIndex: 60,
                pointerEvents: "none",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-serif), serif",
                  fontSize: "32px",
                  color: "#FFF5EF",
                  fontWeight: 400,
                  letterSpacing: "0.02em",
                  margin: 0,
                  textAlign: "center",
                  textShadow: "0 2px 12px rgba(30, 30, 30, 0.4)",
                }}
              >
                GAME OVER
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: "13px",
                  color: "#FFF5EF",
                  opacity: 0.85,
                  margin: 0,
                  textAlign: "center",
                  textShadow: "0 2px 12px rgba(30, 30, 30, 0.4)",
                }}
              >
                {gameOverShooter === "avatar"
                  ? "the avatar potted the 8 ball"
                  : "you potted the 8 ball"}
              </p>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  marginTop: "8px",
                  fontFamily: "var(--font-sans), sans-serif",
                  backgroundColor: "#C97836",
                  color: "#FFF5EF",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  border: "none",
                  cursor: "pointer",
                  pointerEvents: "auto",
                }}
              >
                rack &apos;em up again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
