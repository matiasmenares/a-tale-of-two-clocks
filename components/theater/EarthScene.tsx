import { activityAt, calendar, catAt, dogAt, EARTH_NAME, musicSkill, petUrns, practiceHours, recentPetLoss, season, type Season, earthEpoch, iceLevel, LAUNCH_YEAR, looks, SHIP_NAME, type Epoch } from "@/lib/life";
import { techAt } from "@/lib/tech";
import { MusicNotes, Person, Sleeper, walkClock, type Mood } from "./Person";
import { skyColors, STAR_POINTS } from "./sky";
import { useFocusView } from "./useFocusView";

const GROUND = 262;
const W = 800;
const INK = "#1e1b2e";

/** Pseudoazar determinista en [0, 1). */
const hash = (n: number) => {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

export interface EarthSceneProps {
  /** Tiempo propio terrestre desde el despegue (años). */
  years: number;
  age: number;
  hour: number;
  timelapse: boolean;
  gestureT: number;
  /** Reloj del robot: sigue el ritmo acelerado hasta ×40. */
  fastT: number;
  epoch: Epoch;
  setting: "launch" | "home" | "after" | "reunion";
  stage: "boarding" | "cinematic" | "flight" | "done";
  cinematicTime: number;
  rocketAltitudeM: number;
  deathYears: number;
  shipAge: number;
  shipAlive: boolean;
  earthAlive: boolean;
  /** Recuerdo que trae Tomás de un planeta (una roca). */
  souvenir?: { color: string; from: string };
  /** Dónde mira la cámara cuando la pantalla es angosta (coordenada x de la escena). */
  focusX?: number;
  /** Es el cumpleaños de Martín: fiesta en casa. */
  party?: boolean;
}

function Sky({ hour, timelapse, ice = 0, id }: { hour: number; timelapse: boolean; ice?: number; id: string }) {
  const sky = skyColors(hour, timelapse);
  const sunX = ((hour - 6) / 12) * W;
  const sunY = 210 - sky.sunElev * 180;
  return (
    <>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky.top} />
          <stop offset="1" stopColor={sky.bottom} />
        </linearGradient>
        <radialGradient id={`${id}-sun`}>
          <stop offset="0" stopColor="#fffbeb" />
          <stop offset="0.35" stopColor="#fde68a" />
          <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height="300" fill={`url(#${id}-sky)`} />
      {STAR_POINTS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={sky.night * (0.5 + 0.5 * hash(i))} />
      ))}
      {timelapse ? (
        <path d={`M0 210 Q${W / 2} -60 ${W} 210`} stroke="#fde68a" strokeWidth="7" fill="none" opacity="0.3" strokeLinecap="round" />
      ) : (
        sky.sunElev > -0.15 && <circle cx={sunX} cy={sunY} r="46" fill={`url(#${id}-sun)`} />
      )}
      {!timelapse && sky.night > 0.6 && <circle cx={W - sunX * 0.6} cy={70} r="12" fill="#e2e8f0" opacity={sky.night} />}
      {[0, 1, 2].map((i) => {
        const cx = ((i * 290 + hour * 9) % (W + 200)) - 100;
        return (
          <g key={i} fill="#fff" opacity={0.75 - sky.night * 0.55}>
            <ellipse cx={cx} cy={50 + i * 22} rx="38" ry="11" />
            <ellipse cx={cx + 22} cy={44 + i * 22} rx="24" ry="12" />
            <ellipse cx={cx - 20} cy={47 + i * 22} rx="20" ry="9" />
          </g>
        );
      })}
      {ice > 0 && <rect width={W} height="300" fill="#e0f2fe" opacity={ice * 0.25} />}
    </>
  );
}

/** Nivel tecnológico continuo para un año dado (0–4, con decimales). */
function levelAt(year: number) {
  const marks = [2030, 2045, 2070, 2150, 3000, 6000];
  for (let i = 0; i < marks.length - 1; i++) {
    if (year < marks[i + 1]) return i + Math.max(0, (year - marks[i]) / (marks[i + 1] - marks[i]));
  }
  return 4.999;
}

/**
 * Horizonte urbano. Cada edificio se reconstruye en un año distinto, así la ciudad
 * se renueva poco a poco: ladrillo → vidrio → torres curvas → megatorres → arcologías.
 */
