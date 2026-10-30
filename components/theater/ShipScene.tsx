import { activityAt, earthEpoch, hourOfDay, musicSkill, practiceHours, SHIP_NAME, SHIP_PLACES, surfaceActivity } from "@/lib/life";
import type { PhaseKind, PlanetInfo } from "@/lib/relativity";
import { OUTDOOR_LIGHT, Outdoors } from "./EarthScene";
import { MusicNotes, Person, Sleeper, walkClock, type Mood } from "./Person";
import { Gargantua } from "./Gargantua";
import { RelativisticSky, type SkyProps } from "./RelativisticSky";
import { useFocusView } from "./useFocusView";

const GROUND = 262;
const W = 800;
const INK = "#1e1b2e";

export interface ShipSceneProps {
  stage: "boarding" | "cinematic" | "flight" | "done";
  cinematicTime: number;
  /** Tiempo propio de la nave (años). */
  years: number;
  age: number;
  timelapse: boolean;
  gestureT: number;
  phase: PhaseKind;
  alive: boolean;
  /** La nave ya aterrizó de vuelta en la Tierra y Tomás bajó. */
  landed: boolean;
  /** Posición entre la Tierra (0) y el destino (1). */
  routeFraction: number;
  leg: "ida" | "vuelta";
  /** Edad de Martín en el último mensaje recibido de la Tierra. */
  lastMessageAge: number;
  sky: SkyProps;
  /** Planeta o luna de destino (si es un viaje dentro del sistema solar). */
  planet?: PlanetInfo;
  /** Días desde el aterrizaje en el planeta (si está en la superficie). */
  surfaceDay: number;
  /** Acaba de recibir la noticia de la muerte de su hermano. */
  sadNews: boolean;
  /** Visita al planeta de Miller: fracción de la estadía (0–1), o null si no corresponde. */
  millerProgress: number | null;
  /** Tomás duerme en la cápsula de hipersueño. */
  cryo?: boolean;
  /** Tiempo terrestre y muerte de Martín: para ver por la escotilla la Tierra de esa época al aterrizar. */
  outside?: { years: number; deathYears: number };
  /** Dónde mira la cámara cuando la pantalla es angosta (coordenada x de la escena). */
  focusX?: number;
  /** Clic en la pantalla de navegación: abre el mapa. */
  onOpenMap?: () => void;
  /** Clic en el reloj de la misión: abre la comparación de relojes. */
  onOpenClocks?: () => void;
  /** Clic en la ventana: abre la vista grande del cielo. */
  onOpenWindow?: () => void;
}

/** Brazo de acceso de la tripulación, en lo alto de la torre, hasta la escotilla de la Ranger. */
function Gantry({ t, age, gestureT, waiting = false }: { t: number; age: number; gestureT: number; waiting?: boolean }) {
  const FLOOR = 236;
  const walk = Math.min(1, t / 5.5);
  const x = 300 + walk * 278;
  const fade = t > 5.5 ? Math.max(0, 1 - (t - 5.5) / 0.6) : 1;
  return (
    <>
      <defs>
        <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#bfdbfe" />
        </linearGradient>
        <linearGradient id="g-hull" x1="0" x2="1">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="0.5" stopColor="#71717a" />
          <stop offset="1" stopColor="#27272a" />
        </linearGradient>
      </defs>
      {/* Cielo y paisaje muy abajo: estamos a 100 m de altura */}
      <rect width={W} height="300" fill="url(#g-sky)" />
      {[0, 1].map((i) => (
        <g key={i} fill="#fff" opacity="0.75" transform={`translate(${((gestureT * 4 + i * 420) % 1000) - 200} ${60 + i * 50})`}>
          <ellipse rx="46" ry="12" />
          <ellipse cx="26" cy="-6" rx="26" ry="12" />
        </g>
      ))}
      <rect y="262" width={W} height="38" fill="#86a37a" />
      <path d="M0 262 L120 254 L260 260 L420 250 L600 258 L800 252 V262Z" fill="#9fb3c8" />
      {/* Estructura de la torre detrás del brazo */}
      <g stroke="#475569" strokeWidth="2">
        <line x1="40" y1="0" x2="40" y2="300" />
        <line x1="90" y1="0" x2="90" y2="300" />
        {Array.from({ length: 7 }, (_, i) => (
          <path key={i} d={`M40 ${i * 46} L90 ${i * 46 + 46} M90 ${i * 46} L40 ${i * 46 + 46}`} strokeWidth="1.2" />
        ))}
      </g>

      {/* Costado de la Ranger con la escotilla abierta */}
      <path d="M600 0 L760 0 L760 300 L600 300Z" fill="url(#g-hull)" stroke={INK} strokeWidth="1.5" />
      <path d="M600 60 L760 60 M600 262 L760 262 M680 0 L680 300" stroke="#a1a1aa" strokeWidth="0.8" opacity="0.5" />
      <rect x="600" y="268" width="160" height="6" fill="#f97316" opacity="0.85" />
      <path d="M700 20 L748 20 L740 44 L708 44Z" fill="#0f172a" stroke="#a1a1aa" />
      <text x="712" y="250" fontSize="18" fontWeight="bold" fill="#e4e4e7" letterSpacing="2" transform="rotate(-90 712 250)">RANGER</text>
      <rect x="596" y={FLOOR - 92} width="40" height="92" rx="8" fill="#18181b" stroke="#a1a1aa" strokeWidth="4" />
      <rect x="602" y={FLOOR - 84} width="28" height="80" rx="5" fill="#fde68a" opacity="0.9" />

      {/* Sala blanca: el último cuarto antes de entrar a la nave */}
      <rect x="500" y={FLOOR - 104} width="98" height="104" fill="#f8fafc" stroke={INK} strokeWidth="1.4" />
      <rect x="500" y={FLOOR - 104} width="98" height="8" fill="#e2e8f0" />
      <rect x="512" y={FLOOR - 84} width="30" height="22" rx="2" fill="#bae6fd" stroke={INK} strokeWidth="0.8" />
      <text x="560" y={FLOOR - 70} fontSize="6" fill="#64748b" fontFamily="monospace">SALA</text>
      <text x="560" y={FLOOR - 62} fontSize="6" fill="#64748b" fontFamily="monospace">BLANCA</text>
      <rect x="566" y={FLOOR - 50} width="22" height="50" fill="#e2e8f0" stroke={INK} strokeWidth="0.8" />

      {/* Brazo de acceso: viga reticulada de acero, piso de rejilla, barandas y bandeja de cables */}
      <rect x="90" y={FLOOR} width="510" height="6" fill="#71717a" stroke={INK} strokeWidth="1" />
      {Array.from({ length: 51 }, (_, i) => (
        <line key={i} x1={92 + i * 10} y1={FLOOR + 1} x2={92 + i * 10} y2={FLOOR + 5} stroke="#3f3f46" strokeWidth="0.8" />
      ))}
      <path d={`M90 ${FLOOR + 6} L600 ${FLOOR + 6} L600 ${FLOOR + 34} L90 ${FLOOR + 34}`} fill="none" stroke="#52525b" strokeWidth="3" />
      {Array.from({ length: 13 }, (_, i) => (
        <path key={i} d={`M${90 + i * 40} ${FLOOR + 34} L${110 + i * 40} ${FLOOR + 6} L${130 + i * 40} ${FLOOR + 34}`} stroke="#52525b" strokeWidth="2" fill="none" />
      ))}
      <rect x="90" y={FLOOR + 22} width="510" height="4" fill="#f59e0b" opacity="0.8" />
      {/* Barandas */}
      <line x1="90" y1={FLOOR - 44} x2="500" y2={FLOOR - 44} stroke="#d4d4d8" strokeWidth="3" />
      <line x1="90" y1={FLOOR - 24} x2="500" y2={FLOOR - 24} stroke="#d4d4d8" strokeWidth="2" />
      {Array.from({ length: 11 }, (_, i) => (
        <line key={i} x1={92 + i * 40} y1={FLOOR - 44} x2={92 + i * 40} y2={FLOOR} stroke="#a1a1aa" strokeWidth="2" />
      ))}
      <Person x={x} y={FLOOR} age={age} pose={waiting ? "wave" : walk < 1 ? "walk" : "stand"} t={walk < 1 && !waiting ? walkClock(walk * 278, age) : gestureT} outfit="spacesuit" opacity={fade} helmet />
      {/* Baranda delantera: delante del astronauta */}
      <line x1="90" y1={FLOOR - 4} x2="500" y2={FLOOR - 4} stroke="#e4e4e7" strokeWidth="1.2" opacity="0.6" />
    </>
  );
}

/** Pantalla de instrumentos con marco y título. */
function Screen({ x, y, w, h, title, children }: { x: number; y: number; w: number; h: number; title: string; children: React.ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx="4" fill="#020617" stroke="#3f3f46" strokeWidth="2.5" />
      <rect x="2" y="2" width={w - 4} height={h - 4} rx="3" fill="#0b1324" />
      <text x="5" y="9" fontSize="5.5" fill="#64748b" fontFamily="monospace" letterSpacing="0.8">{title}</text>
      {children}
    </g>
  );
}

