"use client";

import type { Sim } from "@/hooks/useSimulation";
import { ALWAYS, bioYears, NEVER } from "@/lib/cryo";
import { START_AGE } from "@/lib/derive";
import { formatLy, formatYears } from "@/lib/format";
import { buildTrip, DESTINATIONS } from "@/lib/relativity";
import { useEffect, useRef, useState } from "react";
import { shipMapPoint, StarMap, type MapView } from "./StarMap";

const MAX_ZOOM = 60;

/**
 * Mapa con zoom: rueda o botones para acercar, arrastrar para moverse y «Ir a la nave» para seguirla.
 */
function ZoomableMap({ sim, flying }: { sim: Sim; flying: boolean }) {
  const [view, setView] = useState<MapView>({ x: 0, y: 0, zoom: 1 });
  const [follow, setFollow] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const shipAt = shipMapPoint(sim.trip, sim.ship, sim.destination, flying);
  const shown = follow ? { ...view, x: shipAt[0], y: shipAt[1] } : view;
  const zoomBy = (f: number) => setView((v) => ({ ...v, zoom: Math.min(MAX_ZOOM, Math.max(1, v.zoom * f)) }));

  // La rueda acerca o aleja (hace falta un listener no pasivo para que no se desplace la página).
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1.25 : 0.8);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // El mapa es cuadrado y se ajusta al lado más corto del recuadro.
  const unitsPerPx = () => (224 / shown.zoom) / Math.min(box.current?.clientWidth || 1, box.current?.clientHeight || 1);
  const btn = "grid h-11 min-w-11 place-items-center rounded-full border border-white/15 bg-slate-900/80 px-2 text-sm text-slate-100 backdrop-blur transition hover:border-cyan-300/60 sm:h-8 sm:min-w-8";
  return (
    <div className="relative h-[min(62vh,620px)] min-h-[300px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#020617]">
      <div
        ref={box}
        className={`h-full w-full touch-none ${shown.zoom > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
        onPointerDown={(e) => {
          if (shown.zoom === 1) return;
          setFollow(false);
          drag.current = { x: e.clientX, y: e.clientY, vx: shown.x, vy: shown.y };
          (e.target as Element).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const k = unitsPerPx();
          setView((v) => ({ ...v, x: d.vx - (e.clientX - d.x) * k, y: d.vy - (e.clientY - d.y) * k }));
        }}
        onPointerUp={() => (drag.current = null)}
      >
        <StarMap trip={sim.trip} ship={sim.ship} destination={sim.destination} flying={flying} onSelect={sim.setDestination} view={shown} />
      </div>
      <div className="absolute right-2 top-2 flex flex-col gap-1.5">
        <button className={btn} onClick={() => zoomBy(1.6)} aria-label="Acercar" title="Acercar">＋</button>
        <button className={btn} onClick={() => zoomBy(1 / 1.6)} aria-label="Alejar" title="Alejar">－</button>
        <button className={btn} onClick={() => { setFollow(false); setView({ x: 0, y: 0, zoom: 1 }); }} aria-label="Ver todo" title="Ver todo">⤢</button>
      </div>
      {flying && (
        <button
          className={`${btn} absolute bottom-2 left-2 gap-1 px-3 text-xs ${follow ? "border-amber-300/70 text-amber-200" : ""}`}
          onClick={() => {
            setFollow(true);
            setView((v) => ({ ...v, zoom: Math.max(v.zoom, 8) }));
          }}
        >
          🎯 {follow ? "Siguiendo la nave" : "Ir a la nave"}
        </button>
      )}
      {shown.zoom > 1 && <div className="absolute bottom-2 right-2 rounded-full bg-slate-900/80 px-2 py-0.5 font-mono text-[10px] text-slate-400">×{shown.zoom.toFixed(1)}</div>}
    </div>
  );
}

/** Mapa de navegación grande con los destinos clicables y el desenlace previsto de cada viaje. */
export function MissionMap({ sim }: { sim: Sim }) {
  const flying = sim.stage === "flight" || sim.stage === "done";
  const rows = DESTINATIONS.map((d) => {
    const t = buildTrip({ ...sim.trip.params, distance: d.distance, surfaceDays: d.planet?.surfaceDays ?? 0 });
    const earthAlive = START_AGE + t.totalT < sim.lifespan;
    const shipAlive = START_AGE + bioYears(t, t.totalTau, sim.hypersleep ? ALWAYS : NEVER) < sim.lifespan;
    return { d, t, earthAlive, shipAlive };
  });

  // Destinos agrupados por distancia, de lo más cercano a lo más lejano.
  const groups = [
    { title: "Sistema solar", test: (r: (typeof rows)[number]) => r.d.kind === "planet" },
    { title: "Estrellas cercanas", test: (r: (typeof rows)[number]) => r.d.kind !== "planet" && r.d.distance < 100 },
    { title: "Nuestra galaxia", test: (r: (typeof rows)[number]) => r.d.distance >= 100 && r.d.distance < 100_000 },
    { title: "Más allá de la Vía Láctea", test: (r: (typeof rows)[number]) => r.d.distance >= 100_000 },
  ];

  return (
    <section className="space-y-5">
      <div>
        <ZoomableMap sim={sim} flying={flying} />
        <p className="mt-2 text-xs text-slate-400">
          {sim.destination.kind === "planet"
            ? "Viaje dentro del sistema solar: a estas velocidades (unos miles de km/s) la dilatación del tiempo es de apenas segundos. El punto ámbar es la nave."
            : "El Sol está al centro y el centro de la galaxia hacia arriba. Las direcciones son reales (longitud galáctica) y la distancia está en escala logarítmica: cada anillo es 10 veces más lejos. El punto ámbar es la nave. Haz clic en un destino para elegirlo; con la rueda o los botones puedes acercarte y arrastrar el mapa."}
        </p>
      </div>
      <div>
        <div className="hud-label mb-3 text-slate-400">
          Destinos · ida y vuelta: {sim.roundTrip ? "sí" : "no"} · esperanza de vida {sim.lifespan} años{sim.hypersleep ? " · con hipersueño" : ""}
        </div>
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.title}>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-300">{g.title}</div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {rows.filter(g.test).map(({ d, t, earthAlive, shipAlive }) => {
                  const sel = d.id === sim.destination.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => sim.setDestination(d)}
                      className={`flex h-full flex-col justify-between gap-1.5 rounded-xl border px-3 py-2 text-left transition ${
                        sel ? "border-cyan-300/60 bg-cyan-400/10 shadow-[0_0_20px_-8px_rgba(34,211,238,0.9)]" : "border-white/10 bg-white/[0.02] hover:border-white/25"
                      }`}
                    >
                      <div>
                        <div className="font-medium leading-tight text-white">{d.name}</div>
                        <div className="font-mono text-[11px] text-slate-400">
                          {formatLy(d.distance)} · Tierra {formatYears(t.totalT)} · nave {formatYears(t.totalTau)}
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
          ))}
        </div>
      </div>
    </section>
  );
}
