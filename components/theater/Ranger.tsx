import { useId } from "react";

/** La misma nave en la Tierra y en las superficies que visita. */
export function Ranger({ x, y, open = false, water = false }: { x: number; y: number; open?: boolean; water?: boolean }) {
  const id = useId();
  return (
    <g transform={`translate(${x} ${y})`} strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <linearGradient id={`${id}-hull`} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#a5b4c4" />
          <stop offset="0.45" stopColor="#536477" />
          <stop offset="1" stopColor="#253244" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#78c9df" />
          <stop offset="0.45" stopColor="#24465e" />
          <stop offset="1" stopColor="#0b182b" />
        </linearGradient>
      </defs>
      <ellipse cy="2" rx="81" ry="5" fill="#020617" opacity="0.24" />
      {!water && <g>
        <path d="M-40 -15 L-46 0 M38 -15 L44 0" fill="none" stroke="#182335" strokeWidth="3.6" />
        <path d="M-40 -14 L-44 -3 M38 -14 L42 -3" fill="none" stroke="#b6c4ce" strokeWidth="1.4" />
        <path d="M-51 0 H-40 M38 0 H50" stroke="#33465b" strokeWidth="2.8" />
      </g>}
      {/* Ala posterior y motores bajo el fuselaje. */}
      <path d="M-43 -24 L-65 -12 L-32 -13 L1 -23Z" fill="#26374a" stroke="#182335" strokeWidth="1" />
      <path d="M-73 -29 L-80 -28 L-81 -20 L-72 -19Z" fill="#172335" stroke="#0c1726" strokeWidth="1" />
      <path d="M-78 -26 v4" stroke="#9bb8c9" strokeWidth="1.1" />
      <path d="M-65 -38 L-62 -59 Q-57 -61 -52 -58 L-46 -36Z" fill="#47596d" stroke="#182335" strokeWidth="1.3" />
      <path d="M-60 -54 L-56 -54 L-51 -40" fill="none" stroke="#c8d5df" strokeOpacity="0.6" strokeWidth="0.8" />
      <path d="M-73 -17 L-67 -38 Q-66 -41 -61 -41 H-52 L-40 -33 H36 Q43 -33 48 -30 L73 -21 Q78 -17 70 -14 H-68 Q-74 -14 -73 -17Z" fill={`url(#${id}-hull)`} stroke="#182335" strokeWidth="1.5" />
      <path d="M-67 -38 L-52 -38 L-40 -30 H35 L62 -23 L40 -26 H-42 L-55 -34 H-68Z" fill="#d3e0e6" opacity="0.28" />
      <path d="M-70 -18 H69 L64 -14 H-68Z" fill="#132335" opacity="0.65" />
      <path d="M-62 -38 H-53 L-41 -30 H34" fill="none" stroke="#e0ebef" strokeWidth="1" strokeOpacity="0.65" />
      <path d="M38 -30 L48 -28 L63 -23 L58 -21 L39 -25Z" fill={`url(#${id}-glass)`} stroke="#b6c9d5" strokeWidth="0.7" />
      <path d="M48 -27 L48 -24" stroke="#b6c9d5" strokeWidth="0.7" />
      <path d="M41 -29 L47 -27 L57 -24" fill="none" stroke="#d8f3f7" strokeWidth="0.7" opacity="0.7" />
      {/* Ala delta delantera: borde iluminado, intradós oscuro y alerones. */}
      <path d="M-42 -27 L-61 -10 Q-45 -8 -28 -10 L25 -20 L39 -23 L6 -25Z" fill="#40556c" stroke="#182335" strokeWidth="1" />
      <path d="M-42 -27 L-57 -12 L-28 -13 L23 -22" fill="none" stroke="#b6c7d4" strokeWidth="0.8" />
      <path d="M-57 -11 L-29 -11 L23 -21 L-8 -17Z" fill="#1b2c40" />
      <path d="M-32 -22 L-28 -13 M-19 -22 L-15 -15 M-6 -23 L-3 -18" stroke="#1a2d42" strokeWidth="0.7" />
      <path d="M-29 -28 H30" stroke="#fb923c" strokeWidth="2" />
      <path d="M-26 -29 H29" stroke="#ffd5a4" strokeWidth="0.45" />
      <path d="M7 -31 v4 M24 -31 v4" stroke="#2b4056" strokeWidth="0.6" />
      {[4, 20, 34].map(v => <circle key={v} cx={v} cy="-25" r="0.65" fill="#c6d7e2" />)}
      {[-61, -57, -53].map((v) => <path key={v} d={`M${v} -32 v5`} stroke="#172435" strokeWidth="1.3" />)}
      <rect x="-14" y="-31" width="14" height="17" rx="2" fill={open ? "#fde6a2" : "#233247"} stroke="#172435" strokeWidth="1.2" />
      <path d="M-11 -28 H-3 M-3 -23 v3" stroke={open ? "#fff4d6" : "#94a3b8"} strokeWidth="0.8" />
      <text x="14" y="-16.2" fontSize="3.5" textAnchor="middle" fill="#dbe8ef" letterSpacing="0.6">TERRA · 01</text>
      {open && !water && <g>
        <path d="M-14 -14 L-30 0 H-14Z" fill="#738497" stroke="#182335" strokeWidth="1" />
        <path d="M-17 -10 h3 M-21 -6 h7 M-25 -2 h11" stroke="#c0ccd4" strokeWidth="0.6" />
      </g>}
      {water && <path d="M-82 0 Q-48 -3 -19 0 T44 0 T86 0" fill="none" stroke="#c7dbe6" strokeWidth="1" opacity="0.55" />}
    </g>
  );
}
