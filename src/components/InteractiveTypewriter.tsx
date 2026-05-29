"use client";

/**
 * InteractiveTypewriter
 * ---------------------
 * Coffee-brown vintage typewriter with depth-rich SVG visuals. 6 Q&A chips
 * sit in a vertical column on the right. Clicking a chip types the question
 * onto the lined paper while keyboard keys light up to match characters.
 *
 * Preserved behavior: useTyper hook, playClick (Web Audio), activeKey
 * mechanism, -3deg tilt, layered drop-shadows, chip column on the right.
 *
 * Drop-in:  <InteractiveTypewriter />
 */

import { useCallback, useEffect, useRef, useState } from "react";

/* ----------------------------- tokens ----------------------------- */
const C = {
  // Hard color references used in defs / stops / text fills
  paperBg: "#FBF4EA",
  paperRule: "#D9C8A8",
  typingText: "#8B5A3C",
  keyText: "#E8DCC8",
  // Prose + chips
  ink: "#1E1E1E",
  inkSoft: "#3A3A3A",
  burntOrange: "#C97836",
  deepOrange: "#8F4B1E",
};

const MONO = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

/* --------------------------- Q & A data --------------------------- */
type Segment = string | { text: string; href: string };

type QA = {
  id: string;
  chip: string;
  question: string;
  answer: Segment[];
};

const QAS: QA[] = [
  {
    id: "restaurant",
    chip: "What's your favorite restaurant?",
    question: "what's your favorite restaurant?",
    answer: [
      "oh honestly as a foodie this is really hard. i have the biggest back in town, but probably Shukette or Socarrat, but i'm in a search for better japanese restaurants around here.",
    ],
  },
  {
    id: "spare-time",
    chip: "What do you do in your spare time?",
    question: "what do you do in your spare time?",
    answer: [
      "i'm very active honestly. i like snowboarding, skiing, running, i'm on my 150th ride on SoulCycle lol, but i also very much enjoy painting (fun fact: my artworks went on auction at JKT), reading, drawing, and exploring small curated atmospheric stores.",
    ],
  },
  {
    id: "hardest",
    chip: "What's your hardest project by far?",
    question: "what's your hardest project by far?",
    answer: [
      "Manus AI — you can view the case study ",
      { text: "here", href: "/work/manus" },
      ".",
    ],
  },
  {
    id: "favorite",
    chip: "What's the project you liked the most?",
    question: "what's the project you liked the most?",
    answer: [
      "SecondSelf and Olive — both are my hackathon wins, you can view them ",
      { text: "here", href: "/work/second-self" },
      " and ",
      { text: "here", href: "/work/olive" },
      ".",
    ],
  },
  {
    id: "nyc",
    chip: "What are your top things to do in NYC?",
    question: "what are your top things to do in nyc?",
    answer: [
      "go to a jazz bar, walk around DUMBO then catch a sunset, and watch hamilton. thank me later.",
    ],
  },
  {
    id: "nerds",
    chip: "What's your zodiac, MBTI, and enneagram? (for the nerds)",
    question: "what's your zodiac sign, mbti, and enneagram? (for the nerds)",
    answer: [
      "if ur asking me this rn yk elite ball knowledge. I'm an aquarius, entp-a, and 8w7",
    ],
  },
];

function segmentsToPlain(segs: Segment[]): string {
  return segs.map((s) => (typeof s === "string" ? s : s.text)).join("");
}

/* ------------------------- keyboard layout ------------------------ */
/* HARD Y coordinates per spec — no cascading. All rows perfectly horizontal. */
const KEYBOARD_ROWS = [
  { y: 340, startCx: 85,  keys: "1234567890-=" }, // 12 keys
  { y: 385, startCx: 140, keys: "QWERTYUIOP" },   // 10
  { y: 425, startCx: 165, keys: "ASDFGHJKL" },    // 9
  { y: 465, startCx: 165, keys: "ZXCVBNM,." },    // 9
];

/* ------------------------------------------------------------------ */
/*  Typewriter click sound — Web Audio API, no asset file              */
/* ------------------------------------------------------------------ */
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function getAudioCtx() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.25;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