function City({ year, base, t, night }: { year: number; base: number; t: number; night: number }) {
  const n = 15;
  const lv = levelAt(year);
  const lit = (i: number, r: number, c: number) => night * (hash(i * 31 + r * 7 + c) > 0.45 ? 0.95 : 0.1) + 0.06;
  return (
    <g>
      {/* Calle y vereda donde se apoyan los edificios */}
      <rect x="0" y={base} width={W} height={300 - base} fill="#3f3f46" />
      <rect x="0" y={base} width={W} height="4" fill="#71717a" />
      {Array.from({ length: n }, (_, i) => {
        // Cada edificio "vive" con un retraso propio respecto al nivel general.
        const style = Math.floor(Math.max(0, levelAt(year - hash(i + 77) * 60)));
        const w = 34 + hash(i) * 26 + style * 4;
        const x = i * (W / n) - 8 + hash(i + 50) * 10;
        const h = (45 + hash(i + 9) * 65) * (0.75 + style * 0.45);
        const cx = x + w / 2;
        if (style === 0)
          return (
            <g key={i}>
              <rect x={x} y={base - h} width={w} height={h} fill="#57534e" stroke="#1c1917" />
              <rect x={x + w * 0.6} y={base - h - 10} width="9" height="10" fill="#44403c" stroke="#1c1917" />
              {Array.from({ length: Math.floor(h / 15) }, (_, r) =>
                [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={x + 5 + c * (w / 3.2)} y={base - h + 8 + r * 15} width="6" height="7" fill="#fde68a" opacity={lit(i, r, c)} />),
              )}
            </g>
          );
        if (style === 1)
          return (
            <g key={i}>
              <rect x={x} y={base - h} width={w} height={h} fill="#1e3a5f" stroke="#0f172a" />
              <rect x={x} y={base - h} width={w} height={h} fill="url(#glass)" opacity="0.6" />
              {Array.from({ length: 4 }, (_, c) => <line key={c} x1={x + (c + 1) * (w / 5)} y1={base - h} x2={x + (c + 1) * (w / 5)} y2={base} stroke="#7dd3fc" strokeOpacity="0.35" />)}
              <line x1={cx} y1={base - h} x2={cx} y2={base - h - 18} stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx={cx} cy={base - h - 19} r="1.8" fill="#ef4444" opacity={0.4 + 0.6 * ((Math.floor(t * 1.5) + i) % 2)} />
              {Array.from({ length: Math.floor(h / 12) }, (_, r) => <rect key={r} x={x + 3} y={base - h + 6 + r * 12} width={w - 6} height="3" fill="#bae6fd" opacity={lit(i, r, 0) * 0.8} />)}
            </g>
          );
        if (style === 2)
          return (
            <g key={i}>
              <path d={`M${x} ${base} L${x + w * 0.15} ${base - h} Q${cx} ${base - h - 28} ${x + w * 0.85} ${base - h} L${x + w} ${base}Z`} fill="#334155" stroke="#0f172a" />
              {Array.from({ length: Math.floor(h / 22) }, (_, r) => (
                <g key={r}>
                  <rect x={x + w * 0.18} y={base - h + 10 + r * 22} width={w * 0.64} height="3" fill="#67e8f9" opacity={lit(i, r, 1) + 0.2} />
                  {r % 2 === 0 && <ellipse cx={x + w * 0.85} cy={base - h + 18 + r * 22} rx="6" ry="3" fill="#22c55e" />}
                </g>
              ))}
            </g>
          );
        if (style === 3)
          return (
            <g key={i}>
              <path d={`M${x + w * 0.1} ${base} L${x + w * 0.3} ${base - h * 1.25} L${x + w * 0.7} ${base - h * 1.25} L${x + w * 0.9} ${base}Z`} fill="#1e293b" stroke="#020617" />
              {[0.3, 0.55, 0.8].map((f) => (
                <ellipse key={f} cx={cx} cy={base - h * 1.25 * f} rx={w * 0.55} ry="4" fill="none" stroke="#a5f3fc" strokeWidth="2" opacity="0.8" />
              ))}
              {Array.from({ length: 5 }, (_, c) => <line key={c} x1={x + w * (0.32 + c * 0.09)} y1={base - h * 1.2} x2={x + w * (0.25 + c * 0.12)} y2={base} stroke="#4ade80" strokeWidth="2" opacity="0.6" />)}
              <circle cx={cx} cy={base - h * 1.25 - 4} r="3" fill="#f0abfc" opacity={0.5 + 0.5 * Math.sin(t * 2 + i)} />
            </g>
          );
        return (
          <g key={i}>
            <path d={`M${x - 6} ${base} A${w * 0.75} ${h * 0.9} 0 0 1 ${x + w + 6} ${base}Z`} fill="#0e7490" stroke="#083344" opacity="0.9" />
            <path d={`M${x - 6} ${base} A${w * 0.75} ${h * 0.9} 0 0 1 ${x + w + 6} ${base}`} fill="none" stroke="#a5f3fc" strokeWidth="1.5" opacity={0.5 + 0.3 * Math.sin(t + i)} />
            <ellipse cx={cx} cy={base - h * 0.45} rx={w * 0.35} ry={h * 0.2} fill="#22d3ee" opacity="0.25" />
          </g>
        );
      })}
      {/* Tránsito según la época */}
      {lv < 2 &&
        [0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(${((t * (30 + i * 9) + i * 230) % (W + 60)) - 30} ${base + 8})`}>
            <rect x="-9" y="-6" width="18" height="6" rx="2" fill={["#dc2626", "#2563eb", "#f8fafc", "#16a34a"][i]} stroke={INK} strokeWidth="0.6" />
            <rect x="-5" y="-9" width="10" height="4" rx="1.5" fill="#cbd5e1" stroke={INK} strokeWidth="0.5" />
          </g>
        ))}
      {lv >= 1 && lv < 3 &&
        [0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${(t * 22 + i * 260) % W} ${base - 110 - i * 16})`}>
            <rect x="-4" y="-1" width="8" height="3" fill="#0f172a" />
            <line x1="-7" y1="-2" x2="7" y2="-2" stroke="#0f172a" />
          </g>
        ))}
      {lv >= 2 &&
        [0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${((t * (40 + i * 15) + i * 260) % (W + 40)) - 20} ${base - 140 - i * 24})`}>
            <path d="M-11 0 q11 -9 22 0 z" fill="#e2e8f0" stroke={INK} strokeWidth="0.8" />
            <circle cx="-6" cy="1" r="2" fill="#38bdf8" />
            <line x1="11" y1="-1" x2="22" y2="-1" stroke="#67e8f9" strokeWidth="1.5" opacity="0.6" />
          </g>
        ))}
      {lv >= 3 && (
        <>
          <path d={`M0 ${base - 180} Q${W / 2} ${base - 222} ${W} ${base - 180}`} stroke="#94a3b8" strokeWidth="3" fill="none" />
          <rect x={((t * 80) % (W + 120)) - 120} y={base - 203} width="110" height="9" rx="4" fill="#f8fafc" stroke={INK} strokeWidth="0.8" />
        </>
      )}
      {lv >= 4 && <line x1={W * 0.7} y1={base} x2={W * 0.72} y2="0" stroke="#e0f2fe" strokeWidth="2" opacity="0.5" />}
    </g>
  );
}

/**
 * Lanzador de varias etapas al estilo de Interstellar: blanco con franjas negras de
 * referencia, cinco motores y la nave Ranger (oscura, con alas delta) en la punta.
 * El origen (0, 0) es la base de las toberas; mide ~228 unidades de alto.
 */
function Rocket({ x, y, scale, flame }: { x: number; y: number; scale: number; flame: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <linearGradient id="hull" x1="0" x2="1">
          <stop offset="0" stopColor="#cbd5e1" />
          <stop offset="0.4" stopColor="#ffffff" />
          <stop offset="1" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="ranger" x1="0" x2="1">
          <stop offset="0" stopColor="#27272a" />
          <stop offset="0.45" stopColor="#52525b" />
          <stop offset="1" stopColor="#18181b" />
        </linearGradient>
      </defs>
      {flame > 0 && (
        <g opacity={flame}>
          <ellipse cx="0" cy="44" rx="26" ry="48" fill="#f97316" opacity="0.9" />
          <ellipse cx="0" cy="30" rx="17" ry="32" fill="#fde047" />
          <ellipse cx="0" cy="16" rx="9" ry="17" fill="#fff7ed" />
        </g>
      )}
      {/* Toberas y estructura de empuje */}
      {[-14, 0, 14].map((ex) => (
        <path key={ex} d={`M${ex - 3.5} -10 L${ex + 3.5} -10 L${ex + 6} 0 L${ex - 6} 0Z`} fill="#3f3f46" stroke={INK} strokeWidth="1" />
      ))}
      <rect x="-20" y="-18" width="40" height="8" fill="#27272a" stroke={INK} strokeWidth="1" />
      <path d="M-20 -46 L-30 -12 L-20 -16Z M20 -46 L30 -12 L20 -16Z" fill="#18181b" stroke={INK} strokeWidth="1" />
      {/* Primera etapa con patrón de franjas */}
      <rect x="-20" y="-95" width="40" height="77" fill="url(#hull)" stroke={INK} strokeWidth="1.4" />
      <rect x="-20" y="-44" width="13" height="26" fill="#111827" />
      <rect x="7" y="-70" width="13" height="26" fill="#111827" />
      <rect x="-20" y="-95" width="40" height="5" fill="#111827" />
      <text x="1" y="-56" fontSize="9" textAnchor="middle" fill="#1f2937" fontWeight="bold" transform="rotate(-90 1 -56)" letterSpacing="1">TERRA-1</text>
      {/* Interetapa y segunda etapa */}
      <path d="M-20 -95 L-20 -102 L-15 -108 L15 -108 L20 -102 L20 -95Z" fill="#1f2937" stroke={INK} strokeWidth="1" />
      <rect x="-15" y="-150" width="30" height="42" fill="url(#hull)" stroke={INK} strokeWidth="1.3" />
      <rect x="-15" y="-130" width="10" height="12" fill="#111827" />
      <rect x="-15" y="-155" width="30" height="5" fill="#111827" />
      {/* Tercera etapa y adaptador */}
      <rect x="-12" y="-172" width="24" height="17" fill="url(#hull)" stroke={INK} strokeWidth="1.2" />
      <rect x="-12" y="-165" width="24" height="3" fill="#111827" />
      <path d="M-12 -172 L-8 -179 L8 -179 L12 -172Z" fill="#d4d4d8" stroke={INK} strokeWidth="1" />
      {/* Nave Ranger: fuselaje anguloso, alas delta, cabina */}
      <path d="M-24 -179 L-8 -196 L-6 -214 L0 -228 L6 -214 L8 -196 L24 -179Z" fill="url(#ranger)" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M-8 -196 L8 -196 M-16 -186 L16 -186 M0 -228 L0 -196" stroke="#71717a" strokeWidth="0.8" />
      <path d="M-4 -214 L0 -222 L4 -214 L3 -208 L-3 -208Z" fill="#0f172a" stroke="#a1a1aa" strokeWidth="0.6" />
      <path d="M-1 -219 L1 -216" stroke="#67e8f9" strokeWidth="1" />
      <rect x="-20" y="-182" width="40" height="3" fill="#f97316" opacity="0.85" />
    </g>
  );
}

/** La Ranger aterrizada en horizontal, con la escotilla abierta y la rampa abajo. */
function RangerLanded({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <linearGradient id="ranger-side" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#71717a" />
          <stop offset="0.5" stopColor="#3f3f46" />
          <stop offset="1" stopColor="#18181b" />
        </linearGradient>
      </defs>
      <ellipse cx="0" cy="0" rx="80" ry="5" fill="#00000040" />
      {/* Tren de aterrizaje */}
      <path d="M-40 -14 L-46 0 M-42 0 h-8 M38 -14 L44 0 M40 0 h8" stroke="#27272a" strokeWidth="3" />
      {/* Fuselaje con nariz en cuña y cola */}
      <path d="M-72 -16 L-66 -40 L-50 -40 L-40 -32 L40 -32 L74 -20 L70 -14 L-72 -14Z" fill="url(#ranger-side)" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M-66 -40 L-62 -58 L-52 -58 L-48 -40Z" fill="#3f3f46" stroke={INK} strokeWidth="1.2" />
      <path d="M44 -31 L64 -24 L60 -22 L44 -27Z" fill="#0f172a" stroke="#a1a1aa" strokeWidth="0.7" />
      <path d="M-40 -32 L40 -32 M-30 -22 L50 -22" stroke="#a1a1aa" strokeWidth="0.6" opacity="0.6" />
      <rect x="-30" y="-27" width="60" height="2.5" fill="#f97316" opacity="0.85" />
      <text x="0" y="-17" fontSize="6" textAnchor="middle" fill="#e4e4e7" letterSpacing="1">RANGER · TERRA-1</text>
      {/* Escotilla abierta y rampa */}
      <rect x="-14" y="-30" width="14" height="16" fill="#fde68a" opacity="0.9" stroke={INK} strokeWidth="1.6" />
      <path d="M-14 -14 L-30 0 L-14 0Z" fill="#52525b" stroke={INK} strokeWidth="1" />
    </g>
  );
}

function LaunchSite({ props }: { props: EarthSceneProps }) {
  const { stage, cinematicTime, rocketAltitudeM, gestureT, age, years, hour } = props;
  const lifted = stage === "flight" || stage === "done";
  const rise = lifted ? 150 * Math.log10(1 + rocketAltitudeM / 20) : 0;
  const scale = Math.max(0.12, 1 - Math.log10(1 + rocketAltitudeM / 200) / 4);
  const shake = lifted && rocketAltitudeM < 2000 ? Math.sin(gestureT * 40) * 1.2 : 0;
  const ignition = stage === "cinematic" && cinematicTime > 13;
  const pose = stage === "cinematic" && cinematicTime < 7 ? "wave" : lifted && years < 0.002 ? "lookUp" : "stand";
  const night = skyColors(hour, false).night;
  return (
    <>
      <Sky hour={hour} timelapse={props.timelapse} id="launch" />
      {/* Montañas y ciudad lejanas: sólidas, con bruma por la distancia */}
      <path d="M0 200 L90 150 L170 190 L280 130 L380 190 L470 160 L560 200 L800 170 V262 H0Z" fill="#8193ab" />
      <path d="M90 150 L104 158 L80 160Z M280 130 L298 142 L264 142Z M470 160 L482 167 L460 168Z" fill="#e2e8f0" />
      <g transform={`translate(0 ${GROUND - 30}) scale(1 0.62) translate(0 ${-(GROUND - 30)})`}>
        <City year={LAUNCH_YEAR} base={GROUND - 30} t={gestureT} night={night} />
      </g>
      <defs>
        <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyColors(hour, false).bottom} stopOpacity="0.15" />
          <stop offset="1" stopColor={skyColors(hour, false).bottom} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect y="120" width={W} height={GROUND - 150} fill="url(#haze)" />
      <rect y={GROUND - 30} width={W} height="70" fill="#4d6b35" />
      <rect y={GROUND} width={W} height="40" fill="#3f5a2b" />

      {/* Complejo de lanzamiento: losa con rampa, foso de llamas, pedestal, torre de agua y pararrayos */}
      <path d={`M430 ${GROUND + 8} L478 ${GROUND - 6} L800 ${GROUND - 6} L800 ${GROUND + 8}Z`} fill="#a8a29e" stroke={INK} strokeWidth="1.2" />
      <path d={`M430 ${GROUND + 8} L478 ${GROUND - 6}`} stroke="#d6d3d1" strokeWidth="2" />
      {Array.from({ length: 6 }, (_, i) => (
        <line key={i} x1={500 + i * 50} y1={GROUND - 6} x2={500 + i * 50} y2={GROUND + 8} stroke="#78716c" strokeWidth="0.8" />
      ))}
      <rect x="604" y={GROUND - 6} width="56" height="14" fill="#1c1917" />
      <path d={`M604 ${GROUND + 8} q28 -10 56 0`} fill="#44403c" />
      <rect x="590" y={GROUND - 14} width="84" height="8" fill="#57534e" stroke={INK} strokeWidth="1" />
      {[596, 660].map((x) => (
        <g key={x}>
          <rect x={x} y={GROUND - 6} width="8" height="12" fill="#44403c" stroke={INK} strokeWidth="0.8" />
          {!lifted && <rect x={x + 1} y={GROUND - 22} width="6" height="9" rx="1" fill="#f59e0b" stroke={INK} strokeWidth="0.8" />}
        </g>
      ))}
      {/* Torre de agua del sistema de supresión de ruido */}
      <g transform={`translate(760 ${GROUND - 6})`}>
        <path d="M-12 0 L-6 -48 M12 0 L6 -48 M-9 -24 L9 -24" stroke="#64748b" strokeWidth="2" />
        <ellipse cx="0" cy="-54" rx="14" ry="10" fill="#e2e8f0" stroke={INK} strokeWidth="1.6" />
        <text x="0" y="-51" fontSize="5" textAnchor="middle" fill="#334155" fontWeight="bold">H2O</text>
      </g>
      {/* Pararrayos con cable */}
      <line x1="560" y1={GROUND - 6} x2="560" y2="6" stroke="#475569" strokeWidth="2" />
      <path d="M560 6 Q630 40 689 -6" stroke="#475569" strokeWidth="0.8" fill="none" />
      {[500, 540, 720, 790].map((x) => (
        <circle key={x} cx={x} cy={GROUND - 8} r="2" fill={night > 0.4 ? "#fde047" : "#d6d3d1"} />
      ))}
      {/* Torre de servicio con brazos umbilicales y pararrayos */}
      <g stroke="#475569" fill="none">
        <rect x="676" y="14" width="26" height={GROUND - 20} strokeWidth="2.5" />
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d={`M676 ${14 + i * 20} L702 ${34 + i * 20} M702 ${14 + i * 20} L676 ${34 + i * 20}`} strokeWidth="1.1" />
        ))}
        <line x1="689" y1="14" x2="689" y2="-6" strokeWidth="2" />
        {!lifted && (
          <>
            <path d="M676 96 L640 96" strokeWidth="5" />
            <path d="M676 150 L648 150" strokeWidth="4" />
            <path d="M676 205 L650 205" strokeWidth="4" />
          </>
        )}
      </g>
      <Rocket x={632 + shake} y={250 - rise} scale={scale * 0.82} flame={lifted ? 1 : ignition ? 0.35 : 0} />
      {(lifted && rocketAltitudeM < 60_000) || ignition ? (
        <g opacity="0.75">
          {Array.from({ length: 9 }, (_, i) => (
            <circle key={i} cx={588 + i * 11 + Math.sin(gestureT + i) * 4} cy={GROUND - 12 - (i % 3) * 8} r={16 + (i % 3) * 7} fill="#e5e7eb" />
          ))}
          {lifted && <path d={`M632 ${GROUND - 20} Q${626 + Math.sin(gestureT) * 6} ${(250 - rise + GROUND) / 2} 632 ${250 - rise + 20 * scale}`} stroke="#f1f5f9" strokeWidth={18 * Math.max(0.3, scale)} fill="none" opacity="0.7" strokeLinecap="round" />}
        </g>
      ) : null}
      {/* Reja y público */}
      <g stroke="#57534e" strokeWidth="2">
        <line x1="0" y1={GROUND - 22} x2="440" y2={GROUND - 22} />
        {Array.from({ length: 23 }, (_, i) => (
          <line key={i} x1={i * 20} y1={GROUND - 22} x2={i * 20} y2={GROUND} />
        ))}
      </g>
      {[70, 110, 290, 330, 370, 410].map((x, i) => (
        <Person key={i} x={x} y={GROUND} age={22 + i * 11} pose={lifted && i % 2 ? "lookUp" : i === 4 && !lifted ? "wave" : "stand"} t={gestureT + i} scale={0.8} color={["#a16207", "#0f766e", "#7c3aed", "#be123c", "#475569", "#15803d"][i]} />
      ))}
      <line x1="150" y1={GROUND} x2="150" y2={GROUND - 90} stroke="#78716c" strokeWidth="2" />
      <path d={`M150 ${GROUND - 90} l26 6 l-26 6Z`} fill="#2563eb" stroke={INK} strokeWidth="1.6" />
      <Person x={210} y={GROUND} age={age} pose={pose} t={gestureT} />
      <text x="210" y={GROUND + 26} fontSize="12" fill="#f8fafc" textAnchor="middle" fontWeight="600">{EARTH_NAME}</text>
    </>
  );
}

function Home({ props }: { props: EarthSceneProps }) {
  const { years, age, hour, timelapse, gestureT, deathYears } = props;
  const year = LAUNCH_YEAR + Math.floor(years);
  const tech = techAt(year);
  const sky = skyColors(hour, timelapse);
  const lamp = timelapse ? 0.5 : sky.night;
  const dying = deathYears - years < 0.4;
  // En sus dos últimos años lo cuida un robot enfermera.
  const nearDeath = deathYears - years < 2;
  const loss = recentPetLoss(years);
  const party = !!props.party && !dying;
  const cat = !dying ? catAt(years) : null;
  const guitar = musicSkill(practiceHours("earth", years));
  const act = dying ? null : activityAt("earth", years, age);
  const strolling = act?.pose === "walk" && act.walkingFrom === undefined;
  const px = act
    ? act.walkingFrom !== undefined
      ? (act.walkingFrom + (act.place - act.walkingFrom) * (act.walkT ?? 0)) * W
      : strolling
        ? 400 + Math.sin(gestureT * 0.18) * 230
        : act.place * W
    : 0;
  const facing = strolling ? (Math.cos(gestureT * 0.18) >= 0 ? 1 : -1) : act && act.walkingFrom !== undefined && act.place < act.walkingFrom ? -1 : 1;
  const asleep = dying || act?.pose === "sleep";
  // Dónde está y qué hace el perro según lo que haga Martín.
  const dogState: DogState = asleep ? "lie" : act?.pose === "walk" ? "walk" : act?.pose === "exercise" || act?.label === "Visita de la familia" ? "play" : act?.pose === "sit" || act?.pose === "read" || act?.pose === "guitar" ? "lie" : "sit";
  const dogX = asleep
    ? 200
    : act?.pose === "walk"
      ? px - facing * 34
      : dogState === "play"
        ? 470 + Math.sin(gestureT * 1.7) * 40
        : act?.pose === "sit" || act?.pose === "read" || act?.pose === "guitar"
          ? 310
          : px + 38;
  // Emoción de Martín según lo que hace y lo que le pasa.
  const mood: Mood = loss
    ? "sad"
    : party
      ? "joy"
    : nearDeath
      ? "tired"
      : act?.pose === "guitar"
        ? guitar.skill < 0.2
          ? Math.sin(gestureT * 1.3) > 0.4 ? "sour" : "focused"
          : guitar.skill >= 0.8
            ? "joy"
            : "happy"
        : act?.label === "Visita de la familia"
          ? "joy"
          : act?.label === "Jugando en el PC"
            ? Math.sin(gestureT * 0.9) > 0.55 ? "joy" : "focused"
            : act?.pose === "type" || act?.pose === "read"
              ? "focused"
            : act?.pose === "exercise"
              ? "effort"
              : act?.pose === "water" || act?.pose === "walk" || act?.label.includes("mensaje")
                ? "happy"
                : "neutral";
  const dogFacing: 1 | -1 = act?.pose === "walk" ? facing : dogState === "play" ? (Math.cos(gestureT * 1.7) >= 0 ? 1 : -1) : dogX > px ? -1 : 1;
  // Distancia recorrida: las piernas avanzan con ella (sin "caminar en el lugar").
  const walked = !act
    ? 0
    : strolling
      ? (() => {
          const A = 230;
          const u = gestureT * 0.18 + Math.PI / 2;
          const k = Math.floor(u / Math.PI);
          return A * (2 * k + 1 - Math.cos(u - k * Math.PI));
        })()
      : act.walkingFrom !== undefined
        ? (act.place - act.walkingFrom) * (act.walkT ?? 0) * W
        : 0;
  const ghosts = timelapse && !dying;
  const wall = lamp > 0.5 ? "#8b6f5a" : "#d6c2a8";
  const showRobot = nearDeath || tech.robot || (tech.level >= 1 && age >= 80);
  const cal = calendar(years);
  const christmas = cal.dayOfYear >= 352;
  const winter = cal.dayOfYear >= 152 && cal.dayOfYear < 244; // invierno austral
  // Martín tiene perro solo en dos etapas de su vida.
  const pet = dogAt(years);
  const dog =
    pet && !dying
      ? { color: pet.color, scale: 0.65 + 0.35 * Math.min(1, pet.life), old: pet.left < 2.5 }
      : null;

  return (
    <>
      <defs>
        <pattern id="wallpaper" width="26" height="26" patternUnits="userSpaceOnUse">
          <rect width="26" height="26" fill={wall} />
          <path d="M13 4 l3 5 l-3 5 l-3 -5Z" fill="#00000012" />
        </pattern>
        <pattern id="planks" width="80" height="40" patternUnits="userSpaceOnUse">
          <rect width="80" height="40" fill="#8a5a33" />
          <line x1="0" y1="0" x2="80" y2="0" stroke="#6b4423" strokeWidth="2" />
          <line x1="40" y1="0" x2="40" y2="20" stroke="#6b4423" />
          <line x1="10" y1="20" x2="10" y2="40" stroke="#6b4423" />
        </pattern>
      </defs>
      <rect width={W} height={GROUND} fill="url(#wallpaper)" />
      <rect y={GROUND - 10} width={W} height="10" fill="#f5f5f4" stroke={INK} strokeWidth="0.8" />
      <rect y={GROUND} width={W} height="40" fill="url(#planks)" />
      <ellipse cx="360" cy={GROUND + 14} rx="150" ry="12" fill="#9f1239" opacity="0.55" />

      {/* Ventana: cielo y ciudad reales de ese año */}
      <svg x="596" y="34" width="160" height="128" viewBox="150 0 500 300" preserveAspectRatio="xMidYMid slice">
        <Sky hour={hour} timelapse={timelapse} id="win" />
        <City year={year} base={300} t={gestureT} night={sky.night} />
        <SeasonTree x={540} base={300} scale={2.4} season={season(cal.dayOfYear)} t={gestureT} />
        {winter &&
          Array.from({ length: 40 }, (_, k) => (
            <circle key={k} cx={150 + ((hash(k) * 500 + Math.sin(gestureT + k) * 12) % 500)} cy={(hash(k + 3) * 300 + gestureT * 25) % 300} r="3" fill="#fff" opacity="0.85" />
          ))}
      </svg>
      <rect x="596" y="34" width="160" height="128" fill="none" stroke="#fafaf9" strokeWidth="7" />
      <line x1="676" y1="34" x2="676" y2="162" stroke="#fafaf9" strokeWidth="4" />
      <rect x="592.5" y="30.5" width="167" height="135" fill="none" stroke={INK} strokeWidth="1.4" />
      <rect x="599.5" y="37.5" width="153" height="121" fill="none" stroke={INK} strokeWidth="0.9" opacity="0.6" />
      <path d="M582 28 q14 70 4 142 l-8 0 q-6 -70 0 -142Z" fill="#b45309" stroke={INK} strokeWidth="1.6" />
      <path d="M770 28 q-14 70 -4 142 l8 0 q6 -70 0 -142Z" fill="#b45309" stroke={INK} strokeWidth="1.6" />
      <rect x="576" y="22" width="206" height="8" rx="3" fill="#57534e" stroke={INK} strokeWidth="1.4" />

      {/* Biblioteca: los libros cambian de orden cada semana, hay más con los años y falta el que lee */}
      <rect x="378" y="70" width="96" height="120" fill="#6b4423" stroke={INK} strokeWidth="1.6" />
      {[0, 1, 2].map((r) => {
        const week = Math.floor(cal.dayIndex / 7);
        const count = Math.min(9, 5 + Math.floor(years / 6) + r);
        const reading = act?.prop === "book" && !act.walkingFrom;
        return (
          <g key={r}>
            <rect x="382" y={108 + r * 38} width="88" height="4" fill="#4a2f17" />
            {Array.from({ length: count }, (_, b) => {
              if (reading && r === 1 && b === 3) return null;
              const pick = Math.floor(hash(week * 7 + r * 13 + b) * 7);
              const tall = 24 + Math.floor(hash(pick + r) * 7);
              const lean = b === count - 1 && hash(week + r) > 0.5;
              return (
                <rect
                  key={b}
                  x={384 + b * 9.5}
                  y={108 + r * 38 - tall}
                  width="8"
                  height={tall}
                  fill={["#be123c", "#1d4ed8", "#15803d", "#a16207", "#7c3aed", "#0f766e", "#ea580c"][pick]}
                  stroke={INK}
                  strokeWidth="0.5"
                  transform={lean ? `rotate(14 ${392 + b * 9.5} ${108 + r * 38})` : undefined}
                />
              );
            })}
          </g>
        );
      })}
      {/* Estante con las urnas de las mascotas que ya murieron */}
      <rect x="190" y="146" width="62" height="5" fill="#78350f" stroke={INK} strokeWidth="1.6" />
      <path d="M196 151 l6 8 M246 151 l-6 8" stroke={INK} strokeWidth="3.4" />
      <path d="M196 151 l6 8 M246 151 l-6 8" stroke="#78350f" strokeWidth="2" />
      {petUrns(years).map((p, i) => (
        <g key={p.name} transform={`translate(${202 + i * 20} 146)`}>
          <path d="M-5 0 q-2 -8 1 -12 h8 q3 4 1 12Z" fill={["#475569", "#7c2d12", "#1e3a8a"][i]} stroke={INK} strokeWidth="0.8" />
          <rect x="-3.5" y="-15" width="7" height="3" rx="1" fill="#94a3b8" stroke={INK} strokeWidth="0.6" />
          <text x="0" y="-18" fontSize="4.5" textAnchor="middle" fill="#44403c">{p.name}</text>
          {loss?.name === p.name && <circle cx="0" cy="-7" r="9" fill="#fde68a" opacity={0.25 + 0.1 * Math.sin(gestureT * 2)} />}
        </g>
      ))}

      {/* Foto de Tomás con traje de vuelo y fecha */}
      <rect x="262" y="64" width="46" height="56" fill="#fef3c7" stroke="#78350f" strokeWidth="4" />
      <circle cx="285" cy="84" r="9" fill="#f2c9a0" stroke={INK} strokeWidth="0.8" />
      <path d="M276 82 q9 -12 18 0" fill="#3a2618" stroke={INK} strokeWidth="0.8" />
      <rect x="273" y="95" width="24" height="20" rx="3" fill="#3f5873" stroke={INK} strokeWidth="0.8" />
      <rect x="290" y="99" width="5" height="4" fill="#f97316" />
      {tech.level === 0 ? (
        <g>
          <rect x="488" y="58" width="66" height="58" fill="#f8fafc" stroke={INK} strokeWidth="1.6" />
          <rect x="488" y="58" width="66" height="15" fill="#dc2626" stroke={INK} strokeWidth="1.6" />
          <text x="521" y="102" fontSize="17" textAnchor="middle" fill="#0f172a" fontWeight="bold">{year}</text>
        </g>
      ) : (
        <g>
          <rect x="488" y="62" width="68" height="40" rx="4" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
          <text x="522" y="88" fontSize="16" textAnchor="middle" fill="#67e8f9" fontWeight="bold">{year}</text>
        </g>
      )}

      {/* Lámpara */}
      <line x1="340" y1="0" x2="340" y2="34" stroke="#44403c" strokeWidth="2" />
      <path d="M322 50 L358 50 L350 34 L330 34Z" fill="#fef3c7" stroke={INK} strokeWidth="1.6" />
      {lamp > 0.4 && <ellipse cx="340" cy="140" rx="140" ry="110" fill="#fde68a" opacity={lamp * 0.13} />}

      {/* Cama */}
      <rect x="34" y={GROUND - 76} width="12" height="76" rx="3" fill="#7c4a24" stroke={INK} strokeWidth="1.6" />
      <rect x="170" y={GROUND - 44} width="10" height="44" rx="3" fill="#7c4a24" stroke={INK} strokeWidth="1.6" />
      <rect x="44" y={GROUND - 40} width="130" height="20" rx="4" fill="#f8fafc" stroke={INK} strokeWidth="1.6" />
      <rect x="40" y={GROUND - 22} width="138" height="16" fill="#92400e" stroke={INK} strokeWidth="1.6" />
      {!asleep && !ghosts && <path d={`M80 ${GROUND - 40} q40 -8 92 0 l0 18 l-92 0Z`} fill="#3b82f6" stroke={INK} strokeWidth="1.6" />}

      {party && <Balloons x={334} base={GROUND - 54} t={gestureT} />}

      {/* Mesa */}
      <rect x="244" y={GROUND - 54} width="96" height="8" rx="2" fill="#a16207" stroke={INK} strokeWidth="1.6" />
      <rect x="286" y={GROUND - 46} width="9" height="46" fill="#854d0e" stroke={INK} strokeWidth="1.6" />
      <ellipse cx="300" cy={GROUND - 57} rx="11" ry="3" fill="#f8fafc" stroke={INK} strokeWidth="1.6" />
      <rect x="318" y={GROUND - 66} width="8" height="11" rx="1.5" fill="#f87171" stroke={INK} strokeWidth="1.6" />
      {party && (
        <g transform={`translate(272 ${GROUND - 56})`}>
          <rect x="-12" y="-12" width="24" height="12" rx="2" fill="#fbcfe8" stroke={INK} strokeWidth="1.6" />
          <rect x="-12" y="-12" width="24" height="3" fill="#f472b6" />
          {[-6, 0, 6].map((cx) => (
            <g key={cx}>
              <rect x={cx - 1} y="-19" width="2" height="7" fill="#60a5fa" />
              <ellipse cx={cx} cy={-21 + Math.sin(gestureT * 9 + cx) * 0.6} rx="1.4" ry="2.4" fill="#fbbf24" />
            </g>
          ))}
        </g>
      )}

      {/* Escritorio con la tecnología de la época */}
      <rect x="446" y={GROUND - 56} width="112" height="8" rx="2" fill="#57534e" stroke={INK} strokeWidth="1.6" />
      <rect x="540" y={GROUND - 48} width="10" height="48" fill="#44403c" stroke={INK} strokeWidth="1.6" />
      <rect x="452" y={GROUND - 48} width="10" height="48" fill="#44403c" stroke={INK} strokeWidth="1.6" />
      <DeskScreen
        kind={tech.screen}
        mode={asleep || ghosts ? (sky.night > 0.6 && !timelapse ? "off" : ghosts ? "work" : "idle") : act?.label.includes("mensaje") ? "call" : act?.label === "Jugando en el PC" && !act.walkingFrom ? "game" : act?.pose === "type" ? "work" : sky.night > 0.6 ? "off" : "idle"}
        t={gestureT}
        age={age}
      />

      {/* Telescopio y planta */}
      <g stroke={INK} strokeWidth="2.5">
        <line x1="700" y1={GROUND} x2="714" y2={GROUND - 64} />
        <line x1="730" y1={GROUND} x2="714" y2={GROUND - 64} />
      </g>
      <rect x="696" y={GROUND - 74} width="46" height="9" rx="3" fill="#1e293b" stroke={INK} strokeWidth="1.4" transform={`rotate(-30 714 ${GROUND - 68})`} />
      <path d={`M760 ${GROUND} l-6 -26 l28 0 l-6 26Z`} fill="#c2410c" stroke={INK} strokeWidth="1.6" />
      {[-30, -10, 10, 30].map((r, i) => (
        <ellipse key={i} cx="768" cy={GROUND - 40} rx="5" ry="15" fill="#16a34a" stroke={INK} strokeWidth="0.8" transform={`rotate(${r} 768 ${GROUND - 28})`} />
      ))}

      {christmas && (
        <g transform={`translate(600 ${GROUND})`}>
          <rect x="-4" y="-12" width="8" height="12" fill="#78350f" stroke={INK} strokeWidth="1.2" />
          {[0, 1, 2].map((k) => (
            <path key={k} d={`M${-26 + k * 6} ${-12 - k * 22} L0 ${-44 - k * 22} L${26 - k * 6} ${-12 - k * 22}Z`} fill="#15803d" stroke={INK} strokeWidth="1" />
          ))}
          <path d="M0 -84 l3 6 l6 1 l-5 4 l2 6 l-6 -3 l-6 3 l2 -6 l-5 -4 l6 -1Z" fill="#facc15" stroke={INK} strokeWidth="0.6" />
          {Array.from({ length: 12 }, (_, k) => (
            <circle key={k} cx={(hash(k) - 0.5) * (40 - (k % 3) * 10)} cy={-18 - (k % 3) * 22 - hash(k + 4) * 10} r="2" fill={["#ef4444", "#facc15", "#38bdf8", "#f472b6"][(k + Math.floor(gestureT * 2)) % 4]} />
          ))}
          <rect x="-30" y="-10" width="14" height="10" fill="#dc2626" stroke={INK} strokeWidth="1.6" />
          <rect x="14" y="-8" width="12" height="8" fill="#2563eb" stroke={INK} strokeWidth="1.6" />
        </g>
      )}
      {/* Sillón de lectura frente a la biblioteca */}
      <g stroke={INK} strokeWidth="1">
        <rect x="336" y={GROUND - 80} width="16" height="80" rx="6" fill="#991b1b" />
        <rect x="340" y={GROUND - 34} width="58" height="16" rx="5" fill="#b91c1c" />
        <rect x="392" y={GROUND - 46} width="10" height="46" rx="4" fill="#991b1b" />
        <rect x="344" y={GROUND - 18} width="6" height="18" fill="#451a03" />
      </g>
      {/* Sillas */}
      {[0.36 * W - 30, 0.6 * W - 30].map((cx) => (
        <g key={cx} fill="#7c4a24" stroke={INK} strokeWidth="0.8">
          <rect x={cx - 14} y={GROUND - 28} width="28" height="5" />
          <rect x={cx - 14} y={GROUND - 64} width="5" height="64" />
          <rect x={cx + 9} y={GROUND - 28} width="4" height="28" />
        </g>
      ))}

      {/* Monitor cardíaco sobre la cabecera: la señal avanza y el pulso parpadea */}
      {nearDeath && asleep && (() => {
        const pts = Array.from({ length: 41 }, (_, i) => {
          const ph = (((i / 40) * 2 - gestureT * 0.9) % 1 + 1) % 1;
          const y = ph > 0.42 && ph < 0.45 ? -9 : ph >= 0.45 && ph < 0.48 ? 5 : ph > 0.6 && ph < 0.68 ? -2 : 0;
          return `${58 + i},${GROUND - 64 + y}`;
        }).join(" ");
        const beat = ((gestureT * 0.9) % 0.5) < 0.08;
        return (
          <g>
            <rect x="54" y={GROUND - 86} width="64" height="36" rx="4" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
            <polyline points={pts} fill="none" stroke="#22c55e" strokeWidth="1.4" />
            <text x="102" y={GROUND - 76} fontSize="7" fill={beat ? "#f87171" : "#fca5a5"} fontFamily="monospace">♥</text>
            <text x="100" y={GROUND - 54} fontSize="6" fill="#86efac" fontFamily="monospace" textAnchor="end">{58 + Math.round(Math.sin(gestureT * 0.2) * 3)}</text>
          </g>
        );
      })()}

      {/* Cumpleaños: guirnalda colgada de lado a lado, delante de la biblioteca (por debajo de los paneles) */}
      {party && <Bunting x0={262} x1={580} y={112} t={gestureT} text={`¡FELIZ CUMPLE ${Math.floor(age)}!`} />}

      {/* Martín */}
      {ghosts ? (
        <>
          <Sleeper x={46} y={GROUND - 40} length={128} age={age} t={gestureT} opacity={0.35} />
          <Person x={0.6 * W - 30} y={GROUND} age={age} pose="type" t={gestureT} opacity={0.4} />
          <Person x={0.36 * W - 30} y={GROUND} age={age} pose="eat" t={gestureT} opacity={0.4} />
          <Person x={0.84 * W - 18} y={GROUND} age={age} pose="lookUp" t={gestureT} opacity={0.35} />
        </>
      ) : asleep ? (
        <>
          <Sleeper x={46} y={GROUND - 40} length={128} age={age} t={gestureT} frail={dying} />
          {nearDeath && (
            <g>
              <line x1="190" y1={GROUND} x2="190" y2={GROUND - 112} stroke="#94a3b8" strokeWidth="2.5" />
              <line x1="180" y1={GROUND} x2="200" y2={GROUND} stroke="#94a3b8" strokeWidth="3" />
              <path d={`M182 ${GROUND - 112} h16`} stroke="#94a3b8" strokeWidth="2" />
              <rect x="184" y={GROUND - 110} width="12" height="18" rx="4" fill="#e0f2fe" stroke={INK} strokeWidth="0.8" opacity="0.9" />
              <circle cx="190" cy={GROUND - 86 + ((gestureT * 1.5) % 1) * 6} r="0.9" fill="#38bdf8" />
              <path d={`M190 ${GROUND - 92} C188 ${GROUND - 70} 120 ${GROUND - 70} 100 ${GROUND - 52}`} stroke="#bae6fd" strokeWidth="0.9" fill="none" />
            </g>
          )}
        </>
      ) : act ? (
        <Person
          x={px - (act.pose === "type" || act.pose === "eat" ? 30 : act.pose === "lookUp" ? 18 : act.pose === "water" ? 12 : 0)}
          y={GROUND}
          age={age}
          pose={act.pose}
          t={act.pose === "walk" ? walkClock(walked, age) : act.pose === "guitar" ? gestureT * (0.6 + guitar.skill) : gestureT}
          facing={facing}
          prop={act.prop}
          mood={mood}
          skill={guitar.skill}
        />
      ) : null}
      {act?.pose === "guitar" && !ghosts && !asleep && <MusicNotes x={px + 26} y={GROUND - 64} t={gestureT} skill={guitar.skill} />}
      {/* Visita de la familia: un adulto y, cuando Martín ya es abuelo, nietos corriendo */}
      {(act?.label === "Visita de la familia" || (party && !asleep)) && !ghosts && (
        <>
          <Person x={520} y={GROUND} age={Math.max(28, age - 30)} pose="wave" t={gestureT + 2} facing={-1} color="#be185d" mood={party ? "joy" : undefined} />
          {party && <Person x={570} y={GROUND} age={Math.max(30, age - 2)} pose="wave" t={gestureT + 4.5} facing={-1} color="#0e7490" mood="joy" />}
          {age >= 60 &&
            [0, 1].map((k) => {
              const ph = gestureT * (0.35 + k * 0.1) + k * 2;
              const kx = 300 + Math.sin(ph) * 150;
              return <Person key={k} x={kx} y={GROUND} age={7 + k * 2} pose="run" t={gestureT * 1.4 + k} scale={0.58} facing={Math.cos(ph) >= 0 ? 1 : -1} color={k ? "#16a34a" : "#f59e0b"} />;
            })}
        </>
      )}
      {/* El perro de la casa */}
      {dog && (
        <Dog
          x={dogX}
          state={dogState}
          t={gestureT}
          facing={dogFacing}
          color={dog.color}
          scale={dog.scale}
          old={dog.old}
        />
      )}
      {cat && <Cat years={years} hour={hour} t={gestureT} color={cat.color} old={cat.left < 2.5} martinAtArmchair={act?.place === 0.46 && !act.walkingFrom} asleep={asleep} />}
      {party && <Confetti t={gestureT} />}
      {/* Robot cuidador del futuro: en primer plano, recorre el piso y acompaña a Martín junto a la cama */}
      {showRobot && (() => {
        const ft = Number.isFinite(props.fastT) ? props.fastT : gestureT;
        const robotAt = (rt: number) => {
          const roam = Math.sin(rt * 0.22);
          // Como enfermera se queda cerca de Martín; si no, recorre la casa.
          const rx = dying || (nearDeath && asleep) ? 214 : nearDeath ? Math.min(560, Math.max(220, px + 60)) : 420 + roam * 190;
          const dir = dying ? -1 : Math.cos(rt * 0.22) >= 0 ? 1 : -1;
          const bob = Math.sin(rt * 4) * 1.2;
          const arm = dying ? -36 + Math.sin(rt * 1.5) * 4 : -30 + Math.sin(rt * 2.5) * 8;
          return { rx, dir, bob, arm };
        };
        return [robotAt(ft)].map(({ rx, dir, bob, arm }, i) => (
          <g key={i} transform={`translate(${rx} ${GROUND + 14}) scale(${dir * 1.05} 1.05)`}>
            <ellipse cx="0" cy="-2" rx="16" ry="4" fill="#00000033" />
            <rect x="-12" y={-52 + bob} width="24" height="36" rx="8" fill="#e2e8f0" stroke={INK} strokeWidth="1.6" />
            <rect x="-10" y={-74 + bob} width="20" height="18" rx="6" fill="#f8fafc" stroke={INK} strokeWidth="1.6" />
            <rect x="-6" y={-69 + bob} width="12" height="5" rx="2" fill="#0ea5e9" opacity={0.6 + 0.4 * Math.sin(ft * 3)} />
            <line x1="0" y1={-74 + bob} x2="0" y2={-82 + bob} stroke={INK} strokeWidth="1.5" />
            <circle cx="0" cy={-83 + bob} r="2" fill="#f43f5e" opacity={(Math.floor(ft * 2) % 2) ? 1 : 0.3} />
            <ellipse cx="0" cy="-10" rx="14" ry="8" fill="#94a3b8" stroke={INK} strokeWidth="1.6" />
            <line x1="10" y1={-44 + bob} x2="24" y2={arm + bob} stroke={INK} strokeWidth="3" strokeLinecap="round" />
            {nearDeath ? (
              <>
                {/* Robot enfermera: cofia y cruz roja, con un vaso de remedios */}
                <path d={`M-9 ${-75 + bob} L9 ${-75 + bob} L6 ${-82 + bob} L-6 ${-82 + bob}Z`} fill="#fff" stroke={INK} strokeWidth="0.8" />
                <path d={`M-1.5 ${-81 + bob} h3 v1.5 h1.5 v3 h-1.5 v1.5 h-3 v-1.5 h-1.5 v-3 h1.5Z`} fill="#dc2626" />
                <path d={`M-3 ${-40 + bob} h6 v4 h4 v6 h-4 v4 h-6 v-4 h-4 v-6 h4Z`} fill="#dc2626" />
                <rect x="20" y={arm + bob - 7} width="7" height="8" rx="1.5" fill="#fff" stroke={INK} strokeWidth="0.6" />
                <circle cx="22" cy={arm + bob - 5} r="1.2" fill="#f472b6" />
                <circle cx="25" cy={arm + bob - 3} r="1.2" fill="#60a5fa" />
              </>
            ) : (
              !dying && <rect x="20" y={arm + bob - 6} width="9" height="7" rx="1.5" fill="#fbbf24" stroke={INK} strokeWidth="0.6" />
            )}
          </g>
        ));
      })()}
    </>
  );
}

/** Un familiar llega caminando, se arrodilla a dejar flores, se queda un momento y se va. */
/** Guirnalda de banderines con un cartel al centro (cumpleaños). */
export function Bunting({ x0, x1, y, t, text }: { x0: number; x1: number; y: number; t: number; text: string }) {
  const n = 14;
  const colors = ["#f43f5e", "#facc15", "#38bdf8", "#a78bfa", "#4ade80", "#fb923c"];
  const sag = (u: number) => Math.sin(u * Math.PI) * 14 + Math.sin(t * 1.3) * 0.8;
  const mid = (x0 + x1) / 2;
  return (
    <g>
      <path d={`M${x0} ${y} Q${mid} ${y + 28} ${x1} ${y}`} stroke={INK} strokeWidth="1" fill="none" />
      {Array.from({ length: n }, (_, i) => {
        const u = (i + 0.5) / n;
        const x = x0 + (x1 - x0) * u;
        const yy = y + sag(u);
        const sway = Math.sin(t * 2 + i) * 4;
        return <path key={i} d={`M${x - 8} ${yy} L${x + 8} ${yy} L${x + sway * 0.3} ${yy + 16}Z`} fill={colors[i % colors.length]} stroke={INK} strokeWidth="1.2" />;
      })}
      <rect x={mid - 70} y={y + 22} width="140" height="22" rx="5" fill="#fdf2f8" stroke={INK} strokeWidth="1.6" />
      <text x={mid} y={y + 38} fontSize="12" textAnchor="middle" fontWeight="bold" fill="#be185d">{text}</text>
    </g>
  );
}

/** Racimo de globos atados a `x`; con gravedad suben, en ingravidez (`drift`) flotan para cualquier lado. */
export function Balloons({ x, base, t, drift = false }: { x: number; base: number; t: number; drift?: boolean }) {
  const colors = ["#f43f5e", "#38bdf8", "#facc15", "#a78bfa"];
  return (
    <g>
      {colors.map((c, i) => {
        const bx = x + (i - 1.5) * 12 + Math.sin(t * 0.9 + i) * (drift ? 14 : 3);
        const by = base - (drift ? 40 + Math.cos(t * 0.7 + i * 2) * 26 : 62 + (i % 2) * 14 + Math.sin(t * 1.2 + i) * 2);
        return (
          <g key={c}>
            <path d={`M${x} ${base} Q${(x + bx) / 2 + Math.sin(t + i) * 4} ${(base + by) / 2} ${bx} ${by + 11}`} stroke="#e2e8f0" strokeWidth="0.8" fill="none" />
            <ellipse cx={bx} cy={by} rx="8" ry="10" fill={c} stroke={INK} strokeWidth="1.4" />
            <ellipse cx={bx - 3} cy={by - 4} rx="2" ry="3" fill="#fff" opacity="0.5" />
            <path d={`M${bx - 2} ${by + 10} h4 l-2 3Z`} fill={c} stroke={INK} strokeWidth="0.8" />
          </g>
        );
      })}
    </g>
  );
}

/** Papel picado que cae (o flota) por toda la escena. */
export function Confetti({ t, drift = false }: { t: number; drift?: boolean }) {
  const colors = ["#f43f5e", "#facc15", "#38bdf8", "#a78bfa", "#4ade80"];
  return (
    <g pointerEvents="none">
      {Array.from({ length: 40 }, (_, k) => {
        const x = (hash(k) * 800 + Math.sin(t * 1.5 + k) * 16) % 800;
        const y = drift ? 40 + ((hash(k + 5) * 200 + Math.sin(t * 0.5 + k) * 30) % 220) : (hash(k + 5) * 300 + t * (40 + (k % 5) * 10)) % 300;
        return <rect key={k} x={x} y={y} width="4" height="2.4" fill={colors[k % colors.length]} transform={`rotate(${t * 120 + k * 40} ${x + 2} ${y + 1})`} />;
      })}
    </g>
  );
}

function Visitor({ gestureT, age, color }: { gestureT: number; age: number; color: string }) {
  const c = gestureT % 12;
  const ease = (v: number) => Math.min(1, Math.max(0, v));
  if (c < 3) return <Person x={110 + ease(c / 3) * 195} y={GROUND} age={age} pose="walk" t={gestureT} color={color} flowers />;
  if (c < 7.5) return <Person x={305} y={GROUND} age={age} pose="kneel" t={gestureT} color={color} flowers={c < 5.5} />;
  if (c < 9.5) return <Person x={305} y={GROUND} age={age} pose="mourn" t={gestureT} color={color} />;
  return <Person x={305 - ease((c - 9.5) / 2.5) * 220} y={GROUND} age={age} pose="walk" t={gestureT} color={color} facing={-1} />;
}

/** Árbol que cambia con la estación: hojas verdes, otoñales que caen, ramas desnudas con nieve o flores. */
function SeasonTree({ x, base, scale = 1, season: ss, t }: { x: number; base: number; scale?: number; season: Season; t: number }) {
  const canopy = ss === "verano" ? "#15803d" : ss === "otoño" ? "#ea580c" : ss === "primavera" ? "#4ade80" : "none";
  return (
    <g transform={`translate(${x} ${base}) scale(${scale})`}>
      <path d="M0 0 q-2 -20 0 -40 M0 -26 l-12 -12 M0 -32 l10 -10 M0 -38 l-6 -10" stroke={INK} strokeWidth="5.6" fill="none" strokeLinecap="round" />
      <path d="M0 0 q-2 -20 0 -40 M0 -26 l-12 -12 M0 -32 l10 -10 M0 -38 l-6 -10" stroke="#4a3220" strokeWidth="4" fill="none" strokeLinecap="round" />
      {canopy !== "none" && (
        <>
          <circle cx="0" cy="-48" r="18" fill={canopy} stroke={INK} strokeWidth="0.8" />
          <circle cx="-12" cy="-40" r="12" fill={canopy} stroke={INK} strokeWidth="0.8" />
          <circle cx="12" cy="-41" r="12" fill={canopy} stroke={INK} strokeWidth="0.8" />
        </>
      )}
      {ss === "primavera" &&
        Array.from({ length: 12 }, (_, k) => <circle key={k} cx={(hash(k) - 0.5) * 36} cy={-36 - hash(k + 5) * 26} r="2.2" fill="#f9a8d4" />)}
      {ss === "otoño" &&
        Array.from({ length: 6 }, (_, k) => {
          const f = (t * 0.25 + hash(k)) % 1;
          return <ellipse key={k} cx={(hash(k + 2) - 0.5) * 40 + Math.sin(t * 2 + k) * 6} cy={-36 + f * 38} rx="2.4" ry="1.4" fill={k % 2 ? "#f59e0b" : "#b45309"} opacity={1 - f * 0.5} />;
        })}
      {ss === "invierno" && <path d="M-12 -38 l4 -1 M10 -42 l4 -1 M-6 -48 l4 -1" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />}
    </g>
  );
}

/** Mishi, el gato: duerme en la cama, se sube al sillón, mira por la ventana o pasea. */
function Cat({ years, hour, t, color, old, martinAtArmchair, asleep }: { years: number; hour: number; t: number; color: string; old: boolean; martinAtArmchair: boolean; asleep: boolean }) {
  const daySpot = Math.floor(hash(Math.floor(years * 365.25 * 4)) * 3); // cambia de sitio cada 6 h
  let x = 150;
  let y = GROUND - 40;
  let state: "loaf" | "sit" | "walk" = "loaf";
  if (asleep || hour < 7 || hour >= 22) {
    x = 150;
    y = GROUND - 40;
  } else if (martinAtArmchair) {
    x = 344;
    y = GROUND - 80;
  } else if (daySpot === 0) {
    x = 640;
    y = 162;
    state = "sit";
  } else if (daySpot === 1) {
    x = 300 + Math.sin(t * 0.3) * 120;
    y = GROUND;
    state = "walk";
  } else {
    x = 560;
    y = GROUND + 6;
  }
  const facing = state === "walk" && Math.cos(t * 0.3) < 0 ? -1 : 1;
  const step = state === "walk" ? Math.sin(t * 7) * 18 : 0;
  const tail = Math.sin(t * (old ? 1 : 2)) * 15;
  return (
    <g transform={`translate(${x} ${y}) scale(${facing * 0.9} 0.9)`}>
      {state === "walk" &&
        [-7, 6].map((bx, i) => (
          <line key={bx} x1={bx} y1="-8" x2={bx + Math.sin(((i ? 1 : -1) * step * Math.PI) / 180) * 6} y2="0" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
        ))}
      <path d={`M-10 ${state === "sit" ? -6 : -7} q-10 ${-4 + tail / 4} -8 -14`} stroke={INK} strokeWidth="4.6" fill="none" strokeLinecap="round" transform={`rotate(${tail} -10 -7)`} />
      <path d={`M-10 ${state === "sit" ? -6 : -7} q-10 ${-4 + tail / 4} -8 -14`} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" transform={`rotate(${tail} -10 -7)`} />
      <ellipse cx="0" cy={state === "sit" ? -10 : -7} rx={state === "sit" ? 8 : 11} ry={state === "sit" ? 9 : 6} fill={color} stroke={INK} strokeWidth="1.4" />
      {[-4, 0, 4].map((sx) => <path key={sx} d={`M${sx} ${state === "sit" ? -17 : -12} v5`} stroke="#6b7280" strokeWidth="1" />)}
      <g transform={`translate(${state === "sit" ? 3 : 10} ${state === "sit" ? -21 : -13})`}>
        <circle r="6" fill={color} stroke={INK} strokeWidth="1.4" />
        <path d="M-5 -3 l1 -6 l3 4Z M2 -4 l3 -5 l1 6Z" fill={color} stroke={INK} strokeWidth="0.8" />
        {state === "loaf" ? <path d="M1 0 q1.5 1 3 0" stroke={INK} strokeWidth="0.8" fill="none" /> : <circle cx="3" cy="-0.5" r="1" fill="#16a34a" />}
        <path d="M6 1.5 l4 -1 M6 2.5 l4 1" stroke={INK} strokeWidth="0.4" />
      </g>
      {state === "loaf" && <text x="-4" y={-18 - ((t * 3) % 6)} fontSize="5" fill="#e2e8f0" opacity="0.7">z</text>}
    </g>
  );
}

type DogState = "walk" | "sit" | "lie" | "play";

/** Perro de perfil: camina, se sienta, se echa o juega; mueve la cola. */
function Dog({ x, state, t, facing, color, scale, old }: { x: number; state: DogState; t: number; facing: 1 | -1; color: string; scale: number; old: boolean }) {
  const moving = state === "walk" || state === "play";
  const legSwing = moving ? Math.sin(t * (state === "play" ? 9 : 6)) * 22 : 0;
  const hop = state === "play" ? Math.abs(Math.sin(t * 4.5)) * 6 : 0;
  const wag = Math.sin(t * (old ? 6 : 14)) * 25;
  const lying = state === "lie";
  const sitting = state === "sit";
  const body = lying ? -7 : sitting ? -13 : -16;
  const leg = (bx: number, ph: number) =>
    lying ? (
      <line x1={bx} y1={body + 2} x2={bx + 8} y2={-1} stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
    ) : (
      <g transform={`rotate(${ph} ${bx} ${body + 2})`}>
        <line x1={bx} y1={body + 2} x2={bx} y2={0} stroke={INK} strokeWidth="4.2" strokeLinecap="round" />
        <line x1={bx} y1={body + 2} x2={bx} y2={0} stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      </g>
    );
  return (
    <g transform={`translate(${x} ${GROUND - hop}) scale(${facing * scale} ${scale})`}>
      <ellipse cx="0" cy={hop + 1} rx="16" ry="2.5" fill="#00000030" />
      {leg(-9, sitting ? 0 : -legSwing)}
      {leg(8, legSwing)}
      {/* Cola */}
      <path d={`M-13 ${body - 2} q${-8} ${-6 - wag / 6} ${-8} ${-12}`} stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" transform={`rotate(${wag} -13 ${body - 2})`} />
      <path d={`M-13 ${body - 2} q${-8} ${-6 - wag / 6} ${-8} ${-12}`} stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" transform={`rotate(${wag} -13 ${body - 2})`} />
      {/* Cuerpo y cabeza */}
      <ellipse cx="0" cy={body - (sitting ? 3 : 0)} rx="15" ry="7" fill={color} stroke={INK} strokeWidth="1.5" transform={sitting ? `rotate(-28 0 ${body})` : undefined} />
      <g transform={`translate(${sitting ? 9 : 14} ${body - (sitting ? 14 : 8)})${lying ? " rotate(12)" : ""}`}>
        <ellipse cx="0" cy="0" rx="7.5" ry="6.5" fill={color} stroke={INK} strokeWidth="1.5" />
        <ellipse cx="6" cy="2" rx="4" ry="3" fill={color} stroke={INK} strokeWidth="1" />
        <circle cx="9.5" cy="1.2" r="1.2" fill={INK} />
        {lying && !moving ? <path d="M1 -1.5 q1.5 1 3 0" stroke={INK} strokeWidth="0.9" fill="none" /> : <circle cx="2.5" cy="-1.5" r="1.1" fill={INK} />}
        <path d="M-4 -4 q-3 6 1 9" fill={old ? "#a8a29e" : "#44403c"} stroke={INK} strokeWidth="0.8" />
        {state === "play" && <path d="M6 5 q2 4 4 0" fill="#f43f5e" />}
      </g>
      {lying && <text x="-6" y={body - 14 - ((t * 4) % 6)} fontSize="6" fill="#e2e8f0" opacity="0.7">z</text>}
    </g>
  );
}

type ScreenMode = "work" | "call" | "idle" | "off" | "game";

/** Contenido animado de una pantalla de w×h: código, videollamada, salvapantallas o apagada. */
function ScreenContent({ mode, t, age, w, h, tint }: { mode: ScreenMode; t: number; age: number; w: number; h: number; tint: string }) {
  if (mode === "off") return <rect width={w} height={h} fill="#020617" />;
  if (mode === "idle")
    return (
      <g>
        <rect width={w} height={h} fill="#020617" />
        {Array.from({ length: 14 }, (_, i) => {
          const k = (t * 0.35 + hash(i)) % 1;
          const a = hash(i + 30) * Math.PI * 2;
          return <circle key={i} cx={w / 2 + Math.cos(a) * k * w * 0.6} cy={h / 2 + Math.sin(a) * k * h * 0.6} r={0.3 + k * 0.9} fill="#fff" opacity={k} />;
        })}
      </g>
    );
  if (mode === "game") {
    // Juego de plataformas: el héroe salta los obstáculos que vienen y junta monedas.
    const speed = 14;
    const scroll = t * speed;
    const groundY = h * 0.78;
    const gap = w * 0.55;
    const obstacles = [0, 1, 2].map((i) => ((i * gap - scroll) % (gap * 3) + gap * 3) % (gap * 3) - w * 0.2);
    const heroX = w * 0.25;
    // Salta cuando un obstáculo se acerca (arco parabólico).
    const near = obstacles.map((ox) => ox - heroX).filter((d) => d > -4 && d < 9);
    const jump = near.length ? Math.sin(((9 - near[0]) / 13) * Math.PI) * h * 0.32 : 0;
    const run = Math.floor(t * 8) % 2;
    const score = Math.floor(t * 37) % 100000;
    // Un svg anidado recorta el juego al borde de la pantalla.
    return (
      <svg width={w} height={h} overflow="hidden">
        <rect width={w} height={h} fill="#1e3a8a" />
        <rect width={w} height={h * 0.45} fill="#3b82f6" />
        {/* Montañas y nubes con paralaje */}
        {[0, 1, 2].map((i) => {
          const mx = ((i * w * 0.5 - scroll * 0.3) % (w * 1.5) + w * 1.5) % (w * 1.5) - w * 0.25;
          return <path key={i} d={`M${mx} ${groundY} l${w * 0.18} ${-h * 0.32} l${w * 0.18} ${h * 0.32}Z`} fill="#1d4ed8" opacity="0.8" />;
        })}
        {[0, 1].map((i) => {
          const cx = ((i * w * 0.6 - scroll * 0.15) % (w * 1.2) + w * 1.2) % (w * 1.2) - w * 0.1;
          return <ellipse key={i} cx={cx} cy={h * 0.2 + i * 3} rx="4" ry="1.6" fill="#e0f2fe" />;
        })}
        {/* Suelo de ladrillos */}
        <rect y={groundY} width={w} height={h - groundY} fill="#a16207" />
        {Array.from({ length: Math.ceil(w / 4) + 2 }, (_, i) => (
          <rect key={i} x={i * 4 - (scroll % 4)} y={groundY} width="3.6" height="1.2" fill="#ca8a04" />
        ))}
        {/* Monedas */}
        {[0, 1, 2].map((i) => {
          const cx = ((i * w * 0.4 + w * 0.2 - scroll) % (w * 1.2) + w * 1.2) % (w * 1.2);
          return cx > heroX + 1 ? <ellipse key={i} cx={cx} cy={groundY - h * 0.38} rx={0.9 * Math.abs(Math.cos(t * 6 + i))} ry="1.4" fill="#facc15" /> : null;
        })}
        {/* Obstáculos: tubos verdes */}
        {obstacles.map((ox, i) => (
          <g key={i}>
            <rect x={ox} y={groundY - 4} width="3.6" height="4" fill="#16a34a" stroke="#052e16" strokeWidth="0.3" />
            <rect x={ox - 0.5} y={groundY - 5} width="4.6" height="1.4" fill="#22c55e" stroke="#052e16" strokeWidth="0.3" />
          </g>
        ))}
        {/* Héroe pixelado */}
        <g transform={`translate(${heroX} ${groundY - jump})`}>
          <rect x="-1.5" y="-6.5" width="3" height="1.2" fill="#dc2626" />
          <rect x="-1.2" y="-5.4" width="2.6" height="2" fill="#fcd34d" />
          <rect x="-1.4" y="-3.4" width="2.8" height="2.2" fill="#dc2626" />
          <rect x={run && !jump ? -1.6 : -1} y="-1.2" width="1.1" height="1.2" fill="#1e3a8a" />
          <rect x={run && !jump ? 0.6 : 0.1} y="-1.2" width="1.1" height="1.2" fill="#1e3a8a" />
        </g>
        <text x="2" y="4.2" fontSize="3" fill="#fff" fontFamily="monospace">{String(score).padStart(5, "0")}</text>
        <text x={w - 2} y="4.2" fontSize="3" fill="#fde047" fontFamily="monospace" textAnchor="end">♥♥♥</text>
      </svg>
    );
  }
  if (mode === "call") {
    const L = looks(age);
    const talk = Math.abs(Math.sin(t * 8)) * 1.5;
    return (
      <g>
        <rect width={w} height={h} fill="#0c1a33" />
        <circle cx={w * 0.4} cy={h * 0.5} r={h * 0.26} fill={L.skin} stroke="#0f172a" strokeWidth="0.5" />
        <path d={`M${w * 0.4 - h * 0.27} ${h * 0.45} q${h * 0.27} -${h * 0.36} ${h * 0.54} 0`} fill={L.hair} />
        <circle cx={w * 0.36} cy={h * 0.48} r="0.8" fill="#0f172a" />
        <circle cx={w * 0.45} cy={h * 0.48} r="0.8" fill="#0f172a" />
        <ellipse cx={w * 0.405} cy={h * 0.62} rx="1.6" ry={0.4 + talk * 0.5} fill="#7c2d12" />
        <rect x={w * 0.25} y={h * 0.78} width={w * 0.3} height={h * 0.22} rx="2" fill="#2563eb" />
        <circle cx="4" cy="4" r="1.6" fill="#ef4444" opacity={Math.floor(t * 2) % 2 ? 1 : 0.25} />
        <text x="7" y="5.4" fontSize="3.4" fill="#fca5a5" fontFamily="monospace">REC</text>
        {Array.from({ length: 6 }, (_, i) => (
          <rect key={i} x={w * 0.68 + i * 2.2} y={h * 0.5 - (1 + Math.abs(Math.sin(t * 9 + i)) * h * 0.18)} width="1.4" height={2 + Math.abs(Math.sin(t * 9 + i)) * h * 0.36} fill={tint} />
        ))}
        <text x={w * 0.6} y={h * 0.9} fontSize="3" fill="#94a3b8" fontFamily="monospace">→ TOMÁS</text>
      </g>
    );
  }
  // Trabajando: el código se va escribiendo y un gráfico se actualiza.
  const lines = 7;
  const typed = (t * 2.2) % (lines + 2);
  return (
    <g>
      <rect width={w} height={h} fill="#0b1324" />
      <rect width={w} height="3.4" fill="#1e293b" />
      {[0, 1, 2].map((i) => <circle key={i} cx={2 + i * 2.6} cy="1.7" r="0.8" fill={["#ef4444", "#f59e0b", "#22c55e"][i]} />)}
      {Array.from({ length: lines }, (_, i) => {
        const full = (0.25 + hash(i + 3) * 0.35) * w;
        const len = i < Math.floor(typed) ? full : i === Math.floor(typed) ? full * (typed % 1) : 0;
        return (
          <g key={i}>
            <rect x={2 + (i % 3) * 2} y={5.5 + i * 3.1} width={Math.max(0, len)} height="1.4" rx="0.5" fill={["#7dd3fc", "#c4b5fd", "#86efac", "#fcd34d"][i % 4]} opacity="0.85" />
            {i === Math.floor(typed) && Math.floor(t * 3) % 2 === 0 && <rect x={2 + (i % 3) * 2 + len + 0.6} y={5.2 + i * 3.1} width="1" height="2" fill="#f8fafc" />}
          </g>
        );
      })}
      <g transform={`translate(${w * 0.68} 6)`}>
        <rect width={w * 0.28} height={h - 9} fill="#020617" stroke="#334155" strokeWidth="0.4" />
        {Array.from({ length: 5 }, (_, i) => {
          const bh = (0.3 + 0.6 * Math.abs(Math.sin(t * 1.3 + i * 0.9))) * (h - 11);
          return <rect key={i} x={1 + i * (w * 0.052)} y={h - 10 - bh} width={w * 0.04} height={bh} fill={tint} opacity="0.8" />;
        })}
      </g>
    </g>
  );
}

/** Pantalla del escritorio según la tecnología de la época. */
function DeskScreen({ kind, mode, t, age }: { kind: "monitor" | "glass" | "hologram"; mode: ScreenMode; t: number; age: number }) {
  if (kind === "monitor")
    return (
      <g>
        <rect x="496" y={GROUND - 96} width="52" height="36" rx="3" fill="#0f172a" stroke={INK} strokeWidth="1.5" />
        <g transform={`translate(500 ${GROUND - 92})`}>
          <ScreenContent mode={mode} t={t} age={age} w={44} h={28} tint="#38bdf8" />
        </g>
        <rect x="518" y={GROUND - 60} width="8" height="4" fill="#334155" />
        <circle cx="544" cy={GROUND - 62} r="0.9" fill={mode === "off" ? "#f59e0b" : "#22c55e"} />
      </g>
    );
  if (kind === "glass")
    return (
      <g>
        <g transform={`translate(496 ${GROUND - 102})`} opacity="0.92">
          <ScreenContent mode={mode} t={t} age={age} w={54} h={40} tint="#22d3ee" />
        </g>
        <rect x="494" y={GROUND - 104} width="58" height="44" rx="6" fill="#bae6fd22" stroke="#e0f2fe" strokeWidth="1.5" />
        <rect x="518" y={GROUND - 60} width="10" height="4" rx="1" fill="#94a3b8" />
      </g>
    );
  // Holograma: un haz de luz proyecta el contenido en el aire.
  const on = mode !== "off";
  const spin = t * 0.8;
  return (
    <g>
      <ellipse cx="520" cy={GROUND - 58} rx="18" ry="3" fill={on ? "#22d3ee" : "#0e7490"} />
      {on && (
        <>
          <path d={`M504 ${GROUND - 58} L494 ${GROUND - 118} L546 ${GROUND - 118} L536 ${GROUND - 58}Z`} fill="#22d3ee" opacity="0.13" />
          {mode === "game" ? (
            <g transform={`translate(498 ${GROUND - 114})`} opacity="0.75">
              <ScreenContent mode="game" t={t} age={age} w={44} h={30} tint="#22d3ee" />
            </g>
          ) : mode === "call" ? (
            <g opacity="0.85" stroke="#67e8f9" fill="none" strokeWidth="1.2">
              <circle cx="520" cy={GROUND - 98} r="8" />
              <path d={`M508 ${GROUND - 66} q12 -22 24 0`} />
              <ellipse cx="520" cy={GROUND - 94} rx="2.2" ry={0.5 + Math.abs(Math.sin(t * 8))} />
            </g>
          ) : mode === "work" ? (
            <g opacity="0.85">
              {Array.from({ length: 3 }, (_, i) => (
                <rect key={i} x={500 + i * 3} y={GROUND - 112 + i * 14} width="36" height="11" fill="none" stroke="#67e8f9" strokeWidth="0.8" transform={`skewX(${-8 + i * 4})`} />
              ))}
              <path d={`M502 ${GROUND - 80} l8 ${-6 * Math.sin(t)} l8 ${4 * Math.cos(t * 1.3)} l8 -6 l8 ${3 * Math.sin(t * 2)}`} stroke="#a5f3fc" strokeWidth="1.2" fill="none" />
            </g>
          ) : (
            <g opacity="0.85">
              <circle cx="520" cy={GROUND - 90} r="10" fill="none" stroke="#67e8f9" strokeWidth="1.5" />
              <ellipse cx="520" cy={GROUND - 90} rx={10 * Math.abs(Math.cos(spin))} ry="10" fill="none" stroke="#67e8f9" strokeWidth="0.8" />
              <ellipse cx="520" cy={GROUND - 90} rx="17" ry="5" fill="none" stroke="#a5f3fc" opacity="0.6" transform={`rotate(${Math.sin(spin) * 10} 520 ${GROUND - 90})`} />
              <circle cx={520 + Math.cos(spin * 2) * 17} cy={GROUND - 90 + Math.sin(spin * 2) * 5} r="1.6" fill="#f0abfc" />
            </g>
          )}
        </>
      )}
    </g>
  );
}

/** Estado de la tumba según los años desde la muerte: visitas, flores y abandono. */
function Grave({ since, deathYears, gestureT, timelapse, extraVisitor }: { since: number; deathYears: number; gestureT: number; timelapse: boolean; extraVisitor?: React.ReactNode }) {
  const funeral = since < 0.04;
  // Visitas frecuentes al principio que se apagan en ~10 años.
  const visitP = since < 10 ? 0.9 * (1 - since / 10) ** 1.4 : 0;
  const week = Math.floor(since * 52);
  const visitorNow = !funeral && hash(week) < visitP;
  const decay = Math.min(1, Math.max(0, (since - 10) / 60));
  const freshFlowers = funeral ? 6 : Math.round(5 * visitP);
  const deadFlowers = since >= 10 && since < 16 ? 3 : 0;
  const stone = `rgb(${Math.round(150 - decay * 55)},${Math.round(146 - decay * 50)},${Math.round(140 - decay * 50)})`;
  const tilt = decay * 11;
  const deathYear = LAUNCH_YEAR + Math.floor(deathYears);
  const visitors = [
    { age: 60, color: "#4c1d95" },
    { age: 34, color: "#0f766e" },
    { age: 12, color: "#be185d" },
    { age: 88, color: "#44403c" },
  ];
  const who = visitors[week % visitors.length];
  // Clima del día: llueve más en invierno (austral) y casi nada en verano.
  const day = calendar(deathYears + since);
  const rainChance = { invierno: 0.5, otoño: 0.32, primavera: 0.22, verano: 0.07 }[season(day.dayOfYear)];
  const rain = !timelapse && hash(day.dayIndex * 7.13) < rainChance ? 0.5 + hash(day.dayIndex + 3) * 0.5 : 0;
  return (
    <g>
      {/* Día de lluvia: cielo encapotado y nubes oscuras */}
      {rain > 0 && (
        <>
          <rect width={W} height={GROUND} fill="#1e293b" opacity={0.25 + rain * 0.25} />
          {Array.from({ length: 7 }, (_, k) => (
            <ellipse key={k} cx={((k * 140 + gestureT * 6) % 960) - 80} cy={18 + (k % 3) * 14} rx={90 + (k % 2) * 30} ry={22 + (k % 3) * 5} fill="#475569" opacity={0.55 + rain * 0.3} />
          ))}
        </>
      )}
      {/* Reja al fondo del cementerio */}
      <g stroke={decay > 0.5 ? "#7c2d12" : "#334155"} strokeWidth="2">
        <line x1="0" y1={GROUND - 62} x2={W} y2={GROUND - 62} />
        <line x1="0" y1={GROUND - 44} x2={W} y2={GROUND - 44} strokeWidth="1.5" />
        {Array.from({ length: 41 }, (_, i) => (
          <line key={i} x1={i * 20} y1={GROUND - 68} x2={i * 20} y2={GROUND - 38} />
        ))}
      </g>
      {/* Otras tumbas, delante de la reja */}
      {[90, 170, 560, 650, 730].map((x, i) => (
        <g key={i}>
          <ellipse cx={x + 12} cy={GROUND - 7} rx="16" ry="3" fill="#00000030" />
          <path d={`M${x} ${GROUND - 8} v-34 q0 -12 12 -12 q12 0 12 12 v34Z`} fill="#a8a29e" stroke={INK} strokeWidth="1" />
          <path d={`M${x + 12} ${GROUND - 44} v12 M${x + 7} ${GROUND - 39} h10`} stroke="#57534e" strokeWidth="1.5" />
        </g>
      ))}
      {/* Árbol que crece */}
      <path d={`M600 ${GROUND - 4} q-4 -60 4 -120`} stroke="#4a3220" strokeWidth={10 + Math.min(10, since / 8)} fill="none" />
      {(() => {
        const ss = season(calendar(deathYears + since).dayOfYear);
        const leaf = ss === "verano" ? ["#166534", "#15803d"] : ss === "otoño" ? ["#c2410c", "#ea580c"] : ss === "primavera" ? ["#16a34a", "#4ade80"] : null;
        return leaf ? (
          <>
            <circle cx="604" cy={GROUND - 130} r={34 + Math.min(30, since / 3)} fill={leaf[0]} stroke={INK} strokeWidth="1.6" />
            <circle cx="574" cy={GROUND - 110} r={22 + Math.min(18, since / 5)} fill={leaf[1]} stroke={INK} strokeWidth="1.6" />
            {ss === "primavera" && Array.from({ length: 14 }, (_, k) => <circle key={k} cx={574 + hash(k) * 64} cy={GROUND - 160 + hash(k + 3) * 70} r="2.4" fill="#f9a8d4" />)}
          </>
        ) : (
          <path d={`M604 ${GROUND - 110} l-26 -30 M604 ${GROUND - 118} l22 -34 M604 ${GROUND - 124} l-6 -36`} stroke="#4a3220" strokeWidth="5" strokeLinecap="round" />
        );
      })()}

      {/* La tumba */}
      <g transform={`rotate(${tilt} 380 ${GROUND - 4})`}>
        <path d={`M352 ${GROUND - 4} v-64 q0 -22 28 -22 q28 0 28 22 v64Z`} fill={stone} stroke={INK} strokeWidth="1.4" />
        <g opacity={1 - decay * 0.8} fill="#292524" textAnchor="middle">
          <text x="380" y={GROUND - 60} fontSize="10" fontWeight="bold">{EARTH_NAME}</text>
          <text x="380" y={GROUND - 46} fontSize="8">2000 – {deathYear}</text>
          {decay < 0.6 && (
            <text x="380" y={GROUND - 33} fontSize="6" fontStyle="italic">
              <tspan x="380">Hermano</tspan>
              <tspan x="380" dy="7">que esperó</tspan>
            </text>
          )}
        </g>
        {decay > 0.35 && <path d={`M372 ${GROUND - 88} l6 14 l-5 8 l7 16`} stroke="#292524" strokeWidth="1.2" fill="none" />}
        {decay > 0.15 && (
          <g fill="#4d7c0f" opacity={decay}>
            <ellipse cx="360" cy={GROUND - 10} rx={8 + decay * 8} ry="5" />
            <ellipse cx="398" cy={GROUND - 72} rx={4 + decay * 6} ry="3" />
            <ellipse cx="366" cy={GROUND - 80} rx={3 + decay * 5} ry="2.5" />
          </g>
        )}
      </g>
      <rect x="342" y={GROUND - 6} width="76" height="8" fill="#78716c" stroke={INK} strokeWidth="1.6" />

      {/* Flores frescas y marchitas */}
      {Array.from({ length: freshFlowers }, (_, i) => (
        <g key={i} transform={`translate(${352 + i * 11} ${GROUND - 6})`}>
          <line x1="0" y1="0" x2={i % 2 ? 2 : -2} y2="-10" stroke="#15803d" strokeWidth="1.4" />
          <circle cx={i % 2 ? 2 : -2} cy="-12" r="3" fill={["#f43f5e", "#facc15", "#f9fafb", "#a855f7"][i % 4]} stroke={INK} strokeWidth="0.5" />
        </g>
      ))}
      {Array.from({ length: deadFlowers }, (_, i) => (
        <path key={i} d={`M${360 + i * 14} ${GROUND - 6} q2 -6 6 -5`} stroke="#78350f" strokeWidth="1.5" fill="#a16207" />
      ))}
      {/* Maleza que crece con el abandono */}
      {Array.from({ length: 40 }, (_, i) => {
        const h = 4 + decay * 26 * hash(i + 3);
        return <line key={i} x1={330 + i * 2.6} y1={GROUND} x2={330 + i * 2.6 + (hash(i) - 0.5) * 6} y2={GROUND - h} stroke="#4d7c0f" strokeWidth="1.6" />;
      })}

      {/* Funeral y visitas */}
      {funeral &&
        [200, 240, 280, 470, 510, 545].map((x, i) => (
          <Person key={i} x={x} y={GROUND} age={20 + ((i * 17) % 60)} pose={i === 2 ? "kneel" : "mourn"} t={gestureT + i} outfit="mourning" facing={x > 380 ? -1 : 1} flowers={i % 2 === 0} />
        ))}
      {!funeral && timelapse && visitP > 0.05 && (
        <>
          <Person x={300} y={GROUND} age={60} pose="mourn" t={gestureT} color="#4c1d95" opacity={visitP * 0.6} flowers />
          <Person x={470} y={GROUND} age={34} pose="mourn" t={gestureT} color="#0f766e" opacity={visitP * 0.5} facing={-1} />
        </>
      )}
      {!funeral && !timelapse && visitorNow && <Visitor gestureT={gestureT} age={who.age + since} color={who.color} />}
      {extraVisitor}
      {rain > 0 && (
        <g pointerEvents="none">
          {/* Charcos con ondas donde caen las gotas */}
          {[150, 420, 650].map((cx, k) => (
            <g key={cx}>
              <ellipse cx={cx} cy={GROUND + 16 + k * 4} rx={34 + k * 6} ry="4" fill="#94a3b8" opacity="0.35" />
              {[0, 1].map((j) => {
                const f = (gestureT * 0.9 + k * 0.3 + j * 0.5) % 1;
                return <ellipse key={j} cx={cx - 10 + j * 18} cy={GROUND + 16 + k * 4} rx={2 + f * 9} ry={0.6 + f * 1.6} fill="none" stroke="#e2e8f0" strokeWidth="0.7" opacity={1 - f} />;
              })}
            </g>
          ))}
          {/* Gotas inclinadas por el viento */}
          {Array.from({ length: Math.round(70 * rain) }, (_, k) => {
            const speed = 260 + (k % 5) * 30;
            const y = (hash(k + 11) * 320 + gestureT * speed) % 320 - 20;
            const x = (hash(k) * 840 - y * 0.18 + 840) % 840 - 20;
            return <line key={k} x1={x} y1={y} x2={x - 2.6} y2={y + 13} stroke="#cbd5e1" strokeWidth="1" opacity="0.55" />;
          })}
          {/* Salpicaduras en el suelo */}
          {Array.from({ length: 10 }, (_, k) => {
            const f = (gestureT * 1.7 + hash(k + 40)) % 1;
            const x = hash(k + 20 + Math.floor(gestureT * 1.7 + hash(k + 40))) * 800;
            return <path key={k} d={`M${x - 3} ${GROUND + 8 - f * 3} l-2 -3 M${x + 3} ${GROUND + 8 - f * 3} l2 -3`} stroke="#e2e8f0" strokeWidth="0.8" opacity={1 - f} />;
          })}
        </g>
      )}
    </g>
  );
}

/** Eras glaciales: hielo que avanza y retrocede; la civilización sobrevive bajo cúpulas. */
function IceAge({ years, gestureT, night }: { years: number; gestureT: number; night: number }) {
  const ice = 0.3 + 0.7 * iceLevel(years);
  return (
    <>
      {/* Aurora */}
      <path d="M0 70 C150 30 250 110 400 60 S650 20 800 70" stroke="#4ade80" strokeWidth="18" fill="none" opacity={0.15 + night * 0.25} />
      <path d="M0 90 C180 50 300 120 460 80 S680 50 800 95" stroke="#a78bfa" strokeWidth="10" fill="none" opacity={0.1 + night * 0.2} />
      {/* Cordillera con nieves */}
      <path d="M0 210 L80 120 L150 180 L240 90 L330 170 L420 100 L520 180 L610 110 L700 175 L800 120 V262 H0Z" fill="#475569" />
      <path d={`M80 120 L${80 + 30 * ice} ${120 + 34 * ice} L${80 - 30 * ice} ${120 + 34 * ice}Z M240 90 L${240 + 40 * ice} ${90 + 46 * ice} L${240 - 40 * ice} ${90 + 46 * ice}Z M420 100 L${420 + 36 * ice} ${100 + 40 * ice} L${420 - 36 * ice} ${100 + 40 * ice}Z M610 110 L${610 + 36 * ice} ${110 + 40 * ice} L${610 - 36 * ice} ${110 + 40 * ice}Z`} fill="#f8fafc" />
      {/* Ciudades bajo cúpulas, medio enterradas en el hielo */}
      {[120, 380, 640].map((cx, i) => (
        <g key={cx}>
          <path d={`M${cx - 70} ${GROUND - 26} A70 ${62 - i * 8} 0 0 1 ${cx + 70} ${GROUND - 26}Z`} fill="#0e7490" opacity="0.35" stroke="#a5f3fc" strokeOpacity="0.7" />
          {Array.from({ length: 5 }, (_, k) => (
            <rect key={k} x={cx - 50 + k * 20} y={GROUND - 26 - (24 + ((k * 37 + i * 13) % 30))} width="12" height={24 + ((k * 37 + i * 13) % 30)} fill="#1e293b" stroke="#67e8f9" strokeOpacity="0.5" />
          ))}
          <ellipse cx={cx} cy={GROUND - 60} rx="40" ry="18" fill="#67e8f9" opacity={0.1 + night * 0.15} />
        </g>
      ))}
      {/* Glaciar */}
      <path d={`M0 ${GROUND - 34 + (1 - ice) * 18} Q200 ${GROUND - 56 + (1 - ice) * 18} 400 ${GROUND - 38 + (1 - ice) * 18} T800 ${GROUND - 30 + (1 - ice) * 18} V300 H0Z`} fill="#e2e8f0" />
      <path d={`M0 ${GROUND - 10} Q200 ${GROUND - 24} 400 ${GROUND - 12} T800 ${GROUND - 6} V300 H0Z`} fill="#bae6fd" opacity="0.6" />
      {/* Nieve que cae */}
      {Array.from({ length: 40 }, (_, k) => (
        <circle key={k} cx={(hash(k) * 800 + Math.sin(gestureT + k) * 10) % 800} cy={(hash(k + 9) * 300 + gestureT * (12 + (k % 5) * 3)) % 300} r={1 + (k % 3) * 0.6} fill="#fff" opacity={0.4 + ice * 0.4} />
      ))}
    </>
  );
}

/** Millones de años después: otros continentes, otra vida y una civilización orbital. */
function DeepTime({ years, gestureT, night }: { years: number; gestureT: number; night: number }) {
  const drift = (years / 1e6) % 1;
  return (
    <>
      {/* Anillo orbital alrededor de la Tierra */}
      <path d="M-40 150 Q400 40 840 150" stroke="#e0f2fe" strokeWidth="5" fill="none" opacity="0.55" />
      <path d="M-40 156 Q400 48 840 156" stroke="#94a3b8" strokeWidth="2" fill="none" opacity="0.4" />
      {/* Ciudades flotantes */}
      {[180, 560].map((cx, i) => (
        <g key={cx} transform={`translate(${cx + Math.sin(gestureT * 0.2 + i) * 14} ${70 + i * 28 + Math.sin(gestureT * 0.5 + i) * 4})`}>
          <ellipse rx="54" ry="9" fill="#cbd5e1" stroke={INK} strokeWidth="0.8" />
          <path d="M-36 -2 L-30 -30 L-22 -2 M-12 -2 L-4 -44 L4 -2 M16 -2 L24 -26 L32 -2" fill="#e2e8f0" stroke={INK} strokeWidth="0.8" />
          <ellipse cy="7" rx="30" ry="4" fill="#67e8f9" opacity={0.3 + night * 0.4} />
        </g>
      ))}
      {/* Montañas nuevas: la tectónica movió los continentes */}
      <path d={`M0 220 L${120 + drift * 40} 150 L260 205 L${380 - drift * 30} 130 L520 210 L${660 + drift * 30} 160 L800 200 V262 H0Z`} fill="#4c1d95" opacity="0.8" />
      <path d={`M0 ${GROUND - 30} Q200 ${GROUND - 55} 400 ${GROUND - 34} T800 ${GROUND - 26} V300 H0Z`} fill="#2e1065" />
      {/* Vegetación bioluminiscente */}
      {Array.from({ length: 11 }, (_, i) => {
        const x = 40 + i * 72;
        const h = 60 + (i % 4) * 26;
        const sway = Math.sin(gestureT * 0.8 + i) * 6;
        return (
          <g key={i}>
            <path d={`M${x} ${GROUND} q-10 -${h / 2} ${sway} -${h}`} stroke="#7c3aed" strokeWidth="5" fill="none" />
            <circle cx={x + sway} cy={GROUND - h} r={7 + (i % 3) * 2} fill={["#22d3ee", "#f0abfc", "#a3e635"][i % 3]} opacity={0.55 + night * 0.4} />
          </g>
        );
      })}
    </>
  );
}

/** El futuro lejano de la Tierra según la evolución del Sol. `idp` evita choques de ids si la escena se dibuja dos veces. */
function SolarFate({ epoch, years, gestureT, idp = "sf" }: { epoch: Epoch["key"]; years: number; gestureT: number; idp?: string }) {
  const id = (s: string) => `${idp}-${s}`;
  if (epoch === "warming") {
    // Dentro de 100–1000 millones de años el Sol brilla un 10 % más: sabana seca, mesetas y calima.
    const shimmer = (k: number) => Math.sin(gestureT * 2.4 + k) * 1.5;
    return (
      <>
        <defs>
          <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f59e0b" />
            <stop offset="0.55" stopColor="#fcd34d" />
            <stop offset="1" stopColor="#fef3c7" />
          </linearGradient>
          <radialGradient id={id("sun")}>
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.35" stopColor="#fffbeb" />
            <stop offset="0.6" stopColor="#fde68a" stopOpacity="0.7" />
            <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id("ground")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c2a35a" />
            <stop offset="1" stopColor="#8a6a32" />
          </linearGradient>
        </defs>
        <rect width={W} height="300" fill={`url(#${id("sky")})`} />
        <circle cx="610" cy="66" r="120" fill={`url(#${id("sun")})`} />
        <circle cx="610" cy="66" r="30" fill="#fffef5" stroke="#fde68a" strokeWidth="2" />
        {/* Mesetas en tres planos: más pálidas cuanto más lejos (calima) */}
        <path d="M0 196 L60 196 L72 168 L170 168 L184 196 L330 196 L344 160 L420 160 L436 196 L600 196 L612 176 L700 176 L716 196 L800 196 V262 H0Z" fill="#e7b977" opacity="0.7" />
        <path d="M0 214 L110 214 L126 182 L250 182 L268 214 L480 214 L500 186 L590 186 L606 214 L800 214 V262 H0Z" fill="#c98b4a" stroke={INK} strokeWidth="1.2" strokeOpacity="0.5" />
        <path d={`M0 ${GROUND - 28} Q200 ${GROUND - 44} 400 ${GROUND - 30} T800 ${GROUND - 24} V300 H0Z`} fill={`url(#${id("ground")})`} stroke={INK} strokeWidth="1.6" />
        {/* Pastos secos y suculentas resistentes al calor */}
        {Array.from({ length: 22 }, (_, k) => {
          const x = 12 + k * 37 + hash(k) * 14;
          const y = GROUND - 24 + hash(k + 4) * 30;
          return <path key={k} d={`M${x} ${y} l-4 -9 M${x} ${y} l0 -11 M${x} ${y} l4 -8`} stroke="#7c5a1f" strokeWidth="1.4" />;
        })}
        {[90, 330, 560, 730].map((x, k) => (
          <g key={x} transform={`translate(${x} ${GROUND - 20 + (k % 2) * 8})`}>
            <path d="M0 0 v-34 q0 -6 5 -6 q5 0 5 6 v34Z" fill="#4d7c0f" stroke={INK} strokeWidth="1.4" />
            <path d="M0 -16 h-7 q-4 0 -4 -4 v-10 q0 -3 3 -3 q3 0 3 3 v7 h5" fill="#4d7c0f" stroke={INK} strokeWidth="1.4" />
            <path d="M10 -22 h6 q4 0 4 -4 v-8 q0 -3 -3 -3 q-3 0 -3 3 v5 h-4" fill="#4d7c0f" stroke={INK} strokeWidth="1.4" />
            <path d="M5 -36 v30" stroke="#65a30d" strokeWidth="1" opacity="0.7" />
          </g>
        ))}
        {/* Calima: el aire caliente ondula sobre el suelo */}
        {[0, 1, 2].map((k) => (
          <path key={k} d={`M0 ${200 + k * 14 + shimmer(k)} Q200 ${196 + k * 14 - shimmer(k)} 400 ${200 + k * 14 + shimmer(k)} T800 ${200 + k * 14}`} stroke="#fff7ed" strokeWidth="5" fill="none" opacity="0.18" />
        ))}
      </>
    );
  }
  if (epoch === "boiled") {
    // Más de mil millones de años: los océanos se evaporaron. Lecho marino seco, salinas y ruinas bajo un Sol enorme.
    const grow = Math.min(1, (years - 1e9) / 3.5e9);
    const R = 46 + grow * 34;
    const spin = gestureT * 2;
    return (
      <>
        <defs>
          <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7c2d12" />
            <stop offset="0.45" stopColor="#ea580c" />
            <stop offset="1" stopColor="#fdba74" />
          </linearGradient>
          <radialGradient id={id("sun")}>
            <stop offset="0" stopColor="#fffbeb" />
            <stop offset="0.3" stopColor="#fef3c7" />
            <stop offset="0.55" stopColor="#fdba74" stopOpacity="0.6" />
            <stop offset="1" stopColor="#fb923c" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id("seabed")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b45309" />
            <stop offset="1" stopColor="#7c2d12" />
          </linearGradient>
          <pattern id={id("cracks")} width="34" height="20" patternUnits="userSpaceOnUse">
            <path d="M0 10 L8 2 L24 2 L34 10 L24 18 L8 18Z" fill="none" stroke="#a16207" strokeWidth="1" opacity="0.55" />
          </pattern>
        </defs>
        <rect width={W} height="300" fill={`url(#${id("sky")})`} />
        {/* Sol grande con corona que gira despacio */}
        <circle cx="560" cy="86" r={R * 3} fill={`url(#${id("sun")})`} />
        <g transform={`rotate(${spin} 560 86)`} opacity="0.35">
          {Array.from({ length: 12 }, (_, k) => {
            const a = (k / 12) * Math.PI * 2;
            return <path key={k} d={`M${560 + Math.cos(a) * R * 1.1} ${86 + Math.sin(a) * R * 1.1} L${560 + Math.cos(a + 0.06) * R * 1.9} ${86 + Math.sin(a + 0.06) * R * 1.9} L${560 + Math.cos(a + 0.12) * R * 1.1} ${86 + Math.sin(a + 0.12) * R * 1.1}Z`} fill="#fef3c7" />;
          })}
        </g>
        <circle cx="560" cy="86" r={R} fill="#fff7e0" stroke="#fde68a" strokeWidth="3" />
        {/* Antiguas costas: acantilados en planos con calima */}
        <path d="M0 176 L90 150 L150 170 L250 132 L330 168 L430 146 L520 174 L640 140 L730 166 L800 150 V262 H0Z" fill="#c2410c" opacity="0.55" />
        <path d="M0 198 L70 180 L120 194 L200 168 L290 196 L380 178 L470 200 L560 176 L650 198 L740 182 L800 196 V262 H0Z" fill="#9a3412" stroke={INK} strokeWidth="1.2" strokeOpacity="0.5" />
        {/* Lecho marino seco con salinas de grietas hexagonales */}
        <path d={`M0 ${GROUND - 30} Q200 ${GROUND - 44} 400 ${GROUND - 32} T800 ${GROUND - 28} V300 H0Z`} fill={`url(#${id("seabed")})`} stroke={INK} strokeWidth="1.6" />
        <ellipse cx="420" cy={GROUND + 12} rx="260" ry="20" fill="#fef3c7" opacity="0.85" stroke="#fde68a" strokeWidth="1.5" />
        <ellipse cx="420" cy={GROUND + 12} rx="260" ry="20" fill={`url(#${id("cracks")})`} />
        {/* Casco de un barco varado y el esqueleto de una cúpula: lo último de la civilización */}
        <g transform={`translate(130 ${GROUND - 14})`}>
          <path d="M-46 0 Q-40 -26 0 -28 L46 -24 L54 0Z" fill="#57534e" stroke={INK} strokeWidth="1.6" />
          <path d="M-30 -22 L-28 0 M-10 -27 L-9 0 M10 -27 L10 0 M30 -25 L31 0" stroke="#292524" strokeWidth="1.4" />
          <rect x="-6" y="-46" width="5" height="20" fill="#44403c" stroke={INK} strokeWidth="1.2" transform="rotate(12 -3 -26)" />
        </g>
        <g transform={`translate(700 ${GROUND - 22})`} fill="none" stroke={INK} strokeWidth="2.4">
          <path d="M-56 0 A56 46 0 0 1 56 0" stroke="#78716c" strokeWidth="5" strokeDasharray="70 24 40 200" />
          <path d="M-56 0 A56 46 0 0 1 56 0" strokeDasharray="70 24 40 200" />
          <path d="M-28 0 Q-30 -36 0 -46 M28 0 Q30 -36 0 -46 M0 0 V-46" stroke="#57534e" strokeWidth="2" />
        </g>
        {/* Polvo y calima */}
        {Array.from({ length: 24 }, (_, k) => {
          const x = (hash(k) * 800 + gestureT * (10 + (k % 4) * 4)) % 820 - 10;
          return <circle key={k} cx={x} cy={170 + hash(k + 2) * 100} r={0.8 + (k % 3) * 0.5} fill="#fed7aa" opacity="0.5" />;
        })}
        {[0, 1].map((k) => (
          <path key={k} d={`M0 ${210 + k * 18 + Math.sin(gestureT * 2 + k) * 2} Q400 ${204 + k * 18} 800 ${210 + k * 18}`} stroke="#fff7ed" strokeWidth="6" fill="none" opacity="0.12" />
        ))}
      </>
    );
  }
  if (epoch === "redgiant") {
    // El Sol, gigante roja, ocupa medio cielo: la corteza se derrite y brillan ríos de lava.
    const pulse = Math.sin(gestureT * 0.5);
    return (
      <>
        <defs>
          <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1c0505" />
            <stop offset="1" stopColor="#7f1d1d" />
          </linearGradient>
          <radialGradient id={id("giant")} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fdba74" />
            <stop offset="0.55" stopColor="#f97316" />
            <stop offset="0.85" stopColor="#dc2626" />
            <stop offset="1" stopColor="#7f1d1d" />
          </radialGradient>
          <radialGradient id={id("halo")}>
            <stop offset="0.7" stopColor="#ef4444" stopOpacity="0.5" />
            <stop offset="1" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id("crust")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#292524" />
            <stop offset="1" stopColor="#0c0a09" />
          </linearGradient>
        </defs>
        <rect width={W} height="300" fill={`url(#${id("sky")})`} />
        <circle cx="400" cy="70" r={330 + pulse * 6} fill={`url(#${id("halo")})`} />
        <circle cx="400" cy="70" r={270 + pulse * 5} fill={`url(#${id("giant")})`} />
        {/* Granulación: enormes celdas de convección que hierven despacio */}
        {Array.from({ length: 18 }, (_, k) => {
          const a = hash(k) * Math.PI * 2;
          const r = Math.sqrt(hash(k + 7)) * 230;
          const s = 14 + hash(k + 3) * 26 + Math.sin(gestureT * 0.4 + k) * 4;
          return <ellipse key={k} cx={400 + Math.cos(a) * r} cy={70 + Math.sin(a) * r * 0.9} rx={s} ry={s * 0.8} fill={k % 3 ? "#fb923c" : "#b91c1c"} opacity="0.3" />;
        })}
        {/* Corteza negra en placas con grietas incandescentes */}
        <path d={`M0 ${GROUND - 34} L120 ${GROUND - 46} L210 ${GROUND - 36} L330 ${GROUND - 52} L460 ${GROUND - 38} L580 ${GROUND - 48} L700 ${GROUND - 36} L800 ${GROUND - 44} V300 H0Z`} fill={`url(#${id("crust")})`} stroke={INK} strokeWidth="1.6" />
        {Array.from({ length: 8 }, (_, k) => {
          // Grietas que se ramifican entre las placas de roca.
          const x = 30 + k * 100 + hash(k) * 30;
          const y = GROUND - 34 + (k % 2) * 6;
          const d = `M${x} ${y} C${x + 12} ${y + 10} ${x - 8} ${y + 22} ${x + 6} ${y + 34} S${x + 30} ${y + 50} ${x + 24} ${y + 62} M${x + 2} ${y + 24} C${x - 14} ${y + 30} ${x - 24} ${y + 34} ${x - 34} ${y + 44}`;
          const glow = 0.6 + 0.4 * Math.sin(gestureT * 1.5 + k);
          return (
            <g key={k}>
              <path d={d} stroke="#f97316" strokeWidth="7" fill="none" opacity={0.25 * glow} />
              <path d={d} stroke="#fde047" strokeWidth="2" fill="none" opacity={glow} />
            </g>
          );
        })}
        {/* Río de lava en primer plano */}
        <path d={`M0 ${GROUND + 18} Q200 ${GROUND + 4} 400 ${GROUND + 16} T800 ${GROUND + 10}`} stroke="#ea580c" strokeWidth="16" fill="none" />
        <path d={`M0 ${GROUND + 18} Q200 ${GROUND + 4} 400 ${GROUND + 16} T800 ${GROUND + 10}`} stroke="#fde047" strokeWidth="4" fill="none" strokeDasharray="30 18" strokeDashoffset={-gestureT * 12} opacity="0.85" />
        {/* Brasas que suben */}
        {Array.from({ length: 26 }, (_, k) => {
          const f = (gestureT * (0.15 + (k % 5) * 0.04) + hash(k)) % 1;
          return <circle key={k} cx={hash(k + 1) * 800 + Math.sin(gestureT + k) * 8} cy={GROUND + 10 - f * 180} r={1 + (k % 3) * 0.6} fill="#fdba74" opacity={1 - f} />;
        })}
      </>
    );
  }
  // Enana blanca: la Tierra ya no existe. Queda la nebulosa planetaria del Sol muerto, y en el fondo
  // la galaxia elíptica que formaron la Vía Láctea y Andrómeda.
  const turn = gestureT * 1.5;
  return (
    <>
      <defs>
        <radialGradient id={id("neb")}>
          <stop offset="0" stopColor="#e0f2fe" stopOpacity="0.9" />
          <stop offset="0.25" stopColor="#22d3ee" stopOpacity="0.45" />
          <stop offset="0.6" stopColor="#6366f1" stopOpacity="0.25" />
          <stop offset="1" stopColor="#020617" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("milkdromeda")}>
          <stop offset="0" stopColor="#fef3c7" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fef3c7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height="300" fill="#020617" />
      <ellipse cx="170" cy="90" rx="150" ry="60" fill={`url(#${id("milkdromeda")})`} transform="rotate(-18 170 90)" />
      {Array.from({ length: 120 }, (_, k) => (
        <circle key={k} cx={hash(k) * 800} cy={hash(k + 50) * 300} r={k % 9 === 0 ? 1.3 : 0.6} fill={k % 7 === 0 ? "#fde68a" : "#fff"} opacity={0.4 + hash(k + 9) * 0.5} />
      ))}
      <g transform={`rotate(${turn} 470 150)`}>
        <ellipse cx="470" cy="150" rx="210" ry="130" fill={`url(#${id("neb")})`} />
        <ellipse cx="470" cy="150" rx="150" ry="80" fill="none" stroke="#a78bfa" strokeWidth="22" opacity="0.28" />
        <ellipse cx="470" cy="150" rx="150" ry="80" fill="none" stroke="#f0abfc" strokeWidth="4" opacity="0.4" />
        <ellipse cx="470" cy="150" rx="90" ry="160" fill="none" stroke="#f472b6" strokeWidth="12" opacity="0.2" transform="rotate(35 470 150)" />
        {Array.from({ length: 14 }, (_, k) => {
          const a = (k / 14) * Math.PI * 2;
          return <path key={k} d={`M${470 + Math.cos(a) * 60} ${150 + Math.sin(a) * 40} Q${470 + Math.cos(a + 0.3) * 140} ${150 + Math.sin(a + 0.3) * 90} ${470 + Math.cos(a) * 190} ${150 + Math.sin(a) * 120}`} stroke="#67e8f9" strokeWidth="1.2" fill="none" opacity="0.3" />;
        })}
      </g>
      <circle cx="470" cy="150" r="18" fill="#e0f2fe" opacity="0.4" />
      <circle cx="470" cy="150" r="5" fill="#fff" />
    </>
  );
}

