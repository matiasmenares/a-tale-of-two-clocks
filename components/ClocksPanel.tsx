"use client";

import type { Sim } from "@/hooks/useSimulation";
import { bioYears } from "@/lib/cryo";
import { START_AGE, type Derived } from "@/lib/derive";
import { formatAge, formatYears, fmt } from "@/lib/format";
import { calendar, EARTH_NAME, fmtYear, hourOfDay, LAUNCH_YEAR, SHIP_NAME } from "@/lib/life";

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Fecha y hora que marca un reloj que se puso en hora al despegar (1 de enero, 9:00). */
function dateOf(years: number) {
  const { dayOfYear, weekday } = calendar(years);
  let d = Math.floor(dayOfYear);
  let m = 0;
  while (m < 11 && d >= MONTH_DAYS[m]) d -= MONTH_DAYS[m++];
  const year = LAUNCH_YEAR + Math.floor((years * 365.25 + 9 / 24) / 365.25);
  const h = hourOfDay(years);
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return {
    day: d + 1,
    month: MONTHS[m],
    year,
    weekday: WEEKDAYS[weekday],
    time: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
    hour: h,
  };
}

/** Reloj de pared analógico con la hora del día. */
function Dial({ hour, color }: { hour: number; color: string }) {
  const hA = ((hour % 12) / 12) * 360;
  const mA = ((hour % 1) * 360);
  const end = (a: number, l: number) => [50 + Math.sin((a * Math.PI) / 180) * l, 50 - Math.cos((a * Math.PI) / 180) * l];
  const [hx, hy] = end(hA, 22);
  const [mx, my] = end(mA, 33);
  return (
    <svg viewBox="0 0 100 100" className="h-28 w-28">
      <circle cx="50" cy="50" r="46" fill="#0f172a" stroke={color} strokeWidth="3" />
      <circle cx="50" cy="50" r="40" fill="#f8fafc" />
      {Array.from({ length: 12 }, (_, i) => {
        const [x1, y1] = end(i * 30, 37);
        const [x2, y2] = end(i * 30, i % 3 ? 34 : 31);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1e1b2e" strokeWidth={i % 3 ? 1.5 : 3} />;
      })}
      <line x1="50" y1="50" x2={hx} y2={hy} stroke="#1e1b2e" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="50" y1="50" x2={mx} y2={my} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="50" cy="50" r="3.5" fill="#1e1b2e" />
    </svg>
  );
}

/** Hoja de calendario con el día, el mes y el año. */
function CalendarPage({ date, color }: { date: ReturnType<typeof dateOf>; color: string }) {
  return (
    <div className="w-28 overflow-hidden rounded-xl border border-white/10 bg-slate-50 text-center text-slate-900 shadow">
      <div className="py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white" style={{ background: color }}>{date.month}</div>
      <div className="text-4xl font-bold leading-tight">{date.day}</div>
      <div className="pb-1 text-[11px] text-slate-500">{date.weekday} · {fmtYear(date.year)}</div>
    </div>
  );
}

function Side({ title, color, years, age, rate, note }: { title: string; color: string; years: number; age: string; rate: string; note: string }) {
  const date = dateOf(years);
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="hud-label" style={{ color }}>{title}</div>
      <div className="mt-2 flex items-center justify-center gap-4">
        <Dial hour={date.hour} color={color} />
        <CalendarPage date={date} color={color} />
      </div>
      <div className="mt-3 text-center font-mono text-2xl text-white">{date.time}</div>
      <dl className="mt-2 space-y-1 text-sm">
        <div className="flex justify-between gap-2"><dt className="text-slate-400">Tiempo desde el despegue</dt><dd className="font-mono text-white">{formatYears(years)}</dd></div>
        <div className="flex justify-between gap-2"><dt className="text-slate-400">Edad</dt><dd className="font-mono text-white">{age}</dd></div>
        <div className="flex justify-between gap-2"><dt className="text-slate-400">Su reloj avanza</dt><dd className="font-mono text-white">{rate}</dd></div>
      </dl>
      <p className="mt-2 text-xs text-slate-400">{note}</p>
    </section>
  );
}

