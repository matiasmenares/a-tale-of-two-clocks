"use client";

import type { Sim } from "@/hooks/useSimulation";
import { formatYears } from "@/lib/format";
import { earthTimeInShipFrame, stateAt } from "@/lib/relativity";
import { useMemo } from "react";

const W = 360;
const PAD = 50;

/** Diagrama de Minkowski: líneas de universo, simultaneidad de la nave y rayo de luz recibido. */
export function SpacetimeDiagram({ sim }: { sim: Sim }) {
  const { trip, ship } = sim;
  const D = trip.params.distance;
  const T = trip.totalT;
  const H = Math.min(520, Math.max(220, (W * T) / D));
  const sx = (x: number) => PAD + (x / D) * (W - PAD - 10);
  const st = (t: number) => H - PAD - (t / T) * (H - PAD - 10);

  const path = useMemo(() => {
    const pts: string[] = [];
    for (const p of trip.phases) {
      for (let k = 0; k <= 20; k++) {
        const s = stateAt(trip, p.tau0 + ((p.tau1 - p.tau0) * k) / 20);
        pts.push(`${sx(s.x).toFixed(1)},${st(s.t).toFixed(1)}`);
      }
    }
    return "M" + pts.join("L");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip, H]);

  const tSim = earthTimeInShipFrame(ship);
  const flying = sim.stage !== "boarding";
  const tEmit = Math.max(0, ship.t - Math.abs(ship.x));
  const lightLike = Math.abs((W * T) / D - H) < 1;

  return (
    <section className="glass p-4">
      <h3 className="mb-1 font-semibold text-slate-100">Diagrama espacio-tiempo</h3>
      <p className="mb-2 text-xs text-slate-400">
        Vertical: tiempo terrestre · Horizontal: distancia. La línea <span className="text-orange-300">naranja punteada</span> es el
        «ahora» del astronauta; donde corta la línea de la Tierra está lo que él calcula que marca el reloj terrestre.
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 520 }}>
        <defs>
          <clipPath id="plot">
            <rect x={PAD} y={0} width={W - PAD} height={H - PAD} />
          </clipPath>
        </defs>
        <line x1={PAD} y1={H - PAD} x2={W - 5} y2={H - PAD} stroke="#475569" />
        <line x1={PAD} y1={H - PAD} x2={PAD} y2={5} stroke="#475569" />
        <text x={W - 8} y={H - PAD + 14} fontSize="10" fill="#94a3b8" textAnchor="end">{sim.destination.name} →</text>
        <text x={PAD - 4} y={H - PAD + 14} fontSize="10" fill="#94a3b8" textAnchor="end">0</text>
        <text x={12} y={14} fontSize="10" fill="#94a3b8" transform={`rotate(-90 12 14)`} textAnchor="end">tiempo ↑</text>
        <text x={PAD - 4} y={st(T) + 4} fontSize="9" fill="#94a3b8" textAnchor="end">{formatYears(T).replace(" años", "")}</text>

        <g clipPath="url(#plot)">
          {lightLike && <line x1={sx(0)} y1={st(0)} x2={sx(D)} y2={st(D)} stroke="#fde04733" strokeDasharray="2 3" />}
          <line x1={sx(0)} y1={st(0)} x2={sx(0)} y2={st(T)} stroke="#38bdf8" strokeWidth="3" />
          <path d={path} stroke="#fb923c" strokeWidth="2" fill="none" />
          {flying && (
            <>
              <line x1={sx(0)} y1={st(ship.t)} x2={sx(D)} y2={st(ship.t)} stroke="#38bdf8" strokeDasharray="4 4" opacity="0.6" />
              <line
                x1={sx(0)}
                y1={st(tSim)}
                x2={sx(D)}
                y2={st(ship.t + ship.beta * (D - ship.x))}
                stroke="#fb923c"
                strokeDasharray="4 3"
                strokeWidth="1.5"
              />
              <line x1={sx(0)} y1={st(tEmit)} x2={sx(ship.x)} y2={st(ship.t)} stroke="#fde047" strokeDasharray="1 3" strokeWidth="1.5" />
              <circle cx={sx(0)} cy={st(ship.t)} r="4" fill="#38bdf8" />
              <circle cx={sx(0)} cy={st(Math.max(0, tSim))} r="4" fill="none" stroke="#fb923c" strokeWidth="2" />
              <circle cx={sx(ship.x)} cy={st(ship.t)} r="5" fill="#fb923c" />
            </>
          )}
        </g>
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
        <span><span className="text-sky-400">━</span> Tierra</span>
        <span><span className="text-orange-400">━</span> Nave</span>
        <span><span className="text-sky-400">┅</span> «ahora» de la Tierra</span>
        <span><span className="text-orange-400">┅</span> «ahora» de la nave</span>
        <span><span className="text-yellow-300">┈</span> luz que la nave recibe de la Tierra</span>
      </div>
    </section>
  );
}