/** Luz que entra por la escotilla de la nave según la época de la Tierra. */
export const OUTDOOR_LIGHT: Record<Epoch["key"], string> = {
  life: "#fde68a", grave: "#fde68a", future: "#fde68a", ice: "#e0f2fe", deep: "#c4b5fd",
  warming: "#fcd34d", boiled: "#fb923c", redgiant: "#ef4444", whitedwarf: "#a5b4fc",
};

/** El paisaje de la Tierra en este momento, sin personas: lo que se ve al abrir la escotilla de la nave. */
export function Outdoors({ years, deathYears, gestureT, idp }: { years: number; deathYears: number; gestureT: number; idp: string }) {
  const epoch = earthEpoch(years, deathYears);
  if (epoch.key === "warming" || epoch.key === "boiled" || epoch.key === "redgiant" || epoch.key === "whitedwarf")
    return <SolarFate epoch={epoch.key} years={years} gestureT={gestureT} idp={idp} />;
  return (
    <>
      {/* Misma hora que la escena del reencuentro: atardecer junto a la tumba, mediodía en los demás casos */}
      <Sky hour={years > deathYears && years - deathYears <= 300 ? 17 : 12} timelapse={false} ice={epoch.key === "ice" ? 0.4 : 0} id={idp} />
      {epoch.key === "ice" ? (
        <IceAge years={years} gestureT={gestureT} night={0} />
      ) : epoch.key === "deep" ? (
        <DeepTime years={years} gestureT={gestureT} night={0} />
      ) : (
        <>
          <City year={LAUNCH_YEAR + years} base={GROUND - 40} t={gestureT} night={0} />
          <path d={`M0 ${GROUND - 30} Q200 ${GROUND - 55} 400 ${GROUND - 34} T800 ${GROUND - 26} V300 H0Z`} fill="#4d6b35" />
        </>
      )}
    </>
  );
}