/** Los dos relojes lado a lado: lo que marca cada uno, lo que cada uno ve del otro y cuánto se desfasaron. */
export function ClocksPanel({ sim, d }: { sim: Sim; d: Derived }) {
  const flying = sim.stage === "flight" || sim.stage === "done";
  const earth = flying ? d.earthProper : 0;
  const ship = flying ? d.shipProper : 0;
  const deathYears = sim.lifespan - START_AGE;
  const shipBio = bioYears(sim.trip, ship, sim.sleep);
  const rel = ship > 0 ? earth / ship : 1;
  const diff = earth - ship;
  const gamma = sim.ship.gamma;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Side
          title={`🌍 Reloj de ${EARTH_NAME} · Tierra`}
          color="#0891b2"
          years={earth}
          age={earth < deathYears ? formatAge(START_AGE + earth) : `murió a los ${sim.lifespan}`}
          rate="1 día por día (es el reloj de referencia)"
          note="Calendario de la Tierra desde el despegue, el 1 de enero de 2030 a las 9:00."
        />
        <Side
          title={`🧑‍🚀 Reloj de ${SHIP_NAME} · Nave`}
          color="#d97706"
          years={ship}
          age={shipBio < deathYears ? formatAge(START_AGE + shipBio) : `murió a los ${sim.lifespan}`}
          rate={sim.ship.phase.kind === "stay" ? `1 día cada ${fmt(1 / sim.trip.stayRate, 0)} de la Tierra` : gamma > 1.001 ? `1 día cada ${fmt(gamma, gamma < 10 ? 2 : 0)} de la Tierra` : "casi igual que la Tierra"}
          note="El mismo modelo de reloj, puesto en hora junto al de su hermano antes de subir al cohete."
        />
      </div>
      <section className="rounded-2xl border border-cyan-300/20 bg-cyan-400/5 p-4 text-sm text-slate-200">
        <div className="hud-label mb-2 text-cyan-300">Comparación</div>
        {flying ? (
          <ul className="space-y-1.5">
            <li>
              ⏱ El reloj de {SHIP_NAME} va <b className="text-amber-200">{formatYears(Math.max(0, diff))}</b> atrasado respecto al de {EARTH_NAME}
              {rel > 1.0001 && <> (en total, {fmt(rel, rel < 10 ? 2 : 0)} veces menos tiempo)</>}.
            </li>
            <li>
              🔭 Por el telescopio, {EARTH_NAME} <b>ve</b> el reloj de la nave marcando {dateOf(d.shipSeenFromEarth).day} de {dateOf(d.shipSeenFromEarth).month} de{" "}
              {fmtYear(dateOf(d.shipSeenFromEarth).year)}: es luz que salió hace tiempo.
            </li>
            <li>
              🔭 {SHIP_NAME} <b>ve</b> el reloj de la Tierra marcando {dateOf(d.earthSeenFromShip).day} de {dateOf(d.earthSeenFromShip).month} de{" "}
              {fmtYear(dateOf(d.earthSeenFromShip).year)}.
            </li>
            <li>
              🧮 Según la simultaneidad de la nave, «ahora» en la Tierra es {dateOf(d.earthCalcFromShip).day} de {dateOf(d.earthCalcFromShip).month} de{" "}
              {fmtYear(dateOf(d.earthCalcFromShip).year)}
              {Math.abs(d.earthCalcFromShip - earth) > 0.01 && <span className="text-slate-400"> (no coincide con la Tierra: cada uno tiene su propio «ahora»)</span>}.
            </li>
          </ul>
        ) : (
          <p>Los dos relojes marcan lo mismo: están juntos en la plataforma. Pulsa «Subir al cohete» y mira cómo se separan.</p>
        )}
      </section>
    </div>
  );
}
