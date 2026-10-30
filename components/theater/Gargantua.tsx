/**
 * Gargantúa al estilo de Interstellar, pero con la física que la película suavizó:
 * - La sombra negra mide ~2,6 veces el radio de Schwarzschild.
 * - Justo afuera, el anillo de fotones: luz que dio vueltas alrededor del agujero antes de escapar.
 * - La parte de atrás del disco de acreción se ve curvada por encima y por debajo de la sombra (lente gravitacional).
 * - El disco gira: el lado que viene hacia nosotros brilla más y más azulado (Doppler relativista); el otro, más tenue y rojizo.
 */
export function Gargantua({ r, t, idp }: { r: number; t: number; idp: string }) {
  const id = (s: string) => `${idp}-${s}`;
  const disk = r * 4.2; // radio exterior del disco
  const spin = (t * 40) % 1000;
  return (
    <g>
      <defs>
        <radialGradient id={id("glow")}>
          <stop offset="0.25" stopColor="#fde68a" stopOpacity="0.55" />
          <stop offset="0.55" stopColor="#f59e0b" stopOpacity="0.18" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        {/* Doppler: izquierda se acerca (blanco azulado, brillante), derecha se aleja (naranja, tenue) */}
        <linearGradient id={id("beam")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff7ed" stopOpacity="0.15" />
          <stop offset="0.12" stopColor="#fefce8" />
          <stop offset="0.38" stopColor="#fde68a" />
          <stop offset="0.62" stopColor="#f59e0b" />
          <stop offset="0.88" stopColor="#9a3412" />
          <stop offset="1" stopColor="#7c2d12" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id={id("halo")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fffbeb" />
          <stop offset="0.5" stopColor="#fcd34d" />
          <stop offset="1" stopColor="#c2410c" />
        </linearGradient>
      </defs>
      {/* Resplandor general */}
      <circle r={r * 5} fill={`url(#${id("glow")})`} />
      {/* Estrellas del fondo estiradas en arcos alrededor del agujero (anillo de Einstein) */}
      {[0.4, 1.3, 2.2, 3.4, 4.6, 5.5].map((a, k) => (
        <path key={k} d={`M${Math.cos(a) * r * 1.9} ${Math.sin(a) * r * 1.9} A${r * 1.9} ${r * 1.9} 0 0 1 ${Math.cos(a + 0.18) * r * 1.9} ${Math.sin(a + 0.18) * r * 1.9}`} stroke="#e0f2fe" strokeWidth={r * 0.025} fill="none" opacity="0.6" />
      ))}
      {/* Parte de atrás del disco, desviada por la gravedad: arco grueso por arriba y fino por abajo */}
      <path d={`M${-r * 1.55} 0 A${r * 1.55} ${r * 1.5} 0 0 1 ${r * 1.55} 0`} fill="none" stroke={`url(#${id("halo")})`} strokeWidth={r * 0.42} opacity="0.95" />
      <path d={`M${-r * 1.55} 0 A${r * 1.55} ${r * 1.5} 0 0 1 ${r * 1.55} 0`} fill="none" stroke="#fffbeb" strokeWidth={r * 0.08} strokeDasharray={`${r * 0.5} ${r * 0.18}`} strokeDashoffset={-spin * r * 0.02} opacity="0.5" />
      <path d={`M${-r * 1.3} 0 A${r * 1.3} ${r * 1.2} 0 0 0 ${r * 1.3} 0`} fill="none" stroke={`url(#${id("halo")})`} strokeWidth={r * 0.14} opacity="0.75" />
      {/* Sombra y anillo de fotones */}
      <circle r={r * 1.06} fill="none" stroke="#fff7ed" strokeWidth={r * 0.05} opacity="0.95" />
      <circle r={r} fill="#000" />
      {/* Disco de acreción por delante, casi de canto, girando */}
      <ellipse rx={disk} ry={r * 0.16} fill={`url(#${id("beam")})`} />
      <ellipse rx={disk * 0.82} ry={r * 0.09} fill="none" stroke="#fff" strokeWidth={r * 0.03} strokeDasharray={`${r * 0.9} ${r * 0.4}`} strokeDashoffset={spin * r * 0.03} opacity="0.55" />
      <ellipse rx={disk * 0.6} ry={r * 0.06} fill="none" stroke="#fffbeb" strokeWidth={r * 0.025} strokeDasharray={`${r * 0.5} ${r * 0.3}`} strokeDashoffset={spin * r * 0.05} opacity="0.6" />
    </g>
  );
}
