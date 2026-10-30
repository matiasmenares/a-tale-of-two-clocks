"use client";

import type { Sim } from "@/hooks/useSimulation";
import type { Derived } from "@/lib/derive";
import { formatBeta, formatLy, formatYears, fmt } from "@/lib/format";
import { EARTH_NAME, SHIP_NAME } from "@/lib/life";
import { stateAt } from "@/lib/relativity";
import { useEffect, useState } from "react";

/** Largo de la nave Ranger en reposo (metros). */
const SHIP_LENGTH_M = 60;

/** Reloj real de la animación (segundos) para que las agujas giren dentro del modal. */
function useSeconds() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return t;
}

/** Color de la luz según el factor Doppler: más rojo y tenue al alejarse, más azul y brillante al acercarse. */
function dopplerTint(D: number) {
  const k = Math.max(-1, Math.min(1, Math.log(D) / Math.log(20)));
  if (k < 0) return { color: `rgb(255,${Math.round(200 + 55 * (1 + k))},${Math.round(160 + 95 * (1 + k))})`, overlay: "#ef4444", strength: -k };
  return { color: `rgb(${Math.round(200 + 55 * (1 - k))},${Math.round(220 + 35 * (1 - k))},255)`, overlay: "#6366f1", strength: k };
}

/** Lo que se ve por el ocular: la nave de espaldas, con la luz corrida por el Doppler y atrasada. */
function Eyepiece({ D, engines, seenDay, t, front }: { D: number; engines: boolean; seenDay: number; t: number; front: boolean }) {
  const tint = dopplerTint(D);
  const bright = Math.max(0.15, Math.min(1.4, D ** 1.5));
  const flicker = 0.8 + Math.sin(t * 20) * 0.2;
  return (
    <svg viewBox="-100 -100 200 200" className="mx-auto aspect-square w-full max-w-[22rem]">
      <defs>
        <clipPath id="eyepiece">
          <circle r="92" />
        </clipPath>
        <radialGradient id="vignette">
          <stop offset="0.7" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.85" />
        </radialGradient>
      </defs>
      <circle r="98" fill="#0f172a" stroke="#334155" strokeWidth="6" />
      <g clipPath="url(#eyepiece)">
        <rect x="-100" y="-100" width="200" height="200" fill="#020617" />
        {Array.from({ length: 50 }, (_, i) => {
          const x = Math.sin(i * 91.7) * 90;
          const y = Math.cos(i * 37.3) * 90;
          return <circle key={i} cx={x} cy={y} r={i % 7 === 0 ? 1 : 0.5} fill={tint.color} opacity={0.6} />;
        })}
        {/* De frente: la nariz y el parabrisas de la cabina, con Tomás adentro y las luces de aproximación */}
        {front && (
          <g opacity={Math.min(1, bright)}>
            <path d="M-34 -22 L-22 -34 L22 -34 L34 -22 L34 22 L22 34 L-22 34 L-34 22Z" fill="#52525b" stroke="#1e1b2e" strokeWidth="2" />
            <path d="M-26 -14 L-16 -24 L16 -24 L26 -14 L26 14 L16 24 L-16 24 L-26 14Z" fill="#71717a" stroke="#1e1b2e" strokeWidth="1.2" />
            <circle r="9" fill="#a1a1aa" stroke="#1e1b2e" strokeWidth="1.2" />
            <circle r="3" cx="-2" cy="-2" fill="#e4e4e7" opacity="0.7" />
            {/* Parabrisas con la luz de la cabina y la silueta de Tomás */}
            <path d="M-18 -30 L18 -30 L14 -20 L-14 -20Z" fill={tint.color} opacity="0.9" stroke="#1e1b2e" strokeWidth="1" />
            <circle cx="0" cy="-24" r="3.2" fill="#1e293b" />
            <path d="M-5 -20 q5 -5 10 0Z" fill="#1e293b" />
            <text x="0" y="28" fontSize="6" textAnchor="middle" fill="#e4e4e7" fontFamily="monospace" fontWeight="bold">
              D{Math.max(1, Math.floor(seenDay))}
            </text>
            {/* Luces de aproximación que parpadean */}
            {[-28, 28].map((x) => (
              <g key={x}>
                <circle cx={x} cy="0" r="2.6" fill={Math.floor(t * 2) % 2 ? tint.color : "#3f3f46"} />
                <circle cx={x} cy="0" r="7" fill={tint.color} opacity={Math.floor(t * 2) % 2 ? 0.25 : 0} />
              </g>
            ))}
            {/* Con los motores encendidos se adivina el brillo detrás de la nave */}
            {engines && <circle r={46 * flicker} fill={tint.color} opacity={0.12 * Math.min(1, bright)} />}
          </g>
        )}
        {/* De espaldas: la tobera, con la llama si los motores apuntan hacia la Tierra */}
        {!front && <g opacity={Math.min(1, bright)}>
          <path d="M-34 -22 L-22 -34 L22 -34 L34 -22 L34 22 L22 34 L-22 34 L-34 22Z" fill="#3f3f46" stroke="#1e1b2e" strokeWidth="2" />
          <path d="M-22 -34 L-34 -22 M22 -34 L34 -22" stroke="#a1a1aa" strokeWidth="1" opacity="0.6" />
          <rect x="-30" y="-4" width="60" height="4" fill="#f97316" opacity="0.8" />
          {/* Ventanita con la luz de la cabina y el reloj de Tomás */}
          <rect x="-14" y="-28" width="28" height="13" rx="3" fill={tint.color} opacity="0.9" stroke="#1e1b2e" strokeWidth="1" />
          <text x="0" y="-19" fontSize="6.5" textAnchor="middle" fill="#0f172a" fontFamily="monospace" fontWeight="bold">
            D{Math.max(1, Math.floor(seenDay))}
          </text>
          {/* Tobera y llama si los motores estaban encendidos cuando salió esa luz */}
          <circle r="13" cy="14" fill="#18181b" stroke="#52525b" strokeWidth="2" />
          {engines && <circle r={11 * flicker} cy="14" fill={tint.color} opacity={0.9 * Math.min(1, bright)} />}
          {engines && <circle r={22 * flicker} cy="14" fill={tint.color} opacity={0.25 * Math.min(1, bright)} />}
        </g>}
        {/* Corrimiento de color de toda la imagen */}
        <rect x="-100" y="-100" width="200" height="200" fill={tint.overlay} opacity={0.35 * tint.strength} style={{ mixBlendMode: "color" }} />
        <circle r="92" fill="url(#vignette)" />
        <path d="M-92 0 H-60 M60 0 H92 M0 -92 V-60 M0 60 V92" stroke="#94a3b8" strokeWidth="0.6" opacity="0.6" />
      </g>
    </svg>
  );
}

