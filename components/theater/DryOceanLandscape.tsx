import { useId } from "react";

const noise = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/** Antiguo fondo oceánico: estratos expuestos, costra salina y estructuras erosionadas. */
export function DryOceanLandscape({ years, t }: { years: number; t: number }) {
  const id = useId();
  const url = (name: string) => `url(#${id}-${name})`;
  const r = 43 + Math.min(1, Math.max(0, (years - 1e9) / 3.5e9)) * 25;
  const basin = "M374 208 C405 204 462 209 478 217 C495 225 591 224 631 240 C672 256 633 265 679 281 L735 300 H187 C200 279 256 277 281 263 C315 246 280 237 327 226 C352 220 353 212 374 208Z";
  // Malla de celdas con vértices compartidos, perturbados y comprimidos hacia el horizonte.
  const cells = Array.from({ length: 11 }, (_, row) => Array.from({ length: 26 }, (_, col) => {
    const cx = -100 + (col + (row % 2) * 0.5) * Math.sqrt(3) * 23;
    const cy = row * 34.5;
    const points = Array.from({ length: 6 }, (_, k) => {
      const angle = (k * 60 - 30) * Math.PI / 180;
      const rawX = Math.round((cx + Math.cos(angle) * 23) * 100) / 100;
      const rawY = Math.round((cy + Math.sin(angle) * 23) * 100) / 100;
      const seed = Math.round(rawX * 10) + Math.round(rawY * 10) * 11000;
      const x = rawX + (noise(seed) - 0.5) * 12;
      const depth = Math.max(0, (rawY + (noise(seed + 1) - 0.5) * 9) / 340);
      return `${x.toFixed(2)},${(208 + Math.pow(depth, 1.65) * 112).toFixed(2)}`;
    });
    return { row, col, points: points.join(" ") };
  })).flat();
  return (
    <>
      <defs>
        <linearGradient id={`${id}-sky`} x2="0" y2="1">
          <stop stopColor="#63403d" /><stop offset="0.48" stopColor="#b7764e" /><stop offset="1" stopColor="#edbc7c" />
        </linearGradient>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0.2" stopColor="#fff4cf" stopOpacity="0.8" /><stop offset="0.5" stopColor="#ffda9a" stopOpacity="0.28" /><stop offset="1" stopColor="#f5be7c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-sun`} cx="40%" cy="35%">
          <stop stopColor="#fffbed" /><stop offset="0.75" stopColor="#ffedba" /><stop offset="1" stopColor="#fbd59a" />
        </radialGradient>
        <linearGradient id={`${id}-sand`} x2="0" y2="1">
          <stop stopColor="#c39163" /><stop offset="0.45" stopColor="#aa724c" /><stop offset="1" stopColor="#63483a" />
        </linearGradient>
        <linearGradient id={`${id}-salt`} x1="0" y1="0" x2="0.2" y2="1">
          <stop stopColor="#c7ac84" /><stop offset="0.35" stopColor="#e6d2a9" /><stop offset="1" stopColor="#bca185" />
        </linearGradient>
        <linearGradient id={`${id}-cliff`} x1="0" y1="0" x2="0.4" y2="1">
          <stop stopColor="#b47e55" /><stop offset="0.45" stopColor="#916044" /><stop offset="1" stopColor="#654b3c" />
        </linearGradient>
        <linearGradient id={`${id}-hull`} x2="0" y2="1">
          <stop stopColor="#867367" /><stop offset="0.45" stopColor="#66554e" /><stop offset="1" stopColor="#3c3535" />
        </linearGradient>
        <clipPath id={`${id}-basin`}><path d={basin} /></clipPath>
        <clipPath id={`${id}-left-cliff`}><path d="M0 174 L24 171 L33 153 L94 148 L109 157 L142 158 L159 181 L188 188 L196 216 L0 231Z" /></clipPath>
        <clipPath id={`${id}-right-cliff`}><path d="M800 155 L763 159 L753 142 L711 143 L696 157 L672 163 L659 183 L628 189 L616 218 L800 231Z" /></clipPath>
      </defs>
      <rect width="800" height="300" fill={url("sky")} />
      {/* Un disco deslumbrante filtrado por el polvo, sin rayos geométricos. */}
      <circle cx="581" cy="62" r={r * 2.8} fill={url("halo")} />
      <circle cx="581" cy="62" r={r} fill={url("sun")} />
      <path d="M412 75 C469 69 504 80 552 76 S650 69 731 81 L800 89 V97 Q683 82 581 91 T412 84Z" fill="#e9c798" opacity="0.12" />
      <path d="M0 121 Q127 102 248 119 T496 123 T800 116" fill="none" stroke="#f2d0a2" strokeWidth="11" opacity="0.08" />
      {/* Antiguas costas en cuatro planos con perspectiva atmosférica. */}
      <path d="M0 174 L42 160 L85 167 L133 147 L176 155 L207 145 L255 160 L297 149 L339 163 L385 147 L432 158 L468 140 L510 151 L550 141 L600 155 L648 142 L692 153 L741 137 L800 153 V230 H0Z" fill="#c39471" />
      <path d="M0 188 L53 176 L99 179 L139 164 L183 172 L226 169 L264 185 L302 174 L353 181 L395 170 L441 182 L492 166 L540 178 L583 170 L627 186 L675 175 L730 181 L800 168 V238 H0Z" fill="#ad7b5c" />
      <path d="M0 174 L24 171 L33 153 L94 148 L109 157 L142 158 L159 181 L188 188 L196 216 L0 231Z" fill={url("cliff")} />
      <path d="M800 155 L763 159 L753 142 L711 143 L696 157 L672 163 L659 183 L628 189 L616 218 L800 231Z" fill={url("cliff")} />
      {["left-cliff", "right-cliff"].map(side => <g key={side} clipPath={url(side)}>
        {Array.from({ length: 12 }, (_, k) => <path key={k} d={`M0 ${156 + k * 6} Q210 ${152 + k * 6} 400 ${158 + k * 6} T800 ${154 + k * 6}`} fill="none" stroke={k % 3 ? "#d2a576" : "#4c3e36"} strokeWidth={k % 3 ? 0.9 : 1.8} opacity="0.4" />)}
        <path d="M33 153 L41 178 L31 202 L40 225 M94 148 L83 182 L98 206 L92 229 M142 158 L130 190 L152 221 M711 143 L722 173 L709 197 L716 228 M672 163 L686 183 L667 213 M763 159 L750 186 L765 218" fill="none" stroke="#513e34" strokeWidth="1.1" opacity="0.55" />
      </g>)}
      <path d="M0 225 Q126 209 261 219 Q371 198 464 214 T800 225 V300 H0Z" fill={url("sand")} />
      {/* La sal sigue los cauces del terreno y se ensancha hacia la cámara. */}
      <path d={basin} fill={url("salt")} stroke="#e8d6ac" strokeWidth="1.2" />
      <g clipPath={url("basin")}>
        {cells.map(({ row, col, points }) => <polygon key={`${row}-${col}`} points={points} fill={col % 4 ? "#e7d3ad" : "#9e8063"} fillOpacity={0.05 + noise(row * 23 + col) * 0.13} stroke="#8a725b" strokeWidth={0.25 + row * 0.09} strokeLinejoin="bevel" />)}
        <path d="M399 211 Q424 224 397 240 T405 265 T379 300 M473 223 Q454 241 496 256 T532 300 M315 248 Q389 260 353 275 L306 300" fill="none" stroke="#806b56" strokeWidth="1.3" opacity="0.65" />
        <path d="M400 211 Q426 224 399 240 T407 265 T381 300" fill="none" stroke="#f7e9c6" strokeWidth="0.7" opacity="0.8" />
      </g>
      <path d="M371 213 Q339 221 329 228 M292 247 Q324 259 282 271 L242 291 M620 246 Q647 253 635 260" stroke="#eed5a4" strokeWidth="2.6" opacity="0.6" fill="none" />
      {/* Pecio semienterrado: casco de carguero, cubierta rota y cuadernas expuestas. */}
      <g transform="translate(157 248) rotate(-7)">
        <path d="M-82 9 L-120 20 L12 29 L68 10Z" fill="#483c35" opacity="0.24" />
        <path d="M-72 -27 L-47 -17 L44 -19 L76 -35 L62 0 Q-10 18 -58 0Z" fill={url("hull")} stroke="#443b37" strokeWidth="1.2" />
        <path d="M-70 -26 L-47 -17 L44 -19 L74 -33 L49 -25 L-43 -23Z" fill="#b7a085" />
        <path d="M-61 -13 Q-6 -1 65 -16 M-53 -4 Q-9 7 60 -7" fill="none" stroke="#a5896d" strokeWidth="0.65" opacity="0.5" />
        {[-47, -28, -8, 13, 34, 55].map((v, i) => <g key={v}>
          <path d={`M${v} -17 L${v + 5} ${3 - i * 0.7}`} stroke="#383332" strokeWidth="1.5" />
          <path d={`M${v + 2} -16 L${v + 6} -1`} stroke="#b49b7d" strokeWidth="0.6" />
        </g>)}
        <path d="M-32 -21 L-29 -40 L-4 -42 L4 -23 M-26 -39 L-23 -49 L-9 -49 L-6 -42" fill="#74655a" stroke="#453d38" strokeWidth="1" />
        <path d="M-24 -35 h7 v5 h-7Z M-13 -36 h7 v5 h-7Z" fill="#302f2e" />
        <path d="M-2 -24 L5 -38 L19 -33 L22 -21 M25 -22 L32 -34 L46 -32 L49 -22" fill="none" stroke="#ab9277" strokeWidth="1.5" />
        <path d="M9 -37 L17 -29 L13 -21 M36 -33 L41 -23" stroke="#433c36" strokeWidth="0.9" />
        <path d="M-14 -46 L-10 -70 L-7 -71 L-7 -47 M-9 -63 L5 -58 M-10 -65 L-23 -67" fill="none" stroke="#50473e" strokeWidth="1.6" />
        <path d="M-23 -67 L-44 -21 M5 -58 L24 -23" stroke="#8e7962" strokeWidth="0.6" fill="none" />
        <path d="M-78 7 Q-27 0 11 8 T77 5 L81 14 H-78Z" fill="#b78b5d" />
        <path d="M-77 8 Q-30 2 10 9 T76 6" fill="none" stroke="#d6b180" strokeWidth="1" />
      </g>
      {/* Cúpula colapsada: costillas metálicas, vidrio residual y arena acumulada. */}
      <g transform="translate(685 236)">
        <path d="M-61 6 L-102 18 L32 16 L65 4Z" fill="#564236" opacity="0.22" />
        <path d="M-61 0 C-60 -39 -29 -64 0 -61 M12 -60 C38 -57 59 -32 61 -10" fill="none" stroke="#493f39" strokeWidth="3.5" />
        <path d="M-61 -1 C-60 -39 -29 -64 0 -61 M12 -60 C38 -57 59 -32 61 -10" fill="none" stroke="#bbab92" strokeWidth="1" />
        <path d="M-37 0 Q-39 -46 -3 -61 M-7 0 L-3 -61 M29 0 Q34 -39 9 -56" fill="none" stroke="#766d5f" strokeWidth="1.6" />
        <path d="M-54 -25 Q0 -44 54 -25 M-42 -44 Q-15 -51 0 -49" fill="none" stroke="#8d8270" strokeWidth="1.2" />
        <path d="M-37 -36 L-24 -49 L-27 -27Z M15 -50 L30 -37 L20 -28Z" fill="#b2c0b5" stroke="#d8d8bb" strokeWidth="0.5" opacity="0.35" />
        <path d="M21 2 L56 -19 L67 -4 L41 5 M42 -6 L56 -19 M56 -19 L55 -31" fill="none" stroke="#574b41" strokeWidth="1.8" />
        <path d="M-70 3 Q-34 -4 -11 3 T64 5 L75 13 H-73Z" fill="#bd9062" />
        <path d="M-67 3 Q-30 -2 -11 4 T62 6" fill="none" stroke="#e0b984" strokeWidth="0.9" />
      </g>
      {/* Primer plano rugoso y gravas con caras iluminadas. */}
      <path d="M0 273 L35 262 L60 269 L84 261 L112 274 L141 271 L178 290 L208 300 H0Z M800 269 L762 274 L739 267 L711 280 L686 282 L674 300 H800Z" fill="#695040" />
      {Array.from({ length: 32 }, (_, k) => {
        const x = noise(k + 3) * 800;
        const y = 229 + Math.pow(noise(k + 20), 0.6) * 73;
        const s = 0.2 + Math.pow((y - 220) / 80, 2) * (0.35 + noise(k) * 0.5);
        return <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
          <ellipse cx="-5" cy="2" rx="12" ry="3" fill="#493c34" opacity="0.35" />
          <path d="M-9 1 L-5 -6 L3 -8 L11 -1 L7 4 L-3 4Z" fill="#76604b" stroke="#54453b" strokeWidth="0.7" />
          <path d="M-5 -6 L3 -8 L6 -2 L-1 0Z" fill="#c09b70" />
        </g>;
      })}
      {/* Polvo fino: deriva lenta y velos cerca del suelo. */}
      {Array.from({ length: 30 }, (_, k) => {
        const x = (noise(k) * 860 + t * (4 + k % 4)) % 860 - 30;
        return <circle key={k} cx={x} cy={173 + noise(k + 8) * 110} r={0.25 + noise(k + 2) * 0.55} fill="#f5d8ab" opacity="0.3" />;
      })}
      <path d={`M0 ${218 + Math.sin(t * 0.4)} Q200 209 400 218 T800 216`} stroke="#f1c994" strokeWidth="6" opacity="0.1" fill="none" />
      <path d="M0 255 Q122 241 235 257 M554 275 Q666 260 800 270" fill="none" stroke="#deb482" strokeWidth="1.1" opacity="0.35" />
    </>
  );
}