/** Cabina de la Ranger durante la cuenta regresiva y el despegue. */
function Cockpit({ props, shake }: { props: ShipSceneProps; shake: number }) {
  const { age, gestureT, cinematicTime, stage, years, sky } = props;
  const countdown = stage === "cinematic" ? Math.max(0, Math.ceil(16 - cinematicTime)) : 0;
  const met = stage === "flight" ? years * 365.25 * 86_400 : -countdown;
  const mmss = `${met < 0 ? "T−" : "T+"}${String(Math.floor(Math.abs(met) / 60)).padStart(2, "0")}:${String(Math.floor(Math.abs(met) % 60)).padStart(2, "0")}`;
  const altKm = sky.altitudeKm;
  const speedKms = Math.tanh(sky.phi) * 299_792;
  const burning = stage === "flight" || (stage === "cinematic" && cinematicTime > 13);
  const glow = burning ? Math.min(1, shake / 2 + 0.25) : 0;
  const alarm = countdown > 0 && countdown <= 10 && Math.floor(gestureT * 2) % 2 === 0;
  const roll = Math.sin(gestureT * 3) * shake * 2;
  const fmtNum = (v: number, d = 1) => v.toLocaleString("es-CL", { maximumFractionDigits: d, minimumFractionDigits: d });
  const altText = altKm < 1 ? `${fmtNum(altKm * 1000, 0)} m` : `${fmtNum(altKm, altKm < 100 ? 2 : 0)} km`;
  const velText = speedKms < 1 ? `${fmtNum(speedKms * 1000, 1)} m/s` : `${fmtNum(speedKms, 3)} km/s`;
  // Programa de cabeceo: la nave se inclina gradualmente hacia el horizonte mientras sube.
  const pitch = Math.min(1, altKm / 120);
  const gNow = burning && stage === "flight" ? 1 + Math.sin(gestureT * 9) * 0.03 * shake : 0;
  const event =
    stage !== "flight"
      ? countdown > 3
        ? "PRESURIZANDO TANQUES"
        : countdown > 0
          ? "IGNICIÓN"
          : "LISTOS"
      : altKm < 0.15
        ? "DESPEGUE"
        : altKm < 1.5
          ? "TORRE LIBRE"
          : altKm < 15
            ? "MAX-Q · PRESIÓN MÁXIMA"
            : altKm < 100
              ? "ALTA ATMÓSFERA"
              : "EN EL ESPACIO";
  return (
    <g transform={`translate(${Math.sin(gestureT * 47) * shake} ${Math.cos(gestureT * 53) * shake})`}>
      <defs>
        <linearGradient id="ck-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#27272a" />
          <stop offset="1" stopColor="#0c0c0e" />
        </linearGradient>
        <pattern id="ck-hex" width="12" height="10.4" patternUnits="userSpaceOnUse">
          <path d="M3 0 L9 0 L12 5.2 L9 10.4 L3 10.4 L0 5.2Z" fill="none" stroke="#ffffff0d" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width={W} height="300" fill="url(#ck-wall)" />
      <rect width={W} height="300" fill="url(#ck-hex)" />

      {/* Ventanal anguloso de tres paneles con el cielo real */}
      <foreignObject x="430" y="22" width="350" height="160">
        <div style={{ width: "100%", height: "100%", clipPath: "polygon(6% 0, 94% 0, 100% 100%, 0 100%)" }}>
          <RelativisticSky {...sky} />
        </div>
      </foreignObject>
      <path d="M451 22 L759 22 L780 182 L430 182Z" fill="none" stroke="#3f3f46" strokeWidth="12" strokeLinejoin="round" />
      <path d="M554 22 L546 182 M656 22 L664 182" stroke="#3f3f46" strokeWidth="8" />
      <path d="M451 22 L759 22 L780 182 L430 182Z" fill="none" stroke={INK} strokeWidth="1.5" />
      <path d="M470 34 L520 34" stroke="#ffffff30" strokeWidth="3" strokeLinecap="round" />

      {/* Techo con panel de interruptores */}
      <path d="M0 0 L430 0 L400 46 L0 64Z" fill="#1f1f23" stroke={INK} strokeWidth="1.6" />
      {Array.from({ length: 3 }, (_, r) =>
        Array.from({ length: 14 }, (_, c) => {
          const on = (r * 14 + c + Math.floor(gestureT * 0.7)) % 5 !== 0;
          return (
            <g key={`${r}-${c}`} transform={`translate(${36 + c * 25} ${12 + r * 15})`}>
              <rect x="-5" y="-4" width="10" height="9" rx="1.5" fill="#3f3f46" stroke={INK} strokeWidth="0.5" />
              <circle cx="0" cy="0.5" r="2" fill={on ? (c % 4 === 0 ? "#f59e0b" : "#22c55e") : "#1f2937"} />
            </g>
          );
        }),
      )}
      {/* Baliza de alerta */}
      <circle cx="414" cy="56" r="7" fill={alarm || burning ? "#ef4444" : "#7f1d1d"} stroke={INK} strokeWidth="1.6" />
      {(alarm || burning) && <circle cx="414" cy="56" r="16" fill="#ef4444" opacity="0.25" />}

      {/* Costillas estructurales */}
      {[60, 210, 360].map((x) => (
        <path key={x} d={`M${x} 64 L${x + 14} 64 L${x + 24} 300 L${x + 6} 300Z`} fill="#18181b" stroke="#00000080" />
      ))}

      {/* Escotilla lateral con ojo de buey */}
      <rect x="18" y="86" width="96" height="150" rx="16" fill="#202024" stroke="#3f3f46" strokeWidth="4" />
      <circle cx="66" cy="132" r="20" fill="#0b1324" stroke="#52525b" strokeWidth="4" />
      <circle cx="66" cy="132" r="20" fill={sky.altitudeKm < 90 ? "#7dd3fc" : "#020617"} opacity={Math.max(0.15, 1 - sky.altitudeKm / 90)} />
      <rect x="92" y="170" width="12" height="30" rx="3" fill="#a1a1aa" stroke={INK} strokeWidth="1.6" />
      <text x="66" y="222" fontSize="6" fill="#f59e0b" textAnchor="middle" fontFamily="monospace">HATCH 1 · SEALED</text>
      {/* Cables y conductos */}
      <path d="M0 250 C60 244 90 262 140 256 S220 240 270 252" stroke="#0f766e" strokeWidth="3" fill="none" />
      <path d="M0 258 C70 252 110 268 150 262" stroke="#b45309" strokeWidth="2.5" fill="none" />
      {/* Casilleros con correas y extintor */}
      {[130, 172].map((x) => (
        <g key={x}>
          <rect x={x} y="70" width="38" height="44" rx="3" fill="#2a2a2e" stroke={INK} strokeWidth="1.6" />
          <line x1={x + 4} y1="92" x2={x + 34} y2="92" stroke="#ea580c" strokeWidth="2" />
          <text x={x + 19} y="82" fontSize="5" fill="#a1a1aa" textAnchor="middle" fontFamily="monospace">STOW</text>
        </g>
      ))}
      <rect x="340" y="86" width="12" height="34" rx="5" fill="#dc2626" stroke={INK} strokeWidth="1.6" />
      <rect x="343" y="80" width="6" height="7" fill="#18181b" />

      {/* Consola de instrumentos bajo el ventanal */}
      <path d="M392 196 L800 186 L800 300 L370 300Z" fill="#18181b" stroke={INK} strokeWidth="1.5" />
      <path d="M392 196 L800 186" stroke="#52525b" strokeWidth="2" />
      <Screen x={404} y={204} w={92} h={64} title="ACTITUD">
        <g transform={`translate(46 37) rotate(${roll + pitch * 8})`}>
          <clipPath id="ah"><circle r="22" /></clipPath>
          <g clipPath="url(#ah)">
            <g transform={`translate(0 ${18 - pitch * 18})`}>
              <rect x="-40" y="-60" width="80" height="60" fill="#0369a1" />
              <rect x="-40" y="0" width="80" height="40" fill="#78350f" />
              {[-30, -20, -10, 10].map((dy) => <line key={dy} x1="-8" y1={dy} x2="8" y2={dy} stroke="#e2e8f0" strokeWidth="0.8" />)}
            </g>
          </g>
        </g>
        <text x="88" y="60" fontSize="5" fill="#94a3b8" fontFamily="monospace" textAnchor="end">{fmtNum(90 - pitch * 70, 0)}°</text>
        <path d="M30 37 h10 l6 4 l6 -4 h10" stroke="#facc15" strokeWidth="1.8" fill="none" />
        <circle cx="46" cy="37" r="22" fill="none" stroke="#475569" />
      </Screen>
      <Screen x={504} y={204} w={96} h={64} title="TELEMETRÍA">
        <text x="6" y="24" fontSize="7" fill="#64748b" fontFamily="monospace">ALT</text>
        <text x="90" y="24" fontSize="9" fill="#67e8f9" fontFamily="monospace" textAnchor="end">{altText}</text>
        <text x="6" y="38" fontSize="7" fill="#64748b" fontFamily="monospace">VEL</text>
        <text x="90" y="38" fontSize="9" fill="#67e8f9" fontFamily="monospace" textAnchor="end">{velText}</text>
        <text x="6" y="52" fontSize="7" fill="#64748b" fontFamily="monospace">ACEL</text>
        <text x="90" y="52" fontSize="9" fill={burning ? "#fbbf24" : "#475569"} fontFamily="monospace" textAnchor="end">{fmtNum(gNow, 2)} g</text>
      </Screen>
      <Screen x={608} y={202} w={86} h={66} title="TRAYECTORIA">
        <path d="M8 58 Q30 54 48 36 T80 14" stroke="#334155" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
        {(() => {
          const f = Math.min(1, Math.log10(1 + altKm * 1000) / 5.3);
          const px = 8 + f * 72;
          const py = 58 - Math.pow(f, 0.6) * 44;
          return (
            <>
              {f > 0 && <path d={`M8 58 Q${8 + f * 20} ${58 - f * 40} ${px} ${py}`} stroke="#22d3ee" strokeWidth="2" fill="none" />}
              <circle cx={px} cy={py} r="2.5" fill="#f97316" />
            </>
          );
        })()}
      </Screen>
      <Screen x={702} y={200} w={90} h={68} title="RELOJ DE MISIÓN">
        <text x="45" y="44" fontSize="17" fill={met < 0 ? "#fdba74" : "#86efac"} fontFamily="monospace" textAnchor="middle" fontWeight="bold">{mmss}</text>
        <text x="45" y="58" fontSize="5.5" fill={stage === "flight" ? "#fbbf24" : "#64748b"} fontFamily="monospace" textAnchor="middle">{event}</text>
      </Screen>
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={410 + i * 38} y="280" width="26" height="6" rx="1.5" fill="#3f3f46" stroke={INK} strokeWidth="0.5" />
      ))}

      {/* Asiento de lanzamiento moldeado, anclado al piso: Tomás va recostado de espaldas, como en las cápsulas reales */}
      <path d="M196 236 L224 236 L236 300 L184 300Z" fill="#27272a" stroke={INK} strokeWidth="1.4" />
      <rect x="176" y="292" width="72" height="8" fill="#18181b" stroke={INK} strokeWidth="1.6" />
      <g transform="rotate(-38 210 236)">
        {/* Respaldo con cabecera */}
        <path d="M172 236 L178 118 Q180 100 196 100 L206 100 Q214 102 212 116 L206 236Z" fill="#3f3f46" stroke={INK} strokeWidth="1.6" />
        <rect x="174" y="98" width="38" height="24" rx="8" fill="#52525b" stroke={INK} strokeWidth="1.6" />
        <path d="M182 128 L180 232" stroke="#27272a" strokeWidth="3" />
        {/* Asiento y apoyapiernas */}
        <path d="M172 228 L268 228 Q276 228 276 236 L276 246 L172 246Z" fill="#3f3f46" stroke={INK} strokeWidth="1.6" />
        <path d="M244 230 L244 200 Q244 192 252 192 L272 192 L272 230Z" fill="#3f3f46" stroke={INK} strokeWidth="1.4" />
        <Person x={210} y={GROUND} age={age} pose="sit" t={gestureT} outfit="spacesuit" helmet harness />
      </g>
      {/* Palanca de mando lateral */}
      <path d="M318 300 L318 262" stroke="#27272a" strokeWidth="6" strokeLinecap="round" />
      <rect x="312" y="246" width="12" height="18" rx="5" fill="#18181b" stroke={INK} strokeWidth="1.6" />
      <circle cx="318" cy="248" r="2" fill="#ef4444" />

      {/* Resplandor de los motores y polvo en el aire de la cabina */}
      {glow > 0 && <rect width={W} height="300" fill="#f97316" opacity={glow * 0.12} />}
    </g>
  );
}

