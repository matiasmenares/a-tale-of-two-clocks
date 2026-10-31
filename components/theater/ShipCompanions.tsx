"use client";

import { useId, useState } from "react";

/** HAL permanece en la cabina; TARS acompaña la exploración de Miller. */
export function ShipCompanions({ t, cryo = false }: { t: number; cryo?: boolean }) {
  const id = useId();
  const [speaking, setSpeaking] = useState(false);
  const [line, setLine] = useState(0);
  const toggle = () => {
    setSpeaking(value => !value);
    setLine(value => value + 1);
  };
  const halLines = cryo
    ? ["Descansa, Tomás. Yo cuento las estrellas.", "Tu reloj sigue avanzando. Yo sigo aquí."]
    : ["Buenos días, Tomás. ¿Otro año de viaje?", "He revisado las compuertas. Por cortesía.", "Puedo calcular el tiempo. La nostalgia, todavía no."];
  const dialogue = halLines[line % halLines.length];
  return <>
    <defs>
      <radialGradient id={`${id}-eye`} cx="48%" cy="45%">
        <stop stopColor="#fff5bf" /><stop offset="0.1" stopColor="#ffb558" />
        <stop offset="0.28" stopColor="#ff4232" /><stop offset="0.65" stopColor="#941725" /><stop offset="1" stopColor="#160e1b" />
      </radialGradient>
    </defs>
    {/* El ojo rojo y la placa azul de HAL, sobre la pared junto al retrato. */}
    <g transform="translate(246 54)" role="button" tabIndex={0} aria-label="Hablar con HAL 9000, guiño a 2001: una odisea del espacio" aria-expanded={speaking}
      className="cursor-pointer outline-none focus:brightness-150 hover:brightness-125"
      onClick={() => toggle()} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); } }}>
      <title>HAL 9000 · 2001: una odisea del espacio — clic para hablar</title>
      <rect x="-1" y="-1" width="38" height="61" rx="3" fill="#243446" stroke="#172434" strokeWidth="1" />
      <rect width="36" height="58" rx="2" fill="#101b2a" stroke="#9eb0b8" strokeWidth="0.8" />
      <rect x="3" y="4" width="30" height="9" rx="0.5" fill="#24547b" />
      <text x="18" y="10.2" textAnchor="middle" fontSize="5.1" fontFamily="monospace" fill="#e0ebef" letterSpacing="0.6">HAL 9000</text>
      <circle cx="18" cy="30" r="12" fill="#080e18" stroke="#6f8797" strokeWidth="1.4" />
      <circle cx="18" cy="30" r="9.5" fill={`url(#${id}-eye)`} />
      <circle cx="18" cy="30" r="2.6" fill="#ffde98" opacity={0.35 + Math.sin(t * 1.2) * 0.1} />
      <path d="M10 24 Q13 20 19 21" fill="none" stroke="#ffc3ae" strokeWidth="0.7" opacity="0.45" />
      {[47, 50, 53].map(y => <path key={y} d={`M8 ${y} h20`} stroke="#657c8a" strokeWidth="0.7" strokeDasharray="1 1" />)}
    </g>
    {speaking && <g role="status" aria-live="polite" pointerEvents="none">
      <path d="M268 119 L278 131 H475 Q480 131 480 136 V171 Q480 176 475 176 H251 Q246 176 246 171 V136 Q246 131 251 131 H268Z" fill="#101e2e" stroke="#667f90" strokeWidth="0.8" opacity="0.97" />
      <text x="256" y="148" fontSize="5.2" fontFamily="monospace" fill="#fba3a1">HAL 9000 · 2001</text>
      <text x="256" y="162" fontSize="6.6" fill="#e0e9ef">{dialogue}</text>
    </g>}
  </>;
}