function After({ props }: { props: EarthSceneProps }) {
  const { years, epoch, deathYears, hour, timelapse, gestureT } = props;
  const since = years - deathYears;
  const night = skyColors(hour, timelapse).night;
  if (epoch.key === "warming" || epoch.key === "boiled" || epoch.key === "redgiant" || epoch.key === "whitedwarf")
    return <SolarFate epoch={epoch.key} years={years} gestureT={gestureT} />;
  return (
    <>
      <Sky hour={hour} timelapse={timelapse} ice={epoch.key === "ice" ? 0.4 : 0} id="after" />
      {epoch.key === "ice" ? (
        <IceAge years={years} gestureT={gestureT} night={timelapse ? 0.5 : night} />
      ) : epoch.key === "deep" ? (
        <DeepTime years={years} gestureT={gestureT} night={timelapse ? 0.5 : night} />
      ) : (
        <>
          <City year={LAUNCH_YEAR + years} base={GROUND - 40} t={gestureT} night={timelapse ? 0.5 : night} />
          <path d={`M0 ${GROUND - 30} Q200 ${GROUND - 55} 400 ${GROUND - 34} T800 ${GROUND - 26} V300 H0Z`} fill="#4d6b35" />
          {epoch.key === "grave" && <Grave since={since} deathYears={deathYears} gestureT={gestureT} timelapse={timelapse} />}
        </>
      )}
    </>
  );
}

