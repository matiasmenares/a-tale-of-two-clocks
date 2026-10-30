import { looks, type Pose, type Prop } from "@/lib/life";

const THIGH = 23;
const SHIN = 22;
const TORSO = 34;
const UPPER_ARM = 17;
const FOREARM = 16;
const HEAD = 11;
const INK = "#1e1b2e";

const rad = (d: number) => (d * Math.PI) / 180;
/** Extremo de un segmento de largo `l` con ángulo `a` (grados desde la vertical hacia abajo, + hacia adelante). */
const seg = (x: number, y: number, a: number, l: number): [number, number] => [x + Math.sin(rad(a)) * l, y + Math.cos(rad(a)) * l];

/** Cinemática inversa de dos segmentos: ángulos de hombro y codo para llevar la mano a `p` (codo hacia abajo). */
function reach(s: [number, number], p: [number, number]): { sh: number; el: number } {
  const dx = p[0] - s[0];
  const dy = p[1] - s[1];
  const d = Math.min(UPPER_ARM + FOREARM - 0.01, Math.max(Math.abs(UPPER_ARM - FOREARM) + 0.01, Math.hypot(dx, dy)));
  const dir = (Math.atan2(dx, dy) * 180) / Math.PI;
  const bend = (Math.acos((UPPER_ARM ** 2 + d ** 2 - FOREARM ** 2) / (2 * UPPER_ARM * d)) * 180) / Math.PI;
  const pick = [dir + bend, dir - bend].map((sh) => {
    const e = seg(s[0], s[1], sh, UPPER_ARM);
    const fa = (Math.atan2(p[0] - e[0], p[1] - e[1]) * 180) / Math.PI;
    return { sh, el: fa - sh, low: e[1] };
  });
  const best = pick[0].low >= pick[1].low ? pick[0] : pick[1];
  return { sh: best.sh, el: best.el };
}

/** Pose de un instrumento: dónde va, hacia dónde apunta y dónde van las dos manos. */
interface Instrument {
  kind: "guitar" | "violin";
  at: [number, number];
  angle: number;
  /** Mano del frente: rasguea (guitarra) o lleva el arco (violín). */
  play: [number, number];
  /** Mano de atrás: pisa las cuerdas en el mástil. */
  fret: [number, number];
  /** Vibración actual de las cuerdas (0–1). */
  ring: number;
  /** Arco del violín: dirección de la vara. */
  bowDir?: [number, number];
}

/** Escala de la guitarra respecto del dibujo base. */
const GUITAR = 1.25;

function instrumentPose(kind: "guitar" | "violin", t: number, skill: number, hipY: number, shX: number, shY: number): Instrument {
  // Cambio de acorde/nota: los principiantes cambian poco y torpes; los virtuosos recorren todo el mástil.
  const changes = 0.5 + skill * 1.5;
  const k = Math.floor(t * changes);
  const blend = Math.min(1, ((t * changes) % 1) * (2 + skill * 6));
  const pos = (i: number) => Math.sin(i * 12.9898) * 0.5 + 0.5;
  const slide = (pos(k - 1) + (pos(k) - pos(k - 1)) * blend) * (3 + skill * 4);
  if (kind === "guitar") {
    const angle = -30;
    const at: [number, number] = [6, hipY - 8];
    const u: [number, number] = [Math.cos(rad(angle)), Math.sin(rad(angle))];
    const n: [number, number] = [-u[1], u[0]];
    // Rasgueo: abajo en el tiempo, arriba en el contratiempo; más amplio y limpio con la práctica.
    const beat = t * 1.6;
    const strum = Math.cos(beat * Math.PI * 2) * (3 + skill * 2.5);
    const sh = 3 * GUITAR;
    const play: [number, number] = [at[0] + u[0] * sh + n[0] * strum, at[1] + u[1] * sh + n[1] * strum];
    const f = (14 + slide) * GUITAR;
    const fret: [number, number] = [at[0] + u[0] * f - n[0] * 1.5, at[1] + u[1] * f - n[1] * 1.5];
    return { kind, at, angle, play, fret, ring: Math.abs(Math.sin(beat * Math.PI * 2)) };
  }
  const angle = -12;
  const at: [number, number] = [shX + 5, shY + 1];
  const v: [number, number] = [Math.cos(rad(angle)), Math.sin(rad(angle))];
  // El arco cruza las cuerdas cerca del puente y va y viene a lo largo de su vara.
  const bridge: [number, number] = [at[0] + v[0] * 11, at[1] + v[1] * 11];
  const bowDir: [number, number] = [-0.45, 0.89]; // la punta sube hacia adelante, lejos de la cara
  const stroke = 13 + Math.sin(t * 1.4 * Math.PI) * (6 + skill * 4);
  const play: [number, number] = [bridge[0] + bowDir[0] * stroke, bridge[1] + bowDir[1] * stroke];
  const f = 22 + slide * 0.6;
  const fret: [number, number] = [at[0] + v[0] * f, at[1] + v[1] * f - 1.5];
  return { kind, at, angle, play, fret, ring: 0.6 + 0.4 * Math.abs(Math.cos(t * 1.4 * Math.PI)), bowDir };
}

