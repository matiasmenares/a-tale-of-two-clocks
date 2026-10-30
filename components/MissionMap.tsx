"use client";

import type { Sim } from "@/hooks/useSimulation";
import { ALWAYS, bioYears, NEVER } from "@/lib/cryo";
import { START_AGE } from "@/lib/derive";
import { formatLy, formatYears } from "@/lib/format";
import { buildTrip, DESTINATIONS } from "@/lib/relativity";
import { StarMap } from "./StarMap";

/** Mapa de navegación grande con los destinos clicables y el desenlace previsto de cada viaje. */
export function MissionMap({ sim }: { sim: Sim }) {
  const flying = sim.stage === "flight" || sim.stage === "done";
  const rows = DESTINATIONS.map((d) => {
    const t = buildTrip({ ...sim.trip.params, distance: d.distance, surfaceDays: d.planet?.surfaceDays ?? 0 });
    const earthAlive = START_AGE + t.totalT < sim.lifespan;
    const shipAlive = START_AGE + bioYears(t, t.totalTau, sim.hypersleep ? ALWAYS : NEVER) < sim.lifespan;
    return { d, t, earthAlive, shipAlive };
  });

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div>
        <div className="mx-auto aspect-square max-w-md">
          <StarMap trip={sim.trip} ship={sim.ship} destination={sim.destination} flying={flying} onSelect={sim.setDestination} />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {sim.destination.kind === "planet"
            ? "Viaje dentro del sistema solar: a estas velocidades (unos miles de km/s) la dilatación del tiempo es de apenas segundos. El punto ámbar es la nave."
            : "El Sol está al centro y el centro de la galaxia hacia arriba. Las direcciones son reales (longitud galáctica) y la distancia está en escala logarítmica: cada anillo es 10 veces más lejos. El punto ámbar es la nave. Haz clic en un destino para elegirlo."}
        </p>
      </div>
      <div>
        <div className="hud-label mb-2 text-slate-400">
          Destinos · ida y vuelta: {sim.roundTrip ? "sí" : "no"} · esperanza de vida {sim.lifespan} años{sim.hypersleep ? " · con hipersueño" : ""}
        </div>
        <div className="space-y-1.5">
          {rows.map(({ d, t, earthAlive, shipAlive }) => {
            const sel = d.id === sim.destination.id;
            return (
              <button
                key={d.id}
                onClick={() => sim.setDestination(d)}
                className={`grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                  sel ? "border-cyan-300/60 bg-cyan-400/10 shadow-[0_0_20px_-8px_rgba(34,211,238,0.9)]" : "border-white/10 bg-white/[0.02] hover:border-white/25"
                }`}
              >
                <div>
                  <div className="font-medium text-white">
                    {d.name} <span className="font-mono text-xs text-slate-400">{formatLy(d.distance)}</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-400">
                    Tierra {formatYears(t.totalT)} · nave {formatYears(t.totalTau)}
                  </div>
                </div>
                <div className="flex gap-1 text-[11px]">
                  <span className={`rounded-full px-2 py-0.5 ${earthAlive ? "bg-cyan-400/15 text-cyan-200" : "bg-rose-500/15 text-rose-200"}`}>
                    🌍 {earthAlive ? "vive" : "muere"}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 ${shipAlive ? "bg-amber-400/15 text-amber-200" : "bg-rose-500/15 text-rose-200"}`}>
                    🧑‍🚀 {shipAlive ? "vive" : "muere"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