const MONO = "ui-monospace, monospace";

/** Pantalla de la consola de la nave: cambia según la actividad de Tomás y muestra datos reales del vuelo. */
function ConsoleScreen({ props }: { props: ShipSceneProps }) {
  const { years, age, gestureT: t, alive, landed, timelapse, phase, sky, routeFraction, leg, lastMessageAge } = props;
  const w = 74;
  const h = 42;
  const beta = Math.tanh(sky.phi);
  const gamma = Math.cosh(sky.phi);
  const label = alive && !landed ? activityAt("ship", years, age).label : "";
  const mode = !alive || landed ? "standby" : timelapse ? "nav" : label.startsWith("Revisando") ? "nav" : label.startsWith("Experimentos") ? "lab" : label.startsWith("Leyendo") ? "inbox" : "radar";
  const txt = (x: number, y: number, s: string, fill = "#67e8f9", size = 3.4) => (
    <text x={x} y={y} fontSize={size} fill={fill} fontFamily={MONO}>{s}</text>
  );

  if (mode === "standby")
    return (
      <g>
        <rect width={w} height={h} fill="#020617" />
        {txt(16, 23, "SISTEMA EN REPOSO", "#475569", 3.6)}
      </g>
    );

  if (mode === "nav") {
    // Ruta Tierra → destino con la nave avanzando y estado de motores.
    const sx = 6 + Math.min(1, Math.max(0, routeFraction)) * 40;
    const thrust = phase === "cruise" ? 0 : 0.85 + Math.sin(t * 6) * 0.08;
    return (
      <g>
        <rect width={w} height={h} fill="#04101f" />
        {txt(2, 4.5, "NAVEGACIÓN", "#94a3b8", 3)}
        <line x1="6" y1="18" x2="46" y2="18" stroke="#334155" strokeWidth="1" strokeDasharray="1.5 1" />
        <circle cx="6" cy="18" r="2" fill="#38bdf8" />
        <circle cx="46" cy="18" r="2" fill="#fbbf24" />
        <path d={`M${sx - 2.5} 16 L${sx + 2.5} 18 L${sx - 2.5} 20Z`} fill="#f97316" transform={leg === "vuelta" ? `rotate(180 ${sx} 18)` : undefined} />
        <circle cx={sx} cy="18" r={3 + (t * 3) % 3} fill="none" stroke="#f97316" opacity={1 - ((t * 3) % 3) / 3} strokeWidth="0.5" />
        {txt(2, 29, `v ${(beta * 100).toFixed(3)}% c`)}
        {txt(2, 34, `γ ${gamma.toFixed(3)}`)}
        {txt(2, 39, phase === "cruise" ? "MOTORES: OFF" : "MOTORES: 1 g", phase === "cruise" ? "#94a3b8" : "#fbbf24")}
        <text x="52" y="4.5" fontSize="3" fill="#94a3b8" fontFamily={MONO}>EMPUJE</text>
        <rect x="56" y="7" width="8" height="32" fill="#0f172a" stroke="#334155" strokeWidth="0.5" />
        <rect x="56" y={7 + 32 * (1 - thrust)} width="8" height={32 * thrust} fill="#f97316" />
        {Array.from({ length: 4 }, (_, i) => <line key={i} x1="65" y1={7 + i * 10.7} x2="68" y2={7 + i * 10.7} stroke="#475569" strokeWidth="0.5" />)}
      </g>
    );
  }

  if (mode === "lab") {
    // Diagnóstico: registro que avanza y molécula girando.
    const logs = ["O2 21,0 %", "CO2 0,04 %", "REACTOR OK", "ESCUDO 98 %", "H2O 412 L", "RAD 0,3 mSv", "HIDRO OK", "SENSORES OK"];
    const scroll = Math.floor(t * 1.5);
    const a = t * 1.2;
    return (
      <g>
        <rect width={w} height={h} fill="#0b0f1e" />
        {txt(2, 4.5, "DIAGNÓSTICO", "#94a3b8", 3)}
        {Array.from({ length: 6 }, (_, i) => {
          const line = logs[(scroll + i) % logs.length];
          return <g key={i}>{txt(2, 10 + i * 5.4, `> ${line}`, i === 5 ? "#86efac" : "#4ade80aa", 3.2)}</g>;
        })}
        <g transform="translate(58 22)">
          {[0, 1, 2].map((k) => {
            const ang = a + (k * Math.PI * 2) / 3;
            const x = Math.cos(ang) * 9;
            const y = Math.sin(ang) * 4;
            return (
              <g key={k}>
                <line x1="0" y1="0" x2={x} y2={y} stroke="#94a3b8" strokeWidth="0.8" />
                <circle cx={x} cy={y} r="2.4" fill={["#f87171", "#60a5fa", "#e2e8f0"][k]} />
              </g>
            );
          })}
          <circle r="3.2" fill="#facc15" />
        </g>
      </g>
    );
  }

  if (mode === "inbox")
    return (
      <g>
        <rect width={w} height={h} fill="#0b1220" />
        {txt(2, 4.5, "MENSAJES · TIERRA", "#94a3b8", 3)}
        <rect x="2" y="7" width={w - 4} height="13" rx="1.5" fill="#1e3a5f" />
        <circle cx="8" cy="13.5" r="4" fill="#f2c9a0" />
        {txt(14, 12, "Martín", "#e2e8f0", 3.4)}
        {txt(14, 17, `grabado a los ${Math.floor(lastMessageAge)}`, "#94a3b8", 2.8)}
        {Array.from({ length: 3 }, (_, i) => (
          <rect key={i} x="4" y={24 + i * 5.5} width={(0.5 + 0.4 * Math.abs(Math.sin(i * 2.1))) * (w - 8) * Math.min(1, (t * 0.6 - i * 0.6) % 4)} height="2" rx="1" fill="#93c5fd" opacity="0.7" />
        ))}
      </g>
    );

  // Radar de proximidad con barrido.
  const sweep = (t * 1.6) % (Math.PI * 2);
  return (
    <g>
      <rect width={w} height={h} fill="#021a12" />
      <g transform={`translate(${w / 2} ${h / 2 + 2})`}>
        {[6, 12, 18].map((r) => <circle key={r} r={r} fill="none" stroke="#14532d" strokeWidth="0.6" />)}
        <line x1="0" y1="0" x2={Math.cos(sweep) * 18} y2={Math.sin(sweep) * 18} stroke="#4ade80" strokeWidth="1" />
        <path d={`M0 0 L${Math.cos(sweep) * 18} ${Math.sin(sweep) * 18} A18 18 0 0 0 ${Math.cos(sweep - 0.6) * 18} ${Math.sin(sweep - 0.6) * 18}Z`} fill="#4ade80" opacity="0.18" />
        {[[8, -6], [-11, 5], [3, 12]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1" fill="#86efac" opacity={0.3 + 0.7 * Math.max(0, Math.cos(sweep - Math.atan2(y, x)))} />
        ))}
      </g>
      {txt(2, 4.5, "RADAR · DESPEJADO", "#4ade80", 3)}
    </g>
  );
}

