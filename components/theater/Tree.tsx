import type { Season } from "@/lib/life";

/** Copa irregular en capas, tronco ahusado y ramas que se descubren en invierno. */
export function Tree({ x, base, scale = 1, season, t }: { x: number; base: number; scale?: number; season: Season; t: number }) {
  const autumn = season === "otoño";
  const spring = season === "primavera";
  const winter = season === "invierno";
  const leaf = autumn ? "#c96a29" : spring ? "#69a958" : "#397c4b";
  const light = autumn ? "#edb34f" : spring ? "#b0ce73" : "#74a45b";
  return (
    <g transform={`translate(${x} ${base}) scale(${scale})`}>
      <ellipse cy="1" rx="23" ry="3.4" fill="#16291c" opacity="0.18" />
      <path d="M-6 1 Q-2 -9 -3 -24 L-5 -42 L-1 -52 L3 -43 Q1 -24 3 -13 L7 1 L1 -1Z" fill="#75523b" stroke="#302e2b" strokeWidth="0.8" />
      <path d="M-1 -3 Q1 -18 -1 -34 M-2 -15 l-1 -8" stroke="#b48b60" strokeWidth="0.8" fill="none" opacity="0.7" />
      <g transform={`rotate(${Math.sin(t * 0.55 + x) * 0.8} 0 -23)`}>
        <path d="M-1 -27 Q-10 -36 -15 -43 L-20 -49 M-13 -41 l1 -11 M0 -34 Q10 -42 16 -50 L21 -54 M10 -44 l-1 -12 M0 -39 L-3 -59 M-3 -51 l-8 -8" fill="none" stroke="#513d2f" strokeWidth="2.1" />
        {!winter && <>
          <path d="M-27 -39 C-33 -44 -29 -54 -23 -55 C-27 -63 -19 -70 -12 -68 C-11 -78 2 -81 9 -73 C18 -77 27 -70 25 -62 C36 -61 38 -50 30 -45 C36 -34 24 -26 17 -29 C10 -21 0 -24 -5 -27 C-16 -21 -28 -28 -27 -39Z" fill={leaf} stroke="#283c2d" strokeWidth="0.85" />
          <path d="M-27 -39 Q-23 -29 -13 -33 Q-7 -25 3 -31 Q15 -23 24 -34 Q29 -33 32 -39 C34 -31 25 -26 17 -29 C10 -21 0 -24 -5 -27 C-16 -21 -28 -28 -27 -39Z" fill="#203e2e" opacity="0.36" />
          <path d="M-23 -56 Q-26 -65 -15 -65 Q-10 -61 -14 -56 Q-20 -59 -23 -56 M-6 -70 Q-4 -78 5 -72 Q10 -66 4 -64 Q0 -69 -6 -66 M13 -63 Q21 -71 24 -62 Q28 -57 22 -54 Q20 -60 13 -58 M-24 -43 Q-19 -51 -11 -46 Q-9 -41 -14 -40 Q-18 -45 -24 -43 M0 -49 Q5 -58 13 -50 Q17 -43 10 -42 Q6 -49 0 -45" fill={light} opacity="0.6" />
          <path d="M-16 -33 q5 -5 10 -2 M5 -34 q5 -4 10 -1 M-9 -58 q3 -4 7 -1 M22 -44 l4 -2" stroke={light} strokeWidth="1" fill="none" opacity="0.5" />
          {spring && [-20, -7, 8, 21, -14, 2, 17].map((v, i) => <g key={v} transform={`translate(${v} ${-40 - (i * 13) % 28})`}>
            <path d="M-2 0 Q-4 -4 0 -3 Q4 -5 3 -1 Q5 3 1 2 Q-2 5 -2 0" fill="#efd1c5" />
            <circle r="0.65" fill="#e9ad62" />
          </g>)}
        </>}
        {winter && <path d="M-20 -49 l5 5 M9 -55 l1 4 M17 -51 l4 -3 M-11 -59 l4 4 M-3 -59 l2 6" stroke="#e5edf0" strokeWidth="2" fill="none" />}
      </g>
      {autumn && Array.from({ length: 6 }, (_, i) => {
        const f = (t * 0.16 + i * 0.173) % 1;
        return <path key={i} d="M-2 0 Q0 -3 3 0 Q0 3 -2 0" fill={i % 2 ? "#dca34b" : "#a84f24"} opacity={1 - f * 0.65} transform={`translate(${-22 + i * 8 + Math.sin(t + i) * 5} ${-35 + f * 36}) rotate(${f * 180 + i * 30})`} />;
      })}
    </g>
  );
}