function Reunion({ props }: { props: EarthSceneProps }) {
  const { age, shipAge, gestureT, earthAlive, shipAlive, deathYears, years } = props;
  if (!earthAlive && years - deathYears > 300) {
    return (
      <>
        <After props={{ ...props, epoch: earthEpoch(years, deathYears), hour: 12, timelapse: false }} />
        {earthEpoch(years, deathYears).key !== "redgiant" && earthEpoch(years, deathYears).key !== "whitedwarf" && (
          <>
            <RangerLanded x={640} y={GROUND - 4} />
            {shipAlive ? <Person x={520} y={GROUND} age={shipAge} pose="lookUp" t={gestureT} outfit="flightsuit" facing={-1} mood="sad" /> : null}
          </>
        )}
        <text x="560" y={GROUND - 70} fontSize="12" textAnchor="middle" fill="#f8fafc" stroke="#020617" strokeWidth="3" paintOrder="stroke">
          {earthEpoch(years, deathYears).key === "whitedwarf"
            ? "No queda Tierra a la que volver: el Sol es una enana blanca"
            : earthEpoch(years, deathYears).key === "redgiant"
              ? "La Tierra es un mundo de lava bajo la gigante roja: la nave no puede aterrizar"
              : shipAlive
                ? `${SHIP_NAME} vuelve a un mundo irreconocible: de ${EARTH_NAME} no queda ni la tumba`
                : `La nave vuelve sola a un mundo irreconocible`}
        </text>
      </>
    );
  }
  if (!earthAlive) {
    // Tomás vuelve y encuentra la tumba de su hermano.
    return (
      <>
        <Sky hour={17} timelapse={false} id="reunion" />
        <City year={LAUNCH_YEAR + years} base={GROUND - 40} t={gestureT} night={0.2} />
        <path d={`M0 ${GROUND - 30} Q200 ${GROUND - 55} 400 ${GROUND - 34} T800 ${GROUND - 26} V300 H0Z`} fill="#4d6b35" />
        <Grave
          since={years - deathYears}
          deathYears={deathYears}
          gestureT={gestureT}
          timelapse={false}
          extraVisitor={shipAlive ? <Person x={300} y={GROUND} age={shipAge} pose="kneel" t={gestureT} outfit="flightsuit" flowers /> : undefined}
        />
        {!shipAlive && (
          <text x="400" y="60" fontSize="13" textAnchor="middle" fill="#f8fafc">La nave volvió sola: ninguno de los dos hermanos vivió para el reencuentro</text>
        )}
      </>
    );
  }
  return (
    <>
      <Sky hour={12} timelapse={false} id="reunion" />
      <City year={LAUNCH_YEAR + years} base={GROUND - 30} t={gestureT} night={0} />
      <rect y={GROUND - 30} width={W} height="70" fill="#4d6b35" />
      <rect x="470" y={GROUND - 6} width="330" height="12" fill="#78716c" stroke={INK} strokeWidth="1.6" />
      <RangerLanded x={640} y={GROUND - 4} />
      <Person x={props.souvenir ? 360 : 330} y={GROUND} age={age} pose={props.souvenir ? "offer" : "wave"} t={gestureT} mood="joy" />
      {shipAlive ? (
        <Person
          x={props.souvenir ? 418 : 440}
          y={GROUND}
          age={shipAge}
          pose={props.souvenir ? "offer" : "wave"}
          t={gestureT + 1}
          facing={-1}
          outfit="flightsuit"
          prop={props.souvenir ? "rock" : undefined}
          propColor={props.souvenir?.color}
          mood="joy"
        />
      ) : (
        <text x="470" y="80" fontSize="13" textAnchor="middle" fill="#0f172a">La nave volvió sin {SHIP_NAME}</text>
      )}
    </>
  );
}

export function EarthScene(props: EarthSceneProps) {
  const view = useFocusView(props.focusX ?? W / 2);
  return (
    <svg ref={view.ref} viewBox={view.viewBox} preserveAspectRatio="xMidYMax slice" className="toon absolute inset-0 h-full w-full">
      <defs>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7dd3fc" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="#0ea5e9" stopOpacity="0.1" />
          <stop offset="1" stopColor="#e0f2fe" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {props.setting === "launch" ? (
        <LaunchSite props={props} />
      ) : props.setting === "home" ? (
        <Home props={props} />
      ) : props.setting === "reunion" ? (
        <Reunion props={props} />
      ) : (
        <After props={props} />
      )}
    </svg>
  );
}