function InstrumentBody({ inst, t }: { inst: Instrument; t: number }) {
  const vib = (i: number) => Math.sin(t * 90 + i * 2) * inst.ring * 0.6;
  if (inst.kind === "guitar") {
    return (
      <g transform={`translate(${inst.at[0]} ${inst.at[1]}) rotate(${inst.angle}) scale(${GUITAR})`}>
        {/* Cuerpo en forma de 8: contorno primero, relleno encima para fundir las dos curvas */}
        <ellipse cx="-2" cy="0" rx="10.5" ry="9" fill="#d97706" stroke={INK} strokeWidth="1.5" />
        <ellipse cx="9" cy="0" rx="7.5" ry="7" fill="#d97706" stroke={INK} strokeWidth="1.5" />
        <ellipse cx="-2" cy="0" rx="9.75" ry="8.25" fill="#d97706" />
        <ellipse cx="9" cy="0" rx="6.75" ry="6.25" fill="#d97706" />
        <ellipse cx="-3" cy="-3" rx="6" ry="3" fill="#fbbf24" opacity="0.35" />
        <circle cx="6" cy="0" r="2.8" fill="#3b1d06" stroke="#78350f" strokeWidth="0.6" />
        <rect x="-8" y="-3" width="2.2" height="6" rx="0.6" fill="#451a03" />
        {/* Mástil, trastes y clavijero */}
        <rect x="14" y="-1.7" width="22" height="3.4" fill="#78350f" stroke={INK} strokeWidth="1" />
        {[17, 20.5, 23.8, 26.8, 29.6, 32.2].map((x) => (
          <line key={x} x1={x} y1="-1.6" x2={x} y2="1.6" stroke="#d6d3d1" strokeWidth="0.4" />
        ))}
        <path d="M36 -2.6 L42 -3.2 L42 3.2 L36 2.6Z" fill="#451a03" stroke={INK} strokeWidth="1" />
        {[37.5, 40].map((x) => (
          <g key={x}>
            <circle cx={x} cy="-3.8" r="0.9" fill="#e7e5e4" stroke={INK} strokeWidth="0.4" />
            <circle cx={x} cy="3.8" r="0.9" fill="#e7e5e4" stroke={INK} strokeWidth="0.4" />
          </g>
        ))}
        {/* Cuerdas: vibran justo después de cada rasgueo */}
        {[-1, 0, 1].map((i) => (
          <path key={i} d={`M-7 ${i * 0.9} Q14 ${i * 0.9 + vib(i)} 36 ${i * 0.9}`} stroke="#f5f5f4" strokeWidth="0.35" fill="none" />
        ))}
      </g>
    );
  }
  return (
    <g transform={`translate(${inst.at[0]} ${inst.at[1]}) rotate(${inst.angle}) scale(1.2)`}>
      <path d="M0 -4.5 q-5 0 -5 4.5 q0 4.5 5 4.5 q3 0 4 -2 q1 2 4 2 q5 0 5 -4.5 q0 -4.5 -5 -4.5 q-3 0 -4 2 q-1 -2 -4 -2Z" fill="#b45309" stroke={INK} strokeWidth="1.3" />
      <path d="M-1 -2.5 q4 -1.5 8 0" stroke="#fbbf24" strokeWidth="0.8" fill="none" opacity="0.45" />
      <path d="M3 -2.6 q-1 2.6 0 5.2 M10 -2.6 q1 2.6 0 5.2" stroke="#3b1d06" strokeWidth="0.6" fill="none" />
      <ellipse cx="-2" cy="-4" rx="3" ry="1.4" fill="#1c1917" stroke={INK} strokeWidth="0.6" />
      <rect x="13.5" y="-1.2" width="11" height="2.4" fill="#1c1917" stroke={INK} strokeWidth="0.8" />
      <path d="M24.5 -1.6 q3.5 -1 3.5 1.6 q0 2.6 -3.5 1.6Z" fill="#451a03" stroke={INK} strokeWidth="0.8" />
      {[-0.6, 0.6].map((y, i) => (
        <path key={y} d={`M1 ${y} Q12 ${y + vib(i)} 24 ${y}`} stroke="#f5f5f4" strokeWidth="0.3" fill="none" />
      ))}
      <rect x="6.6" y="-1.8" width="1" height="3.6" fill="#fef3c7" />
    </g>
  );
}

interface Angles {
  hipL: number; kneeL: number; hipR: number; kneeR: number;
  shL: number; elL: number; shR: number; elR: number;
  lean: number; head: number; seated: boolean;
}

function angles(pose: Pose, t: number, vigor: number): Angles {
  const base: Angles = { hipL: 0, kneeL: 0, hipR: 0, kneeR: 0, shL: 6, elL: 8, shR: -4, elR: 8, lean: 0, head: 0, seated: false };
  const breath = Math.sin(t * 1.6) * 2;
  switch (pose) {
    case "walk":
    case "run": {
      const run = pose === "run";
      const f = (run ? 2.6 : 1.1) * vigor;
      const amp = (run ? 38 : 24) * (0.6 + 0.4 * vigor);
      const s = Math.sin(t * f * Math.PI * 2);
      const c = Math.cos(t * f * Math.PI * 2);
      return {
        ...base,
        hipL: amp * s, hipR: -amp * s,
        // La rodilla se dobla en la fase de balanceo (pierna avanzando: d(sin)/dt = cos > 0).
        kneeL: -(run ? 70 : 30) * Math.max(0, c), kneeR: -(run ? 70 : 30) * Math.max(0, -c),
        shL: -amp * 0.9 * s, shR: amp * 0.9 * s,
        elL: run ? 85 : 18, elR: run ? 85 : 18,
        lean: run ? 10 : 3,
      };
    }
    case "sit":
      return { ...base, hipL: 88, hipR: 92, kneeL: -88, kneeR: -92, shL: 25 + breath, elL: 45, shR: 20, elR: 50, seated: true };
    case "type": {
      const tap = Math.sin(t * 9 * vigor) * 4;
      return { ...base, hipL: 88, hipR: 92, kneeL: -88, kneeR: -92, shL: 55 + tap, elL: 35, shR: 50 - tap, elR: 40, lean: 6, seated: true };
    }
    case "eat": {
      const cycle = (t * 0.35 * vigor) % 1;
      const lift = cycle < 0.3 ? Math.sin((cycle / 0.3) * Math.PI) : 0;
      return { ...base, hipL: 88, hipR: 92, kneeL: -88, kneeR: -92, shL: 40, elL: 40, shR: 35 + lift * 45, elR: 40 + lift * 95, lean: 4, seated: true };
    }
    case "wave":
      return { ...base, shR: 160, elR: 20 + Math.sin(t * 9) * 25 };
    case "lookUp":
      return { ...base, head: -22, lean: -4, shL: 10, shR: -10 };
    case "float": {
      const d = Math.sin(t * 0.8) * 10;
      return { ...base, hipL: 25 + d, kneeL: -45, hipR: 10 - d, kneeR: -30, shL: 80 + d, elL: 30, shR: 110 - d, elR: 20, head: -5 };
    }
    case "kneel": {
      // Deja las flores: baja el brazo lentamente y lo vuelve a subir.
      const place = (Math.sin(t * 0.9) + 1) / 2;
      return { ...base, hipL: 70, kneeL: -160, hipR: 10, kneeR: -100, shL: 35 + place * 40, elL: 10 + place * 20, shR: 40, elR: 30, lean: 16 + place * 6, head: 10 + place * 8, seated: false };
    }
    case "exercise": {
      // Saltos de tijera: brazos arriba y piernas abiertas al compás.
      const k = (Math.sin(t * 5 * vigor) + 1) / 2;
      return { ...base, hipL: 4 + k * 14, hipR: -4 - k * 14, shL: 15 + k * 150, elL: 5, shR: -15 - k * 150, elR: -5, head: -4 };
    }
    case "reach": {
      const k = Math.sin(t * 1.2) * 8;
      return { ...base, shL: 150 + k, elL: 10, shR: 135 - k, elR: 15, head: -18, lean: -3 };
    }
    case "water":
      return { ...base, shL: 62 + Math.sin(t * 1.5) * 4, elL: 18, shR: 10, elR: 30, lean: 8, head: 12 };
    case "guitar": {
      // Los brazos los coloca la cinemática inversa (manos sobre la guitarra); aquí, cabeza y pie al compás.
      const beat = t * 1.6;
      const tap = Math.max(0, Math.sin(beat * Math.PI * 2)) ** 2 * 9;
      return { ...base, hipL: 88, hipR: 92, kneeL: -88 + tap, kneeR: -92, lean: 5 + Math.sin(beat * Math.PI) * 1.5, head: 12 + Math.sin(beat * Math.PI * 2) * 3, seated: true };
    }
    case "offer":
      // Extiende el brazo para entregar algo.
      return { ...base, shL: 78, elL: 6, shR: 12, elR: 20, lean: 4, head: 6 };
    case "violin": {
      // Violín al hombro: los brazos van por cinemática inversa; el cuerpo se mece con la frase musical.
      const sway = Math.sin(t * 0.9 * vigor);
      return { ...base, hipL: 88, hipR: 92, kneeL: -88, kneeR: -92, lean: 1 + sway * 4, head: 16 + sway * 2, seated: true };
    }
    case "read": {
      const page = Math.sin(t * 0.3) * 3;
      return { ...base, hipL: 88, hipR: 92, kneeL: -88, kneeR: -92, shL: 62 + page, elL: 78, shR: 58, elR: 82, head: 8, seated: true };
    }
    case "mourn": {
      // Duelo: se mece levemente y de vez en cuando se seca las lágrimas.
      const cycle = (t * 0.25) % 1;
      const wipe = cycle > 0.7 ? Math.sin(((cycle - 0.7) / 0.3) * Math.PI) : 0;
      const sway = Math.sin(t * 0.8) * 2;
      return { ...base, shL: 30 + sway, elL: 65, shR: 30 + wipe * 95, elR: 75 + wipe * 60, head: 16 - wipe * 8 + sway, lean: 6 + sway };
    }
    default:
      return { ...base, shL: 6 + breath, shR: -4 - breath };
  }
}

