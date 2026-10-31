import { Person, walkClock } from "./Person";
import { Tree } from "./Tree";
import { returnJourney } from "@/lib/departure";

const clamp = (v: number) => Math.max(0, Math.min(1, v));

/** Una breve escena de Martín regresando del lanzamiento, ligada al reloj terrestre. */
export function ReturnHome({ progress, age, t }: { progress: number; age: number; t: number }) {
  const { travelled, cameraX, carX, walk } = returnJourney(progress);
  const exiting = progress >= 0.94;
  const doorOpen = progress >= 0.925 && progress < 0.975;
  const opening = clamp((progress - 0.925) / 0.012);
  const closing = clamp((0.975 - progress) / 0.02);
  const doorAngle = Math.min(opening, closing) * Math.PI / 3;
  // Bisagra en el borde delantero: al abrir, el panel se acorta en perspectiva
  // y el borde libre se acerca al espectador, conservando el tamaño de la puerta.
  const doorPoint = (x: number, y: number) => [
    31 + (x - 31) * Math.cos(doorAngle),
    y + (31 - x) * Math.sin(doorAngle) * 0.35,
  ].join(",");
  const doorPolygon = (points: [number, number][]) => points.map(([x, y]) => doorPoint(x, y)).join(" ");
  const personX = 586 + walk * 63;
  return <>
    <path d="M0 213 Q160 204 330 216 T800 209 V300 H0Z" fill="#657c55" />
    {/* Árboles y postes pasan junto al auto mientras la cámara lo acompaña. */}
    {Array.from({ length: 24 }, (_, i) => ({ x: 70 + i * 390 - cameraX, i })).filter(({ x }) => x > -100 && x < 900).map(({ x, i }) => (
      <Tree key={i} x={x} base={235} scale={1.2 + (i % 3) * 0.25} season="verano" t={t} />
    ))}
    {Array.from({ length: 30 }, (_, i) => 140 + i * 300 - cameraX).filter(x => x > -30 && x < 830).map(x => <g key={x}>
      <path d={`M${x} 239 V159 q0 -10 10 -10 h14`} fill="none" stroke="#687a7e" strokeWidth="2" />
      <path d={`M${x + 15} 149 h17`} stroke="#c0c8bf" strokeWidth="3" />
    </g>)}
    <g transform={`translate(${8000 - cameraX} 0)`}>
    {/* La casa, al fondo de la vereda. */}
    <path d="M503 230 V144 L606 95 L708 144 V230Z" fill="#c8b698" stroke="#3f4544" strokeWidth="1.2" />
    <path d="M488 148 L606 85 L722 148 L713 153 L606 99 L497 154Z" fill="#4a5961" stroke="#283b48" strokeWidth="1.3" />
    <path d="M508 153 H703 M509 221 H704" stroke="#f3e3c4" strokeWidth="2" />
    <rect x="632" y="169" width="35" height="61" rx="2" fill={walk > 0.7 ? "#4a3b2e" : "#8a6952"} stroke="#4b4a42" strokeWidth="1.5" />
    <path d="M638 176 h23 v47 h-23Z" fill="none" stroke="#c3a281" strokeWidth="0.8" />
    <circle cx="659" cy="202" r="1.4" fill="#ddba7c" />
    {[528, 580, 679].map(x => <g key={x}>
      <rect x={x} y="166" width="22" height="31" fill="#719dab" stroke="#e9dfc8" strokeWidth="3" />
      <path d={`M${x + 11} 166 v31 M${x} 182 h22`} stroke="#e9dfc8" strokeWidth="1" />
      <path d={`M${x + 2} 169 h9 l-9 13Z`} fill="#e3f0ef" opacity="0.3" />
    </g>)}
    <path d="M628 230 H673 L699 249 H610Z" fill="#c2b8a4" />
    </g>
    <rect y="240" width="800" height="60" fill="#49545b" />
    <path d="M0 241 H800" stroke="#c2c1b6" strokeWidth="4" />
    <path d="M0 284 H800" stroke="#e1d6b0" strokeWidth="1.8" strokeDasharray="30 25" strokeDashoffset={cameraX} />
    {/* Martín camina por la vereda, detrás del auto estacionado. */}
    {exiting && <Person x={personX} y={239 - walk * 9} age={age} pose={walk > 0 ? "walk" : "stand"} t={walkClock(walk * 63 / 0.6, age)} scale={0.6} opacity={Math.min(1, (1 - walk) * 10)} />}
    {/* Auto con conductor visible, ruedas vinculadas al recorrido. */}
    <g transform={`translate(${carX} 262)`}>
      <ellipse cy="4" rx="48" ry="5" fill="#1d2830" opacity="0.3" />
      <path d="M-43 -9 L-36 -22 L-22 -24 L-11 -40 Q-9 -43 -3 -43 H15 Q21 -43 25 -38 L37 -24 L47 -20 L50 -7Z" fill="#587b88" stroke="#203847" strokeWidth="1.4" />
      <path d="M-19 -25 L-9 -39 H1 V-25Z M5 -39 H15 Q18 -39 21 -35 L30 -25 H5Z" fill="#1c3c51" stroke="#9bbcc8" strokeWidth="0.7" />
      {doorOpen && <path d="M3 -39 H15 L31 -25 V-10 H3Z" fill="#142a39" stroke="#203847" strokeWidth="0.7" />}
      {!exiting && <>
        <circle cx="16" cy="-33" r="4" fill="#e8b48f" />
        <path d="M12 -34 q3 -6 7 0" fill="#45362e" />
        <path d="M9 -25 q5 -8 12 0" fill="#2563eb" />
      </>}
      <path d="M-35 -20 H35 M2 -25 V-11 M9 -21 h6" fill="none" stroke="#b9d0d4" strokeWidth="0.7" />
      <path d="M-42 -9 H46" stroke="#263e4d" strokeWidth="3" />
      <path d="M44 -19 l4 1 v4 h-4Z" fill="#ffe2a7" />
      {[-28, 31].map(x => <g key={x} transform={`translate(${x} -5) rotate(${travelled / 8 * 180 / Math.PI})`}>
        <circle r="8" fill="#1c2d39" /><circle r="4.6" fill="#a7b6bc" />
        <path d="M-4 0 h8 M0 -4 v8" stroke="#4d6574" strokeWidth="1" />
      </g>)}
    </g>
    {/* El auto se detiene antes de abrir la puerta; Martín sale por la vereda. */}
    {doorOpen && <g transform={`translate(${carX} 262)`}>
      <polygon points={doorPolygon([[3, -39], [15, -39], [31, -25], [31, -10], [3, -10]])} fill="#688e9b" stroke="#203847" strokeWidth="0.8" strokeLinejoin="round" />
      <polygon points={doorPolygon([[6, -36], [15, -36], [27, -25], [6, -25]])} fill="#25475a" stroke="#b9d0d4" strokeWidth="0.6" />
      <polyline points={doorPolygon([[7, -22], [14, -22]])} fill="none" stroke="#d6e2df" strokeWidth="1.1" />
      <polyline points={doorPolygon([[5, -13], [29, -13]])} fill="none" stroke="#405e70" strokeWidth="0.7" />
    </g>}
    {cameraX < 450 && <text x={104 - cameraX} y="221" fill="#dce5df" fontSize="8" textAnchor="middle">CENTRO DE LANZAMIENTO ←</text>}
  </>;
}
