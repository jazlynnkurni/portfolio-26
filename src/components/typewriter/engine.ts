/* Shared rig for every typewriter direction: WebGL host, the strike/press
   simulation, the question chips, and the typing itself.

   A variant only supplies a palette + a `shade()` GLSL function. Everything
   below is identical across the five so they compare honestly. */

import { MACHINE_GLSL, PLATEN_TOP, PAPER_HALF, VIEW_X } from "./machine";

/** A run of answer text; the object form types out as a real link. */
export type Seg = string | { text: string; href: string };

/* Real copy from the live /about typewriter. */
export const QAS: { chip: string; q: string; a: Seg[] | string }[] = [
  {
    chip: "What's your favorite restaurant?",
    q: "what's your favorite restaurant?",
    a: "oh honestly as a foodie this is really hard. i have the biggest back in town, but probably Shukette or Socarrat, but i'm in a search for better japanese restaurants around here.",
  },
  {
    chip: "What do you do in your spare time?",
    q: "what do you do in your spare time?",
    a: "i'm very active honestly. i like snowboarding, skiing, running, i'm on my 150th ride on SoulCycle lol, but i also very much enjoy painting (fun fact: my artworks went on auction at JKT), reading, drawing, and exploring small curated atmospheric stores.",
  },
  {
    chip: "What's your hardest project by far?",
    q: "what's your hardest project by far?",
    a: [
      "Manus AI — you can view the case study ",
      { text: "here", href: "/work/manus-ai" },
      ".",
    ],
  },
  {
    chip: "What's the project you liked the most?",
    q: "what's the project you liked the most?",
    a: [
      "SecondSelf and Olive — both are my hackathon wins, you can view them ",
      { text: "here", href: "https://devpost.com/software/second-self-giwmxh" },
      " and ",
      { text: "here", href: "https://drive.google.com/file/d/15-mX_sIkPU_Ww4R1UueWG10Wv9CQbhEy/view" },
      ".",
    ],
  },
  {
    chip: "What are your top things to do in NYC?",
    q: "what are your top things to do in nyc?",
    a: "go to a jazz bar, walk around DUMBO then catch a sunset, and watch hamilton. thank me later.",
  },
  {
    chip: "What's your zodiac, MBTI, and enneagram? (for the nerds)",
    q: "what's your zodiac sign, mbti, and enneagram? (for the nerds)",
    a: "if ur asking me this rn yk elite ball knowledge. I'm an aquarius, entp-a, and 8w7",
  },
];

const VERT = `attribute vec2 p; varying vec2 v;
void main(){ v = p; gl_Position = vec4(p, 0.0, 1.0); }`;

/* The variant's shade() is dropped in below the shared geometry. */
function buildFrag(shade: string) {
  return `precision highp float;
varying vec2 v;
uniform vec2 uRes;
uniform float uTime;
uniform float uKey;     // index of the key being struck, -1 = none
uniform float uPress;   // 0..1 strike depth
uniform float uCarriage;// 0..1 carriage travel
uniform vec2 uPointer;  // machine-space pointer, for spec highlights
uniform float uScale;   // <1 zooms in on the machine
uniform vec2 uPan;
uniform sampler2D uLegend;  // key legends, drawn in machine space
uniform float uKeyR, uKeyDX, uRowDY, uStag, uBank, uKeyX0, uKeyY0;

/* Key legends, sampled in machine space so they ride the keys exactly and
   still get whatever screening the variant applies. */
const vec2 LEG_MIN = vec2(-0.72, -0.44);
const vec2 LEG_MAX = vec2( 0.72,  0.04);
float legend(vec2 p){
  vec2 uv = (p - LEG_MIN) / (LEG_MAX - LEG_MIN);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
  return texture2D(uLegend, vec2(uv.x, 1.0 - uv.y)).r;
}

${MACHINE_GLSL}

${shade}

void main(){
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(v.x * ${VIEW_X.toFixed(3)}, v.y * ${VIEW_X.toFixed(3)} / aspect) * uScale + uPan;

  float h, mat;
  machine(p, uKey, uPress, h, mat);
  if (mat < 0.5) { gl_FragColor = vec4(0.0); return; }

  vec3 n = normalAt(p, 0.0016, uKey, uPress);
  vec3 col = shade(p, h, n, mat, uTime);

  // Coverage from the height field's own edge, so the silhouette is smooth
  // without any MSAA.
  float e = 1.6 / uRes.y;
  float hx, hy, mm;
  machine(p + vec2(e, 0.0), uKey, uPress, hx, mm);
  machine(p + vec2(0.0, e), uKey, uPress, hy, mm);
  float cov = smoothstep(0.0, 0.008, h);
  gl_FragColor = vec4(col, cov);
}`;
}