function CabinBackdrop({ props, lights = 1 }: { props: ShipSceneProps; lights?: number }) {
  const { gestureT } = props;
  // En hipersueño la mesa se pliega y su lugar lo ocupa la cápsula.
  const folded = !!props.cryo && props.alive;
  return (
    <>
      <defs>
        <linearGradient id="c-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#475569" />
          <stop offset="1" stopColor="#334155" />
        </linearGradient>
      </defs>
      <rect width={W} height="300" fill="url(#c-wall)" />
      {/* Paneles con remaches */}
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i}>
          <rect x={i * 100 + 5} y="16" width="90" height="226" rx="8" fill="#526178" stroke="#1e293b" />
          {[24, 230].map((y) => [14, 82].map((dx) => <circle key={`${y}-${dx}`} cx={i * 100 + dx} cy={y} r="1.6" fill="#94a3b8" />))}
        </g>
      ))}
      {/* Tubería y franja de luz */}
      <rect x="0" y="6" width={W} height="7" fill="#94a3b8" stroke={INK} strokeWidth="1.6" />
      <rect x="0" y="0" width={W} height="5" fill="#e0f2fe" opacity={0.6 * lights} />
      <path d="M0 250 H800" stroke="#64748b" strokeWidth="5" />
      <rect y={GROUND} width={W} height="40" fill="#1e293b" />
      {Array.from({ length: 20 }, (_, i) => (
        <rect key={i} x={i * 40 + 2} y={GROUND + 4} width="36" height="6" fill="#334155" />
      ))}
      {/* Pasamanos */}
      <path d="M220 150 h120" stroke={INK} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M220 150 h120" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
      {/* Huerto hidropónico */}
      <rect x="300" y="40" width="92" height="56" rx="6" fill="#0f172a" stroke={INK} strokeWidth="1.6" />
      <rect x="300" y="40" width="92" height="56" rx="6" fill="#a855f7" opacity="0.18" />
      {/* Cultivos en ciclos de ~90 días: crecen, amarillean un poco antes de la cosecha y vuelven a brotar */}
      {Array.from({ length: 6 }, (_, i) => {
        const g = ((props.years * 365.25) / 90 + i * 0.07) % 1;
        const s = 0.35 + g * 0.75;
        const ripe = g > 0.85;
        return (
          <g key={i} transform={`translate(${312 + i * 14} 86) scale(${s})`}>
            <path d="M0 0 q-6 -10 0 -18 q6 8 0 18" fill={ripe ? "#a3e635" : "#22c55e"} stroke={INK} strokeWidth="0.6" />
            <path d="M0 0 q6 -8 2 -14" fill="none" stroke="#16a34a" strokeWidth="1.5" />
            {ripe && <circle cx="3" cy="-12" r="2.4" fill="#ef4444" stroke={INK} strokeWidth="0.5" />}
          </g>
        );
      })}
      {/* Con los años la cabina se gasta: manchas, marcas de roce y parches de cinta */}
      {props.stage !== "boarding" &&
        Array.from({ length: Math.min(14, Math.floor(props.years / 1.5)) }, (_, k) => {
          const x = 30 + ((k * 211) % 740);
          const y = 150 + ((k * 37) % 80);
          return <ellipse key={k} cx={x} cy={y} rx={6 + (k % 3) * 3} ry={2 + (k % 2)} fill="#1e293b" opacity="0.18" transform={`rotate(${(k * 23) % 40 - 20} ${x} ${y})`} />;
        })}
      {props.years > 8 && (
        <g transform="rotate(-8 128 196)">
          <rect x="112" y="190" width="34" height="9" fill="#cbd5e1" opacity="0.85" stroke="#94a3b8" strokeWidth="0.6" />
          <path d="M112 190 v9 M146 190 v9" stroke="#94a3b8" strokeWidth="0.6" strokeDasharray="1 1" />
        </g>
      )}
      {/* Fotos que manda Martín: Tomás las va pegando en la pared */}
      {Array.from({ length: Math.min(9, Math.floor(props.years / 2)) }, (_, k) => {
        const spots = [[98, 72], [132, 96], [96, 120], [418, 64], [452, 86], [488, 62], [524, 88], [560, 66], [236, 112]];
        const [x, y] = spots[k];
        return (
          <g key={k} transform={`rotate(${((k * 47) % 24) - 12} ${x + 10} ${y + 12})`}>
            <rect x={x} y={y} width="20" height="24" fill="#f8fafc" stroke={INK} strokeWidth="1" />
            <rect x={x + 2.5} y={y + 2.5} width="15" height="14" fill={["#7dd3fc", "#fcd34d", "#86efac", "#fca5a5", "#c4b5fd"][k % 5]} />
            <circle cx={x + 10} cy={y + 9} r="3.2" fill="#f2c9a0" />
            <rect x={x + 6.5} y={y + 12} width="7" height="4.5" rx="1.5" fill={k % 2 ? "#2563eb" : "#7c5c3b"} />
            <circle cx={x + 10} cy={y + 1} r="1.4" fill="#ef4444" stroke={INK} strokeWidth="0.4" />
          </g>
        );
      })}
      {/* Foto del hermano */}
      <rect x="176" y="56" width="42" height="52" fill="#fef3c7" stroke="#78350f" strokeWidth="3" />
      <circle cx="197" cy="75" r="8" fill="#f2c9a0" stroke={INK} strokeWidth="0.6" />
      <path d="M189 73 q8 -11 16 0" fill="#3a2618" stroke={INK} strokeWidth="0.7" />
      <rect x="187" y="85" width="20" height="18" rx="3" fill="#2563eb" stroke={INK} strokeWidth="0.7" />
      {/* Ventana relativista: un clic la abre en grande */}
      <g onClick={props.onOpenWindow} role="button" aria-label="Mirar por la ventana" className="cursor-pointer">
        <title>Mirar por la ventana</title>
        <foreignObject x="612" y="36" width="176" height="156">
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden" }}>
            <RelativisticSky {...props.sky} />
          </div>
        </foreignObject>
        <ellipse cx="700" cy="114" rx="90" ry="80" fill="none" stroke="#cbd5e1" strokeWidth="10" className="transition hover:stroke-cyan-200" />
      </g>
      <ellipse cx="700" cy="114" rx="96" ry="86" fill="none" stroke={INK} strokeWidth="1.5" />
      {Array.from({ length: 8 }, (_, i) => (
        <circle key={i} cx={700 + Math.cos((i * Math.PI) / 4) * 93} cy={114 + Math.sin((i * Math.PI) / 4) * 83} r="2.4" fill="#64748b" />
      ))}
      {/* Litera con saco de dormir */}
      <rect x="22" y={GROUND - 46} width="136" height="10" rx="3" fill="#64748b" stroke={INK} strokeWidth="1.6" />
      <rect x="22" y={GROUND - 36} width="136" height="36" fill="#475569" stroke={INK} strokeWidth="1.6" />
      <rect x="22" y={GROUND - 100} width="8" height="100" fill="#64748b" stroke={INK} strokeWidth="1.6" />
      {/* Mesa plegable */}
      {!folded && <rect x="214" y={GROUND - 54} width="84" height="8" rx="2" fill="#cbd5e1" stroke={INK} strokeWidth="1.6" />}
      {!folded && <rect x="252" y={GROUND - 46} width="7" height="46" fill="#94a3b8" stroke={INK} strokeWidth="1.6" />}
      {/* Cinta de correr con arnés */}
      <rect x="348" y={GROUND - 14} width="96" height="14" rx="4" fill="#0f172a" stroke={INK} strokeWidth="1.6" />
      <path d="M432 248 L444 182" stroke={INK} strokeWidth="7.4" />
      <path d="M432 248 L444 182" stroke="#64748b" strokeWidth="5" />
      <rect x="436" y="176" width="20" height="10" rx="2" fill="#1e293b" stroke={INK} strokeWidth="1.4" />
      {/* Consola de navegación */}
      <rect x="470" y={GROUND - 58} width="96" height="58" fill="#0f172a" stroke={INK} strokeWidth="1.6" />
      {/* La pantalla de navegación abre el mapa */}
      <g onClick={props.onOpenMap} role="button" aria-label="Abrir el mapa de navegación" className="cursor-pointer transition hover:brightness-150">
        <title>Abrir el mapa de navegación</title>
        <rect x="478" y={GROUND - 112} width="80" height="48" rx="4" fill="#020617" stroke="#475569" strokeWidth="3" />
        <g transform={`translate(481 ${GROUND - 109})`}>
          <ConsoleScreen props={props} />
        </g>
      </g>
      {/* Reloj de la misión sobre la consola: abre la comparación de relojes */}
      {(() => {
        const days = props.years * 365.25 + 9 / 24;
        const h = (days % 1) * 24;
        const hh = String(Math.floor(h)).padStart(2, "0");
        const mm = String(Math.floor((h % 1) * 60)).padStart(2, "0");
        return (
          <g onClick={props.onOpenClocks} role="button" aria-label="Comparar los relojes de los dos hermanos" className="cursor-pointer transition hover:brightness-150">
            <title>Comparar los relojes de Tomás y Martín</title>
            <rect x="482" y={GROUND - 140} width="72" height="20" rx="4" fill="#0b1120" stroke={INK} strokeWidth="1.6" />
            <text x="487" y={GROUND - 126} fontSize="7" fill="#94a3b8" fontFamily="monospace">DÍA</text>
            <text x="503" y={GROUND - 126} fontSize="8" fill="#fbbf24" fontFamily="monospace" fontWeight="bold">
              {Math.floor(days) + 1}
            </text>
            <text x="550" y={GROUND - 126} fontSize="8" fill="#67e8f9" fontFamily="monospace" textAnchor="end">
              {hh}:{mm}
            </text>
          </g>
        );
      })()}
      {Array.from({ length: 8 }, (_, i) => (
        <circle key={i} cx={480 + i * 10} cy={GROUND - 46} r="2.5" fill={["#22c55e", "#ef4444", "#f59e0b"][(i + Math.floor(gestureT)) % 3]} stroke={INK} strokeWidth="0.8" />
      ))}
      {/* Taburetes */}
      {(folded ? [SHIP_PLACES.console * W] : [0.32 * W - 30, SHIP_PLACES.console * W]).map((cx) => (
        <g key={cx} fill="#64748b" stroke={INK} strokeWidth="0.8">
          <rect x={cx - 13} y={GROUND - 28} width="26" height="5" rx="2" />
          <rect x={cx - 2} y={GROUND - 28} width="4" height="28" />
        </g>
      ))}
    </>
  );
}