/**
 * Tiempo de gesto para caminar según la distancia recorrida (unidades del dibujo),
 * así las piernas solo se mueven cuando el personaje realmente avanza.
 */
export function walkClock(distance: number, age: number) {
  const STRIDE = 40; // avance por ciclo de pasos
  return Math.abs(distance) / (STRIDE * 1.1 * looks(age).vigor);
}

export type Mood = "neutral" | "happy" | "joy" | "sad" | "focused" | "effort" | "tired" | "sour";

/** Ojo, ceja y boca según la emoción (vista de perfil, mirando a la derecha). */
function Face({ hx, hy, mood, brow, browWidth, t }: { hx: number; hy: number; mood: Mood; brow: string; browWidth: number; t: number }) {
  const blink = (t * 0.7) % 4 < 0.12;
  const closed = mood === "joy" || blink;
  const lid = mood === "tired" ? 1.2 : 0;
  // Ceja: más baja si se concentra, arqueada si está triste, alta si está feliz.
  const browPath =
    mood === "sad" || mood === "tired"
      ? `M${hx + 3} ${hy - 5.2} q2.5 -2.2 5 -0.4`
      : mood === "focused" || mood === "effort"
        ? `M${hx + 3} ${hy - 4.4} q2.5 0.6 5 -0.6`
        : mood === "joy" || mood === "happy"
          ? `M${hx + 3} ${hy - 6.4} q2.5 -1.8 5 0`
          : mood === "sour"
            ? `M${hx + 3} ${hy - 4.8} q2.5 -2.6 5 0.6`
            : `M${hx + 3} ${hy - 5.6} q2.5 -1.4 5 0`;
  const mouth =
    mood === "happy"
      ? <path d={`M${hx + 4.2} ${hy + 5.4} q2.6 2.6 5 -0.2`} stroke="#7c2d12" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      : mood === "joy"
        ? <path d={`M${hx + 4} ${hy + 5} q2.8 4.2 5.4 0Z`} fill="#7c2d12" stroke="#7c2d12" strokeWidth="0.6" />
        : mood === "sad"
          ? <path d={`M${hx + 4.4} ${hy + 7} q2.4 -2 4.6 0.2`} stroke="#7c2d12" strokeWidth="1.1" fill="none" strokeLinecap="round" />
          : mood === "effort"
            ? <rect x={hx + 4.4} y={hy + 5.2} width="4.6" height="1.8" rx="0.5" fill="#fff" stroke="#7c2d12" strokeWidth="0.7" />
            : mood === "sour"
              ? <path d={`M${hx + 4.2} ${hy + 6} l1.2 -0.8 l1.2 0.8 l1.2 -0.8 l1.2 0.8`} stroke="#7c2d12" strokeWidth="1" fill="none" />
              : mood === "focused" || mood === "tired"
                ? <path d={`M${hx + 4.6} ${hy + 6} h4.2`} stroke="#7c2d12" strokeWidth="1.1" strokeLinecap="round" />
                : <path d={`M${hx + 4.5} ${hy + 6} q2.5 1.4 4.6 -0.4`} stroke="#7c2d12" strokeWidth="1.1" fill="none" strokeLinecap="round" />;
  const tearY = (t * 0.8) % 1;
  return (
    <>
      {closed ? (
        <path d={`M${hx + 3.3} ${hy - 1.6} q1.8 ${mood === "joy" ? -1.6 : 1.2} 3.6 0`} stroke={INK} strokeWidth="0.9" fill="none" strokeLinecap="round" />
      ) : (
        <>
          <ellipse cx={hx + 5} cy={hy - 2} rx="1.9" ry="2.3" fill="#fff" stroke={INK} strokeWidth="0.6" />
          <circle cx={hx + 5.7} cy={hy - (mood === "sad" ? 1.2 : 1.8)} r="1.1" fill={INK} />
          {lid > 0 && <rect x={hx + 3} y={hy - 4.4} width="4" height={lid + 1.2} fill="#e8b48f" />}
        </>
      )}
      <path d={browPath} stroke={brow} strokeWidth={browWidth} fill="none" strokeLinecap="round" />
      {mouth}
      {mood === "sad" && <ellipse cx={hx + 6.2} cy={hy + 1 + tearY * 7} rx="0.8" ry="1.2" fill="#7dd3fc" opacity={1 - tearY} />}
      {mood === "effort" && <ellipse cx={hx - 4} cy={hy - 8 + ((t * 1.5) % 1) * 6} rx="0.9" ry="1.4" fill="#bae6fd" />}
    </>
  );
}

