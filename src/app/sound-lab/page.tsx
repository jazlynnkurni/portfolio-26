"use client";

/**
 * SOUND-LAB — ball-clink sound variations.
 * -------------------------------------------------------------------
 * Renders the real scene and plays a synthesized collision sound each time two
 * balls touch (impact scales volume + pitch). Five sound characters to compare,
 * all generated with the Web Audio API (no asset files). Not in nav.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import ChromeSnookerScene from "@/components/snooker/ChromeSnookerScene";

type SoundId = "glass" | "wood" | "marble" | "clack" | "chime";
const SOUNDS: { id: SoundId; name: string; blurb: string }[] = [
  { id: "marble", name: "Marble Click", blurb: "bright, glassy tick with a short ring" },
  { id: "glass", name: "Glass Clink", blurb: "high crystalline ping, longer shimmer" },
  { id: "wood", name: "Wood Knock", blurb: "warm, dull, filtered thock" },
  { id: "clack", name: "Pool Clack", blurb: "punchy double-transient, real table" },
  { id: "chime", name: "Bell Chime", blurb: "soft tonal bell, dreamy" },
];

function useSynth() {
  const ctxRef = useRef<AudioContext | null>(null);
  const lastRef = useRef(0);
  const ensure = () => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    // Browsers create the context suspended; resume() must run inside a gesture.
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  };
  const resume = useCallback(() => { ensure(); }, []);
  const play = useCallback((id: SoundId, impact: number, vol: number) => {
    const ctx = ensure(); const now = ctx.currentTime;
    // simple rate-limit so a single frame's many contacts don't machine-gun
    if (now - lastRef.current < 0.02) return; lastRef.current = now;
    const amp = Math.min(1, impact / 18) * vol; if (amp < 0.02) return;
    const pitch = 1 + Math.min(1, impact / 25) * 0.5; // faster hits ring higher

    const master = ctx.createGain(); master.gain.value = amp; master.connect(ctx.destination);

    if (id === "wood") {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.25));
      const src = ctx.createBufferSource(); src.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 320 * pitch; bp.Q.value = 6;
      src.connect(bp); bp.connect(master); src.start(now); src.stop(now + 0.07);
    } else if (id === "clack") {
      for (let k = 0; k < 2; k++) {
        const t = now + k * 0.012;
        const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.setValueAtTime(520 * pitch, t); o.frequency.exponentialRampToValueAtTime(180, t + 0.05);
        const g = ctx.createGain(); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        const n = ctx.createBufferSource(); const b = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate); const dd = b.getChannelData(0); for (let i = 0; i < dd.length; i++) dd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (dd.length * 0.2)); n.buffer = b;
        const ng = ctx.createGain(); ng.gain.value = 0.4; n.connect(ng); ng.connect(master);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.07); n.start(t);
      }
    } else {
      // tonal family: marble / glass / chime — sine partials with decay
      const specs: Record<string, { freq: number; parts: number[]; decay: number }> = {
        marble: { freq: 1400, parts: [1, 2.7], decay: 0.09 },
        glass: { freq: 2100, parts: [1, 2.4, 4.1], decay: 0.22 },
        chime: { freq: 720, parts: [1, 2.0, 3.01, 4.2], decay: 0.6 },
      };
      const s = specs[id];
      s.parts.forEach((mul, idx) => {
        const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = s.freq * pitch * mul;
        const g = ctx.createGain(); const peak = 0.9 / (idx + 1);
        g.gain.setValueAtTime(peak, now); g.gain.exponentialRampToValueAtTime(0.0008, now + s.decay);
        o.connect(g); g.connect(master); o.start(now); o.stop(now + s.decay + 0.02);
      });
    }
  }, []);
  return { play, resume };
}

export default function SoundLab() {
  const [sound, setSound] = useState<SoundId>("marble");
  const [vol, setVol] = useState(0.7);
  const soundRef = useRef(sound); soundRef.current = sound;
  const volRef = useRef(vol); volRef.current = vol;
  const { play, resume } = useSynth();
  const [armed, setArmed] = useState(false);

  // browsers need a user gesture before audio can start — resume the context
  // on the first interaction anywhere.
  useEffect(() => {
    const arm = () => { resume(); setArmed(true); };
    window.addEventListener("pointerdown", arm, { once: true });
    return () => window.removeEventListener("pointerdown", arm);
  }, [resume]);

  const onHit = useCallback((impact: number) => { play(soundRef.current, impact, volRef.current); }, [play]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center py-10" style={{ background: "#FFF5EF" }}>
      <div style={{ width: "min(400px, calc((100vh - 210px) / 1.79))" }}>
        <ChromeSnookerScene onBallHit={onHit} />
      </div>
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl" style={{ background: "rgba(30,24,18,0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)" }}>
          {SOUNDS.map((s) => (
            <button key={s.id} onClick={() => setSound(s.id)} className="px-3 py-2 rounded-full text-[12.5px] font-mono transition-all" style={{ backgroundColor: sound === s.id ? "#C97836" : "transparent", color: sound === s.id ? "#fff" : "rgba(255,255,255,0.7)" }}>{s.name}</button>
          ))}
          <span style={{ width: 1, height: 22, background: "rgba(255,255,255,0.14)" }} />
          <label className="flex items-center gap-2 text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.7)" }}>vol <input type="range" min={0} max={1} step={0.02} value={vol} onChange={(e) => setVol(parseFloat(e.target.value))} className="accent-[#E0965A] w-20" /></label>
          <button onClick={() => play(soundRef.current, 16, volRef.current)} className="px-3 py-2 rounded-full text-[12px] font-mono" style={{ color: "#fff", background: "#C97836" }}>test ▶</button>
        </div>
        <p className="font-mono text-[11px]" style={{ color: "rgba(120,100,85,0.85)" }}>
          {armed ? SOUNDS.find((s) => s.id === sound)!.blurb : "click anywhere once to enable audio"} · break the rack to hear it
        </p>
      </div>
    </main>
  );
}
