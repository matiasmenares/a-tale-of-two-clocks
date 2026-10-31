import { useId } from "react";

const noise = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/** Corteza fracturada y océano de magma bajo la fotosfera de una gigante roja. */
export function RedGiantLandscape({ t }: { t: number }) {
  const id = useId();
  const url = (name: string) => `url(#${id}-${name})`;
  const pulse = Math.sin(t * 0.35);
  const river = "M362 202 C423 215 475 211 452 224 C429 238 274 233 289 251 C304 270 528 258 590 300 H373 C355 284 192 279 205 253 C218 228 393 236 413 222 C427 214 383 212 362 202Z";
  const leftRock = "M0 211 L58 197 L98 202 L134 187 L159 197 L185 218 L241 223 L275 239 L221 251 L190 278 L0 300Z";
  const rightRock = "M800 202 L741 185 L704 200 L660 179 L630 188 L592 217 L532 224 L487 243 L545 257 L608 285 L800 300Z";
  return (
    <>
      <defs>
        <linearGradient id={`${id}-sky`} x2="0" y2="1">
          <stop stopColor="#160c20" /><stop offset="0.6" stopColor="#72262a" /><stop offset="1" stopColor="#ef763d" />
        </linearGradient>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0.6" stopColor="#fb5c2b" stopOpacity="0.45" /><stop offset="1" stopColor="#dc492d" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-sun`} cx="42%" cy="38%" r="65%">
          <stop stopColor="#ffd193" /><stop offset="0.45" stopColor="#ff9e58" /><stop offset="0.8" stopColor="#e85e38" /><stop offset="1" stopColor="#a92d2d" />
        </radialGradient>
        <linearGradient id={`${id}-rock`} x1="0" y1="0" x2="0.4" y2="1">
          <stop stopColor="#493638" /><stop offset="0.45" stopColor="#241e29" /><stop offset="1" stopColor="#100f1a" />
        </linearGradient>
        <linearGradient id={`${id}-lava`} x2="0" y2="1">
          <stop stopColor="#ffba67" /><stop offset="0.4" stopColor="#ff7d29" /><stop offset="1" stopColor="#ee431e" />
        </linearGradient>
        <linearGradient id={`${id}-smoke`} x2="0" y2="1">
          <stop stopColor="#231c2d" stopOpacity="0" /><stop offset="1" stopColor="#3f2830" stopOpacity="0.7" />
        </linearGradient>
        <clipPath id={`${id}-plates`}><path d={leftRock} /><path d={rightRock} /></clipPath>
        <clipPath id={`${id}-disc`}><circle cx="430" cy="25" r={228 + pulse * 2} /></clipPath>
      </defs>
      <rect width="800" height="300" fill={url("sky")} />
      <circle cx="430" cy="25" r="315" fill={url("halo")} />
      {/* Protuberancias en arcos: el disco permanece bien recortado. */}
      {[0.2, 0.7, 1.4, 2.4, 2.9].map((a, k) => {
        const x = 430 + Math.cos(a) * 224;
        const y = 25 + Math.sin(a) * 224;
        return <g key={a} transform={`translate(${x} ${y}) rotate(${a * 180 / Math.PI})`}>
          <path d={`M-2 -17 C${36 + Math.sin(t * 0.3 + k) * 3} -42 46 32 -2 16`} fill="none" stroke="#f56a3e" strokeWidth="6" opacity="0.25" />
          <path d="M-2 -17 C34 -38 42 30 -2 16" fill="none" stroke="#ffbb79" strokeWidth="1.6" opacity="0.75" />
        </g>;
      })}
      <circle cx="430" cy="25" r={228 + pulse * 2} fill={url("sun")} />
      <g clipPath={url("disc")}>
        {Array.from({ length: 65 }, (_, k) => {
          const x = 200 + noise(k) * 460;
          const y = -205 + noise(k + 90) * 460;
          const size = 11 + noise(k + 8) * 26;
          return <path key={k} transform={`translate(${x} ${y}) rotate(${noise(k + 1) * 180 + Math.sin(t * 0.2 + k) * 3}) scale(${size / 20})`} d="M-20 -4 Q-23 -18 -8 -19 Q1 -29 12 -15 Q26 -13 19 2 Q25 17 7 18 Q-3 27 -13 13 Q-27 13 -20 -4Z" fill={k % 3 ? "#ffe0a0" : "#a63129"} opacity={0.07 + noise(k + 6) * 0.1} />;
        })}
        <path d="M230 112 C320 58 385 154 468 115 S588 62 646 118 M229 123 C323 74 389 164 471 126" stroke="#9b342c" strokeWidth="3" fill="none" opacity="0.09" />
      </g>
      {/* Relieves lejanos casi disueltos en el resplandor. */}
      <path d="M0 173 L44 159 L80 171 L137 145 L184 162 L223 152 L278 179 L333 164 L375 180 L432 151 L482 175 L540 154 L590 171 L647 147 L694 173 L753 155 L800 168 V300 H0Z" fill="#a14638" />
      <path d="M0 204 L74 182 L111 191 L158 169 L193 185 L241 178 L279 201 L330 188 L377 205 L442 181 L475 195 L533 170 L574 189 L620 181 L675 202 L742 177 L800 196 V300 H0Z" fill="#603336" />
      <path d="M0 218 Q130 199 244 218 T469 211 T800 216 V300 H0Z" fill={url("lava")} />
      {/* Mesas de basalto y bloques con bordes calentados desde abajo. */}
      <path d={leftRock} fill={url("rock")} stroke="#9a4c3e" strokeWidth="1" />
      <path d={rightRock} fill={url("rock")} stroke="#9a4c3e" strokeWidth="1" />
      <path d="M134 187 L147 210 L181 222 L210 245 M660 179 L652 207 L606 229 L579 254 M58 197 L71 224 L48 245" fill="none" stroke="#0c0e19" strokeWidth="2" />
      <path d="M0 273 L93 255 L143 266 L170 300 H0Z M629 274 L704 255 L757 261 L800 252 V300 H655Z" fill="#15151f" stroke="#643935" strokeWidth="1" />
      <path d={river} fill={url("lava")} stroke="#ffbc68" strokeWidth="0.8" />
      <path d="M364 204 C426 216 466 214 436 225 C399 238 251 238 267 253 C281 270 455 259 495 300" fill="none" stroke="#ffd995" strokeWidth="2.8" opacity="0.8" />
      {/* Fragmentos de corteza flotando sobre las corrientes. */}
      {Array.from({ length: 25 }, (_, k) => {
        const x = 80 + noise(k + 20) * 660;
        const y = 220 + noise(k + 30) * 80;
        return <path key={k} d={`M${x} ${y} l${5 + noise(k) * 12} -2 l6 3 l-12 2Z`} fill="#79382f" opacity="0.65" />;
      })}
      {Array.from({ length: 7 }, (_, k) => {
        const x = 35 + k * 120;
        const d = `M${x} 216 l14 14 l-7 12 l22 15 l-6 17 l24 26 M${x + 8} 242 l-27 9 l-9 20`;
        return <g key={k} clipPath={url("plates")}>
          <path d={d} fill="none" stroke="#e95d2c" strokeWidth="6" opacity="0.16" />
          <path d={d} fill="none" stroke="#ff9e47" strokeWidth="1.2" opacity={0.65 + Math.sin(t * 0.7 + k) * 0.15} />
        </g>;
      })}
      {/* Columnas de gas y ceniza que dejan ver el paisaje a través de sus capas. */}
      {[110, 550, 728].map((x, k) => <path key={x} d={`M${x - 12} 219 C${x - 40} 177 ${x + 22} 157 ${x - 9} 119 C${x - 30} 91 ${x - 11} 62 ${x + 12} 47 C${x - 3} 87 ${x + 33} 111 ${x + 15} 145 C${x - 5} 177 ${x + 33} 198 ${x + 12} 219Z`} fill={url("smoke")} transform={`translate(${Math.sin(t * 0.25 + k) * 4} 0)`} />)}
      {Array.from({ length: 35 }, (_, k) => {
        const f = (t * (0.055 + (k % 4) * 0.018) + noise(k)) % 1;
        return <path key={k} d={`M${noise(k + 1) * 800 + Math.sin(t * 0.4 + k) * f * 18} ${275 - f * 205} l1 -${1.2 + (k % 3)}`} stroke={k % 3 ? "#ffc28b" : "#713a3c"} strokeWidth={0.6 + noise(k + 2)} opacity={(1 - f) * 0.8} />;
      })}
      <path d="M0 206 Q200 192 400 209 T800 201" stroke="#ffbd88" strokeWidth="8" fill="none" opacity="0.08" />
    </>
  );
}
