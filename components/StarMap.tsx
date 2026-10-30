"use client";

import { formatLy } from "@/lib/format";
import { AU_LY, DESTINATIONS, type Destination, type ShipState, type Trip } from "@/lib/relativity";

/** Longitud galáctica aproximada (grados) de cada destino, vista desde el Sol. */
const GALACTIC_L: Record<string, number> = {
  proxima: 313.9,
  sirio: 227.2,
  vega: 67.4,
  aldebaran: 181,
  pleyades: 166.6,
  betelgeuse: 199.8,
  centro: 0,
  andromeda: 121.2,
  gargantua: 40,
  cuasar: 290,
  custom: 90,
};

const R = 100;
const MAX_LY = 1e10;
/** Radio en el mapa: escala logarítmica para que quepan 4 al y 2,5 millones de al. */
const radius = (ly: number) => (R * Math.log10(1 + ly)) / Math.log10(1 + MAX_LY);
const point = (ly: number, l: number): [number, number] => {
  const a = (l * Math.PI) / 180;
  const r = radius(ly);
  // Centro galáctico hacia arriba; la longitud crece en sentido antihorario.
  return [-r * Math.sin(a), -r * Math.cos(a)];
};

export interface MapView {
  x: number;
  y: number;
  zoom: number;
}
const viewBox = (v: MapView) => {
  const half = 112 / v.zoom;
  return `${v.x - half} ${v.y - half} ${half * 2} ${half * 2}`;
};

/** Dónde está la nave en el mapa (para centrar el zoom en ella). */
export function shipMapPoint(trip: Trip, ship: ShipState, destination: Destination, flying: boolean): [number, number] {
  if (destination.kind === "planet") {
    const r = (au: number) => R * Math.sqrt(au / 32);
    const destAu = trip.params.distance / AU_LY;
    const rp = PLANET_AU[destination.id] ?? destAu + 1;
    const th = Math.acos(Math.max(-1, Math.min(1, (rp * rp + 1 - destAu * destAu) / (2 * rp))));
    const f = flying ? Math.min(1, Math.max(0, ship.x / trip.params.distance)) : 0;
    const x = rp * Math.sin(th) * f;
    const y = 1 + (rp * Math.cos(th) - 1) * f;
    const d = Math.hypot(x, y);
    return d === 0 ? [0, 0] : [(x / d) * r(d), (y / d) * r(d)];
  }
  return point(flying ? Math.max(0, ship.x) : 0, GALACTIC_L[destination.id] ?? 90);
}

const RINGS = [1, 10, 100, 1_000, 10_000, 100_000, 1_000_000, 1e7, 1e8, 1e9];

const ORBITS = [
  { name: "Mercurio", au: 0.39 },
  { name: "Venus", au: 0.72 },
  { name: "Tierra", au: 1 },
  { name: "Marte", au: 1.52 },
  { name: "Júpiter", au: 5.2 },
  { name: "Saturno", au: 9.5 },
  { name: "Urano", au: 19.2 },
  { name: "Neptuno", au: 30 },
];
const PLANET_AU: Record<string, number> = { marte: 1.52, europa: 5.2, titan: 9.5, triton: 30 };