/** Cápsula de hipersueño sobre la litera: Tomás dormido bajo un vidrio escarchado, con signos vitales muy lentos. */
function CryoPod({ age, t }: { age: number; t: number }) {
  // En el centro de la cabina (donde va la mesa plegada), a la vista entre los paneles de información.
  const x0 = 196;
  const y0 = GROUND - 84;
  // Un latido cada ~6 s: el metabolismo casi detenido.
  const beat = (t / 6) % 1 < 0.05;
  return (
    <g>
      {/* Base con tubos de refrigerante */}
      <rect x={x0} y={GROUND - 30} width="140" height="30" rx="6" fill="#334155" stroke={INK} strokeWidth="1.6" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={x0 + 14 + i * 40} y={GROUND - 22} width="26" height="5" rx="2.5" fill="#0ea5e9" opacity={0.45 + 0.25 * Math.sin(t * 1.2 + i)} />
      ))}
      <Sleeper x={x0 + 12} y={GROUND - 30} length={118} age={age} t={t * 0.15} blanket="#cbd5e1" pillow="#e0f2fe" frail />
      {/* Cúpula de vidrio con escarcha en los bordes */}
      <path d={`M${x0 + 4} ${GROUND - 30} Q${x0 + 4} ${y0} ${x0 + 70} ${y0} Q${x0 + 136} ${y0} ${x0 + 136} ${GROUND - 30}Z`} fill="#bae6fd" opacity="0.28" stroke="#e0f2fe" strokeWidth="2" />
      <path d={`M${x0 + 4} ${GROUND - 30} Q${x0 + 4} ${y0} ${x0 + 70} ${y0} Q${x0 + 136} ${y0} ${x0 + 136} ${GROUND - 30}`} fill="none" stroke={INK} strokeWidth="1.6" />
      <path d={`M${x0 + 22} ${GROUND - 56} Q${x0 + 30} ${y0 + 8} ${x0 + 60} ${y0 + 6}`} stroke="#fff" strokeWidth="2.4" fill="none" opacity="0.6" />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 15) * Math.PI;
        const cx = x0 + 70 - Math.cos(a) * 64;
        const cy = GROUND - 30 - Math.sin(a) * 50;
        return <circle key={i} cx={cx} cy={cy} r={2 + (i % 3)} fill="#f0f9ff" opacity="0.55" />;
      })}
      {/* Neblina fría que cae por los costados */}
      {[0, 1, 2, 3].map((i) => {
        const k = (t * 0.25 + i / 4) % 1;
        return <ellipse key={i} cx={x0 + 6 + i * 44 + k * 10} cy={GROUND - 4 + k * 3} rx={10 + k * 12} ry={3 + k * 2} fill="#e0f2fe" opacity={0.35 * (1 - k)} />;
      })}
      {/* Panel de signos vitales */}
      <rect x={x0 + 146} y={GROUND - 74} width="40" height="30" rx="3" fill="#0f172a" stroke={INK} strokeWidth="1.4" />
      <line x1={x0 + 166} y1={GROUND - 44} x2={x0 + 166} y2={GROUND} stroke="#475569" strokeWidth="3" />
      <text x={x0 + 150} y={GROUND - 65} fontSize="5" fill="#7dd3fc" fontFamily="monospace">CRIO −5 °C</text>
      <text x={x0 + 150} y={GROUND - 57} fontSize="5" fill={beat ? "#f87171" : "#86efac"} fontFamily="monospace">♥ 1/día</text>
      <path d={`M${x0 + 150} ${GROUND - 50} h10 ${beat ? "l2 -5 l2 8 l2 -3" : "h6"} h14`} stroke="#22c55e" strokeWidth="0.9" fill="none" />
      <text x={x0 + 100} y={GROUND - 88} fontSize="7" fill="#e0f2fe" opacity="0.8">❄ z</text>
    </g>
  );
}

/**
 * Compuerta de mantenimiento en la pared bajo la ventana. `open` va de 0 (cerrada) a 1 (abierta):
 * la puerta gira sobre su bisagra izquierda y deja ver el cableado.
 */