function compile(gl: WebGLRenderingContext, type: number, src: string, label: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(`[${label}] ` + gl.getShaderInfoLog(s));
    console.error(src.split("\n").map((l, i) => `${i + 1}: ${l}`).join("\n"));
  }
  return s;
}

/** Key-bank geometry. The lab route tunes these; /about ships the defaults. */
export type KeyParams = {
  keyR: number; keyDX: number; rowDY: number;
  stag: number; bank: number; x0: number; y0: number;
};
// The values jaz tuned by eye in /typewriter-lab. Left as-is deliberately —
// a "mathematically centred" variant was tried and she preferred these.
export const KEY_DEFAULTS: KeyParams = {
  keyR: 0.015, keyDX: 0.102, rowDY: 0.062,
  stag: 0.017, bank: 0.015, x0: -0.498, y0: -0.396,
};

export function mountMachine(
  canvas: HTMLCanvasElement,
  shade: string,
  opts: {
    scale?: number; pan?: [number, number];
    onKeyTap?: (ch: string) => void;
    params?: KeyParams;
  } = {},
) {
  let P: KeyParams = { ...KEY_DEFAULTS, ...(opts.params ?? {}) };
  const scale = opts.scale ?? 1;
  const pan = opts.pan ?? [0, 0];
  const ctx0 = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false }) as WebGLRenderingContext | null;
  if (!ctx0) return null;
  const gl: WebGLRenderingContext = ctx0;

  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT, "vert"));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, buildFrag(shade), "frag"));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  // --- key legends -------------------------------------------------------
  // Same keyPos maths as machine.js, mirrored in JS, so a letter lands dead
  // centre on its cap. Typewriter order: numbers at the back, ZXCV at the front.
  const ROWS = ["ZXCVBNM,.?", "ASDFGHJKL;", "QWERTYUIOP", "1234567890"];
  const LEG_MIN = [-0.72, -0.44];
  const LEG_MAX = [0.72, 0.04];
  const legend = document.createElement("canvas");
  legend.width = 1440;
  legend.height = 480;
  function drawLegend(): void {
    const c = legend.getContext("2d")!;
    const spanX = LEG_MAX[0] - LEG_MIN[0];
    const spanY = LEG_MAX[1] - LEG_MIN[1];
    c.fillStyle = "#000";
    c.fillRect(0, 0, legend.width, legend.height);
    c.fillStyle = "#fff";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = `600 ${Math.round((P.keyR * 0.92 / spanY) * legend.height)}px "IBM Plex Mono", ui-monospace, monospace`;
    for (let i = 0; i < 40; i++) {
      const row = Math.floor(i / 10);
      const col = i % 10;
      const x = P.x0 + col * P.keyDX + row * P.stag;
      const y = P.y0 + row * P.rowDY + x * x * P.bank;
      const px = ((x - LEG_MIN[0]) / spanX) * legend.width;
      const py = (1 - (y - LEG_MIN[1]) / spanY) * legend.height;
      c.fillText(ROWS[row][col], px, py);
    }
  }
  drawLegend();
  const texLegend = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texLegend);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, legend);
  gl.uniform1i(gl.getUniformLocation(prog, "uLegend"), 0);
  // The mono webfont usually lands after first paint; redraw once it has or
  // the legends bake in a fallback face.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      drawLegend();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texLegend);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, legend);
    });
  }

  const U = {
    res: gl.getUniformLocation(prog, "uRes"),
    time: gl.getUniformLocation(prog, "uTime"),
    key: gl.getUniformLocation(prog, "uKey"),
    press: gl.getUniformLocation(prog, "uPress"),
    carriage: gl.getUniformLocation(prog, "uCarriage"),
    pointer: gl.getUniformLocation(prog, "uPointer"),
    scale: gl.getUniformLocation(prog, "uScale"),
    pan: gl.getUniformLocation(prog, "uPan"),
    keyR: gl.getUniformLocation(prog, "uKeyR"),
    keyDX: gl.getUniformLocation(prog, "uKeyDX"),
    rowDY: gl.getUniformLocation(prog, "uRowDY"),
    stag: gl.getUniformLocation(prog, "uStag"),
    bank: gl.getUniformLocation(prog, "uBank"),
    x0: gl.getUniformLocation(prog, "uKeyX0"),
    y0: gl.getUniformLocation(prog, "uKeyY0"),
  };

  const state = { key: -1, press: 0, carriage: 0, pointer: [0, 0] };

  function resize(): void {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(2, Math.round(r.width * dpr));
    canvas.height = Math.max(2, Math.round(r.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  addEventListener("resize", resize);
  resize();

  const t0 = performance.now();
  function frame(t: number) {
    // Strike decay. Slow enough that you can actually SEE the key go down as
    // an answer types itself, fast enough to still read as a keystroke.
    state.press *= 0.87;
    if (state.press < 0.01) { state.press = 0; state.key = -1; }

    gl.uniform2f(U.res, canvas.width, canvas.height);
    gl.uniform1f(U.time, (t - t0) * 0.001);
    gl.uniform1f(U.key, state.key);
    gl.uniform1f(U.press, state.press);
    gl.uniform1f(U.carriage, state.carriage);
    gl.uniform2f(U.pointer, state.pointer[0], state.pointer[1]);
    gl.uniform1f(U.scale, scale);
    gl.uniform2f(U.pan, pan[0], pan[1]);
    gl.uniform1f(U.keyR, P.keyR);
    gl.uniform1f(U.keyDX, P.keyDX);
    gl.uniform1f(U.rowDY, P.rowDY);
    gl.uniform1f(U.stag, P.stag);
    gl.uniform1f(U.bank, P.bank);
    gl.uniform1f(U.x0, P.x0);
    gl.uniform1f(U.y0, P.y0);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  addEventListener("pointermove", (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    const aspect = r.width / r.height;
    state.pointer[0] = ((e.clientX - r.left) / r.width * 2 - 1) * VIEW_X;
    state.pointer[1] = -((e.clientY - r.top) / r.height * 2 - 1) * VIEW_X / aspect;
  });

  /* Screen point -> machine space, inverting exactly what the vertex/fragment
     pair does: clip coords scaled by VIEW_X, y flipped and divided by aspect,
     then the variant's zoom/pan. */
  function toMachine(clientX: number, clientY: number) {
    const r = canvas.getBoundingClientRect();
    const aspect = r.width / r.height;
    const vx = ((clientX - r.left) / r.width) * 2 - 1;
    const vy = -(((clientY - r.top) / r.height) * 2 - 1);
    return [vx * VIEW_X * scale + pan[0], (vy * VIEW_X) / aspect * scale + pan[1]] as const;
  }

  /* Which key is under the pointer? Same keyPos maths as the GLSL, with a
     generous radius so it stays tappable on touch. */
  function keyAt(clientX: number, clientY: number) {
    const [mx, my] = toMachine(clientX, clientY);
    let best = -1;
    let bestD = P.keyR * 1.7;
    for (let i = 0; i < 40; i++) {
      const row = Math.floor(i / 10);
      const col = i % 10;
      const kx = P.x0 + col * P.keyDX + row * P.stag;
      const ky = P.y0 + row * P.rowDY + kx * kx * P.bank;
      const d = Math.hypot(mx - kx, my - ky);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  // Tapping a key sinks it and types its letter, same path as an answer does.
  canvas.style.touchAction = "manipulation";
  canvas.addEventListener("pointerdown", (e: PointerEvent) => {
    const i = keyAt(e.clientX, e.clientY);
    if (i < 0) return;
    e.preventDefault();
    state.key = i;
    state.press = 1;
    const row = Math.floor(i / 10);
    const ch = ["ZXCVBNM,.?", "ASDFGHJKL;", "QWERTYUIOP", "1234567890"][row][i % 10];
    if (opts.onKeyTap) opts.onKeyTap(ch);
  });
  // Cursor tells you the keys are live before you click one.
  canvas.addEventListener("pointermove", (e: PointerEvent) => {
    canvas.style.cursor = keyAt(e.clientX, e.clientY) >= 0 ? "pointer" : "";
  });

  return {
    /** Live-tune the key bank (used by /typewriter-lab). */
    setParams(next: Partial<KeyParams>) {
      P = { ...P, ...next };
      drawLegend();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texLegend);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, legend);
    },
    /* Called on every typed character: sink the key that actually carries it,
       using the same layout the legend texture is drawn from. */
    strike(ch: string) {
      const c = ch.toUpperCase();
      let idx = -1;
      for (let r = 0; r < ROWS.length; r++) {
        const col = ROWS[r].indexOf(c);
        if (col >= 0) { idx = r * 10 + col; break; }
      }
      if (idx < 0) idx = 30 + (c.charCodeAt(0) % 10); // punctuation/space → number row
      state.key = idx;
      state.press = 1;
    },
    resize,
  };
}

/* Position the DOM sheet onto the shader platen. Both read the same constants,
   so the paper always emerges from the roller no matter the viewport. */
export function placePaper(canvas: HTMLCanvasElement, paper: HTMLElement) {
  const r = canvas.getBoundingClientRect();
  const aspect = r.width / r.height;
  const halfY = VIEW_X / aspect;
  const topFrac = (halfY - PLATEN_TOP) / (2 * halfY);
  paper.style.left = ((-PAPER_HALF + VIEW_X) / (2 * VIEW_X) * 100) + "%";
  paper.style.width = ((PAPER_HALF * 2) / (2 * VIEW_X) * 100) + "%";
  paper.style.bottom = ((1 - topFrac) * 100) + "%";
}

/* Character-at-a-time typing with a human-ish cadence.
   Accepts segments so a linked run ("here") types INTO a real anchor rather
   than arriving as dead text — the answers carry case-study links. */
export function typewriter(
  el: HTMLElement,
  input: Seg[] | string,
  { speed = 26, onChar, onDone }: { speed?: number; onChar?: (c: string) => void; onDone?: () => void } = {},
) {
  const segs: Seg[] = typeof input === "string" ? [input] : input;
  let si = 0, ci = 0;
  let sink: HTMLElement = el;
  let stopped = false;
  el.textContent = "";

  function step() {
    if (stopped) return;
    if (si >= segs.length) { if (onDone) onDone(); return; }
    const seg = segs[si];
    const text = typeof seg === "string" ? seg : seg.text;

    if (ci === 0) {
      if (typeof seg === "string") sink = el;
      else {
        const a = document.createElement("a");
        a.href = seg.href;
        a.className = "tw-link";
        if (/^https?:/.test(seg.href)) { a.target = "_blank"; a.rel = "noreferrer"; }
        el.appendChild(a);
        sink = a;
      }
    }
    if (ci >= text.length) { si++; ci = 0; sink = el; step(); return; }

    const ch = text[ci++];
    sink.appendChild(document.createTextNode(ch));
    if (onChar) onChar(ch);
    // Punctuation gets a beat; spaces are quick. Reads less robotic.
    let d = speed + Math.random() * speed * 0.9;
    if (".,!?".includes(ch)) d += 220;
    if (ch === " ") d *= 0.5;
    setTimeout(step, d);
  }
  setTimeout(step, 90);
  return () => { stopped = true; };
}

/* Chips + paper wiring, shared by all five. */
type Rig = { strike: (ch: string) => void; resize: () => void } | null;
export function wireQA({ chipHost, qEl, aEl, machine, caret }: { chipHost: HTMLElement; qEl: HTMLElement; aEl: HTMLElement; machine: Rig; caret?: HTMLElement | null }) {
  let cancel: (() => void) | null = null;
  let busy = false;

  QAS.forEach((qa) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.type = "button";
    b.innerHTML = `<span class="arrow">→</span><span>${qa.chip}</span>`;
    b.addEventListener("click", () => {
      if (busy && cancel) cancel();
      busy = true;
      [...chipHost.children].forEach((c) => c.classList.remove("on"));
      b.classList.add("on");
      aEl.textContent = "";
      if (caret) caret.classList.add("on");
      cancel = typewriter(qEl, "> " + qa.q, {
        speed: 22,
        onChar: (ch: string) => { if (machine) machine.strike(ch); },
        onDone: () => {
          cancel = typewriter(aEl, qa.a, {
            speed: 20,
            onChar: (ch: string) => { if (machine) machine.strike(ch); },
            onDone: () => { busy = false; if (caret) caret.classList.remove("on"); },
          });
        },
      });
    });
    chipHost.appendChild(b);
  });
}
