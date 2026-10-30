"use client";

import { DESTINATIONS, PHASE_LABEL, stateAt, tauFromT } from "@/lib/relativity";
import { CINEMATIC_SECONDS, type Sim } from "@/hooks/useSimulation";
import { START_AGE, type Derived } from "@/lib/derive";
import { fmt, formatAge, formatBeta, formatFactor, formatLy, formatPlayback, formatYears } from "@/lib/format";
import {
  activityAt, birthdayGuests, lifeEventAt, weatherAt, calendar, EARTH_NAME, earthEpoch, fmtYear, hourOfDay, LAUNCH_YEAR, musicSkill, practiceHours, recentPetLoss, season, SEASON_ICON, SHIP_NAME, surfaceActivity,
} from "@/lib/life";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { techAt } from "@/lib/tech";
import { arrivalTau, earthToShip, shipToEarth } from "@/lib/comms";
import { bioYears, inCryo, tauAtBio } from "@/lib/cryo";
import { dopplerOf, fuel, headlineFor, inbox, shield } from "@/lib/voyage";
import { EarthScene } from "./EarthScene";
import { ShipScene } from "./ShipScene";
import { useSoundscape } from "./useSoundscape";

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
      className={`pointer-events-none absolute overflow-hidden rounded-2xl border border-white/10 bg-[#030712]/60 px-2.5 py-1.5 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-md sm:px-3.5 sm:py-2.5 ${className}`}
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

/** Barra segmentada de la consola: varios controles en una sola pastilla con divisiones. */
const SEGMENTS = "flex items-center overflow-hidden rounded-full border border-white/10 bg-white/[0.04] divide-x divide-white/10";
const SEG = "flex h-7 items-center gap-1.5 px-2.5 text-slate-200";

/** Lo que se esconde en pantallas chicas (celular vertical o apaisado) para no tapar las escenas. */
const SECONDARY = "max-sm:hidden [@media(max-height:520px)]:hidden";

/** Desglose de un intervalo en años, días, horas, minutos y segundos. */
function breakdownTime(years: number) {
  const totalSec = Math.max(0, years) * 365.25 * 86_400;
  const y = Math.floor(totalSec / (365.25 * 86_400));
  let rest = totalSec - y * 365.25 * 86_400;
  const dd = Math.floor(rest / 86_400);
  rest -= dd * 86_400;
  const h = Math.floor(rest / 3600);
  rest -= h * 3600;
  const m = Math.floor(rest / 60);
  const s = Math.floor(rest - m * 60);
  return { y, d: dd, h, m, s };
}

/** Reloj de bolsillo: las agujas muestran la hora que marca después de `years` desde el despegue (9:00). */
function Watch({ years, name, color }: { years: number; name: string; color: string }) {
  const hours = 9 + years * 365.25 * 24;
  const hA = ((hours % 12) / 12) * 360;
  const mA = (((hours * 60) % 60) / 60) * 360;
  const hand = (a: number, l: number) => [50 + Math.sin((a * Math.PI) / 180) * l, 50 - Math.cos((a * Math.PI) / 180) * l];
  const [hx, hy] = hand(hA, 20);
  const [mx, my] = hand(mA, 30);
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 112" className="h-16 w-14 sm:h-20 sm:w-[4.5rem]">
        <circle cx="50" cy="8" r="6" fill="none" stroke="#d4a017" strokeWidth="3" />
        <rect x="45" y="12" width="10" height="6" rx="2" fill="#d4a017" />
        <circle cx="50" cy="56" r="40" fill="#fef9c3" stroke="#d4a017" strokeWidth="6" />
        <g transform="translate(0 6)">
          {Array.from({ length: 12 }, (_, i) => {
            const [x1, y1] = hand(i * 30, 34);
            const [x2, y2] = hand(i * 30, i % 3 ? 31 : 28);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1e1b2e" strokeWidth={i % 3 ? 1.5 : 3} />;
          })}
          <line x1="50" y1="50" x2={hx} y2={hy} stroke="#1e1b2e" strokeWidth="4" strokeLinecap="round" />
          <line x1="50" y1="50" x2={mx} y2={my} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="50" cy="50" r="3" fill="#1e1b2e" />
        </g>
      </svg>
      <div className="hud-label text-[10px]" style={{ color }}>{name}</div>
    </div>
  );
}

