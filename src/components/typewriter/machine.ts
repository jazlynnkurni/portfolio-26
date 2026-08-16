/* Shared typewriter geometry, as GLSL.

   v2 — rebuilt so it actually reads as a typewriter. The first pass was a box
   with keys on it; what makes the object recognisable is the stuff around the
   keys, so this adds the parts a person actually identifies it by:

     · the type-bar basket (the fan of bars swinging up at the platen)
     · the paper bail with its rollers, lying across the sheet
     · side frames rising to carry the carriage
     · the carriage-return lever out to the top left
     · a space bar, and key rows that arc the way a real keyboard does
     · ribbon spools sitting up on the deck

   Everything is one height field evaluated per pixel, so a variant only has to
   supply a shade(). Machine space: x roughly -1.05..1.05, y up, origin mid-
   machine. PLATEN_TOP / PAPER_HALF drive the DOM sheet in engine.js — keep
   them honest or the paper stops meeting the roller. */

export const PLATEN_TOP = 0.300;   // where the sheet emerges from the roller
export const PAPER_HALF = 0.468;   // half-width of the sheet (wider: the
                                   // lines need room for a full sentence)
export const VIEW_X = 1.05;        // half-width of the viewport in machine space

export const MACHINE_GLSL = /* glsl */ `
float sdRound(vec2 p, vec2 b, float r){
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}
float sdCircle(vec2 p, float r){ return length(p) - r; }
float sdSeg(vec2 p, vec2 a, vec2 b, float r){
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

/* Flat interior, rounded shoulder of width w — the moulded-plastic profile. */
float bevel(float d, float w){
  float a = clamp(-d / w, 0.0, 1.0);
  return w * sqrt(max(0.0, 1.0 - (1.0 - a) * (1.0 - a)));
}
/* True half-cylinder, for the platen, knobs and bail rollers. */
float cyl(float d, float r){
  float a = clamp(-d / r, 0.0, 1.0);
  return r * sqrt(max(0.0, 1.0 - (1.0 - a) * (1.0 - a)));
}

/* Key-bank geometry is uniforms, not constants, so /typewriter-lab can dial it
   live. Defaults live in engine.ts (KEY_DEFAULTS). */

/* Centre of key i (0..39): 4 rows of 10, staggered AND arced — the outer keys
   ride higher, which is most of why a typewriter keyboard looks like one. */
vec2 keyPos(int i){
  int row = i / 10;
  int col = i - row * 10;
  float fr = float(row);
  // Stagger is a fraction of the pitch, as on a real keyboard; the x*x term
  // banks the row so outer keys ride higher.
  float x = uKeyX0 + float(col) * uKeyDX + fr * uStag;
  float y = uKeyY0 + fr * uRowDY + x * x * uBank;
  return vec2(x, y);
}

/* h  = surface height at p
   mat= 1 body · 2 keys · 3 carriage · 4 platen · 5 knobs · 6 spools
        7 type bars · 8 paper bail · 9 return lever · 10 space bar · 11 struck key
   pressedKey = index being struck (-1 none), press = 0..1 depth */
void machine(vec2 p, float pressedKey, float press, out float h, out float mat){
  h = 0.0; mat = 0.0;

  // --- main body: a wedge, taller toward the back ------------------------
  float dBody = sdRound(p - vec2(0.0, -0.2475), vec2(0.760, 0.2775), 0.075);
  float rake  = 0.42 + 0.58 * smoothstep(-0.48, 0.02, p.y);
  float hBody = bevel(dBody, 0.075) * rake + (dBody < 0.0 ? 0.052 * rake : 0.0);
  if (hBody > h) { h = hBody; mat = 1.0; }

  // --- side frames: the arms that carry the carriage ---------------------
  for (int s = 0; s < 2; s++) {
    float sx = (s == 0) ? -0.660 : 0.660;
    float dS = sdRound(p - vec2(sx, -0.020), vec2(0.125, 0.175), 0.070);
    if (dS < 0.0) {
      float hS = 0.115 + bevel(dS, 0.070) * 0.75;
      if (hS > h) { h = hS; mat = 1.0; }
    }
  }

  // --- type-bar basket: the fan of bars standing up at the platen ---------
  // Drawn before the keys so the keys can sit over its lower edge.
  vec2 pivot = vec2(0.0, -0.150);
  for (int b = 0; b < 21; b++) {
    float u = float(b) / 20.0;
    float a = mix(-1.16, 1.16, u);
    vec2 dir = vec2(sin(a), cos(a));
    float dB = sdSeg(p, pivot + dir * 0.150, pivot + dir * 0.395, 0.0085);
    if (dB < 0.0) {
      float hB = 0.128 + bevel(dB, 0.0085) * 1.4;
      if (hB > h) { h = hB; mat = 7.0; }
    }
  }
  // The segment the bars pivot out of — a dark arc under the fan.
  float dSeg = sdCircle(p - pivot, 0.175);
  if (dSeg < 0.0 && p.y > -0.170) {
    float hSg = 0.100 + bevel(dSeg, 0.030) * 0.6;
    if (hSg > h) { h = hSg; mat = 7.0; }
  }

  // --- ribbon spools, up on the deck --------------------------------------
  for (int s = 0; s < 2; s++) {
    float sx = (s == 0) ? -0.400 : 0.400;
    float ds = sdCircle(p - vec2(sx, 0.010), 0.088);
    if (ds < 0.0) {
      float hs = 0.150 + bevel(ds, 0.034) * 0.55;
      // Spool centre is a recessed hub.
      float dh = sdCircle(p - vec2(sx, 0.010), 0.030);
      if (dh < 0.0) hs -= 0.022;
      if (hs > h) { h = hs; mat = 6.0; }
    }
  }

  // --- keys ---------------------------------------------------------------
  for (int i = 0; i < 40; i++) {
    vec2 kp = keyPos(i);
    float dk = sdCircle(p - kp, uKeyR);
    if (dk < uKeyR) {
      int row = i / 10;
      bool hit = abs(float(i) - pressedKey) < 0.5 && press > 0.12;
      float sink = hit ? press * 0.034 : 0.0;
      // Back rows stand taller, so the bank steps up toward the machine.
      float stack = 0.028 + float(row) * 0.021;
      float cap = bevel(dk, uKeyR * 0.72) * 0.5;
      // Ring around a dished top — the nickel key rim.
      if (dk > -uKeyR * 0.58) cap += 0.013;
      float hk = hBody + stack + cap - sink;
      // A struck key gets its OWN material, not just a lower height: the cap
      // top is flat, so sinking it alone leaves the normal (and therefore the
      // shading) identical and the movement reads as nothing happening.
      if (hk > h) { h = hk; mat = hit ? 11.0 : 2.0; }
    }
  }

  // --- space bar ----------------------------------------------------------
  float dSp = sdRound(p - vec2(0.0, -0.4685), vec2(0.300, 0.0225), 0.020);
  if (dSp < 0.0) {
    float hSp = hBody + 0.030 + bevel(dSp, 0.020) * 0.6;
    if (hSp > h) { h = hSp; mat = 10.0; }
  }

  // --- carriage rail ------------------------------------------------------
  float dCar = sdRound(p - vec2(0.0, 0.150), vec2(0.870, 0.040), 0.024);
  if (dCar < 0.0) {
    float hc = 0.215 + bevel(dCar, 0.028) * 0.6;
    if (hc > h) { h = hc; mat = 3.0; }
  }

  // --- platen -------------------------------------------------------------
  float dPl = sdRound(p - vec2(0.0, 0.232), vec2(0.600, 0.072), 0.072);
  if (dPl < 0.0) {
    float hp = 0.250 + cyl(dPl, 0.072) * 1.30;
    if (hp > h) { h = hp; mat = 4.0; }
  }

  // --- paper bail: bar + rollers, lying ACROSS the sheet ------------------
  // Deliberately above PLATEN_TOP so it crosses the white paper rather than
  // hiding behind the roller — that silhouette is a big part of the read.
  float dBail = sdRound(p - vec2(0.0, 0.362), vec2(0.520, 0.0105), 0.010);
  if (dBail < 0.0) {
    float hb = 0.400 + cyl(dBail, 0.0105) * 1.2;
    if (hb > h) { h = hb; mat = 8.0; }
  }
  for (int r = 0; r < 3; r++) {
    float rx = -0.290 + float(r) * 0.290;
    float dR = sdCircle(p - vec2(rx, 0.362), 0.030);
    if (dR < 0.0) {
      float hr = 0.405 + cyl(dR, 0.030) * 0.85;
      if (hr > h) { h = hr; mat = 8.0; }
    }
  }

  // --- platen knobs -------------------------------------------------------
  for (int k = 0; k < 2; k++) {
    float kx = (k == 0) ? -0.672 : 0.672;
    float dk2 = sdCircle(p - vec2(kx, 0.232), 0.098);
    if (dk2 < 0.0) {
      float hk2 = 0.280 + cyl(dk2, 0.098) * 0.85;
      if (hk2 > h) { h = hk2; mat = 5.0; }
    }
  }

  // --- carriage-return lever, out to the top left -------------------------
  float dLv = sdSeg(p, vec2(-0.640, 0.300), vec2(-0.910, 0.395), 0.0145);
  float dLk = sdCircle(p - vec2(-0.910, 0.395), 0.030);
  float dLever = min(dLv, dLk);
  if (dLever < 0.0) {
    float hl = 0.430 + bevel(dLever, 0.014) * 1.2;
    if (hl > h) { h = hl; mat = 9.0; }
  }
}

/* Surface normal from the height field. */
vec3 normalAt(vec2 p, float e, float pressedKey, float press){
  float h0, h1, h2, m;
  machine(p, pressedKey, press, h0, m);
  machine(p + vec2(e, 0.0), pressedKey, press, h1, m);
  machine(p + vec2(0.0, e), pressedKey, press, h2, m);
  return normalize(vec3((h0 - h1) / e, (h0 - h2) / e, 1.0));
}

float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1,0)), u.x),
             mix(hash21(i + vec2(0,1)), hash21(i + vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p *= 2.02; a *= 0.5; }
  return s;
}
`;