/** Notas que salen del instrumento: más y más afinadas a medida que mejora. */
export function MusicNotes({ x, y, t, skill }: { x: number; y: number; t: number; skill: number }) {
  const count = 2 + Math.round(skill * 5);
  return (
    <g pointerEvents="none">
      {Array.from({ length: count }, (_, i) => {
        const k = (t * (0.35 + skill * 0.25) + i / count) % 1;
        const seed = Math.sin((Math.floor(t * (0.35 + skill * 0.25) + i / count) + i) * 91.7) * 0.5 + 0.5;
        const sour = seed > 0.35 + skill * 0.65; // las notas desafinadas desaparecen con la práctica
        const wob = Math.sin(k * 8 + i) * (sour ? 6 : 3);
        return (
          <text
            key={i}
            x={x + wob + i * 3}
            y={y - k * 46}
            fontSize={sour ? 9 : 10 + skill * 3}
            fill={sour ? "#f87171" : ["#67e8f9", "#fde047", "#f0abfc"][i % 3]}
            opacity={1 - k}
            fontWeight="bold"
          >
            {sour ? "✗" : i % 2 ? "♫" : "♪"}
          </text>
        );
      })}
    </g>
  );
}

export type Outfit = "casual" | "flightsuit" | "spacesuit" | "mourning";

interface Palette {
  top: string;
  topDark: string;
  sleeve: string;
  pants: string;
  pantsDark: string;
  shoes: string;
  accent?: string;
}

function palette(outfit: Outfit, age: number, color?: string): Palette {
  switch (outfit) {
    case "flightsuit":
      return { top: "#3f5873", topDark: "#2c3f55", sleeve: "#3f5873", pants: "#3f5873", pantsDark: "#2c3f55", shoes: "#111827", accent: "#f97316" };
    case "spacesuit":
      return { top: "#f8fafc", topDark: "#cbd5e1", sleeve: "#f1f5f9", pants: "#f1f5f9", pantsDark: "#cbd5e1", shoes: "#334155", accent: "#1d4ed8" };
    case "mourning":
      return { top: color ?? "#27272a", topDark: "#18181b", sleeve: color ?? "#27272a", pants: "#1c1917", pantsDark: "#0c0a09", shoes: "#0c0a09" };
    default: {
      // Joven: polera y jeans. Mayor: chaleco de lana sobre camisa y pantalón de tela.
      const old = age >= 58;
      const top = color ?? (old ? "#7c5c3b" : "#2563eb");
      return {
        top,
        topDark: old ? "#5b4229" : "#1d4ed8",
        sleeve: old ? "#e7e5e4" : top,
        pants: old ? "#57534e" : "#1e3a5f",
        pantsDark: old ? "#44403c" : "#172d4a",
        shoes: old ? "#3f2a1c" : "#f5f5f4",
      };
    }
  }
}

export interface PersonProps {
  x: number;
  y: number;
  age: number;
  pose: Pose;
  /** Tiempo (s) para animar gestos. */
  t: number;
  scale?: number;
  facing?: 1 | -1;
  outfit?: Outfit;
  /** Color principal de la ropa (para personajes secundarios). */
  color?: string;
  opacity?: number;
  helmet?: boolean;
  /** Lleva un ramo de flores en la mano delantera. */
  flowers?: boolean;
  /** Arnés de 5 puntas del asiento de lanzamiento. */
  harness?: boolean;
  /** Objeto en la mano delantera. */
  prop?: Prop;
  /** Emoción que muestra la cara. */
  mood?: Mood;
  /** Color del objeto (por ejemplo, la roca de cada planeta). */
  propColor?: string;
  /** Destreza con el instrumento (0–1): cambia la soltura de las manos. */
  skill?: number;
}