function MaintenanceHatch({ open, t, sparks }: { open: number; t: number; sparks: boolean }) {
  const x0 = 644;
  const y0 = 204;
  const w = 46;
  const h = 46;
  const angle = open * 115 * (Math.PI / 180);
  const edge = x0 + w * Math.cos(angle);
  const bulge = Math.sin(angle) * 5; // el borde libre se acerca a la cámara y se ve más alto
  const shade = Math.round(100 - Math.sin(angle) * 22);
  return (
    <g>
      {/* Marco y hueco con el cableado */}
      <rect x={x0 - 3} y={y0 - 3} width={w + 6} height={h + 6} rx="4" fill="#334155" stroke={INK} strokeWidth="1.6" />
      <rect x={x0} y={y0} width={w} height={h} rx="2" fill="#0b1120" />
      {open > 0 && (
        <g opacity={Math.min(1, open * 2)}>
          <path d={`M${x0 + 4} ${y0 + 8} C${x0 + 16} ${y0 + 18} ${x0 + 8} ${y0 + 30} ${x0 + 26} ${y0 + 36} M${x0 + 8} ${y0 + 4} C${x0 + 24} ${y0 + 14} ${x0 + 32} ${y0 + 26} ${x0 + 42} ${y0 + 40}`} stroke="#ef4444" strokeWidth="1.6" fill="none" />
          <path d={`M${x0 + 4} ${y0 + 24} C${x0 + 16} ${y0 + 28} ${x0 + 26} ${y0 + 18} ${x0 + 42} ${y0 + 26}`} stroke="#22c55e" strokeWidth="1.6" fill="none" />
          <path d={`M${x0 + 6} ${y0 + 40} h14 v-8 h12`} stroke="#facc15" strokeWidth="1.2" fill="none" />
          <rect x={x0 + 30} y={y0 + 6} width="10" height="7" rx="1" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
          <circle cx={x0 + 35} cy={y0 + 9.5} r="1.3" fill={Math.floor(t * 3) % 2 ? "#ef4444" : "#7f1d1d"} />
          {sparks && Math.sin(t * 13) > 0.4 && (
            <g stroke="#fde047" strokeWidth="0.9">
              {[0, 1, 2, 3].map((k) => {
                const a = k * 1.6 + t * 4;
                return <line key={k} x1={x0 + 26} y1={y0 + 36} x2={x0 + 26 + Math.cos(a) * 6} y2={y0 + 36 + Math.sin(a) * 6} />;
              })}
            </g>
          )}
        </g>
      )}
      {/* La puerta: un trapecio que se angosta y se oscurece al girar sobre la bisagra */}
      <path
        d={`M${x0} ${y0} L${edge} ${y0 - bulge} L${edge} ${y0 + h + bulge} L${x0} ${y0 + h}Z`}
        fill={`rgb(${shade},${shade + 16},${shade + 36})`}
        stroke={INK}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {open < 0.35 && (
        <g opacity={1 - open / 0.35}>
          {/* Remaches, manija y cartel de advertencia de la puerta cerrada */}
          {[[5, 5], [w - 5, 5], [5, h - 5], [w - 5, h - 5]].map(([dx, dy]) => (
            <circle key={`${dx}-${dy}`} cx={x0 + dx * Math.cos(angle)} cy={y0 + dy} r="1.4" fill="#94a3b8" stroke={INK} strokeWidth="0.5" />
          ))}
          <rect x={x0 + (w - 9) * Math.cos(angle)} y={y0 + h / 2 - 6} width={4 * Math.cos(angle) + 0.5} height="12" rx="1.5" fill="#cbd5e1" stroke={INK} strokeWidth="0.8" />
          <g transform={`translate(${x0 + 9 * Math.cos(angle)} ${y0 + 9}) scale(${Math.cos(angle)} 1)`}>
            <path d="M0 10 L7 0 L14 10Z" fill="#facc15" stroke={INK} strokeWidth="0.8" />
            <text x="7" y="8.6" fontSize="7" textAnchor="middle" fontWeight="bold" fill={INK}>!</text>
          </g>
          <path d={`M${x0 + 6 * Math.cos(angle)} ${y0 + h - 12} h${22 * Math.cos(angle)}`} stroke="#64748b" strokeWidth="1.2" />
        </g>
      )}
      {/* Bisagras */}
      <rect x={x0 - 2} y={y0 + 6} width="3" height="7" rx="1" fill="#94a3b8" stroke={INK} strokeWidth="0.6" />
      <rect x={x0 - 2} y={y0 + h - 13} width="3" height="7" rx="1" fill="#94a3b8" stroke={INK} strokeWidth="0.6" />
    </g>
  );
}

/** Objetos sueltos que flotan en ingravidez (motores apagados). */
function FloatingStuff({ t }: { t: number }) {
  const drift = (k: number, ax: number, ay: number) => [ax + Math.sin(t * 0.21 + k) * 40, ay + Math.cos(t * 0.17 + k * 2) * 18] as const;
  const [bx, by] = drift(0, 260, 170);
  const [ax, ay] = drift(1, 420, 120);
  const [px, py] = drift(2, 560, 190);
  const [wx, wy] = drift(3, 170, 130);
  return (
    <g>
      {/* Gota de agua que se deforma */}
      <ellipse cx={wx} cy={wy} rx={5 + Math.sin(t * 3) * 1.2} ry={5 - Math.sin(t * 3) * 1.2} fill="#7dd3fc" opacity="0.8" stroke="#0369a1" strokeWidth="0.6" />
      <circle cx={wx - 1.5} cy={wy - 1.5} r="1.2" fill="#fff" opacity="0.8" />
      {/* Manzana */}
      <g transform={`translate(${ax} ${ay}) rotate(${t * 20})`}>
        <circle r="5" fill="#dc2626" stroke={INK} strokeWidth="0.8" />
        <path d="M0 -5 l1 -3" stroke="#78350f" strokeWidth="1.2" />
      </g>
      {/* Lápiz */}
      <g transform={`translate(${px} ${py}) rotate(${t * 35})`}>
        <rect x="-8" y="-1.2" width="16" height="2.4" fill="#facc15" stroke={INK} strokeWidth="0.5" />
        <path d="M8 -1.2 L11 0 L8 1.2Z" fill="#78350f" />
      </g>
      {/* Libro abierto */}
      <g transform={`translate(${bx} ${by}) rotate(${Math.sin(t * 0.4) * 30})`}>
        <path d="M-9 -5 L0 -3 L9 -5 L9 5 L0 7 L-9 5Z" fill="#fef3c7" stroke={INK} strokeWidth="0.7" />
        <line x1="0" y1="-3" x2="0" y2="7" stroke={INK} strokeWidth="0.6" />
      </g>
    </g>
  );
}

function Cabin({ props }: { props: ShipSceneProps }) {
  const { years, age, timelapse, gestureT, phase, alive } = props;
  const weightless = phase === "cruise";
  const act = activityAt("ship", years, age);
  const px = act.walkingFrom !== undefined ? (act.walkingFrom + (act.place - act.walkingFrom) * (act.walkT ?? 0)) * W : act.place * W;
  const seated = ["type", "eat", "sit", "guitar", "violin", "read"].includes(act.pose);
  // En la consola se sienta en su banqueta, a la derecha, mirando hacia la pantalla.
  const settled = act.walkingFrom === undefined;
  const atConsole = settled && act.place === SHIP_PLACES.console;
  const repairing = settled && act.label === "Reparando un panel";
  const gardening = settled && act.label === "Cuidando el huerto hidropónico";
  const pose = weightless && act.pose !== "sleep" ? "float" : act.pose;
  const floatY = GROUND - 44 + Math.sin(gestureT * 0.7) * 8;
  const hour = hourOfDay(years);
  const night = alive && !timelapse && (hour < 7 || hour >= 23);
  const sleeper = <Sleeper x={32} y={GROUND - 46} length={124} age={age} t={gestureT} blanket="#f97316" pillow="#cbd5e1" />;
  const offset = atConsole ? 0 : seated && !weightless ? 30 : act.pose === "stand" ? 60 : 0;
  const violin = musicSkill(practiceHours("ship", years));
  const mood: Mood = props.sadNews
    ? "sad"
    : act.pose === "violin"
      ? violin.skill < 0.2
        ? Math.sin(gestureT * 1.3) > 0.4 ? "sour" : "focused"
        : violin.skill >= 0.8
          ? "joy"
          : "happy"
      : act.pose === "run" || act.pose === "exercise"
        ? "effort"
        : act.label === "Reparando un panel" || act.pose === "type"
          ? "focused"
          : act.pose === "read" || act.prop === "camera" || act.pose === "reach"
            ? "happy"
            : "neutral";
  return (
    <>
      <CabinBackdrop props={props} />
      {/* Compuerta de mantenimiento bajo la ventana: cerrada, y se abre mientras la repara */}
      <MaintenanceHatch
        open={props.cryo || act.label !== "Reparando un panel" ? 0 : Math.max(0, Math.min(1, (hour - 11) / 0.06, (12 - hour) / 0.06))}
        t={gestureT}
        sparks={repairing && !timelapse}
      />
      {/* Luz de crecimiento del huerto cuando lo cuida */}
      {gardening && !props.cryo && <rect x="300" y="96" width="92" height="40" fill="#e879f9" opacity={0.12 + Math.sin(gestureT * 2) * 0.05} pointerEvents="none" />}
      {weightless && alive && !timelapse && !props.cryo && <FloatingStuff t={gestureT} />}
      {alive && props.cryo ? (
        <CryoPod age={age} t={gestureT} />
      ) : alive ? (
        timelapse ? (
          <>
            <Sleeper x={32} y={GROUND - 46} length={124} age={age} t={gestureT} blanket="#f97316" pillow="#cbd5e1" opacity={0.35} />
            <Person x={SHIP_PLACES.console * W} y={weightless ? floatY : GROUND} age={age} pose={weightless ? "float" : "type"} t={gestureT} opacity={0.4} facing={-1} outfit="flightsuit" />
            <Person x={0.48 * W} y={weightless ? floatY : GROUND - 14} age={age} pose={weightless ? "float" : "run"} t={gestureT} opacity={0.4} outfit="flightsuit" />
          </>
        ) : act.pose === "sleep" ? (
          sleeper
        ) : (
          <Person
            x={px - offset}
            y={weightless ? floatY : act.pose === "run" ? GROUND - 14 : GROUND}
            age={age}
            pose={pose}
            t={
              pose === "walk" && act.walkingFrom !== undefined
                ? walkClock((act.place - act.walkingFrom) * (act.walkT ?? 0) * W, age)
                : act.pose === "violin"
                  ? gestureT * (0.6 + violin.skill)
                  : gestureT
            }
            facing={atConsole || repairing || (act.walkingFrom !== undefined && act.place < act.walkingFrom) ? -1 : 1}
            outfit="flightsuit"
            prop={act.prop}
            mood={mood}
            skill={violin.skill}
          />
        )
      ) : (
        <g>
          <rect x="50" y={GROUND - 64} width="90" height="18" rx="4" fill="#e2e8f0" stroke={INK} strokeWidth="1.6" />
          <text x="400" y="140" fontSize="14" textAnchor="middle" fill="#e2e8f0">{SHIP_NAME} ya no está. La nave sigue en piloto automático.</text>
        </g>
      )}
      {alive && !props.cryo && !timelapse && act.pose === "violin" && act.walkingFrom === undefined && (
        <MusicNotes x={px - offset + 20} y={(weightless ? floatY : GROUND) - 78} t={gestureT} skill={violin.skill} />
      )}
      {/* La roca que trae de recuerdo, sobre la mesa durante el regreso */}
      {props.planet && props.leg === "vuelta" && !props.cryo && (
        <g transform={`translate(270 ${GROUND - 58})`}>
          <path d="M-7 4 L-6 -3 L0 -6 L7 -2 L7 4Z" fill={props.planet.rock} stroke={INK} strokeWidth="0.9" />
          <rect x="-9" y="4" width="18" height="2" fill="#94a3b8" />
        </g>
      )}
      {/* Iluminación nocturna de la cabina */}
      {night && (
        <>
          <rect width={W} height="300" fill="#0b1a4a" opacity="0.4" pointerEvents="none" />
          <rect x="0" y={GROUND - 2} width={W} height="3" fill="#38bdf8" opacity="0.6" pointerEvents="none" />
        </>
      )}
    </>
  );
}