/** Los dos relojes que pusieron en hora al despegar, juntos otra vez, y cuánto se desfasaron. */
function PocketWatches({ earth, ship }: { earth: number; ship: number }) {
  const diff = breakdownTime(earth - ship);
  return (
    <div className="mt-2 flex items-center justify-center gap-3">
      <Watch years={earth} name={EARTH_NAME} color="#0891b2" />
      <div className="max-w-[12rem] text-left text-[11px] leading-snug text-slate-300">
        Pusieron en hora estos dos relojes al despegar. Hoy el de {SHIP_NAME} va atrasado:
        <div className="mt-0.5 font-mono text-amber-200">
          {diff.y > 0 && `${fmt(diff.y, 0)} a `}
          {diff.d} d {diff.h} h {diff.m} min {diff.s} s
        </div>
      </div>
      <Watch years={ship} name={SHIP_NAME} color="#d97706" />
    </div>
  );
}

/** Barrita de nivel (combustible, escudo). */
function Gauge({ label, value, color, note }: { label: string; value: number; color: string; note?: string }) {
  return (
    <div title={note}>
      <div className="hud-label text-slate-500">{label}</div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full ${color}`} style={{ width: `${Math.max(1, value * 100)}%` }} />
      </div>
      <div className="font-mono text-[10px] text-slate-400">{fmt(value * 100, value < 0.1 ? 1 : 0)} %</div>
    </div>
  );
}

/** Quiénes van al cumpleaños de Martín y a quiénes ya no puede invitar. */
function BirthdayNote({ age }: { age: number }) {
  const { guests, gone, away, frail } = birthdayGuests(age);
  const friends = guests.filter((g) => g.role === "amigo" || g.role === "amiga").map((g) => g.name);
  const family = guests.filter((g) => g.role !== "amigo" && g.role !== "amiga" && g.age >= 2).map((g) => g.name);
  const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}` : xs[0]);
  return (
    <div className="mt-0.5 text-xs text-pink-300">
      <b>🎂 ¡Cumple {age} años!</b>{" "}
      {friends.length ? `Lo visitan ${list(friends)}` : "Ya no quedan amigos que puedan venir"}
      {family.length > 0 && <>{friends.length ? ", con " : "; lo acompaña "}{list(family)}</>}.
      {gone.length > 0 && <span className="text-slate-400"> Extraña a {list(gone)}.</span>}
      {away.length > 0 && <span className="text-slate-400"> {list(away)} lo llama desde lejos.</span>}
      {frail.length > 0 && <span className="text-slate-400"> {list(frail)} ya no sale de casa: lo saluda por teléfono.</span>}
    </div>
  );
}

const PHASE_COLOR: Record<string, string> = { accel: "#f59e0b", cruise: "#22d3ee", decel: "#a78bfa", stay: "#f472b6", surface: "#f97316" };