/** Cápsula con contorno (extremidad). */
function Limb({ pts, color, w }: { pts: [number, number][]; color: string; w: number }) {
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join("");
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={w + 2.8} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

/**
 * Zapato con la suela sobre el punto del pie. Tapa el final de la pierna (que termina en el tobillo)
 * y, cuando el pie está en el aire, se inclina un poco con la canilla.
 */
function Shoe({ at, color, tilt = 0, back = false }: { at: [number, number]; color: string; tilt?: number; back?: boolean }) {
  const [x, y] = at;
  // De rodillas, la canilla queda en el piso hacia atrás y el zapato apunta hacia atrás.
  const flip = back ? `translate(${2 * x} 0) scale(-1 1)` : "";
  return (
    <g transform={`${flip}${tilt ? ` rotate(${tilt} ${x} ${y - 4})` : ""}` || undefined}>
      <path
        d={`M${x - 5} ${y} L${x - 5.5} ${y - 5} Q${x - 5.5} ${y - 9.5} ${x - 1} ${y - 9.5} L${x + 3} ${y - 8.5} Q${x + 11} ${y - 7} ${x + 12} ${y - 2.5} Q${x + 12.5} ${y} ${x + 10} ${y}Z`}
        fill={color}
        stroke={INK}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d={`M${x - 4.6} ${y - 1.3} H${x + 11.4}`} stroke={INK} strokeWidth="0.7" opacity="0.45" />
    </g>
  );
}

/** Persona de perfil estilo caricatura: poses animadas, vestuario y rasgos que envejecen. */
export function Person({
  x, y, age, pose, t, scale = 1, facing = 1, outfit = "casual", color, opacity = 1, helmet = false, flowers = false, harness = false, prop, mood, propColor, skill = 0.5,
}: PersonProps) {
  const L = looks(age);
  const P = palette(outfit, age, color);
  const a = angles(pose, t, L.vigor);
  const kneeling = pose === "kneel";
  const hipY = a.seated ? -SHIN - 4 : kneeling ? -SHIN + 2 : -(THIGH + SHIN) + (pose === "walk" ? -Math.abs(Math.sin(t * 1.1 * L.vigor * Math.PI * 2)) * 1.5 : 0);
  const lean = a.lean + L.stoop;
  const shX = Math.sin(rad(lean)) * TORSO;
  const shY = hipY - Math.cos(rad(lean)) * TORSO;
  const neckX = shX + Math.sin(rad(lean)) * 4;
  const neckY = shY - Math.cos(rad(lean)) * 4;
  const headTilt = a.head + L.stoop * 0.8;
  const hx = neckX + Math.sin(rad(lean + L.stoop * 0.6)) * (HEAD - 1) + 1.5;
  const hy = neckY - Math.cos(rad(lean)) * (HEAD - 1);

  const leg = (hip: number, knee: number) => {
    const k = seg(0, hipY, hip, THIGH);
    const f = seg(k[0], k[1], hip + knee, SHIN);
    // La pierna termina en el tobillo, dentro del zapato, para que su punta redonda no asome bajo la suela.
    const ankle = seg(k[0], k[1], hip + knee, SHIN - 7);
    const lifted = f[1] < -1;
    const tilt = lifted ? -Math.max(-30, Math.min(30, hip + knee)) * 0.6 : 0; // punta abajo al despegar, arriba al adelantar
    return { k, f, ankle, tilt, back: hip + knee < -60 };
  };
  const arm = (sh: number, el: number) => {
    const s: [number, number] = [shX - 1, shY + 3];
    const e = seg(s[0], s[1], sh, UPPER_ARM);
    const h = seg(e[0], e[1], sh + el, FOREARM);
    return { s, e, h };
  };
  const lL = leg(a.hipL, a.kneeL);
  const lR = leg(a.hipR, a.kneeR);
  // En ingravidez sigue tocando el violín mientras flota.
  const playing = pose === "guitar" || pose === "violin" ? pose : pose === "float" && prop === "violin" ? "violin" : null;
  const inst = playing && instrumentPose(playing, t, skill, hipY, shX, shY);
  const shoulder: [number, number] = [shX - 1, shY + 3];
  const ikL = inst && reach(shoulder, inst.play);
  const ikR = inst && reach(shoulder, inst.fret);
  const aL = ikL ? arm(ikL.sh, ikL.el) : arm(a.shL, a.elL);
  const aR = ikR ? arm(ikR.sh, ikR.el) : arm(a.shR, a.elR);
  const showCane = L.cane && (pose === "stand" || pose === "walk" || pose === "lookUp" || pose === "mourn");

  // Torso como silueta: espalda recta, pecho y barriga hacia adelante.
  const ux = Math.sin(rad(lean));
  const uy = -Math.cos(rad(lean));
  const nx = -uy; // normal hacia adelante
  const ny = ux;
  const half = 8.5;
  const belly = L.belly + (outfit === "spacesuit" ? 3 : 0);
  const P0 = [0 - nx * half, hipY - ny * half];
  const P1 = [0 + nx * (half + belly * 0.6), hipY + ny * (half + belly * 0.6)];
  const P2 = [shX + nx * (half + 1), shY + ny * (half + 1)];
  const P3 = [shX - nx * (half + 1), shY - ny * (half + 1)];
  const mid = [(0 + shX) / 2 + nx * (half + belly), (hipY + shY) / 2 + ny * (half + belly)];
  const torso = `M${P0[0]} ${P0[1]} L${P1[0]} ${P1[1]} Q${mid[0]} ${mid[1]} ${P2[0]} ${P2[1]} Q${shX + ux * 4} ${shY + uy * 4} ${P3[0]} ${P3[1]} Z`;

  const skinDark = "#c98f6b";
  const brow = L.hair;

  return (
    <g transform={`translate(${x} ${y}) scale(${scale * facing} ${scale})`} opacity={opacity}>
      {/* Extremidades del fondo */}
      <Limb pts={[[0, hipY], lR.k, lR.ankle]} color={P.pantsDark} w={9} />
      <Shoe at={lR.f} color={P.shoes} tilt={lR.tilt} back={lR.back} />
      <Limb pts={[aR.s, aR.e, aR.h]} color={P.topDark} w={7} />
      <circle cx={aR.h[0]} cy={aR.h[1]} r="3.4" fill={outfit === "spacesuit" ? "#cbd5e1" : skinDark} stroke={INK} strokeWidth="1.3" />

      {/* Torso y ropa */}
      <path d={torso} fill={P.top} stroke={INK} strokeWidth="1.7" strokeLinejoin="round" />
      {outfit === "casual" && age >= 58 && (
        <path d={`M${shX + nx * 2} ${shY + ny * 2} L${(shX * 0.4) + nx * 6} ${(hipY * 0.4 + shY * 0.6) + ny * 6}`} stroke={P.sleeve} strokeWidth="4" />
      )}
      {outfit === "flightsuit" && (
        <>
          <line x1={shX + nx * 7} y1={shY + ny * 7} x2={nx * 8} y2={hipY + ny * 8} stroke="#94a3b8" strokeWidth="0.9" />
          <rect x={shX + nx * 1 - 3} y={shY + 8} width="7" height="6" rx="1" fill={P.accent} stroke={INK} strokeWidth="0.6" />
          <rect x={shX - nx * 6 - 2} y={shY + 6} width="5" height="3.5" fill="#fff" stroke={INK} strokeWidth="0.4" />
          <line x1={-nx * 9} y1={hipY - 3} x2={nx * 9} y2={hipY - 3} stroke="#1f2937" strokeWidth="2.2" />
        </>
      )}
      {outfit === "spacesuit" && (
        <>
          <rect x={shX - nx * 13 - 6} y={shY + 2} width="9" height="26" rx="3" fill="#e2e8f0" stroke={INK} strokeWidth="1" />
          <rect x={shX + nx * 2 - 4} y={shY + 10} width="9" height="7" rx="1.5" fill={P.accent} stroke={INK} strokeWidth="0.6" />
          <line x1={-nx * 9} y1={hipY - 2} x2={nx * 9} y2={hipY - 2} stroke="#94a3b8" strokeWidth="2" />
        </>
      )}

      {harness && (
        <g stroke="#ea580c" strokeWidth="2.6" strokeLinecap="round">
          {/* Correas de hombro sobre el pecho hasta la hebilla, y cinturón abdominal */}
          <line x1={shX + nx * 2 - ux * 1} y1={shY + ny * 2 - uy * 1} x2={nx * (half + 1) + ux * 10} y2={hipY + ny * (half + 1) + uy * 10} />
          <line x1={shX - nx * 3} y1={shY - ny * 3} x2={nx * (half - 2) + ux * 10} y2={hipY + ny * (half - 2) + uy * 10} />
          <line x1={-nx * half + ux * 4} y1={hipY - ny * half + uy * 4} x2={nx * (half + 1) + ux * 4} y2={hipY + ny * (half + 1) + uy * 4} />
          <circle cx={nx * (half + 0.5) + ux * 9} cy={hipY + ny * (half + 0.5) + uy * 9} r="2.6" fill="#d4d4d8" stroke={INK} strokeWidth="0.8" />
        </g>
      )}

      {/* Cabeza */}
      <g transform={`rotate(${headTilt * 0.6} ${neckX} ${neckY})`}>
        <path d={`M${neckX - 3} ${neckY + 2} L${neckX - 3} ${neckY - 4} L${neckX + 3} ${neckY - 4} L${neckX + 3} ${neckY + 2}Z`} fill={L.skin} stroke={INK} strokeWidth="1" />
        <ellipse cx={hx} cy={hy} rx={HEAD} ry={HEAD * 1.07} fill={L.skin} stroke={INK} strokeWidth="1.6" />
        {/* Nariz, oreja, ojo, ceja, boca */}
        <path d={`M${hx + HEAD - 1.5} ${hy - 2} q4 3.5 0.5 5.5`} fill={L.skin} stroke={INK} strokeWidth="1.1" />
        <ellipse cx={hx - 2.5} cy={hy + 1} rx="2.6" ry="3.4" fill={L.skin} stroke={INK} strokeWidth="1" />
        <Face hx={hx} hy={hy} mood={mood ?? (pose === "mourn" || pose === "kneel" ? "sad" : "neutral")} brow={brow} browWidth={1.4 + L.wrinkles * 0.6} t={t} />
        <circle cx={hx + 6} cy={hy + 3} r="1.8" fill="#f87171" opacity={0.25 * (1 - L.wrinkles)} />
        {/* Pelo: volumen en la nuca y coronilla; con la edad se retira */}
        <path
          d={`M${hx - HEAD - 0.5} ${hy + 5}
              C${hx - HEAD - 2} ${hy - 6} ${hx - 6} ${hy - HEAD - 3} ${hx + 1} ${hy - HEAD - 1.5 + L.balding * 6}
              C${hx + 6} ${hy - HEAD - 1 + L.balding * 6} ${hx + 9} ${hy - 7 + L.balding * 4} ${hx + 9 - L.balding * 10} ${hy - 5 + L.balding * 3}
              C${hx + 3} ${hy - 7 + L.balding * 4} ${hx - 2} ${hy - 5} ${hx - 4} ${hy}
              C${hx - 5} ${hy + 2} ${hx - 6} ${hy + 4} ${hx - 6} ${hy + 7} Z`}
          fill={L.hair}
          stroke={INK}
          strokeWidth="1"
          opacity={1 - L.balding * 0.25}
        />
        {L.wrinkles > 0 && (
          <g stroke="#8a4b2a" strokeWidth="0.55" fill="none" opacity={L.wrinkles * 0.9} strokeLinecap="round">
            <path d={`M${hx + 2} ${hy - 8} q3.5 -0.8 7 0`} />
            {L.wrinkles > 0.4 && <path d={`M${hx + 2.5} ${hy - 9.8} q3 -0.7 6 0`} />}
            <path d={`M${hx + 7.6} ${hy - 1} l2 -1.2 M${hx + 7.8} ${hy + 0.2} l2.2 0.4`} />
            {L.wrinkles > 0.55 && <path d={`M${hx + 7} ${hy + 3} q1.3 2 0.2 4.4`} />}
            {L.wrinkles > 0.75 && <path d={`M${hx + 1} ${hy + 6} q2 1.5 1 4`} />}
          </g>
        )}
        {L.glasses && (
          <g stroke={INK} strokeWidth="0.9" fill="#bae6fd55">
            <rect x={hx + 2.4} y={hy - 4.5} width="6" height="4.6" rx="1.6" />
            <line x1={hx + 2.4} y1={hy - 3} x2={hx - 3} y2={hy - 2.4} />
          </g>
        )}
        {helmet && (
          <>
            <circle cx={hx + 0.5} cy={hy} r={HEAD + 6} fill="#bae6fd30" stroke="#e2e8f0" strokeWidth="2.4" />
            <path d={`M${hx - 6} ${hy - 12} q8 -6 16 0`} stroke="#fff" strokeWidth="1.6" fill="none" opacity="0.8" />
          </>
        )}
      </g>

      {inst && (
        <>
          <Limb pts={[[0, hipY], lL.k, lL.ankle]} color={P.pants} w={9.5} />
          <Shoe at={lL.f} color={P.shoes} tilt={lL.tilt} back={lL.back} />
        </>
      )}
      {/* Instrumento sobre el regazo o al hombro, con la mano de atrás pisando las cuerdas */}
      {inst && (
        <>
          <InstrumentBody inst={inst} t={t} />
          <circle cx={aR.h[0]} cy={aR.h[1]} r="3.2" fill={skinDark} stroke={INK} strokeWidth="1.2" />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={aR.h[0] + 1.5 + i * 1.3} cy={aR.h[1] - 2.2 + Math.sin(t * (4 + skill * 8) + i * 2) * 0.6} r="0.9" fill={skinDark} stroke={INK} strokeWidth="0.5" />
          ))}
        </>
      )}

      {/* Extremidades del frente */}
      {!inst && (
        <>
          <Limb pts={[[0, hipY], lL.k, lL.ankle]} color={P.pants} w={9.5} />
          <Shoe at={lL.f} color={P.shoes} tilt={lL.tilt} back={lL.back} />
        </>
      )}
      <Limb pts={[aL.s, aL.e, aL.h]} color={P.sleeve === P.top ? P.top : P.sleeve} w={7.5} />
      <circle cx={aL.h[0]} cy={aL.h[1]} r="3.7" fill={outfit === "spacesuit" ? "#cbd5e1" : L.skin} stroke={INK} strokeWidth="1.3" />
      {showCane && <Limb pts={[[aL.h[0], aL.h[1]], [aL.h[0] + 4, 0]]} color="#78350f" w={2.2} />}
      {inst?.bowDir && (
        // Arco: la vara pasa por el puente y la mano lo empuja a lo largo de sí misma.
        <g>
          <line x1={aL.h[0] + inst.bowDir[0] * 2} y1={aL.h[1] + inst.bowDir[1] * 2} x2={aL.h[0] - inst.bowDir[0] * 40} y2={aL.h[1] - inst.bowDir[1] * 40} stroke={INK} strokeWidth="2.2" />
          <line x1={aL.h[0] + inst.bowDir[0] * 2} y1={aL.h[1] + inst.bowDir[1] * 2} x2={aL.h[0] - inst.bowDir[0] * 40} y2={aL.h[1] - inst.bowDir[1] * 40} stroke="#92400e" strokeWidth="1" />
          <line x1={aL.h[0] + 1.6} y1={aL.h[1]} x2={aL.h[0] - inst.bowDir[0] * 38 + 1.6} y2={aL.h[1] - inst.bowDir[1] * 38} stroke="#fafaf9" strokeWidth="0.5" opacity="0.9" />
          <rect x={aL.h[0] - 1.8} y={aL.h[1] - 1} width="3.6" height="3" rx="0.8" fill="#1c1917" />
        </g>
      )}
      {prop && !inst && <HeldProp prop={prop} hand={aL.h} hip={prop === "violin" ? [shX + 4, shY + 6] : [0, hipY]} t={t} color={propColor} />}
      {flowers && (
        <g transform={`translate(${aL.h[0]} ${aL.h[1]})`}>
          <path d="M0 0 L3 -12 M0 0 L-2 -11 M0 0 L6 -9" stroke="#15803d" strokeWidth="1.4" />
          <circle cx="3" cy="-13" r="3" fill="#f43f5e" stroke={INK} strokeWidth="0.6" />
          <circle cx="-2.5" cy="-12" r="2.6" fill="#facc15" stroke={INK} strokeWidth="0.6" />
          <circle cx="6.5" cy="-10" r="2.6" fill="#f9fafb" stroke={INK} strokeWidth="0.6" />
        </g>
      )}
    </g>
  );
}