/** Planeta de Miller: océano poco profundo bajo Gargantúa; llega una ola gigante y Tomás corre a la Ranger. */
function Miller({ props }: { props: ShipSceneProps }) {
  const { age, gestureT, alive } = props;
  const p = props.millerProgress ?? 0;
  // La ola gigante (montañas de agua por la marea del agujero negro) se acerca en la última parte.
  const waveX = p < 0.55 ? 900 : 900 - ((p - 0.55) / 0.45) * 760;
  const waveH = p < 0.55 ? 0 : 60 + ((p - 0.55) / 0.45) * 170;
  const running = p > 0.6;
  const tx = running ? 360 - Math.min(1, (p - 0.6) / 0.3) * 150 : 360 + Math.sin(gestureT * 0.2) * 90;
  const facing: 1 | -1 = running ? -1 : Math.cos(gestureT * 0.2) >= 0 ? 1 : -1;
  const inside = p > 0.92;
  return (
    <>
      <defs>
        <linearGradient id="m-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#64748b" />
          <stop offset="1" stopColor="#1e293b" />
        </linearGradient>
      </defs>
      <rect width={W} height="300" fill="#0b1020" />
      {Array.from({ length: 40 }, (_, k) => <circle key={k} cx={(k * 173) % 800} cy={(k * 59) % 160} r="0.8" fill="#fff" opacity="0.6" />)}
      {/* Gargantúa: disco de acreción visto de canto y su imagen curvada por la gravedad */}
      <g transform="translate(470 128) rotate(-4)">
        <Gargantua r={44} t={gestureT} idp="miller" />
      </g>
      {/* Océano poco profundo hasta las rodillas */}
      <rect y="200" width={W} height="100" fill="url(#m-sea)" />
      {Array.from({ length: 8 }, (_, k) => (
        <path key={k} d={`M${((k * 110 + gestureT * 20) % 900) - 60} ${214 + (k % 4) * 14} q15 -4 30 0`} stroke="#cbd5e1" strokeWidth="1.2" fill="none" opacity="0.5" />
      ))}
      {/* La Ranger, posada en el agua */}
      <g transform={`translate(150 ${GROUND - 8})`}>
        <path d="M-72 -16 L-66 -40 L-50 -40 L-40 -32 L40 -32 L74 -20 L70 -14 L-72 -14Z" fill="#52525b" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M-66 -40 L-62 -58 L-52 -58 L-48 -40Z" fill="#3f3f46" stroke={INK} strokeWidth="1.2" />
        <rect x="-14" y="-30" width="14" height="16" fill={inside ? "#fde68a" : "#18181b"} stroke={INK} strokeWidth="1.6" />
        <rect x="-30" y="-27" width="60" height="2.5" fill="#f97316" opacity="0.85" />
        <rect x="-80" y="-14" width="160" height="8" fill="#334155" opacity="0.6" />
      </g>
      {/* La ola gigante */}
      {waveH > 0 && (
        <path
          d={`M${waveX - 220} 300 C${waveX - 120} 280 ${waveX - 40} ${260 - waveH} ${waveX + 30} ${250 - waveH} C${waveX + 90} ${245 - waveH} ${waveX + 160} ${240 - waveH * 0.6} ${waveX + 400} ${230 - waveH * 0.5} L${waveX + 400} 300Z`}
          fill="#475569"
          stroke="#cbd5e1"
          strokeWidth="2"
          opacity="0.95"
        />
      )}
      {alive && !inside && (
        <>
          <Person x={tx} y={GROUND + 4} age={age} pose="walk" t={walkClock(gestureT * (running ? 60 : 18), age)} facing={facing} outfit="spacesuit" helmet mood={running ? "effort" : "focused"} />
          <ellipse cx={tx} cy={GROUND + 6} rx="20" ry="3" fill="#e2e8f0" opacity="0.5" />
        </>
      )}
      <text x="400" y="290" fontSize="11" textAnchor="middle" fill="#fde68a" fontFamily="monospace">
        1 hora aquí = 7 años en la Tierra
      </text>
    </>
  );
}

/** Planeta o luna que domina el cielo. */
function SkyBody({ parent }: { parent: PlanetInfo["parent"] }) {
  if (parent === "mars")
    return (
      <g>
        <circle cx="640" cy="54" r="9" fill="#fef3c7" opacity="0.9" />
        <circle cx="640" cy="54" r="20" fill="#fef3c7" opacity="0.15" />
        <ellipse cx="200" cy="70" rx="6" ry="4" fill="#78716c" />
      </g>
    );
  if (parent === "jupiter")
    return (
      <g transform="translate(560 90)">
        <circle r="78" fill="#d6a46a" />
        {[-50, -28, -8, 14, 36, 56].map((y, i) => (
          <rect key={y} x="-80" y={y} width="160" height={i % 2 ? 9 : 6} fill={i % 2 ? "#b45309" : "#fde68a"} opacity="0.55" />
        ))}
        <ellipse cx="26" cy="24" rx="14" ry="8" fill="#c2410c" opacity="0.8" />
        <circle r="78" fill="none" stroke="#00000033" strokeWidth="20" />
      </g>
    );
  if (parent === "saturn")
    return (
      <g transform="translate(560 80) rotate(-14)" opacity="0.75">
        <ellipse rx="120" ry="20" fill="none" stroke="#fde68a" strokeWidth="10" />
        <circle r="54" fill="#eab308" />
        <path d="M-120 0 A120 20 0 0 0 120 0" fill="none" stroke="#fde68a" strokeWidth="10" />
      </g>
    );
  return (
    <g transform="translate(560 80)">
      <circle r="60" fill="#3b82f6" />
      <ellipse cx="-14" cy="-10" rx="22" ry="9" fill="#93c5fd" opacity="0.5" />
      <circle r="60" fill="none" stroke="#1e3a8a" strokeOpacity="0.5" strokeWidth="14" />
    </g>
  );
}