/** Reloj con una aguja de segundos que gira a `rate` vueltas por cada vuelta del reloj de la Tierra. */
function RateClock({ label, rate, color, t, note }: { label: string; rate: number; color: string; t: number; note: string }) {
  const a = ((t / 6) * rate * 360) % 360;
  const x = 30 + Math.sin((a * Math.PI) / 180) * 22;
  const y = 30 - Math.cos((a * Math.PI) / 180) * 22;
  return (
    <div className="flex flex-col items-center text-center">
      <svg viewBox="0 0 60 60" className="h-20 w-20">
        <circle cx="30" cy="30" r="27" fill="#f8fafc" stroke={color} strokeWidth="3" />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1="30" y1="5" x2="30" y2={i % 3 ? 8 : 10} stroke="#1e1b2e" strokeWidth={i % 3 ? 1 : 2} transform={`rotate(${i * 30} 30 30)`} />
        ))}
        <line x1="30" y1="30" x2={x} y2={y} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="30" cy="30" r="2.5" fill="#1e1b2e" />
      </svg>
      <div className="mt-1 text-xs font-semibold" style={{ color }}>{label}</div>
      <div className="text-[11px] text-slate-400">{note}</div>
    </div>
  );
}

/** Nave de perfil, comprimida en la dirección del movimiento por el factor 1/γ. */
function SideShip({ squeeze, color }: { squeeze: number; color: string }) {
  return (
    <g transform={`scale(${squeeze} 1)`}>
      <path d="M0 18 L6 4 L16 4 L22 10 L84 10 L100 18 L84 26 L0 26Z" fill={color} stroke="#1e1b2e" strokeWidth={1.2 / Math.max(squeeze, 0.05)} vectorEffect="non-scaling-stroke" />
      <path d="M6 4 L9 -6 L15 -6 L16 4Z" fill="#3f3f46" stroke="#1e1b2e" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <rect x="20" y="17" width="64" height="2" fill="#f97316" />
      <path d="M86 12 L96 18 L86 16Z" fill="#0f172a" />
    </g>
  );
}