/** Objeto que sostiene el personaje (coordenadas locales, mirando a la derecha). */
function HeldProp({ prop, hand, hip, t, color }: { prop: Prop; hand: [number, number]; hip: [number, number]; t: number; color?: string }) {
  const [hx, hy] = hand;
  switch (prop) {
    case "rock":
      return (
        <g transform={`translate(${hx + 2} ${hy - 2})`}>
          <path d="M-5 1 L-4 -4 L1 -6 L6 -3 L6 2 L1 5 L-3 4Z" fill={color ?? "#78716c"} stroke={INK} strokeWidth="0.9" />
          <path d="M-2 -2 l3 1 M1 2 l2 -2" stroke="#00000055" strokeWidth="0.6" />
        </g>
      );
    case "flag":
      return (
        <g transform={`translate(${hx} ${hy})`}>
          <line x1="0" y1="10" x2="0" y2="-34" stroke="#e5e7eb" strokeWidth="1.6" />
          <path d={`M0 -34 h18 q${Math.sin(t * 2)} 5 0 10 h-18Z`} fill="#1d4ed8" stroke={INK} strokeWidth="0.6" />
          <circle cx="9" cy="-29" r="2.6" fill="#f97316" />
        </g>
      );
    case "book":
    case "tablet":
      return prop === "book" ? (
        <g transform={`translate(${hx} ${hy - 4}) rotate(-12)`}>
          <rect x="-2" y="-9" width="13" height="16" rx="1" fill="#b91c1c" stroke={INK} strokeWidth="0.9" />
          <rect x="0" y="-8" width="10" height="14" fill="#fef3c7" />
          <line x1="2" y1="-4" x2="8" y2="-4" stroke="#a8a29e" strokeWidth="0.6" />
          <line x1="2" y1="-1" x2="8" y2="-1" stroke="#a8a29e" strokeWidth="0.6" />
          <line x1="2" y1="2" x2="7" y2="2" stroke="#a8a29e" strokeWidth="0.6" />
        </g>
      ) : (
        <g transform={`translate(${hx} ${hy - 4}) rotate(-12)`}>
          <rect x="-2" y="-9" width="13" height="17" rx="1.5" fill="#0f172a" stroke={INK} strokeWidth="0.9" />
          <rect x="-0.5" y="-7.5" width="10" height="14" fill="#1d4ed8" />
          <rect x="1" y="-6" width="7" height="2" fill="#bfdbfe" />
          <rect x="1" y="-2" width={3 + ((t * 2) % 4)} height="1.2" fill="#e0f2fe" />
        </g>
      );
    case "mug":
      return (
        <g transform={`translate(${hx} ${hy - 3})`}>
          <rect x="-3" y="-6" width="7" height="8" rx="1.5" fill="#f8fafc" stroke={INK} strokeWidth="0.8" />
          <path d="M4 -4 q3 0 3 2.5 q0 2.5 -3 2.5" fill="none" stroke={INK} strokeWidth="0.8" />
          {[0, 1].map((i) => (
            <path key={i} d={`M${-1 + i * 3} -8 q-1.5 -3 0 -5 q1.5 -2 0 -4`} stroke="#e2e8f0" strokeWidth="0.7" fill="none" opacity={0.3 + 0.4 * Math.abs(Math.sin(t * 2 + i))} />
          ))}
        </g>
      );
    case "can":
      return (
        <g transform={`translate(${hx} ${hy})`}>
          <path d="M-4 -2 L6 -2 L7 7 L-5 7Z" fill="#16a34a" stroke={INK} strokeWidth="0.8" />
          <path d="M6 1 L15 -3" stroke="#16a34a" strokeWidth="2" />
          {Array.from({ length: 5 }, (_, i) => {
            const k = (t * 2 + i / 5) % 1;
            return <circle key={i} cx={15 + k * 8} cy={-3 + k * k * 22} r="0.9" fill="#38bdf8" opacity={1 - k * 0.5} />;
          })}
        </g>
      );
    case "tool": {
      const spark = Math.sin(t * 13) > 0.3;
      return (
        <g transform={`translate(${hx} ${hy})`}>
          <rect x="0" y="-1.5" width="12" height="3" rx="1" fill="#94a3b8" stroke={INK} strokeWidth="0.6" />
          <circle cx="13" cy="0" r="2.2" fill="none" stroke="#94a3b8" strokeWidth="1.4" />
          {spark &&
            Array.from({ length: 5 }, (_, i) => {
              const a = (i / 5) * Math.PI * 2 + t * 5;
              return <line key={i} x1="15" y1="0" x2={15 + Math.cos(a) * 5} y2={Math.sin(a) * 5} stroke="#fde047" strokeWidth="0.8" />;
            })}
        </g>
      );
    }
    case "camera": {
      const flash = (t * 0.5) % 1 < 0.06;
      return (
        <g transform={`translate(${hx} ${hy - 4})`}>
          <rect x="-2" y="-4" width="11" height="7" rx="1.5" fill="#18181b" stroke={INK} strokeWidth="0.8" />
          <circle cx="9" cy="-0.5" r="2.4" fill="#334155" stroke={INK} strokeWidth="0.6" />
          {flash && <circle cx="10" cy="-0.5" r="10" fill="#fff" opacity="0.7" />}
        </g>
      );
    }
    case "violin": {
      // El violín descansa en el hombro; el arco sale de la mano.
      const [shx, shy] = hip;
      return (
        <g>
          <g transform={`translate(${shx} ${shy}) rotate(-20)`}>
            <path d="M0 -4 q-6 0 -6 4 q0 4 6 4 q3 0 4 -2 q1 2 4 2 q5 0 5 -4 q0 -4 -5 -4 q-3 0 -4 2 q-1 -2 -4 -2Z" fill="#b45309" stroke={INK} strokeWidth="0.9" />
            <line x1="13" y1="0" x2="26" y2="0" stroke="#451a03" strokeWidth="2" />
            <circle cx="27" cy="0" r="1.6" fill="#451a03" />
          </g>
          <line x1={hx - 12} y1={hy + 8} x2={hx + 16} y2={hy - 14} stroke="#e7e5e4" strokeWidth="1.1" />
        </g>
      );
    }
    case "guitar": {
      const [px, py] = hip;
      return (
        <g transform={`translate(${px + 12} ${py - 10}) rotate(-28)`}>
          <line x1="6" y1="0" x2="32" y2="0" stroke="#78350f" strokeWidth="2.6" />
          <rect x="31" y="-2" width="5" height="4" rx="1" fill="#451a03" />
          <ellipse cx="0" cy="0" rx="9" ry="7.5" fill="#d97706" stroke={INK} strokeWidth="1" />
          <ellipse cx="-4" cy="0" rx="5" ry="5.5" fill="#d97706" stroke={INK} strokeWidth="1" />
          <circle cx="1" cy="0" r="2" fill="#451a03" />
        </g>
      );
    }
  }
}

