"use client";

import type { Sim } from "@/hooks/useSimulation";
import {
  EARTH_CLOCK_SHIFTS,
  gpsMicrosecondsPerDay,
  M31_BH_MASSES,
  M_SUN,
  schwarzschildRadius,
  schwarzschildRate,
} from "@/lib/gravity";
import { formatFactor, formatYears, fmt } from "@/lib/format";
import { Tex } from "./Tex";

const W = 360;
const H = 170;

/** Embudo (paraboloide de Flamm) del agujero negro M31* con la posición del astronauta. */
export function GravityWell({ sim }: { sim: Sim }) {
  const { trip, ship } = sim;
  const k = sim.stayK;
  const rate = schwarzschildRate(k);
  const rsAU = schwarzschildRadius(M31_BH_MASSES * M_SUN) / 1.496e11;
  const rMax = 8;
  const px = (r: number) => (r / rMax) * (W / 2 - 10);
  const depth = (r: number) => 30 + 110 * (1 - Math.sqrt(Math.max(0, r - 1)) / Math.sqrt(rMax - 1));
  const pts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const r = 1 + ((rMax - 1) * i * i) / 3600;
    pts.push(`${W / 2 + px(r)},${depth(r)}`);
  }
  const right = pts.join(" ");
  const left = pts.map((p) => p.split(",")).map(([x, y]) => `${W - Number(x)},${y}`).join(" ");
  const there = ship.phase.kind === "stay" && sim.stage === "flight";
  const gps = gpsMicrosecondsPerDay();
  const earthTotal = trip.totalT * (EARTH_CLOCK_SHIFTS.earthSurface + EARTH_CLOCK_SHIFTS.sunAt1AU + EARTH_CLOCK_SHIFTS.orbitalSpeed);

  return (
    <section className="glass p-4">
      <h3 className="mb-1 font-semibold text-slate-100">Pozos gravitatorios</h3>
      <Tex block>{String.raw`\frac{d\tau}{dt} = \sqrt{1-\frac{2GM}{rc^2}} = \sqrt{1-\frac{r_s}{r}}`}</Tex>

      {sim.stayEnabled ? (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <polyline points={left} fill="none" stroke="#a78bfa" strokeWidth="1.5" />
            <polyline points={right} fill="none" stroke="#a78bfa" strokeWidth="1.5" />
            {[2, 3, 5].map((r) => (
              <ellipse key={r} cx={W / 2} cy={depth(r)} rx={px(r)} ry={px(r) * 0.12} fill="none" stroke="#a78bfa55" />
            ))}
            <ellipse cx={W / 2} cy={depth(1)} rx={px(1)} ry={px(1) * 0.15} fill="#000" stroke="#f97316" />
            <circle cx={W / 2 + px(Math.min(k, rMax))} cy={depth(Math.min(k, rMax))} r="6" fill={there ? "#fb923c" : "#fb923c66"} />
            <text x={W / 2 + px(Math.min(k, rMax)) + 9} y={depth(Math.min(k, rMax)) + 4} fontSize="10" fill="#fdba74">
              🧑‍🚀 {there ? "aquí ahora" : "parada prevista"}
            </text>
            <text x={W / 2} y={H - 6} fontSize="10" fill="#94a3b8" textAnchor="middle">
              horizonte r_s ≈ {fmt(rsAU, 1)} UA (masa como M31*, {fmt(M31_BH_MASSES / 1e8, 1)}×10⁸ M☉)
            </text>
          </svg>
          <p className="text-xs text-slate-300">
            A r = {k < 1.01 ? `r_s(1 + ${(k - 1).toExponential(1)})` : `${fmt(k, 2)} r_s`} el reloj del astronauta late{" "}
            <b className="text-orange-300">{formatFactor(rate)}</b> respecto al espacio lejano: por cada año suyo pasan{" "}
            <b className="text-sky-300">{formatYears(1 / rate)}</b> fuera. ¡Como en <i>Interstellar</i>!
          </p>
        </>
      ) : (
        <p className="text-xs text-slate-400">Activa la parada junto al agujero negro en el panel de control para verla.</p>
      )}

      <div className="mt-3 space-y-1 border-t border-white/10 pt-2 text-xs text-slate-400">
        <p>
          🌍 El gemelo terrestre también vive en pozos: gravedad de la Tierra ({EARTH_CLOCK_SHIFTS.earthSurface.toExponential(2)}), del Sol (
          {EARTH_CLOCK_SHIFTS.sunAt1AU.toExponential(2)}) y velocidad orbital ({EARTH_CLOCK_SHIFTS.orbitalSpeed.toExponential(2)}). En todo el
          viaje eso le hace envejecer <b className="text-sky-300">{formatYears(earthTotal)}</b> menos que en el espacio profundo.
        </p>
        <p>
          🛰 Ejemplo real: los relojes GPS se adelantan {fmt(gps.grav, 1)} µs/día por gravedad (RG) y se atrasan {fmt(-gps.vel, 1)} µs/día por
          velocidad (RE): neto <b>+{fmt(gps.net, 1)} µs/día</b>. Sin corregirlo, el GPS fallaría ~10 km por día.
        </p>
      </div>
    </section>
  );
}