export function TwinsTheater({ sim, d, onOpen }: { sim: Sim; d: Derived; onOpen: (p: "map" | "control" | "data" | "clocks") => void }) {
  const { stage, ship, trip, lifespan, destination, cinematicTime } = sim;
  const [copied, setCopied] = useState(false);
  const [sound, setSound] = useState(false);
  const clocks = useGestureClocks(sim.earthPlayback, sim.shipPlayback, (stage === "flight" || stage === "cinematic") && !sim.playing);
  const flying = stage === "flight" || stage === "done";

  const earthYears = flying ? d.earthProper : 0;
  const shipYears = flying ? d.shipProper : 0;
  const deathYears = lifespan - START_AGE;
  const earthAge = START_AGE + Math.min(earthYears, deathYears);
  // Con hipersueño el cuerpo de Tomás casi no envejece en el crucero: su edad es biológica, no la del reloj.
  const shipBio = bioYears(trip, shipYears, sim.sleep);
  const cryo = flying && stage === "flight" && inCryo(trip, shipYears, sim.sleep);
  const shipAge = START_AGE + Math.min(shipBio, deathYears);
  const earthAlive = earthYears < deathYears;
  const shipAlive = shipBio < deathYears;
  // Lo sacaron del hipersueño y, despierto, no le alcanza la vida para terminar el viaje.
  const doomed = flying && stage === "flight" && shipAlive && !sim.hypersleep && sim.sleep.length > 0 && tauAtBio(trip, deathYears, sim.sleep) < trip.totalTau;
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

  const toShip = earthToShip(trip, ship, sim.sleep);

  // Cumpleaños: los gemelos despegaron el día que cumplían 30, así que cada uno cumple años cuando su propio
  // reloj completa un año más. El aviso dura ~2 s reales aunque el ritmo sea rápido (y al menos un día).
  // En pausa vale solo el día exacto, para no ver fiestas al revisar el viaje con la barra.
  const winE = sim.playing ? Math.min(0.5, Math.max(1 / 365.25, sim.earthPlayback * 2)) : 1 / 365.25;
  const winS = sim.playing ? Math.min(0.5, Math.max(1 / 365.25, sim.shipPlayback * 2)) : 1 / 365.25;
  const live = stage === "flight";
  // Con el ritmo muy alto (más de un año por segundo) los cumpleaños serían una fiesta continua: no se muestran.
  const calmE = !sim.playing || sim.earthPlayback <= 1;
  const calmS = !sim.playing || sim.shipPlayback <= 1;
  const kEarth = Math.floor(earthYears);
  const earthBirthday = live && calmE && earthAlive && kEarth >= 1 && earthYears - kEarth < winE ? START_AGE + kEarth : null;
  // Saludos de cumpleaños: cada uno graba un mensaje el día que cumple, y le llega al otro cuando llega esa luz.
  const kFromEarth = Math.floor(d.earthSeenFromShip);
  const greetFromEarth =
    live && calmS && shipAlive && !cryo && kFromEarth >= 1 && kFromEarth < deathYears && shipYears - arrivalTau(trip, kFromEarth) < winS ? kFromEarth : null;
  const kFromShip = Math.floor(d.shipSeenFromEarth);
  const sent = kFromShip >= 1 ? stateAt(trip, kFromShip) : null;
  const greetFromShip =
    live && calmE && earthAlive && sent && bioYears(trip, kFromShip, sim.sleep) < deathYears && !inCryo(trip, kFromShip, sim.sleep) && earthYears - (sent.t + sent.x) < winE
      ? { age: Math.floor(START_AGE + bioYears(trip, kFromShip, sim.sleep)), sentAt: sent.t }
      : null;

  // Martín ve por el telescopio que la nave dio la vuelta cuando le llega esa luz; la nave viene casi
  // pegada a su propia luz, así que llega muy poco después.
  const turn = trip.phases.find((p) => p.leg === "vuelta");
  const turnSeenAt = turn ? stateAt(trip, turn.tau0).t + stateAt(trip, turn.tau0).x : Infinity;
  const welcome = sim.roundTrip && live && earthAlive && earthYears >= turnSeenAt;
  const lifeEvent = live && calmE && earthAlive ? lifeEventAt(earthAge, sim.playing ? Math.max(30 / 365.25, sim.earthPlayback * 2) : 30 / 365.25) : null;

  // Sonido: solo lo que pasa a velocidad "humana" y con la simulación corriendo.
  const running = sim.playing || stage === "cinematic";
  const launchSec = shipYears * SEC_PER_YEAR;
  useSoundscape(sound, {
    rumble: !running ? 0 : stage === "cinematic" ? Math.max(0, (cinematicTime - 12) / 4) : stage === "flight" && launchSec < 600 ? 1 - launchSec / 600 : 0,
    hum: running && live && !shipTimelapse && ship.phase.kind !== "surface" && !(destination.miller && ship.phase.kind === "stay"),
    rain: running && !earthTimelapse && (earthSetting === "home" || (earthSetting === "after" && (epoch.key === "grave" || epoch.key === "future"))) ? weatherAt(earthYears).rain : 0,
    guitar: running && !earthTimelapse && earthSetting === "home" && earthAct?.pose === "guitar" && earthAct.walkingFrom === undefined ? musicSkill(practiceHours("earth", earthYears)).skill : null,
    violin: running && live && !shipTimelapse && !cryo && shipAct?.pose === "violin" && shipAct.walkingFrom === undefined ? musicSkill(practiceHours("ship", shipYears)).skill : null,
    singing: running && !earthTimelapse && earthBirthday !== null && hourOfDay(earthYears) >= 18.5 && hourOfDay(earthYears) < 19 ? earthBirthday : null,
  });

  // Marcas en la barra de progreso (en tiempo de la nave).
  const marks = (() => {
    const list: { tau: number; icon: string; label: string }[] = [];
    const arrive = trip.phases.find((p) => p.kind === "surface" || p.kind === "stay");
    const outEnd = trip.phases.filter((p) => p.leg === "ida").at(-1);
    if (arrive) list.push({ tau: arrive.tau0 + 1e-6, icon: "🪐", label: `Llegada a ${destination.name}` });
    else if (outEnd && sim.roundTrip) list.push({ tau: outEnd.tau1 - 1e-6, icon: "🎯", label: `Llegada a ${destination.name}` });
    if (turn) list.push({ tau: turn.tau0 + 1e-6, icon: "↩️", label: "Media vuelta: empieza el regreso" });
    for (const age of [40, 50, 60, 70, 80]) {
      if (age >= lifespan) break;
      const tau = tauFromT(trip, age - START_AGE);
      if (tau < trip.totalTau) list.push({ tau: tau + 1e-6, icon: "🎂", label: `${EARTH_NAME} cumple ${age}` });
    }
    const earthDeath = tauFromT(trip, deathYears);
    if (earthDeath < trip.totalTau) list.push({ tau: earthDeath, icon: "🕯️", label: `Muere ${EARTH_NAME}` });
    const shipDeath = tauAtBio(trip, deathYears, sim.sleep);
    if (shipDeath < trip.totalTau) list.push({ tau: shipDeath, icon: "✝️", label: `Muere ${SHIP_NAME}` });
    list.push({ tau: trip.totalTau, icon: sim.roundTrip ? "🤝" : "🏁", label: sim.roundTrip ? "Reencuentro" : "Fin del viaje" });
    // Que no se encimen: primero los hitos del viaje y las muertes; los cumpleaños solo si hay espacio.
    const gap = trip.totalTau * 0.05;
    const shown: typeof list = [];
    for (const m of [...list.filter((x) => x.icon !== "🎂"), ...list.filter((x) => x.icon === "🎂")])
      if (shown.every((o) => Math.abs(o.tau - m.tau) > gap)) shown.push(m);
    return shown;
  })();

  // Bandeja de mensajes semanales de Martín: con el Doppler llegan a cuentagotas al alejarse y de golpe al volver.
  const mail = inbox(d.earthSeenFromShip, deathYears, dopplerOf(ship, trip.stayRate));
  const tank = fuel(trip, shipYears);
  const armor = shield(trip, shipYears);
  const news = headlineFor(LAUNCH_YEAR + Math.floor(d.earthSeenFromShip));

  // Hacia dónde mira la cámara en pantallas angostas: el personaje o lo que está pasando.
  const placeX = (a: { place: number; walkingFrom?: number; walkT?: number }) =>
    (a.walkingFrom !== undefined ? a.walkingFrom + (a.place - a.walkingFrom) * (a.walkT ?? 0) : a.place) * 800;
  const earthFocus =
    earthSetting === "launch"
      ? stage === "boarding"
        ? 260
        : 600
      : earthSetting === "home"
        ? earthAct
          ? earthAct.pose === "walk" && earthAct.walkingFrom === undefined
            ? 400
            : placeX(earthAct)
          : 120
        : earthSetting === "reunion"
          ? 430
          : 400;
  const shipFocus =
    stage === "boarding"
      ? 330
      : stage === "cinematic"
        ? cinematicTime < 6
          ? 300 + (cinematicTime / 6) * 278
          : 400
        : reunion
          ? 200
          : cryo
            ? 290
            : ship.phase.kind === "surface" || ship.phase.kind === "stay" || shipYears * SEC_PER_YEAR < 3_600 || !shipAct
              ? 400
              : placeX(shipAct);
  const toEarth = shipToEarth(ship, d.earthRate);
  const countdown = stage === "cinematic" ? Math.ceil(CINEMATIC_SECONDS - cinematicTime) : 0;

  const progress = trip.totalTau > 0 ? Math.min(1, shipYears / trip.totalTau) : 0;

  return (
    <section className="relative flex h-[100svh] flex-col overflow-hidden bg-black [@media(min-height:520px)]:min-h-[560px]">
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
          focusX={earthFocus}
          onOpenClocks={() => onOpen("clocks")}
          party={earthBirthday !== null}
          welcome={welcome}
        />
        <Hud accent="cyan" className="left-2 top-2 max-w-[min(25rem,calc(100%-1rem))] sm:left-3 sm:top-3">
          <div className="hud-label text-cyan-300">🌍 {EARTH_NAME} · Tierra</div>
          <div className="text-lg font-semibold tracking-tight text-white sm:text-3xl [@media(max-height:520px)]:text-lg">
            {earthAlive ? formatAge(earthAge) : <span className="text-rose-200">Murió a los {lifespan}</span>}
          </div>
          <div className="text-xs text-slate-300 sm:text-sm">
            <span className="font-mono text-cyan-200">{epoch.title}</span>
            {flying && earthAlive && earthSetting === "home" && (
              <>
                {" "}· {SEASON_ICON[ss]} {ss}
                {!earthTimelapse && (() => {
                  const w = weatherAt(earthYears);
                  return w.snow ? " · nieva" : w.rain > 0 ? " · llueve" : w.clouds > 0.55 ? " · nublado" : "";
                })()}
              </>
            )}
            {earthAct && flying && earthSetting === "home" && !earthTimelapse && (
              <>
                {" "}· {earthAct.label}
                {earthAct.pose === "guitar" && <span className="text-cyan-300"> (nivel {guitarLevel})</span>}
              </>
            )}
            {earthAlive && earthTimelapse && <> · los días pasan volando</>}
          </div>
          {earthBirthday && <BirthdayNote age={earthBirthday} />}
          {lifeEvent && <div className="mt-0.5 text-xs text-violet-300">⭐ {lifeEvent}</div>}
          {welcome && (
            <div className="mt-0.5 text-xs text-emerald-300">
              🔭 Vio que la nave dio la vuelta y prepara la bienvenida: llega en {formatYears(Math.max(0, trip.totalT - earthYears))}
            </div>
          )}
          {greetFromShip && (
            <div className="mt-0.5 text-xs text-amber-200">
              📨 Llegó el saludo que {SHIP_NAME} grabó al cumplir {greetFromShip.age}: la luz tardó {formatYears(earthYears - greetFromShip.sentAt)}
            </div>
          )}
          {loss && <div className="mt-0.5 text-xs text-rose-300">💔 Está triste: murió {loss.name}. Sus cenizas quedaron en una urna en el estante.</div>}
          {epoch.note && <div className={`mt-0.5 text-xs text-slate-400 ${SECONDARY}`}>{epoch.note}</div>}
          {flying && techAt(LAUNCH_YEAR + Math.floor(earthYears)).level > 0 && (
            <div className={`mt-0.5 text-xs text-cyan-300/90 ${SECONDARY}`}>◇ {techAt(LAUNCH_YEAR + Math.floor(earthYears)).name}</div>
          )}
          {flying && <div className={`mt-1.5 ${SECONDARY}`}><SpeedBadge self={sim.earthPlayback} other={sim.shipPlayback} otherName={SHIP_NAME} /></div>}
        </Hud>
        {flying && stage !== "done" && earthAlive && (
          <Hud className={`bottom-3 right-3 hidden max-w-xs text-xs text-slate-300 sm:block ${SECONDARY}`}>
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
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Reproducción */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={sim.togglePlay}
              className="rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-1.5 font-semibold text-slate-950 shadow-[0_0_20px_-4px_rgba(251,146,60,0.9)] transition hover:brightness-110"
            >
              {stage === "boarding" ? "🚀 Subir al cohete" : stage === "done" ? "↺ Repetir" : sim.playing ? "⏸ Pausa" : "▶ Seguir"}
            </button>
            <button onClick={sim.reset} title="Reiniciar" aria-label="Reiniciar" className="rounded-full border border-white/15 px-3 py-1.5 text-slate-300 transition hover:border-white/40 hover:text-white">
              <span className="max-sm:hidden">Reiniciar</span>
              <span className="sm:hidden">↺</span>
            </button>
          </div>
          {/* Viaje: destino y ajustes, en una sola barra segmentada (en el celular va abajo, en su propia fila) */}
          <div className={`${SEGMENTS} max-sm:order-2`}>
            <label className={`${SEG} min-w-0`}>
              <span className="hud-label text-slate-400">Destino</span>
              <select
                value={destination.id}
                onChange={(e) => sim.setDestination(DESTINATIONS.find((x) => x.id === e.target.value)!)}
                className="max-w-[11rem] truncate bg-transparent font-medium text-white outline-none sm:max-w-[15rem] [&>option]:bg-slate-900"
              >
                {destination.id === "custom" && <option value="custom">{formatLy(destination.distance)} (personalizado)</option>}
                {DESTINATIONS.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name} · {formatLy(x.distance)}
                  </option>
                ))}
              </select>
            </label>
            <label className={`${SEG} cursor-pointer ${SECONDARY}`} title="Ida y vuelta: Tomás regresa a la Tierra">
              <input type="checkbox" checked={sim.roundTrip} onChange={(e) => sim.setRoundTrip(e.target.checked)} className="accent-cyan-400" />
              ↩ <span className="hidden 2xl:inline">ida y vuelta</span>
            </label>
            <label className={`${SEG} ${SECONDARY}`} title="Cuánto tiempo pasa por cada segundo real">
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
            <label
              className={`${SEG} ${SECONDARY} ${shipAlive ? "cursor-pointer" : "cursor-not-allowed opacity-40"}`}
              title={shipAlive ? "Hipersueño: desde ahora Tomás duerme en una cápsula criogénica durante el crucero y su cuerpo casi no envejece (animación suspendida)" : `${SHIP_NAME} murió: ya no puede entrar a la cápsula`}
            >
              <input type="checkbox" checked={sim.hypersleep && shipAlive} disabled={!shipAlive} onChange={(e) => sim.setHypersleep(e.target.checked)} className="accent-sky-300" />
              ❄️ <span className="hidden 2xl:inline">hipersueño</span>
            </label>
            <label className={`${SEG} cursor-pointer ${SECONDARY}`} title="Director: cámara lenta automática en el despegue, el volteo, las muertes y la llegada">
              <input type="checkbox" checked={sim.director} onChange={(e) => sim.setDirector(e.target.checked)} className="accent-cyan-400" />
              🎬 <span className="hidden 2xl:inline">director</span>
            </label>
          </div>
          {/* Paneles y herramientas: solo íconos (con nombre en pantallas muy anchas) */}
          <div className={SEGMENTS}>
            <button onClick={() => onOpen("map")} title="Mapa" aria-label="Mapa" className={`${SEG} transition hover:bg-white/10`}>
              🗺 <span className="hidden 2xl:inline">Mapa</span>
            </button>
            <button onClick={() => onOpen("control")} title="Control" aria-label="Control" className={`${SEG} transition hover:bg-white/10`}>
              ⚙ <span className="hidden 2xl:inline">Control</span>
            </button>
            <button onClick={() => onOpen("data")} title="Datos" aria-label="Datos" className={`${SEG} transition hover:bg-white/10`}>
              📊 <span className="hidden 2xl:inline">Datos</span>
            </button>
            <button
              onClick={() => setSound((v) => !v)}
              title={sound ? "Silenciar" : "Activar sonido: despegue, cabina, lluvia, guitarra, violín y cumpleaños"}
              aria-label={sound ? "Silenciar" : "Activar sonido"}
              className={`${SEG} transition hover:bg-white/10`}
            >
              {sound ? "🔊" : "🔇"}
            </button>
            <button
              onClick={async () => {
                const url = sim.shareUrl();
                try {
                  await navigator.clipboard.writeText(url);
                } catch {
                  window.prompt("Copia este link", url);
                }
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
              title="Copiar un link a este viaje en este momento"
              aria-label="Compartir"
              className={`${SEG} transition hover:bg-white/10`}
            >
              {copied ? "✓" : "🔗"}
            </button>
          </div>
          {countdown > 0 && countdown <= 10 && <span className="glow-amber font-mono text-lg font-bold text-amber-300">T−{countdown}</span>}
        </div>
        {/* Línea de tiempo de la misión por fases: se puede arrastrar para moverse por el viaje */}
        <div className="mx-auto mt-1 flex max-w-5xl items-end gap-2">
          <span className="hud-label w-12 shrink-0 pb-1 text-right text-slate-500">T+0</span>
          <div className="flex-1">
            {/* Carril de momentos clave sobre la barra: un clic salta directo a cada uno */}
            <div className="relative h-4">
              {marks.map((m) => (
                <button
                  key={m.label}
                  onClick={() => sim.seek(m.tau)}
                  title={m.label}
                  aria-label={m.label}
                  className="group absolute bottom-0 flex -translate-x-1/2 flex-col items-center"
                  style={{ left: `${(m.tau / trip.totalTau) * 100}%` }}
                >
                  <span className="text-[11px] leading-none opacity-75 transition group-hover:scale-125 group-hover:opacity-100">{m.icon}</span>
                  <span className="h-1 w-px bg-white/30" />
                </button>
              ))}
            </div>
            <div className="relative h-5">
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
          </div>
          <span className="hud-label w-16 shrink-0 pb-1 text-slate-400">{Math.round(progress * 100)} %</span>
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
          sadNews={sadNews && !cryo}
          cryo={cryo}
          outside={{ years: earthYears, deathYears }}
          focusX={shipFocus}
          onOpenMap={() => onOpen("map")}
          onOpenClocks={() => onOpen("clocks")}
          millerProgress={destination.miller && ship.phase.kind === "stay" ? (shipYears - ship.phase.tau0) / (ship.phase.tau1 - ship.phase.tau0) : null}
          sky={sky}
        />
        <Hud accent="amber" className="left-2 top-2 max-w-[min(25rem,calc(100%-1rem))] sm:left-3 sm:top-3">
          <div className="hud-label text-amber-300">🧑‍🚀 {SHIP_NAME} · Nave TERRA-1</div>
          <div className="text-lg font-semibold tracking-tight text-white sm:text-3xl [@media(max-height:520px)]:text-lg">
            {shipAlive ? formatAge(shipAge) : <span className="text-rose-200">Murió a los {lifespan}</span>}
          </div>
          <div className="text-xs text-slate-300 sm:text-sm">
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
            {cryo && shipAlive && <span className="text-sky-200"> · ❄️ En hipersueño: su cuerpo casi no envejece</span>}
            {!cryo && !surfaceAct && !(destination.miller && ship.phase.kind === "stay") && shipAct && flying && !reunion && !shipTimelapse && shipYears * SEC_PER_YEAR > 3_600 && (
              <>
                {" "}· {ship.phase.kind === "cruise" && shipAct.pose !== "sleep" ? `flotando — ${shipAct.label.toLowerCase()}` : shipAct.label}
                {shipAct.pose === "violin" && <span className="text-amber-300"> (nivel {violinLevel})</span>}
              </>
            )}
            {doomed && (
              <div className="text-xs text-amber-300">⚠️ Despierto no le alcanza la vida para terminar el viaje: vuelve a activar ❄️ hipersueño.</div>
            )}
            {greetFromEarth && (
              <div className="text-xs text-cyan-200">
                📨 Llegó el saludo que {EARTH_NAME} grabó al cumplir {START_AGE + greetFromEarth}: la luz tardó {formatYears(ship.t - greetFromEarth)}
                {!earthAlive && " — en la Tierra, él ya murió"}
              </div>
            )}
            {live && shipAlive && !cryo && mail.perShipWeek >= 7 && (
              <div className="text-xs text-sky-300">📬 Le llegan de golpe los mensajes de {EARTH_NAME}: {fmt(mail.perShipWeek / 7, 0)} por día. Ve pasar años de su vida en semanas.</div>
            )}
            {live && shipAlive && !cryo && mail.received > 0 && mail.perShipWeek > 0 && mail.perShipWeek < 0.3 && (
              <div className="text-xs text-rose-300/80">📭 Los mensajes de {EARTH_NAME} llegan a cuentagotas: uno cada {fmt(1 / mail.perShipWeek, 0)} semanas.</div>
            )}
            {sadNews && !cryo && <div className="text-xs text-rose-300">💔 Le llegó la noticia: {EARTH_NAME} murió.</div>}
            {shipAlive && shipTimelapse && <> · los días pasan volando</>}
          </div>
          {flying && <div className={`mt-1.5 ${SECONDARY}`}><SpeedBadge self={sim.shipPlayback} other={sim.earthPlayback} otherName={EARTH_NAME} /></div>}
        </Hud>
        {flying && !reunion && (
          <Hud className={`bottom-3 right-3 max-w-sm space-y-1 text-xs text-slate-300 ${SECONDARY}`}>
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
            <div className="grid grid-cols-3 gap-2 pt-0.5">
              <Gauge label="Combustible" value={tank.left} color="bg-amber-400" />
              <Gauge label="Escudo" value={armor.left} color="bg-sky-400" note={armor.patched ? "reparado con la reserva" : undefined} />
              <div>
                <div className="hud-label text-slate-500">Bandeja</div>
                <div className="font-mono text-slate-100">📬 {fmt(mail.received, 0)}</div>
              </div>
            </div>
            {stage !== "done" && news && (
              <div className="text-slate-400">
                📰 Última noticia de la Tierra ({fmtYear(news[0])}): <span className="text-slate-200">{news[1]}</span>
              </div>
            )}
            {rindler && d.earthSeenFromShip < 1.2 && outbound && (
              <div className="text-slate-500">Mientras acelera, la luz de la Tierra casi no lo alcanza (horizonte de Rindler).</div>
            )}
          </Hud>
        )}
      </div>

      {stage === "done" && (
        <div className="glass absolute inset-x-0 top-3/4 z-20 mx-auto w-[min(34rem,calc(100%-2rem))] -translate-y-1/2 p-5 text-center text-sm text-slate-200 max-sm:p-3 [@media(max-height:520px)]:top-auto [@media(max-height:520px)]:bottom-2 [@media(max-height:520px)]:translate-y-0 [@media(max-height:520px)]:p-2.5">
          <div className="hud-label mb-1 text-cyan-300">Fin de la misión</div>
          <div className="mb-2 text-xl font-semibold text-white max-sm:text-lg [@media(max-height:520px)]:mb-1 [@media(max-height:520px)]:text-base">
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
          {sim.roundTrip && <PocketWatches earth={d.earthProper} ship={d.shipProper} />}
          <p className="mt-2 text-xs text-slate-400 [@media(max-height:520px)]:hidden">
            En la Tierra pasaron {formatAge(d.earthProper).replace(" y", ",")}; en la nave, {formatAge(d.shipProper).replace(" y", ",")}. Nadie hizo trampa:
            el que viajó (y aceleró) vivió menos tiempo
            {d.earthProper - d.shipProper < 1 / 365.25 && <> — en este viaje, apenas {fmt((d.earthProper - d.shipProper) * 365.25 * 86_400, 1)} segundos</>}.
          </p>
          {sim.roundTrip && destination.planet && shipAlive && (
            <p className="mt-1 text-sm text-amber-200">🪨 {SHIP_NAME} trajo una roca de {destination.name.split(" (")[0]} para {earthAlive ? EARTH_NAME : "la tumba de su hermano"}.</p>
          )}
          <button onClick={sim.reset} className="mt-3 rounded-full [@media(max-height:520px)]:mt-1.5 border border-cyan-300/40 px-4 py-1.5 text-xs text-cyan-100 transition hover:bg-cyan-400/10">
            Probar otro destino
          </button>
        </div>
      )}
    </section>
  );
}