function playClick() {
  const ctx = getAudioCtx();
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;

  const bufferSize = ctx.sampleRate * 0.04;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800;
  filter.Q.value = 1.5;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.8, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  noise.connect(filter).connect(noiseGain).connect(masterGain);
  noise.start(now);
  noise.stop(now + 0.05);
}

/* ------------------------------------------------------------------ */
/*  Typing hook: types `full` one char at a time, reports active char  */
/* ------------------------------------------------------------------ */
function useTyper() {
  const [typed, setTyped] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const type = useCallback(
    (full: string, opts?: { speed?: number; onDone?: () => void }) => {
      const speed = opts?.speed ?? 38;
      let i = 0;
      clear();
      setTyped("");
      const tick = () => {
        i += 1;
        const slice = full.slice(0, i);
        setTyped(slice);
        playClick();
        const raw = full[i - 1] ?? "";
        const upper = raw.toUpperCase();
        let next: string | null = null;
        if (/[A-Z]/.test(upper)) next = upper;
        else if (/[0-9]/.test(raw)) next = raw;
        else if (raw === "-" || raw === "=" || raw === "," || raw === ".") next = raw;
        else if (raw === " ") next = " ";
        setActiveKey(next);
        if (i < full.length) {
          const jitter = speed + (Math.random() * 26 - 10);
          timer.current = setTimeout(tick, Math.max(16, jitter));
        } else {
          setActiveKey(null);
          opts?.onDone?.();
        }
      };
      timer.current = setTimeout(tick, speed);
    },
    [clear]
  );

  const reset = useCallback(() => {
    clear();
    setTyped("");
    setActiveKey(null);
  }, [clear]);

  useEffect(() => () => clear(), [clear]);

  return { typed, activeKey, type, reset };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function InteractiveTypewriter() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "question" | "answer" | "done">(
    "idle"
  );

  const qTyper = useTyper();
  const aTyper = useTyper();

  const current = QAS.find((q) => q.id === activeId) ?? null;

  const play = useCallback(
    (qa: QA) => {
      setActiveId(qa.id);
      setPhase("question");
      qTyper.reset();
      aTyper.reset();
      qTyper.type(qa.question, {
        speed: 42,
        onDone: () => {
          setTimeout(() => {
            setPhase("answer");
            aTyper.type(segmentsToPlain(qa.answer), {
              speed: 30,
              onDone: () => setPhase("done"),
            });
          }, 520);
        },
      });
    },
    [qTyper, aTyper]
  );

  const liveKey =
    phase === "question" ? qTyper.activeKey : phase === "answer" ? aTyper.activeKey : null;
  const isTyping = phase === "question" || phase === "answer";

  /* Measure each chip's text width so the active arrow can fly across it */
  const textRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [textWidths, setTextWidths] = useState<number[]>([]);
  useEffect(() => {
    const measure = () => {
      const widths = textRefs.current.map((el) => el?.offsetWidth ?? 0);
      setTextWidths(widths);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const renderAnswer = () => {
    if (!current) return null;
    const limit = aTyper.typed.length;
    let consumed = 0;
    const out: React.ReactNode[] = [];
    for (let i = 0; i < current.answer.length; i++) {
      const seg = current.answer[i];
      const text = typeof seg === "string" ? seg : seg.text;
      const start = consumed;
      const end = consumed + text.length;
      consumed = end;
      if (limit <= start) break;
      const visible = text.slice(0, Math.max(0, limit - start));
      if (typeof seg === "string") {
        out.push(<span key={i}>{visible}</span>);
      } else {
        const fullyTyped = limit >= end;
        out.push(
          fullyTyped ? (
            <a
              key={i}
              href={seg.href}
              style={{
                color: C.burntOrange,
                textDecoration: "underline",
                textUnderlineOffset: "2px",
                fontWeight: 600,
              }}
            >
              {visible}
            </a>
          ) : (
            <span key={i} style={{ color: C.burntOrange, fontWeight: 600 }}>
              {visible}
            </span>
          )
        );
      }
    }
    return out;
  };

  const linedBg =
    `repeating-linear-gradient(to bottom, transparent 0, transparent 27px, ${C.paperRule} 27px, ${C.paperRule} 28px), ${C.paperBg}`;

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "row", gap: 48, alignItems: "center", maxWidth: 1100, margin: "0 auto" }}>
        {/* ----- LEFT: shadowed typewriter unit (upright) ----- */}
        <div
          style={{
            filter:
              "drop-shadow(0 4px 8px rgba(30, 30, 30, 0.08)) drop-shadow(0 16px 32px rgba(30, 30, 30, 0.12)) drop-shadow(0 32px 64px rgba(30, 30, 30, 0.08))",
          }}
        >
          <div style={{ position: "relative", width: 720 }}>
            {/* ------------- LINED PAPER (tucks behind chassis/platen) ------------- */}
            <div
              style={{
                position: "relative",
                margin: "0 auto",
                width: "60%",
                minHeight: 232,
                background: linedBg,
                borderRadius: "3px 3px 0 0",
                boxShadow:
                  "0 -1px 0 rgba(0,0,0,0.04), 0 10px 24px rgba(58,42,32,0.10), inset 0 0 0 1px rgba(58,42,32,0.04)",
                padding: "22px 26px 16px",
                fontFamily: MONO,
                fontSize: 13,
                lineHeight: "28px",
                color: C.inkSoft,
                zIndex: 1,
                marginBottom: -80,
              }}
            >
              {phase === "idle" ? (
                <p style={{ color: "rgba(58,42,32,0.45)", fontStyle: "italic", margin: 0 }}>
                  pick a question and i&apos;ll type back&hellip;
                </p>
              ) : (
                <>
                  <p style={{ margin: 0, color: C.ink, fontWeight: 600 }}>
                    &gt; {qTyper.typed}
                    {phase === "question" && <span style={{ ...caretStyle }}>|</span>}
                  </p>
                  {(phase === "answer" || phase === "done") && (
                    <p style={{ margin: "0", marginTop: 4 }}>
                      {renderAnswer()}
                      {phase === "answer" && <span style={{ ...caretStyle }}>|</span>}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* ------------- CHASSIS + KEYBOARD (single SVG) ------------- */}
            <svg
              viewBox="0 0 780 520"
              width="720"
              height="480"
              style={{ display: "block", position: "relative", zIndex: 2 }}
              aria-hidden
            >
              <defs>
                <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6B4630" />
                  <stop offset="60%" stopColor="#4A2F1A" />
                  <stop offset="100%" stopColor="#2D1A0F" />
                </linearGradient>

                <linearGradient id="carriageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7A5439" />
                  <stop offset="100%" stopColor="#3D2515" />
                </linearGradient>

                <radialGradient id="keycapGrad" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#7A5439" />
                  <stop offset="100%" stopColor="#3D2515" />
                </radialGradient>

                <radialGradient id="knobGrad" cx="35%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="#9C6B45" />
                  <stop offset="100%" stopColor="#2D1A0F" />
                </radialGradient>

                <radialGradient id="spoolWell" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1F120A" />
                  <stop offset="100%" stopColor="#0F0805" />
                </radialGradient>

                <radialGradient id="activeKeyGrad" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#E89556" />
                  <stop offset="100%" stopColor="#A05E26" />
                </radialGradient>
              </defs>

              {/* ===== UNIFIED BODY (no separate keyboard tray) ===== */}
              <rect x="20" y="120" width="740" height="380" rx="16" fill="url(#bodyGrad)" />
              {/* Bottom beveled highlight stripe */}
              <rect x="20" y="496" width="740" height="4" rx="2" fill="#7A5439" opacity="0.3" />

              {/* ===== CARRIAGE PEDESTAL ===== */}
              <rect x="90" y="80" width="600" height="60" rx="8" fill="url(#carriageGrad)" />

              {/* ===== PLATEN (dark ridged cylinder) ===== */}
              <rect x="100" y="110" width="580" height="24" rx="12" fill="#1F120A" />
              {/* 30 vertical ridge lines every 18px */}
              {Array.from({ length: 30 }, (_, i) => {
                const x = 109 + i * 18;
                return (
                  <line
                    key={`ridge-${i}`}
                    x1={x}
                    y1="112"
                    x2={x}
                    y2="132"
                    stroke="#3D2515"
                    strokeWidth="1"
                  />
                );
              })}

              {/* ===== KNOB SPHERES at carriage ends ===== */}
              <circle cx="100" cy="110" r="18" fill="url(#knobGrad)" />
              <circle cx="680" cy="110" r="18" fill="url(#knobGrad)" />

              {/* ===== JAZ & CO NAMEPLATE ===== */}
              <rect x="335" y="190" width="110" height="22" rx="4" fill="#1F120A" />
              <text
                x="390"
                y="206"
                textAnchor="middle"
                fontFamily={MONO}
                fontSize="11"
                fontWeight="600"
                fill="#E8DCC8"
                letterSpacing="1.65"
              >
                JAZ &amp; CO
              </text>

              {/* ===== SHE'S TYPING... INDICATOR ===== */}
              <text
                x="390"
                y="240"
                textAnchor="middle"
                fontFamily={MONO}
                fontSize="10"
                fill={C.typingText}
                letterSpacing="2.5"
                style={{
                  animation: isTyping ? "tw-typing-pulse 1.2s ease-in-out infinite" : "none",
                  opacity: isTyping ? undefined : 0.4,
                }}
              >
                SHE&apos;S TYPING...
              </text>

              {/* ===== SPOOL WELLS (inset into body) ===== */}
              {[
                { cx: 160, cy: 240 },
                { cx: 620, cy: 240 },
              ].map((p, idx) => (
                <g key={`spool-${idx}`}>
                  {/* recessed well */}
                  <circle cx={p.cx} cy={p.cy} r="44" fill="url(#spoolWell)" />
                  {/* inner hub disc */}
                  <circle cx={p.cx} cy={p.cy} r="36" fill="#3D2515" />
                  {/* 8 spokes */}
                  {Array.from({ length: 8 }, (_, i) => {
                    const a = (i * Math.PI) / 4;
                    const cosA = Math.cos(a);
                    const sinA = Math.sin(a);
                    return (
                      <line
                        key={`spk-${i}`}
                        x1={p.cx + 10 * cosA}
                        y1={p.cy + 10 * sinA}
                        x2={p.cx + 32 * cosA}
                        y2={p.cy + 32 * sinA}
                        stroke="#8B5A3C"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    );
                  })}
                  {/* center bolt */}
                  <circle cx={p.cx} cy={p.cy} r="8" fill="url(#knobGrad)" />
                </g>
              ))}

              {/* ===== KEYBOARD ROWS (3-layer keys: shadow + rim + cap) ===== */}
              {KEYBOARD_ROWS.flatMap((row) =>
                Array.from(row.keys).map((k, ki) => {
                  const cx = row.startCx + ki * 50;
                  const cy = row.y;
                  const active = liveKey === k;
                  return (
                    <g key={`k-${row.y}-${k}-${ki}`}>
                      {/* drop shadow ellipse */}
                      <ellipse cx={cx} cy={cy + 14} rx="18" ry="4" fill="#000" opacity="0.3" />
                      {/* rim / well */}
                      <circle cx={cx} cy={cy} r="18" fill="#2D1A0F" />
                      {/* keycap (lifted 2px) */}
                      <circle
                        cx={cx}
                        cy={cy - 2}
                        r="15"
                        fill={active ? "url(#activeKeyGrad)" : "url(#keycapGrad)"}
                        data-key={k}
                      />
                      <text
                        x={cx}
                        y={cy + 2}
                        textAnchor="middle"
                        fontFamily={MONO}
                        fontSize="11"
                        fontWeight="700"
                        fill={C.keyText}
                      >
                        {k}
                      </text>
                    </g>
                  );
                })
              )}

              {/* ===== SPACEBAR (rim + shadow + cap) ===== */}
              {(() => {
                const x = 250;
                const y = 493; // center 505, height 24 → top 493
                const w = 280;
                const h = 24;
                const active = liveKey === " ";
                return (
                  <g>
                    {/* shadow */}
                    <ellipse cx={x + w / 2} cy={y + h + 4} rx={w / 2} ry="4" fill="#000" opacity="0.3" />
                    {/* rim */}
                    <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx="15" fill="#2D1A0F" />
                    {/* cap */}
                    <rect
                      x={x}
                      y={y - 2}
                      width={w}
                      height={h}
                      rx="12"
                      fill={active ? "url(#activeKeyGrad)" : "url(#keycapGrad)"}
                      data-key=" "
                    />
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* ----- RIGHT: arrow-prefixed question rows ----- */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignSelf: "center",
            maxWidth: 420,
          }}
        >
          {QAS.map((qa, idx) => {
            const busy = phase === "question" || phase === "answer";
            const isActive = activeId === qa.id && busy;
            const textWidth = textWidths[idx] ?? 0;
            return (
              <button
                key={qa.id}
                type="button"
                className={`tw-q-row${isActive ? " tw-q-active" : ""}`}
                disabled={busy && !isActive}
                onClick={() => play(qa)}
                aria-label={qa.chip}
                aria-pressed={isActive}
              >
                <span
                  className="tw-q-arrow"
                  style={
                    isActive
                      ? {
                          transform: `translateX(${textWidth + 14}px)`,
                          opacity: 0,
                        }
                      : undefined
                  }
                  aria-hidden
                >
                  <svg
                    viewBox="0 0 20 20"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="3" y1="10" x2="17" y2="10" />
                    <polyline points="11,4 17,10 11,16" />
                  </svg>
                </span>
                <span
                  className="tw-q-text"
                  ref={(el) => {
                    textRefs.current[idx] = el;
                  }}
                >
                  <span
                    style={{
                      backgroundImage: "linear-gradient(#C97836, #C97836)",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "0 0.58em",
                      backgroundSize: isActive ? "100% 1.5px" : "0% 1.5px",
                      transition:
                        "background-size 0.45s cubic-bezier(0.65, 0, 0.35, 1)",
                      WebkitBoxDecorationBreak: "clone",
                      boxDecorationBreak: "clone",
                    }}
                  >
                    {qa.chip}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* keyframes + question-row styles */}
      <style>{`
        @keyframes tw-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes tw-typing-pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes tw-arrow-pulse { 0%,100%{transform:translateX(0)} 50%{transform:translateX(2px)} }
        @keyframes tw-underline-grow { from{transform:scaleX(0)} to{transform:scaleX(1)} }

        .tw-q-row {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          background: transparent;
          border: none;
          padding: 8px 0;
          cursor: pointer;
          text-align: left;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          position: relative;
        }
        .tw-q-row:disabled { cursor: default; }
        .tw-q-row:disabled:not(.tw-q-active) { opacity: 0.45; }

        .tw-q-arrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          color: #3A2618;
          animation: tw-arrow-pulse 2s ease-in-out infinite;
          transition: transform 0.45s cubic-bezier(0.65, 0, 0.35, 1),
                      opacity 0.1s ease 0.35s,
                      color 0.2s ease;
        }
        .tw-q-row:disabled:not(.tw-q-active) .tw-q-arrow { animation: none; }

        .tw-q-text {
          position: relative;
          display: inline-block;
          font-size: 17px;
          font-weight: 500;
          color: #3A2618;
          letter-spacing: -0.01em;
          transition: color 0.3s ease;
        }
        .tw-q-text::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -2px;
          width: 100%;
          height: 1px;
          background: #C97836;
          transform-origin: left center;
          transform: scaleX(0);
          transition: transform 0.3s ease;
          pointer-events: none;
        }

        /* Hover (not active, not disabled) */
        .tw-q-row:hover:not(.tw-q-active):not(:disabled) .tw-q-arrow {
          transform: translateX(6px);
          animation: none;
          color: #C97836;
        }
        .tw-q-row:hover:not(.tw-q-active):not(:disabled) .tw-q-text {
          color: #C97836;
        }
        .tw-q-row:hover:not(.tw-q-active):not(:disabled) .tw-q-text::after {
          animation: tw-underline-grow 0.3s ease forwards;
        }

        /* Active — arrow translate set inline (per-chip text width); strike via background-gradient on .tw-q-text */
        .tw-q-row.tw-q-active .tw-q-text { color: rgba(139, 90, 60, 0.6); }
        .tw-q-row.tw-q-active .tw-q-arrow { animation: none; }
      `}</style>
    </div>
  );
}

const caretStyle: React.CSSProperties = {
  display: "inline-block",
  marginLeft: 1,
  color: C.burntOrange,
  fontWeight: 700,
  animation: "tw-blink 1s steps(1) infinite",
};