/** Tomás en la superficie del planeta: explora, planta la bandera, recoge rocas y mira el cielo. */
function Surface({ props }: { props: ShipSceneProps }) {
  const { years, age, gestureT, alive, planet, surfaceDay } = props;
  if (!planet) return null;
  const hour = hourOfDay(years);
  const act = surfaceActivity(hour, surfaceDay);
  const g = planet.gravity;
  const walking = act.pose === "walk";
  // Con poca gravedad se camina dando saltitos.
  const roam = 320 + Math.sin(gestureT * 0.15) * 200;
  const x = walking ? roam : act.place * W;
  const facing: 1 | -1 = walking ? (Math.cos(gestureT * 0.15) >= 0 ? 1 : -1) : act.prop === "camera" ? -1 : 1;
  const hop = walking ? Math.abs(Math.sin(gestureT * 2.2)) * 14 * (1 - g) : 0;
  const darkSky = planet.sky === "#020617";
  const flagUp = surfaceDay >= 0.12;
  return (
    <>
      <rect width={W} height="300" fill={planet.sky} />
      {darkSky &&
        Array.from({ length: 50 }, (_, k) => <circle key={k} cx={(k * 157) % 800} cy={(k * 71) % 180} r={k % 6 === 0 ? 1.2 : 0.6} fill="#fff" opacity="0.8" />)}
      {planet.parent === "saturn" && <rect width={W} height="300" fill="#f59e0b" opacity="0.25" />}
      <SkyBody parent={planet.parent} />
      {/* Terreno con colinas, cráteres y rocas */}
      <path d={`M0 210 Q140 180 280 205 T560 196 T800 208 V300 H0Z`} fill={planet.groundDark} />
      <path d={`M0 ${GROUND - 14} Q200 ${GROUND - 30} 420 ${GROUND - 16} T800 ${GROUND - 12} V300 H0Z`} fill={planet.ground} />
      {[120, 470, 700].map((cx, k) => (
        <ellipse key={cx} cx={cx} cy={GROUND + 8 + k * 6} rx={30 - k * 6} ry="6" fill={planet.groundDark} opacity="0.6" />
      ))}
      {Array.from({ length: 14 }, (_, k) => (
        <path key={k} d={`M${(k * 61) % 800} ${GROUND + 2 + (k % 4) * 8} l4 -6 l6 1 l3 5Z`} fill={planet.rock} stroke="#00000044" strokeWidth="0.6" />
      ))}
      {/* Huellas */}
      {Array.from({ length: 10 }, (_, k) => (
        <ellipse key={k} cx={180 + k * 32} cy={GROUND + 4 + (k % 2) * 3} rx="3.2" ry="1.4" fill="#00000030" />
      ))}
      {/* La Ranger aterrizada */}
      <g transform={`translate(${0.78 * W} ${GROUND - 4})`}>
        <ellipse cx="0" cy="2" rx="80" ry="5" fill="#00000040" />
        <path d="M-40 -14 L-46 2 M38 -14 L44 2" stroke="#27272a" strokeWidth="3" />
        <path d="M-72 -16 L-66 -40 L-50 -40 L-40 -32 L40 -32 L74 -20 L70 -14 L-72 -14Z" fill="#52525b" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M-66 -40 L-62 -58 L-52 -58 L-48 -40Z" fill="#3f3f46" stroke={INK} strokeWidth="1.2" />
        <path d="M44 -31 L64 -24 L60 -22 L44 -27Z" fill={act.inside ? "#fde68a" : "#0f172a"} stroke="#a1a1aa" strokeWidth="0.7" />
        <rect x="-30" y="-27" width="60" height="2.5" fill="#f97316" opacity="0.85" />
        <rect x="-14" y="-30" width="14" height="16" fill={act.inside ? "#fde68a" : "#18181b"} stroke={INK} strokeWidth="1.6" />
      </g>
      {/* Bandera de la misión */}
      {flagUp && (
        <g transform={`translate(${0.62 * W + 14} ${GROUND})`}>
          <line x1="0" y1="0" x2="0" y2="-62" stroke="#e5e7eb" strokeWidth="2" />
          <path d="M0 -62 h30 v18 h-30Z" fill="#1d4ed8" stroke={INK} strokeWidth="0.8" />
          <circle cx="15" cy="-53" r="4.5" fill="#f97316" />
          <text x="15" y="-38" fontSize="5" textAnchor="middle" fill="#e2e8f0">TERRA-1</text>
        </g>
      )}
      {alive && !act.inside && (
        <Person
          x={x}
          y={GROUND - hop}
          age={age}
          pose={act.pose}
          t={walking ? walkClock(Math.abs(Math.sin(gestureT * 0.15)) * 400 + gestureT * 2, age) : gestureT}
          facing={facing}
          outfit="spacesuit"
          helmet
          prop={act.prop}
          propColor={planet.rock}
          mood={act.pose === "lookUp" || act.prop === "camera" ? "joy" : act.prop === "rock" ? "happy" : "focused"}
        />
      )}
      {/* Recipiente con las muestras recogidas */}
      <g transform={`translate(${0.3 * W + 34} ${GROUND})`}>
        <rect x="-10" y="-14" width="20" height="14" rx="2" fill="#e5e7eb" stroke={INK} strokeWidth="1.6" />
        {Array.from({ length: Math.min(4, Math.floor(surfaceDay) + (hour >= 12 ? 1 : 0)) }, (_, k) => (
          <path key={k} d={`M${-7 + k * 4} -14 l2 -4 l3 1 l1 3Z`} fill={planet.rock} stroke={INK} strokeWidth="0.5" />
        ))}
      </g>
    </>
  );
}

/** De vuelta en la Tierra: la cabina vacía con la escotilla abierta a la luz del día. */
function Landed({ props }: { props: ShipSceneProps }) {
  const out = props.outside ?? { years: 0, deathYears: Infinity };
  const epoch = earthEpoch(out.years, out.deathYears).key;
  // Con la gigante roja (lava) o sin Tierra (enana blanca) la nave no puede aterrizar: la escotilla queda cerrada.
  const sealed = epoch === "redgiant" || epoch === "whitedwarf";
  const light = OUTDOOR_LIGHT[epoch];
  const view = (
    <svg x="0" y="0" width="110" height={GROUND - 70} viewBox="560 30 150 240" preserveAspectRatio="xMidYMid slice">
      <Outdoors years={out.years} deathYears={out.deathYears} gestureT={props.gestureT} idp="hatch" />
    </svg>
  );
  return (
    <>
      <CabinBackdrop props={props} lights={0.3} />
      {/* Por la ventana redonda también se ve la Tierra de esa época */}
      <clipPath id="landed-window">
        <ellipse cx="700" cy="114" rx="86" ry="76" />
      </clipPath>
      <g clipPath="url(#landed-window)">
        <svg x="612" y="36" width="176" height="156" viewBox="380 0 340 300" preserveAspectRatio="xMidYMid slice">
          <Outdoors years={out.years} deathYears={out.deathYears} gestureT={props.gestureT} idp="window" />
        </svg>
      </g>
      <ellipse cx="700" cy="114" rx="90" ry="80" fill="none" stroke="#cbd5e1" strokeWidth="10" />
      <ellipse cx="700" cy="114" rx="96" ry="86" fill="none" stroke={INK} strokeWidth="1.5" />
      {/* La luz de afuera tiñe la cabina */}
      <rect width={W} height="300" fill={light} opacity={sealed ? 0.12 : 0.1} pointerEvents="none" />
      {sealed ? (
        <>
          <rect x="40" y="70" width="110" height={GROUND - 70} rx="12" fill="#64748b" stroke={INK} strokeWidth="2" />
          <g transform="translate(40 70)">
            <clipPath id="porthole">
              <circle cx="55" cy="60" r="30" />
            </clipPath>
            <g clipPath="url(#porthole)">{view}</g>
            <circle cx="55" cy="60" r="30" fill="none" stroke="#cbd5e1" strokeWidth="6" />
            <circle cx="55" cy="60" r="33" fill="none" stroke={INK} strokeWidth="1.6" />
          </g>
          <path d="M60 200 h70 M60 210 h70" stroke="#475569" strokeWidth="3" />
        </>
      ) : (
        <>
          <g transform="translate(40 70)">
            <clipPath id="hatch-open">
              <rect width="110" height={GROUND - 70} rx="12" />
            </clipPath>
            <g clipPath="url(#hatch-open)">{view}</g>
          </g>
          <rect x="40" y="70" width="110" height={GROUND - 70} rx="12" fill="none" stroke={INK} strokeWidth="2" />
          <path d="M40 70 L20 60 L20 270 L40 262Z" fill="#94a3b8" stroke={INK} strokeWidth="1.6" />
          <path d={`M40 ${GROUND} L150 ${GROUND} L210 290 L0 290Z`} fill={light} opacity="0.3" />
        </>
      )}
      <text x="430" y="150" fontSize="15" textAnchor="middle" fill="#f8fafc" stroke="#020617" strokeWidth="3" paintOrder="stroke">
        {epoch === "whitedwarf"
          ? "No hay Tierra a la que bajar: el Sol es una enana blanca"
          : epoch === "redgiant"
            ? "La Tierra es lava: la nave no puede aterrizar"
            : props.alive
              ? `${SHIP_NAME} bajó de la nave: ahora está en la Tierra ↑`
              : "La nave aterrizó vacía"}
      </text>
    </>
  );
}

export function ShipScene(props: ShipSceneProps) {
  const { stage, cinematicTime, years, age, gestureT, landed } = props;
  const view = useFocusView(props.focusX ?? W / 2);
  const launchSeconds = years * 365.25 * 86_400;
  const inCockpit = (stage === "cinematic" && cinematicTime >= 6) || (stage === "flight" && launchSeconds < 3_600);
  const shake = stage === "flight" ? Math.max(0, 3 * (1 - launchSeconds / 600)) : stage === "cinematic" && cinematicTime > 14 ? 1 : 0;
  return (
    <svg ref={view.ref} viewBox={view.viewBox} preserveAspectRatio="xMidYMax slice" className="toon absolute inset-0 h-full w-full">
      {stage === "boarding" ? (
        <Gantry t={0} age={age} gestureT={gestureT} waiting />
      ) : stage === "cinematic" && cinematicTime < 6 ? (
        <Gantry t={cinematicTime} age={age} gestureT={gestureT} />
      ) : landed ? (
        <Landed props={props} />
      ) : props.phase === "surface" && stage === "flight" ? (
        <Surface props={props} />
      ) : props.millerProgress !== null && stage === "flight" ? (
        <Miller props={props} />
      ) : inCockpit ? (
        <Cockpit props={props} shake={shake} />
      ) : (
        <Cabin props={props} />
      )}
    </svg>
  );
}
