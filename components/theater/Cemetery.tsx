import type { ReactNode } from "react";

const INK = "#1e1b2e";
const random = (n: number) => {
  const value = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

/** Fechas y lugares fijos: al retroceder el viaje se recupera el mismo cementerio. */
export function cemeteryPlots(since: number) {
  const initial = [90, 170, 560, 650, 730].map((x, i) => ({
    id: i, x: x + 12, y: 254, scale: 0.55, born: -8 - random(i) * 45,
  }));
  const additions = Array.from({ length: 30 }, (_, i) => {
    const row = Math.floor(i / 10);
    const column = (i * 7) % 10;
    // Dos sectores a los lados de Martín dejan libre su tumba y el acceso de las visitas.
    const x = column < 5 ? 30 + column * 48 : 500 + (column - 5) * 63;
    return {
      id: i + 5,
      x: x + (random(i + 50) - 0.5) * 12,
      y: 222 + row * 23,
      scale: 0.36 + row * 0.095,
      born: 2 + i * 4 + random(i + 70) * 2,
    };
  });
  return [...initial, ...additions].filter((plot) => plot.born <= since).sort((a, b) => a.y - b.y || a.id - b.id);
}

/** Lápida con desgaste propio: se mancha, se agrieta, pierde fragmentos y acaba vencida. */
export function Headstone({ x, y, age, seed = 0, scale = 1, children }: {
  x: number; y: number; age: number; seed?: number; scale?: number; children?: ReactNode;
}) {
  const decay = Math.min(1, Math.max(0, (age - 10) / 60));
  const crumble = Math.min(1, Math.max(0, (age - 75) / 75));
  const direction = seed === 0 || random(seed + 10) > 0.5 ? 1 : -1;
  const tilt = direction * (decay * (7 + random(seed + 20) * 6) + crumble * 48);
  const stone = `rgb(${Math.round(150 - decay * 55)},${Math.round(146 - decay * 50)},${Math.round(140 - decay * 50)})`;
  const silhouette = crumble > 0.2
    ? "M-28 0 V-64 Q-28 -86 -8 -85 L-5 -75 L4 -80 L9 -70 L17 -78 Q28 -73 28 -64 V0Z"
    : "M-28 0 V-64 Q-28 -86 0 -86 Q28 -86 28 -64 V0Z";
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="5" cy="3" rx={35 + crumble * 14} ry="5" fill="#00000030" />
      <g transform={`rotate(${tilt} 0 0)`}>
        <path d={silhouette} fill={stone} stroke={INK} strokeWidth="1.4" />
        <path d="M-24 -8 V-63 Q-24 -79 -8 -81" fill="none" stroke="#e7e5e4" strokeWidth="1" opacity={0.35 * (1 - decay)} />
        <g opacity={1 - decay * 0.8}>{children}</g>
        {decay > 0.35 && <path d="M-8 -84 l6 14 l-5 8 l7 16 M-2 -70 l9 -5" stroke="#292524" strokeWidth={1 + crumble} fill="none" />}
        {crumble > 0.1 && <path d="M28 -40 l-12 7 l4 9 l-8 12" stroke="#292524" strokeWidth="1.3" fill="none" />}
        {decay > 0.15 && <g fill="#4d7c0f" opacity={decay * 0.85}>
          <ellipse cx="-20" cy="-6" rx={8 + decay * 8} ry="5" />
          <ellipse cx="18" cy="-68" rx={4 + decay * 6} ry="3" />
          <ellipse cx="-14" cy="-76" rx={3 + decay * 5} ry="2.5" />
        </g>}
      </g>
      <path d="M-38 0 H38 V8 H-38Z" fill="#78716c" stroke={INK} strokeWidth="1.3" />
      {crumble > 0 && <g fill={stone} stroke={INK} strokeWidth="0.8" opacity={Math.min(1, crumble * 4)}>
        <path d="M30 6 l8 -9 l9 5 l-4 7Z" />
        <path d="M-36 9 l-6 -6 l-8 5 l3 4Z" />
        {crumble > 0.4 && <path d="M15 12 l8 -8 l8 4 l-2 6Z" />}
      </g>}
      {decay > 0 && <g fill="none" stroke="#4d7c0f" strokeWidth="1.6" opacity={decay}>
        {Array.from({ length: 7 }, (_, i) => {
          const gx = -35 + i * 12;
          return <path key={i} d={`M${gx} 8 q-4 ${-9 - random(i + seed) * 15 * decay} -7 ${-8 - random(i + seed) * 12 * decay} M${gx} 8 q2 -9 5 -12`} />;
        })}
      </g>}
    </g>
  );
}

export function Cemetery({ since }: { since: number }) {
  return <g>{cemeteryPlots(since).map((plot) => (
    <Headstone key={plot.id} x={plot.x} y={plot.y} scale={plot.scale} age={since - plot.born} seed={plot.id + 1}>
      <path d="M0 -66 v24 M-10 -57 h20" stroke="#57534e" strokeWidth="2" />
      <path d="M-12 -30 h24 M-8 -23 h16" stroke="#57534e" strokeWidth="1.2" />
    </Headstone>
  ))}</g>;
}
