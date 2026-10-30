"use client";

import { DESTINATIONS, PHASE_LABEL } from "@/lib/relativity";
import { CINEMATIC_SECONDS, type Sim } from "@/hooks/useSimulation";
import { START_AGE, type Derived } from "@/lib/derive";
import { fmt, formatAge, formatBeta, formatFactor, formatLy, formatPlayback, formatYears } from "@/lib/format";
import {
  activityAt, calendar, EARTH_NAME, earthEpoch, fmtYear, hourOfDay, LAUNCH_YEAR, musicSkill, practiceHours, recentPetLoss, season, SEASON_ICON, SHIP_NAME, surfaceActivity,
} from "@/lib/life";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { techAt } from "@/lib/tech";
import { arrivalTau, earthToShip, shipToEarth } from "@/lib/comms";
import { StarMap } from "../StarMap";
import { EarthScene } from "./EarthScene";
import { ShipScene } from "./ShipScene";

const SEC_PER_YEAR = 365.25 * 86_400;
const LY_KM = 9.4607e12;

/** Reloj de gestos: avanza según la velocidad de reproducción (lento = cámara lenta, rápido = acelerado). */
function useGestureClocks(earthPlayback: number, shipPlayback: number, frozen: boolean) {
  const [, setFrame] = useState(0);
  const clocks = useRef({ earth: 0, ship: 0, earthFast: 0 });
  const speeds = useRef({ earthPlayback, shipPlayback, frozen });
  speeds.current = { earthPlayback, shipPlayback, frozen };
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      // En pausa todo se detiene; en cámara lenta los gestos, mascotas y robot van igual de lentos.
      const f = (p: number, max = 4) => (speeds.current.frozen ? 0 : Math.min(max, Math.max(0.03, p * SEC_PER_YEAR)));
      clocks.current.earth += dt * f(speeds.current.earthPlayback);
      clocks.current.ship += dt * f(speeds.current.shipPlayback);
      // Las máquinas no se cansan: el robot acompaña el ritmo acelerado mucho más allá que las personas.
      clocks.current.earthFast = (clocks.current.earthFast || 0) + dt * f(speeds.current.earthPlayback, 40);
      setFrame((n) => n + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return clocks.current;
}

function SpeedBadge({ self, other, otherName }: { self: number; other: number; otherName: string }) {
  const rel = other > 0 ? self / other : 1;
  const normal = Math.abs(rel - 1) < 0.02;
  const fast = rel > 1;
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
      <span
        className={`rounded-full px-2 py-0.5 font-mono font-semibold ring-1 ${
          normal
            ? "bg-white/5 text-slate-200 ring-white/15"
            : fast
              ? "bg-rose-500/15 text-rose-200 ring-rose-400/50 shadow-[0_0_14px_-2px_rgba(244,63,94,0.6)]"
              : "bg-cyan-400/15 text-cyan-200 ring-cyan-300/50 shadow-[0_0_14px_-2px_rgba(34,211,238,0.6)]"
        }`}
      >
        {normal ? "▶ MISMO RITMO" : fast ? `⏩ RÁPIDA ${formatFactor(rel)}` : `⏪ LENTA ${formatFactor(rel)}`}
      </span>
      {!normal && <span className="text-slate-400">vs {otherName}</span>}
      <span className="font-mono text-slate-500">1 s = {formatPlayback(self)}</span>
    </div>
  );
}

function Hud({ children, className = "", accent }: { children: ReactNode; className?: string; accent?: "cyan" | "amber" }) {
  return (
    <div
      className={`pointer-events-none absolute overflow-hidden rounded-2xl border border-white/10 bg-[#030712]/60 px-3.5 py-2.5 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-md ${className}`}
    >
      {accent && (
        <div
          className={`absolute inset-y-2 left-0 w-[3px] rounded-r ${accent === "cyan" ? "bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" : "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)]"}`}
        />
      )}
      {children}
    </div>
  );
}

const PHASE_COLOR: Record<string, string> = { accel: "#f59e0b", cruise: "#22d3ee", decel: "#a78bfa", stay: "#f472b6", surface: "#f97316" };