/** Mapa del sistema solar (escala radial √UA): la Tierra, el planeta de destino y la nave en ruta. */
function SolarMap({ trip, ship, destination, flying, onSelect, compact, view }: {
  trip: Trip; ship: ShipState; destination: Destination; flying: boolean; onSelect?: (d: Destination) => void; compact: boolean; view: MapView;
}) {
  const k = 1 / view.zoom;
  const r = (au: number) => R * Math.sqrt(au / 32);
  const toXY = (x: number, y: number): [number, number] => {
    const d = Math.hypot(x, y);
    return d === 0 ? [0, 0] : [(x / d) * r(d), (y / d) * r(d)];
  };
  const earth: [number, number] = [0, 1];
  const destAu = trip.params.distance / AU_LY;
  const rp = PLANET_AU[destination.id] ?? destAu + 1;
  // Ángulo del planeta para que la distancia Tierra–planeta sea la del viaje.
  const cosT = Math.max(-1, Math.min(1, (rp * rp + 1 - destAu * destAu) / (2 * rp)));
  const th = Math.acos(cosT);
  const planet: [number, number] = [rp * Math.sin(th), rp * Math.cos(th)];
  const f = flying ? Math.min(1, Math.max(0, ship.x / trip.params.distance)) : 0;
  const shipAu: [number, number] = [earth[0] + (planet[0] - earth[0]) * f, earth[1] + (planet[1] - earth[1]) * f];
  const path = Array.from({ length: 21 }, (_, i) => {
    const k = i / 20;
    return toXY(earth[0] + (planet[0] - earth[0]) * k, earth[1] + (planet[1] - earth[1]) * k);
  });
  const done = path.filter((_, i) => i / 20 <= f);
  const [ex, ey] = toXY(...earth);
  const [px, py] = toXY(...planet);
  const [sx, sy] = toXY(...shipAu);
  const others = DESTINATIONS.filter((d) => d.kind === "planet");
  return (
    <svg viewBox={viewBox(view)} className="h-full w-full" role="img" aria-label="Mapa del sistema solar">
      <circle r="110" fill="#020617" stroke="#22d3ee55" />
      {ORBITS.map((o) => (
        <g key={o.name}>
          <circle r={r(o.au)} fill="none" stroke="#94a3b8" strokeOpacity="0.22" strokeWidth={0.6 * k} />
          {!compact && o.au >= 5 && <text x={2 * k} y={-r(o.au) - 1.5 * k} fontSize={4 * k} fill="#64748b">{o.name}</text>}
        </g>
      ))}
      <circle r={5 * k} fill="#fde047" stroke="#f59e0b" />
      <polyline points={path.map((p) => p.join(",")).join(" ")} fill="none" stroke="#22d3ee" strokeOpacity="0.5" strokeDasharray={`${3 * k} ${2 * k}`} strokeWidth={(compact ? 1.4 : 0.9) * k} />
      {flying && done.length > 1 && <polyline points={[...done, [sx, sy]].map((p) => p.join(",")).join(" ")} fill="none" stroke="#fbbf24" strokeWidth={(compact ? 2.2 : 1.5) * k} />}
      <circle cx={ex} cy={ey} r={3.2 * k} fill="#38bdf8" stroke="#020617" strokeWidth={0.6 * k} />
      {!compact && <text x={ex + 4 * k} y={ey + 5 * k} fontSize={4.6 * k} fill="#7dd3fc">Tierra</text>}
      {!compact &&
        others.map((d) => {
          if (d.id === destination.id) return null;
          const a = (PLANET_AU[d.id] ?? 1) ;
          const [ox, oy] = toXY(-a * 0.7, -a * 0.71);
          return (
            <g key={d.id} onClick={onSelect ? () => onSelect(d) : undefined} style={{ cursor: onSelect ? "pointer" : undefined }}>
              <circle cx={ox} cy={oy} r={2.6 * k} fill="#cbd5e1" />
              {onSelect && <circle cx={ox} cy={oy} r={8 * k} fill="transparent" />}
              <text x={ox + 4 * k} y={oy + 1.6 * k} fontSize={4.4 * k} fill="#cbd5e1">{d.name.split(" (")[0]}</text>
            </g>
          );
        })}
      <circle cx={px} cy={py} r={(compact ? 7 : 6) * k} fill="#22d3ee" opacity="0.2" />
      <circle cx={px} cy={py} r={3.4 * k} fill={destination.planet?.ground ?? "#f97316"} stroke="#020617" strokeWidth={0.6 * k} />
      {!compact && (
        <text x={px > 40 ? px - 5 * k : px + 5 * k} y={py - 6 * k} fontSize={4.8 * k} fill="#a5f3fc" fontWeight={700} textAnchor={px > 40 ? "end" : "start"}>
          {destination.name}
        </text>
      )}
      {flying && (
        <g transform={`translate(${sx} ${sy})`}>
          <circle r={(compact ? 7 : 5.5) * k} fill="#fbbf24" opacity="0.25" />
          <circle r={(compact ? 3.2 : 2.6) * k} fill="#fbbf24" stroke="#020617" strokeWidth={0.6 * k} />
        </g>
      )}
      {!compact && view.zoom === 1 && (
        <text x="0" y="108" fontSize={4.5 * k} fill="#64748b" textAnchor="middle" fontFamily="monospace">
          sistema solar · distancia al Sol en escala √UA
        </text>
      )}
    </svg>
  );
}