/** Telescopio de Martín: lo que ve (luz atrasada y corrida por el Doppler) y lo que calcula (contracción y reloj lento). */
export function TelescopePanel({ sim, d }: { sim: Sim; d: Derived }) {
  const t = useSeconds();
  const flying = sim.stage === "flight" || sim.stage === "done";
  const { trip, ship } = sim;
  if (!flying || ship.x <= 0)
    return <p className="text-sm text-slate-400">La nave todavía está en la plataforma: por el telescopio solo se ve el cohete listo para despegar.</p>;

  // Lo que se ve: la luz que llega ahora salió de la nave cuando su reloj marcaba `seenTau`.
  const seenTau = Math.min(d.shipSeenFromEarth, trip.totalTau);
  const emit = stateAt(trip, seenTau);
  const D = emit.phase.kind === "stay" ? trip.stayRate : 1 / (emit.gamma * (1 + emit.beta));
  const lightAge = ship.t - emit.t;
  const engines = emit.alpha !== 0;
  // Hacia dónde apunta la nave en esa imagen: de espaldas si los motores empujan alejándola (acelera en la ida,
  // crucero de ida) o si frena al volver (los motores apuntan a la Tierra); de frente en el resto del regreso
  // y mientras frena al llegar al destino (dio media vuelta).
  const ida = emit.phase.leg === "ida";
  const front = (ida && emit.phase.kind === "decel") || (!ida && emit.phase.kind !== "decel");
  // Lo que se calcula para "ahora" en el marco de la Tierra.
  const gamma = ship.gamma;
  const contracted = SHIP_LENGTH_M / gamma;
  const away = emit.beta > 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="hud-label mb-2 text-cyan-300">🔭 Lo que ve {EARTH_NAME} por el ocular</div>
          <Eyepiece D={D} engines={engines} seenDay={seenTau * 365.25 + 1} t={t} front={front} />
          <ul className="mt-3 space-y-1 text-sm text-slate-300">
            <li>
              ⏳ Es una imagen <b>del pasado</b>: esa luz salió de la nave hace <b className="text-cyan-200">{formatYears(lightAge)}</b>, cuando estaba a{" "}
              {formatLy(emit.x)} de la Tierra. En la ventanita se ve el reloj de {SHIP_NAME} marcando el día {fmt(Math.floor(seenTau * 365.25) + 1, 0)}.
            </li>
            <li>
              🌈 {Math.abs(D - 1) < 0.01 ? (
                "La luz llega con su color normal."
              ) : away ? (
                <>
                  Como se aleja, la luz llega <b className="text-rose-300">más roja y tenue</b>: cada onda se estira {fmt(1 / D, 1)} veces (corrimiento al rojo).
                </>
              ) : (
                <>
                  Como se acerca, la luz llega <b className="text-sky-300">más azul y brillante</b>: cada onda se comprime {fmt(D, 1)} veces (corrimiento al azul).
                </>
              )}
            </li>
            <li>
              🎞 Por eso ve a {SHIP_NAME} moverse {D < 1 ? <>en <b>cámara lenta</b> (×{fmt(D, D < 0.1 ? 3 : 2)})</> : <>en <b>cámara rápida</b> (×{fmt(D, 1)})</>}: lo que ve no es solo la dilatación, también el retraso de la luz.
            </li>
            <li>
              {front
                ? ida
                  ? "🛸 La nave se ve de frente: dio media vuelta y frena apuntando los motores hacia su destino."
                  : "🛸 La nave viene de regreso y se ve de frente: el parabrisas de la cabina, con Tomás adentro, y las luces de aproximación."
                : ida
                  ? "🚀 La nave se ve de espaldas: se aleja con los motores apuntando a la Tierra."
                  : "🚀 Se ve de espaldas aunque viene de vuelta: dio media vuelta y frena con los motores apuntando a la Tierra."}
            </li>
            {engines && <li>🔥 En esa imagen los motores están encendidos: su luz también cambia de color.</li>}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="hud-label mb-2 text-amber-300">🧮 Lo que calcula para «ahora»</div>
          <div className="mb-1 flex justify-between text-xs text-slate-400">
            <span>Velocidad {formatBeta(Math.abs(ship.beta))}</span>
            <span>γ = {fmt(gamma, gamma < 10 ? 3 : 1)}</span>
          </div>
          <svg viewBox="-4 -16 180 112" className="w-full">
            <text x="0" y="-9" fontSize="5" fill="#94a3b8">En reposo (como la construyeron)</text>
            <SideShip squeeze={1} color="#71717a" />
            <line x1="0" y1="31" x2="100" y2="31" stroke="#94a3b8" strokeWidth="0.6" />
            <path d="M0 29 v4 M100 29 v4" stroke="#94a3b8" strokeWidth="0.6" />
            <text x="104" y="33" fontSize="5" fill="#cbd5e1">{SHIP_LENGTH_M} m</text>
            <g transform="translate(0 58)">
              <text x="0" y="-9" fontSize="5" fill="#fbbf24">Medida desde la Tierra, a esta velocidad</text>
              <SideShip squeeze={1 / gamma} color="#f59e0b" />
              <line x1="0" y1="31" x2={100 / gamma} y2="31" stroke="#fbbf24" strokeWidth="0.6" />
              <path d={`M0 29 v4 M${100 / gamma} 29 v4`} stroke="#fbbf24" strokeWidth="0.6" />
              <text x={100 / gamma + 4} y="33" fontSize="5" fill="#fde68a">
                {fmt(contracted, contracted < 10 ? 1 : 0)} m (÷ {fmt(gamma, 1)})
              </text>
            </g>
          </svg>
          <p className="mt-1 text-xs text-slate-400">
            <b className="text-slate-200">Contracción de Lorentz:</b> el largo en la dirección del movimiento se acorta por γ; el alto no cambia. Ojo: como la nave se aleja
            en línea recta, desde la Tierra se ve de espaldas y la contracción no se aprecia en la imagen (además, la luz de la punta y de la cola tarda distinto en llegar:
            es la «rotación de Terrell»).
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <RateClock label={`Reloj de ${EARTH_NAME}`} rate={1} color="#0891b2" t={t} note="1 vuelta" />
            <RateClock label={`${SHIP_NAME}, calculado`} rate={1 / gamma} color="#d97706" t={t} note={`÷ γ: ${fmt(1 / gamma, 3)} vueltas`} />
            <RateClock label={`${SHIP_NAME}, visto`} rate={D} color="#e11d48" t={t} note={`× Doppler: ${fmt(D, 3)}`} />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Las tres agujas muestran cuánto avanza cada reloj mientras el de la Tierra da una vuelta. El «calculado» atrasa por la dilatación del tiempo; el «visto» además suma
            el efecto de que cada imagen sale desde más lejos (o más cerca) que la anterior.
          </p>
        </section>
      </div>
    </div>
  );
}