export function TwinsTheater({ sim, d, onOpen }: { sim: Sim; d: Derived; onOpen: (p: "map" | "control" | "data") => void }) {
  const { stage, ship, trip, lifespan, destination, cinematicTime } = sim;
  const clocks = useGestureClocks(sim.earthPlayback, sim.shipPlayback, (stage === "flight" || stage === "cinematic") && !sim.playing);
  const flying = stage === "flight" || stage === "done";

  const earthYears = flying ? d.earthProper : 0;
  const shipYears = flying ? d.shipProper : 0;
  const deathYears = lifespan - START_AGE;
  const earthAge = START_AGE + Math.min(earthYears, deathYears);
  const shipAge = START_AGE + Math.min(shipYears, deathYears);
  const earthAlive = earthYears < deathYears;
  const shipAlive = shipYears < deathYears;
  const earthTimelapse = sim.playing && stage === "flight" && sim.earthPlayback * 365.25 > 1;
  const shipTimelapse = sim.playing && stage === "flight" && sim.shipPlayback * 365.25 > 1;
  const epoch = earthEpoch(earthYears, deathYears);
  const reunion = stage === "done" && sim.roundTrip;

  const earthSetting = !flying ? "launch" : reunion ? "reunion" : earthYears < 2 / 365.25 ? "launch" : earthAlive ? "home" : "after";
  const earthAct = earthAlive ? activityAt("earth", earthYears, earthAge) : null;
  const shipAct = shipAlive ? activityAt("ship", shipYears, shipAge) : null;

  const D = trip.params.distance;
  const outbound = ship.phase.leg === "ida";
  const aheadDistance = stage === "done" ? 1e-6 : outbound && ship.phase.kind !== "stay" ? D - ship.x : outbound ? 1 : ship.x;
  const farFromGalaxy = D > 30_000 && Math.min(ship.x, D - ship.x) > 30_000;
  const phi = flying && stage !== "done" ? Math.acosh(Math.max(1, ship.gamma)) : 0;
  const sky = {
    phi,
    aheadDistance: Math.max(1e-6, aheadDistance),
    altitudeKm: flying ? ship.x * LY_KM : 0,
    aheadKind: (outbound ? (destination.kind === "custom" ? "star" : destination.kind) : "sun") as "star" | "cluster" | "galaxy" | "sun" | "planet",
    planet: outbound ? destination.planet : undefined,
    blackHole: (ship.phase.kind === "stay" && stage === "flight") || (outbound && destination.kind === "blackhole" && stage === "flight"),
    starDensity: farFromGalaxy ? 0.06 : 1,
  };

  const earthSeenAge = START_AGE + d.earthSeenFromShip;
  // Tomás se entera de la muerte de su hermano cuando le llega esa luz; queda triste unos dos meses.
  const newsTau = deathYears < trip.totalT ? arrivalTau(trip, deathYears) : Infinity;
  const sadNews = flying && shipYears >= newsTau && shipYears - newsTau < 60 / 365.25;
  const cal = calendar(earthYears);
  const ss = season(cal.dayOfYear);
  const loss = earthAlive ? recentPetLoss(earthYears) : null;
  const guitarLevel = musicSkill(practiceHours("earth", earthYears)).level;
  const violinLevel = musicSkill(practiceHours("ship", shipYears)).level;
  const surfaceDay = ship.phase.kind === "surface" ? (shipYears - ship.phase.tau0) * 365.25 : 0;
  const surfaceAct = ship.phase.kind === "surface" && stage === "flight" ? surfaceActivity(hourOfDay(shipYears), surfaceDay) : null;
  const deathNewsArrived = !earthAlive && d.earthSeenFromShip >= deathYears;
  const rindler = flying && ship.alpha > 0 && ship.x > 0.5;

  const toShip = earthToShip(trip, ship);
  const toEarth = shipToEarth(ship, d.earthRate);
  const countdown = stage === "cinematic" ? Math.ceil(CINEMATIC_SECONDS - cinematicTime) : 0;

  const progress = trip.totalTau > 0 ? Math.min(1, shipYears / trip.totalTau) : 0;
  const chip = "flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1";

  return (
    <section className="relative flex h-[100svh] min-h-[560px] flex-col overflow-hidden bg-black">
      {/* ── Mitad superior: la Tierra ── */}
      <div className="relative flex-1 overflow-hidden">
        <EarthScene
          years={earthYears}
          age={earthAge}
          hour={hourOfDay(earthYears)}
          timelapse={earthTimelapse}
          gestureT={clocks.earth}
          fastT={clocks.earthFast}
          epoch={epoch}
          setting={earthSetting}
          stage={stage}
          cinematicTime={cinematicTime}
          rocketAltitudeM={flying ? ship.x * LY_KM * 1000 : 0}
          deathYears={deathYears}
          shipAge={shipAge}
          shipAlive={shipAlive}
          earthAlive={earthAlive}
          souvenir={sim.roundTrip && destination.planet && shipAlive ? { color: destination.planet.rock, from: destination.name } : undefined}
        />
        <Hud accent="cyan" className="left-3 top-3 max-w-[min(25rem,calc(100%-1.5rem))]">
          <div className="hud-label text-cyan-300">🌍 {EARTH_NAME} · Tierra</div>
          <div className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {earthAlive ? formatAge(earthAge) : <span className="text-rose-200">Murió a los {lifespan}</span>}
          </div>
          <div className="text-sm text-slate-300">
            <span className="font-mono text-cyan-200">{epoch.title}</span>
            {flying && earthAlive && earthSetting === "home" && <> · {SEASON_ICON[ss]} {ss}</>}
            {earthAct && flying && earthSetting === "home" && !earthTimelapse && (
              <>
                {" "}· {earthAct.label}
                {earthAct.pose === "guitar" && <span className="text-cyan-300"> (nivel {guitarLevel})</span>}
              </>
            )}
            {earthAlive && earthTimelapse && <> · los días pasan volando</>}
          </div>
          {loss && <div className="mt-0.5 text-xs text-rose-300">💔 Está triste: murió {loss.name}. Sus cenizas quedaron en una urna en el estante.</div>}
          {epoch.note && <div className="mt-0.5 text-xs text-slate-400">{epoch.note}</div>}
          {flying && techAt(LAUNCH_YEAR + Math.floor(earthYears)).level > 0 && (
            <div className="mt-0.5 text-xs text-cyan-300/90">◇ {techAt(LAUNCH_YEAR + Math.floor(earthYears)).name}</div>
          )}
          {flying && <div className="mt-1.5"><SpeedBadge self={sim.earthPlayback} other={sim.shipPlayback} otherName={SHIP_NAME} /></div>}
        </Hud>
        {flying && stage !== "done" && earthAlive && (
          <Hud className="bottom-3 right-3 hidden max-w-xs text-xs text-slate-300 sm:block">
            <div className="hud-label mb-0.5 text-slate-400">Telescopio</div>
            Ve a {SHIP_NAME} con <b className="text-amber-300">{formatAge(START_AGE + d.shipSeenFromEarth)}</b>
            <div className="text-slate-500">la luz tarda: ya está a {formatLy(ship.x)}</div>
            <div className="mt-1">
              📡 Un mensaje a {SHIP_NAME} hoy tarda <b className="text-cyan-200">{formatYears(toShip.earthFrameDelay)}</b>
              <div className="text-slate-500">
                él lo leería con {toShip.receiverAge >= lifespan ? "— ya habrá muerto" : formatAge(toShip.receiverAge)}
              </div>
            </div>
          </Hud>
        )}
      </div>

      {/* ── Consola central de misión ── */}
      <div className="relative z-10 border-y border-white/10 bg-gradient-to-b from-[#0b1222] to-[#050913] px-3 pb-2 pt-1.5 text-xs text-slate-200 shadow-[0_0_40px_rgba(0,0,0,0.9)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="hud-label hidden text-slate-500 2xl:inline">Misión TERRA-1</span>
          <button
            onClick={sim.togglePlay}
            className="rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-1.5 font-semibold text-slate-950 shadow-[0_0_20px_-4px_rgba(251,146,60,0.9)] transition hover:brightness-110"
          >
            {stage === "boarding" ? "🚀 Subir al cohete" : stage === "done" ? "↺ Repetir" : sim.playing ? "⏸ Pausa" : "▶ Seguir"}
          </button>
          <button onClick={sim.reset} className="rounded-full border border-white/15 px-3 py-1.5 text-slate-300 transition hover:border-white/40 hover:text-white">
            Reiniciar
          </button>
          <label className={chip}>
            <span className="hud-label text-slate-400">Destino</span>
            <select
              value={destination.id}
              onChange={(e) => sim.setDestination(DESTINATIONS.find((x) => x.id === e.target.value)!)}
              className="bg-transparent font-medium text-white outline-none [&>option]:bg-slate-900"
            >
              {destination.id === "custom" && <option value="custom">{formatLy(destination.distance)} (personalizado)</option>}
              {DESTINATIONS.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} · {formatLy(x.distance)}
                </option>
              ))}
            </select>
          </label>
          <label className={`${chip} cursor-pointer`}>
            <input type="checkbox" checked={sim.roundTrip} onChange={(e) => sim.setRoundTrip(e.target.checked)} className="accent-cyan-400" />
            <span className="hidden lg:inline">ida y vuelta</span><span className="lg:hidden">↩</span>
          </label>
          <label className={chip}>
            <span className="hud-label text-slate-400">Ritmo</span>
            <input
              type="range"
              min={-7.5}
              max={4}
              step={0.01}
              value={Math.log10(sim.rate)}
              onChange={(e) => sim.setRate(10 ** Number(e.target.value))}
              className="w-20"
            />
            <span className="w-[4.6rem] whitespace-nowrap font-mono text-cyan-200">{formatPlayback(sim.rate)}/s</span>
          </label>
          <label className={`${chip} cursor-pointer`} title="Cámara lenta automática en el despegue, el volteo, las muertes y la llegada">
            <input type="checkbox" checked={sim.director} onChange={(e) => sim.setDirector(e.target.checked)} className="accent-cyan-400" />
            🎬 <span className="hidden xl:inline">director</span>
          </label>
          <button onClick={() => onOpen("map")} title="Mapa" aria-label="Mapa" className={`${chip} text-slate-200 transition hover:border-cyan-300/50`}>
            🗺 <span className="hidden xl:inline">Mapa</span>
          </button>
          <button onClick={() => onOpen("control")} title="Control" aria-label="Control" className={`${chip} text-slate-200 transition hover:border-cyan-300/50`}>
            ⚙ <span className="hidden xl:inline">Control</span>
          </button>
          <button onClick={() => onOpen("data")} title="Datos" aria-label="Datos" className={`${chip} text-slate-200 transition hover:border-cyan-300/50`}>
            📊 <span className="hidden xl:inline">Datos</span>
          </button>
          {countdown > 0 && countdown <= 10 && <span className="glow-amber font-mono text-lg font-bold text-amber-300">T−{countdown}</span>}
        </div>
        {/* Línea de tiempo de la misión por fases: se puede arrastrar para moverse por el viaje */}
        <div className="mx-auto mt-1.5 flex max-w-5xl items-center gap-2">
          <span className="hud-label w-12 shrink-0 text-right text-slate-500">T+0</span>
          <div className="relative h-5 flex-1">
            <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/5">
              {trip.phases.map((p, i) =>
                p.tau1 > p.tau0 ? (
                  <div
                    key={i}
                    className="absolute inset-y-0"
                    style={{ left: `${(p.tau0 / trip.totalTau) * 100}%`, width: `${((p.tau1 - p.tau0) / trip.totalTau) * 100}%`, background: PHASE_COLOR[p.kind], opacity: 0.35 }}
                  />
                ) : null,
              )}
              <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-amber-300" style={{ width: `${progress * 100}%` }} />
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.0005}
              value={progress}
              onChange={(e) => sim.seek(Number(e.target.value) * trip.totalTau)}
              aria-label="Progreso del viaje"
              className="timeline absolute inset-0 h-full w-full"
            />
          </div>
          <span className="hud-label w-16 shrink-0 text-slate-400">{Math.round(progress * 100)} %</span>
        </div>
      </div>

      {/* ── Mitad inferior: la nave ── */}
      <div className="relative flex-1 overflow-hidden">
        <ShipScene
          stage={stage}
          cinematicTime={cinematicTime}
          years={shipYears}
          age={shipAge}
          timelapse={shipTimelapse}
          gestureT={clocks.ship}
          phase={ship.phase.kind}
          alive={shipAlive}
          landed={reunion}
          routeFraction={flying ? ship.x / D : 0}
          leg={ship.phase.leg}
          lastMessageAge={Math.min(lifespan, earthSeenAge)}
          planet={destination.planet}
          surfaceDay={surfaceDay}
          sadNews={sadNews}
          millerProgress={destination.miller && ship.phase.kind === "stay" ? (shipYears - ship.phase.tau0) / (ship.phase.tau1 - ship.phase.tau0) : null}
          sky={sky}
        />
        <Hud accent="amber" className="left-3 top-3 max-w-[min(25rem,calc(100%-1.5rem))]">
          <div className="hud-label text-amber-300">🧑‍🚀 {SHIP_NAME} · Nave TERRA-1</div>
          <div className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {shipAlive ? formatAge(shipAge) : <span className="text-rose-200">Murió a los {lifespan}</span>}
          </div>
          <div className="text-sm text-slate-300">
            <span className="font-mono text-amber-200">
              {reunion
                ? "De vuelta en la Tierra"
                : flying
                  ? `Día ${fmtYear(Math.floor(shipYears * 365.25) + 1)}`
                  : stage === "cinematic"
                    ? "Embarcando…"
                    : "En la plataforma"}
            </span>
            {surfaceAct && shipAlive && <> · 🪐 {surfaceAct.label}</>}
            {destination.miller && ship.phase.kind === "stay" && stage === "flight" && shipAlive && (
              <> · 🌊 En el planeta de Miller: cada hora suya son 7 años de {EARTH_NAME}</>
            )}
            {!surfaceAct && !(destination.miller && ship.phase.kind === "stay") && shipAct && flying && !reunion && !shipTimelapse && shipYears * SEC_PER_YEAR > 3_600 && (
              <>
                {" "}· {ship.phase.kind === "cruise" && shipAct.pose !== "sleep" ? `flotando — ${shipAct.label.toLowerCase()}` : shipAct.label}
                {shipAct.pose === "violin" && <span className="text-amber-300"> (nivel {violinLevel})</span>}
              </>
            )}
            {sadNews && <div className="text-xs text-rose-300">💔 Le llegó la noticia: {EARTH_NAME} murió.</div>}
            {shipAlive && shipTimelapse && <> · los días pasan volando</>}
          </div>
          {flying && <div className="mt-1.5"><SpeedBadge self={sim.shipPlayback} other={sim.earthPlayback} otherName={EARTH_NAME} /></div>}
        </Hud>
        <Hud className={`bottom-3 left-3 w-36 p-2 ${stage === "done" ? "hidden" : "hidden sm:block"}`}>
          <div className="hud-label mb-1 text-cyan-300">Navegación</div>
          <div className="aspect-square">
            <StarMap trip={trip} ship={ship} destination={destination} flying={flying} compact />
          </div>
          <div className="mt-1 font-mono text-[10px] leading-tight text-slate-300">
            {flying ? (
              <>
                a {formatLy(ship.x)} de la Tierra
                <br />
                {ship.phase.leg === "ida" ? `faltan ${formatLy(Math.max(0, D - ship.x))} a ${destination.name}` : `volviendo · faltan ${formatLy(ship.x)}`}
              </>
            ) : (
              <>
                destino: {destination.name}
                <br />
                {formatLy(D)} de distancia
              </>
            )}
          </div>
        </Hud>
        {flying && !reunion && (
          <Hud className="bottom-3 right-3 max-w-sm space-y-1 text-xs text-slate-300">
            <div className="grid grid-cols-3 gap-2 font-mono">
              <div>
                <div className="hud-label text-slate-500">Fase</div>
                <div className="text-slate-100">{PHASE_LABEL[ship.phase.kind]}</div>
              </div>
              <div>
                <div className="hud-label text-slate-500">Velocidad</div>
                <div className="text-cyan-200">{formatBeta(Math.abs(ship.beta))}</div>
              </div>
              <div>
                <div className="hud-label text-slate-500">γ</div>
                <div className="text-amber-200">{formatFactor(ship.gamma).slice(1)}</div>
              </div>
            </div>
            {phi > 0.05 && (
              <div>
                Ventana (centro = adelante, borde = atrás): dentro del círculo punteado la luz llega{" "}
                <b className="text-sky-300">más azul (hasta ×{formatFactor(Math.exp(phi)).slice(1)})</b>; fuera,{" "}
                <b className="text-rose-300">más roja y tenue</b>. Es el efecto Doppler.
              </div>
            )}
            <div className={ship.alpha !== 0 ? "text-amber-300" : "text-cyan-300"}>
              {ship.alpha !== 0 ? "Motores a 1 g: siente su peso normal (equivalencia)" : ship.phase.kind === "cruise" ? "Motores apagados: ingravidez" : "En reposo"}
            </div>
            {stage !== "done" && (
              <div>
                📡 Señal a la Tierra hoy: tarda <b className="text-cyan-200">{formatYears(toEarth.earthFrameDelay)}</b>; {EARTH_NAME} la oiría{" "}
                {toEarth.receiverAge >= lifespan ? "— ya muerto" : `con ${formatAge(toEarth.receiverAge)}`}
              </div>
            )}
            {stage !== "done" && (
              <div>
                🔭 Ve la Tierra del año {LAUNCH_YEAR + Math.floor(d.earthSeenFromShip)}: {EARTH_NAME} con {formatAge(Math.min(earthSeenAge, lifespan))}
                {deathNewsArrived && <b className="text-rose-300"> — llegó la noticia de su muerte</b>}
              </div>
            )}
            {rindler && d.earthSeenFromShip < 1.2 && outbound && (
              <div className="text-slate-500">Mientras acelera, la luz de la Tierra casi no lo alcanza (horizonte de Rindler).</div>
            )}
          </Hud>
        )}
      </div>

      {stage === "done" && (
        <div className="glass absolute inset-x-0 top-3/4 z-20 mx-auto w-[min(34rem,calc(100%-2rem))] -translate-y-1/2 p-5 text-center text-sm text-slate-200">
          <div className="hud-label mb-1 text-cyan-300">Fin de la misión</div>
          <div className="mb-2 text-xl font-semibold text-white">
            {sim.roundTrip ? `Regreso a la Tierra · año ${fmtYear(LAUNCH_YEAR + Math.floor(d.earthProper))}` : `Llegada a ${destination.name}`}
          </div>
          <div className="grid grid-cols-2 gap-2 text-left">
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-2">
              <div className="hud-label text-cyan-300">🌍 {EARTH_NAME}</div>
              {earthAlive ? <b className="text-cyan-100">vivo · {formatAge(earthAge)}</b> : <b className="text-rose-300">murió en {LAUNCH_YEAR + Math.floor(deathYears)} a los {lifespan}</b>}
            </div>
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-2">
              <div className="hud-label text-amber-300">🧑‍🚀 {SHIP_NAME}</div>
              {shipAlive ? <b className="text-amber-100">vivo · {formatAge(shipAge)}</b> : <b className="text-rose-300">murió en el viaje a los {lifespan}</b>}
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            En la Tierra pasaron {formatAge(d.earthProper).replace(" y", ",")}; en la nave, {formatAge(d.shipProper).replace(" y", ",")}. Nadie hizo trampa:
            el que viajó (y aceleró) vivió menos tiempo
            {d.earthProper - d.shipProper < 1 / 365.25 && <> — en este viaje, apenas {fmt((d.earthProper - d.shipProper) * 365.25 * 86_400, 1)} segundos</>}.
          </p>
          {sim.roundTrip && destination.planet && shipAlive && (
            <p className="mt-1 text-sm text-amber-200">🪨 {SHIP_NAME} trajo una roca de {destination.name.split(" (")[0]} para {earthAlive ? EARTH_NAME : "la tumba de su hermano"}.</p>
          )}
          <button onClick={sim.reset} className="mt-3 rounded-full border border-cyan-300/40 px-4 py-1.5 text-xs text-cyan-100 transition hover:bg-cyan-400/10">
            Probar otro destino
          </button>
        </div>
      )}
    </section>
  );
}