export function StarMap({
  trip,
  ship,
  destination,
  flying,
  onSelect,
  compact = false,
  view = { x: 0, y: 0, zoom: 1 },
}: {
  trip: Trip;
  ship: ShipState;
  destination: Destination;
  flying: boolean;
  onSelect?: (d: Destination) => void;
  compact?: boolean;
  /** Encuadre del mapa (centro en unidades del mapa y acercamiento). */
  view?: MapView;
}) {
  const k = 1 / view.zoom;
  if (destination.kind === "planet")
    return <SolarMap trip={trip} ship={ship} destination={destination} flying={flying} onSelect={onSelect} compact={compact} view={view} />;
  const l = GALACTIC_L[destination.id] ?? 90;
  const dest = point(trip.params.distance, l);
  const shipPos = point(flying ? Math.max(0, ship.x) : 0, l);
  const gc = point(26_000, 0);
  const all = (destination.id === "custom" ? [...DESTINATIONS, destination] : DESTINATIONS).filter((d) => d.kind !== "planet");

  return (
    <svg viewBox={viewBox(view)} className="h-full w-full" role="img" aria-label="Mapa de navegación">
      <defs>
        <radialGradient id="map-bg">
          <stop offset="0" stopColor="#0b1530" />
          <stop offset="1" stopColor="#020617" />
        </radialGradient>
        <radialGradient id="map-galaxy">
          <stop offset="0" stopColor="#fde68a" stopOpacity="0.55" />
          <stop offset="0.25" stopColor="#c084fc" stopOpacity="0.25" />
          <stop offset="1" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r="110" fill="url(#map-bg)" stroke="#22d3ee55" strokeWidth={1 * k} />
      {/* Interior de la Vía Láctea (unos 50.000 al alrededor del Sol) */}
      <circle r={radius(50_000)} fill="#7c3aed" opacity="0.08" />
      <circle cx={gc[0]} cy={gc[1]} r="26" fill="url(#map-galaxy)" />
      {RINGS.map((d) => (
        <g key={d}>
          <circle r={radius(d)} fill="none" stroke="#94a3b8" strokeOpacity="0.18" strokeDasharray={`${1.5 * k} ${2.5 * k}`} strokeWidth={0.6 * k} />
          {!compact && (
            <text x={2 * k} y={-radius(d) + 4 * k} fontSize={4.2 * k} fill="#64748b" fontFamily="monospace">
              {formatLy(d).replace(",00", "")}
            </text>
          )}
        </g>
      ))}
      {!compact && (
        <>
          <text x={gc[0]} y={gc[1] - 9 * k} fontSize={5 * k} fill="#e9d5ff" textAnchor="middle">Centro galáctico</text>
          <text x="0" y="108" fontSize={4.5 * k} fill="#64748b" textAnchor="middle" fontFamily="monospace" opacity={view.zoom === 1 ? 1 : 0}>
            plano de la Vía Láctea · distancia en escala logarítmica
          </text>
        </>
      )}

      {/* Ruta planificada y tramo recorrido */}
      <line x1="0" y1="0" x2={dest[0]} y2={dest[1]} stroke="#22d3ee" strokeOpacity="0.5" strokeDasharray={`${3 * k} ${2 * k}`} strokeWidth={(compact ? 1.4 : 0.9) * k} />
      {flying && <line x1="0" y1="0" x2={shipPos[0]} y2={shipPos[1]} stroke="#fbbf24" strokeWidth={(compact ? 2.2 : 1.5) * k} />}

      {/* Destinos */}
      {all.map((d) => {
        const [x, y] = point(d.distance, GALACTIC_L[d.id] ?? 90);
        const sel = d.id === destination.id;
        if (compact && !sel) return <circle key={d.id} cx={x} cy={y} r={1.6 * k} fill="#64748b" />;
        return (
          <g
            key={d.id}
            onClick={onSelect ? () => onSelect(d) : undefined}
            style={{ cursor: onSelect ? "pointer" : undefined }}
          >
            {sel && <circle cx={x} cy={y} r={(compact ? 7 : 6) * k} fill="#22d3ee" opacity="0.2" />}
            {d.kind === "blackhole" && <circle cx={x} cy={y} r={4.4 * k} fill="none" stroke="#f59e0b" strokeWidth={1.2 * k} />}
            <circle cx={x} cy={y} r={(sel ? 3.2 : 2.4) * k} fill={d.kind === "blackhole" ? "#000" : sel ? "#67e8f9" : d.kind === "galaxy" ? "#c4b5fd" : "#e2e8f0"} stroke="#020617" strokeWidth={0.6 * k} />
            {onSelect && <circle cx={x} cy={y} r={8 * k} fill="transparent" />}
            {!compact && (
              <text
                x={x < 0 && d.id !== "andromeda" ? x - 4 * k : x + 4 * k}
                y={y + (1.6 + (d.id === "proxima" ? 4 : d.id === "vega" ? -5 : d.id === "andromeda" ? 7 : 0)) * k}
                fontSize={4.6 * k}
                textAnchor={x < 0 && d.id !== "andromeda" ? "end" : "start"}
                fill={sel ? "#a5f3fc" : "#cbd5e1"}
                fontWeight={sel ? 700 : 400}
              >
                {d.name}
              </text>
            )}
          </g>
        );
      })}

      {/* El Sol (y la Tierra) en el centro */}
      <circle r={(compact ? 4 : 3.4) * k} fill="#fde047" stroke="#f59e0b" />
      {!compact && <text x={-5 * k} y={-4 * k} fontSize={4.6 * k} fill="#fde68a" textAnchor="end">Sol · Tierra</text>}

      {/* La nave */}
      {flying && (
        <g transform={`translate(${shipPos[0]} ${shipPos[1]})`}>
          <circle r={(compact ? 7 : 5.5) * k} fill="#fbbf24" opacity="0.25" />
          <circle r={(compact ? 3.2 : 2.6) * k} fill="#fbbf24" stroke="#020617" strokeWidth={0.6 * k} />
          {!compact && (
            <text x={6 * k} y={-5 * k} fontSize={4.6 * k} fill="#fde68a" fontWeight={700}>
              TERRA-1 · {formatLy(Math.max(0, ship.x))} del Sol
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