/**
 * Persona acostada boca arriba bajo una frazada (cama o saco de dormir).
 * (x, y) es el borde izquierdo de la superficie del colchón; `length` su largo.
 */
export function Sleeper({ x, y, length, age, t, blanket = "#93c5fd", pillow = "#f8fafc", opacity = 1, frail = false }: {
  x: number;
  y: number;
  length: number;
  age: number;
  t: number;
  blanket?: string;
  pillow?: string;
  opacity?: number;
  frail?: boolean;
}) {
  const L = looks(age);
  const breath = Math.sin(t * (frail ? 1 : 1.6)) * 1.2;
  const hx = x + 22;
  const hy = y - 12;
  const bodyEnd = x + length - 6;
  return (
    <g opacity={opacity}>
      <ellipse cx={x + 20} cy={y - 5} rx="19" ry="7" fill={pillow} stroke={INK} strokeWidth="1.2" />
      {/* Cabeza de perfil mirando hacia arriba */}
      <ellipse cx={hx} cy={hy} rx={HEAD * 1.05} ry={HEAD * 0.95} fill={L.skin} stroke={INK} strokeWidth="1.6" />
      <path d={`M${hx - 2} ${hy - HEAD + 0.5} q3 -4.5 6 -0.5`} fill={L.skin} stroke={INK} strokeWidth="1.1" />
      <path d={`M${hx - 6} ${hy - 4} q2.5 1.6 5 0`} stroke={INK} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d={`M${hx + 5} ${hy - 5} q1 2 0 4`} stroke="#7c2d12" strokeWidth="1" fill="none" />
      <path
        d={`M${hx - HEAD - 1} ${hy + 1} C${hx - HEAD - 3} ${hy - 8} ${hx - 12} ${hy - 13 + L.balding * 4} ${hx - 6 + L.balding * 4} ${hy - HEAD - 0.5} L${hx - 7} ${hy - 3} Q${hx - 9} ${hy + 4} ${hx - HEAD - 1} ${hy + 1}Z`}
        fill={L.hair}
        stroke={INK}
        strokeWidth="1"
      />
      {L.wrinkles > 0.3 && <path d={`M${hx - 1} ${hy - 1} q2 -1 4 0 M${hx + 2} ${hy + 3} q1.5 0.6 3 0`} stroke="#8a4b2a" strokeWidth="0.6" fill="none" opacity={L.wrinkles} />}
      {/* Frazada sobre el cuerpo: sube y baja con la respiración */}
      <path
        d={`M${hx + 9} ${y - 2} C${hx + 12} ${y - 19 - breath} ${hx + 40} ${y - 21 - breath} ${hx + 55} ${y - 15}
            C${hx + 75} ${y - 12} ${bodyEnd - 22} ${y - 16} ${bodyEnd - 12} ${y - 20}
            C${bodyEnd - 4} ${y - 22} ${bodyEnd} ${y - 12} ${bodyEnd + 2} ${y} Z`}
        fill={blanket}
        stroke={INK}
        strokeWidth="1.6"
      />
      <path d={`M${hx + 14} ${y - 12 - breath} q20 -5 36 -2`} stroke="#ffffff88" strokeWidth="2" fill="none" />
      <circle cx={hx + 30} cy={y - 16 - breath} r="3.4" fill={L.skin} stroke={INK} strokeWidth="1" />
      {!frail && (
        <text x={hx + 6} y={hy - 16 - ((t * 6) % 8)} fontSize="9" fill="#e2e8f0" opacity={0.7}>
          z
        </text>
      )}
    </g>
  );
}
