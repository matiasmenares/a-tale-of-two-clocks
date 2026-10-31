import { useId } from "react";

/** TARS camina articulando sus cuatro bloques y gira al correr de vuelta a la Ranger. */
export function Tars({ x, y, t, running, boarding = 0 }: { x: number; y: number; t: number; running: boolean; boarding?: number }) {
  const id = useId();
  const cycle = t * (running ? 5 : 2.2);
  const roll = running ? -t * 230 : Math.sin(cycle) * 3;
  const bob = running ? Math.abs(Math.sin(cycle)) * 5 : Math.abs(Math.sin(cycle)) * 2;
  return <g role="img" aria-label={running ? "TARS corre hacia la Ranger para escapar de la ola" : "TARS explora el océano junto a Tomás"}>
    <title>TARS · Interstellar · humor: 90 %</title>
    <defs>
      <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="0">
        <stop stopColor="#c2cdd0" /><stop offset="0.2" stopColor="#8196a0" /><stop offset="0.6" stopColor="#a2b2b8" /><stop offset="1" stopColor="#40586b" />
      </linearGradient>
    </defs>
    <ellipse cx={x} cy={y + 2} rx="25" ry="3.5" fill="#0d1e2d" opacity={0.25 * (1 - boarding)} />
    {[0, 1].map(i => {
      const ripple = (t * 0.8 + i * 0.5) % 1;
      return <ellipse key={i} cx={x} cy={y + 3} rx={12 + ripple * 24} ry={2 + ripple * 3} fill="none" stroke="#cadce2" strokeWidth="0.8" opacity={(1 - ripple) * 0.5 * (1 - boarding)} />;
    })}
    <g transform={`translate(${x} ${y - bob - boarding * 17}) scale(${1 - boarding * 0.35})`} opacity={1 - boarding}>
      <g transform={`rotate(${roll} 0 -26)`}>
        {[-20, -9.5, 1, 11.5].map((sx, i) => {
          const joint = Math.sin(cycle + (i % 2) * Math.PI) * (running ? 31 : 13);
          return <g key={sx} transform={`rotate(${joint} ${sx + 4.5} -27)`}>
            <rect x={sx} y="-54" width="9" height="54" rx="1" fill={`url(#${id}-metal)`} stroke="#1d3040" strokeWidth="0.9" />
            <path d={`M${sx + 1.5} -51 v20 M${sx + 1.5} -25 v21`} stroke="#e0e7e6" strokeWidth="0.55" opacity="0.6" />
            <path d={`M${sx + 1} -29 h7 M${sx + 1} -25 h7 M${sx + 2} -7 h5`} stroke="#294052" strokeWidth="0.7" />
            <circle cx={sx + 4.5} cy="-27" r="1.8" fill="#3d5261" stroke="#a9bec7" strokeWidth="0.5" />
            {i === 1 && <>
              <rect x={sx + 1} y="-49" width="7" height="12" rx="0.5" fill="#132b3c" />
              <path d={`M${sx + 2} -46 h5 M${sx + 2} -43 h3 M${sx + 2} -40 h4`} stroke="#95d8db" strokeWidth="0.6" />
            </>}
            {i === 2 && <text x={sx + 4.5} y="-43" fontSize="3.4" fill="#253f50" fontFamily="monospace" textAnchor="middle" transform={`rotate(90 ${sx + 4.5} -43)`}>TARS</text>}
          </g>;
        })}
      </g>
      {running && <path d="M-25 1 l-6 -6 M-20 4 l-10 -1 M25 2 l6 -7" fill="none" stroke="#d3e2e7" strokeWidth="1.1" opacity={0.4 + Math.abs(Math.sin(cycle)) * 0.4} />}
    </g>
  </g>;
}
