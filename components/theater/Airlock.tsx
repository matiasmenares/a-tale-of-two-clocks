/** Compartimento de salida separado de la zona habitable: nunca sustituye a la litera. */
export function Airlock({ sealed }: { sealed: boolean }) {
  return <g>
    <defs>
      <linearGradient id="airlock-wall" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#526b7a" /><stop offset="0.6" stopColor="#344e60" /><stop offset="1" stopColor="#223b50" />
      </linearGradient>
      <linearGradient id="airlock-metal" x1="0" y1="0" x2="1" y2="0">
        <stop stopColor="#78919f" /><stop offset="0.3" stopColor="#b3c3c9" /><stop offset="1" stopColor="#4e697b" />
      </linearGradient>
      <linearGradient id="airlock-floor" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#172c3d" /><stop offset="1" stopColor="#385364" />
      </linearGradient>
    </defs>
    <rect width="800" height="300" fill="url(#airlock-wall)" />
    {[12, 184, 282, 452, 590, 790].map(x => <g key={x}>
      <path d={`M${x} 16 V252`} stroke="#183346" strokeWidth="7" />
      <path d={`M${x - 1.5} 18 V249`} stroke="#a7bec8" strokeWidth="0.8" opacity="0.35" />
    </g>)}
    <path d="M0 18 H800 M0 251 H800" stroke="#1a3042" strokeWidth="8" />
    <path d="M0 14 H800 M0 248 H800" stroke="#91abb5" strokeWidth="1.2" opacity="0.6" />
    {[208, 468].map(x => <g key={x}>
      <rect x={x} y="19" width="100" height="6" rx="2" fill="#1a3143" />
      <path d={`M${x + 5} 22 h90`} stroke="#e0f2ed" strokeWidth="2" opacity="0.7" />
    </g>)}
    <text x="401" y="42" textAnchor="middle" fontFamily="monospace" fontSize="7" letterSpacing="2" fill="#d0e0e3">ESCLUSA · TERRA-1</text>
    {/* Marco exterior: un pasillo libre hasta la escotilla, sin muebles. */}
    <rect x="28" y="56" width="134" height="207" rx="17" fill="#183144" stroke="#8fa7b3" strokeWidth="1.3" />
    <path d="M37 247 V76 Q37 65 48 65 H142 Q153 65 153 76 V247" fill="none" stroke="#bbc9cb" strokeWidth="2" />
    <rect x="44" y="39" width="103" height="12" rx="2" fill="#172d3e" />
    <text x="95" y="47" fontSize="5.5" fontFamily="monospace" textAnchor="middle" fill={sealed ? "#f8a47d" : "#a8e1be"}>{sealed ? "EXTERIOR · BLOQUEADO" : "SALIDA A SUPERFICIE"}</text>
    {/* La puerta interior deja clara la conexión con la habitación de Tomás. */}
    <rect x="310" y="54" width="128" height="208" rx="18" fill="#1c3447" stroke="#152c3f" strokeWidth="2" />
    <rect x="318" y="61" width="112" height="196" rx="13" fill="url(#airlock-metal)" stroke="#adc1c9" strokeWidth="0.8" />
    <path d="M324 78 V241 M425 78 V241" stroke="#3a566a" strokeWidth="1" />
    <circle cx="374" cy="111" r="23" fill="#1b3243" stroke="#506c7e" strokeWidth="5" />
    <path d="M359 101 Q369 91 383 96" fill="none" stroke="#94bac5" strokeWidth="1.5" opacity="0.4" />
    <rect x="337" y="151" width="74" height="18" rx="2" fill="#233e52" />
    <text x="374" y="163" fontFamily="monospace" fontSize="8" textAnchor="middle" fill="#deebeb" letterSpacing="1">← CABINA</text>
    <path d="M409 187 v27" stroke="#263e50" strokeWidth="6" />
    <path d="M409 190 v20" stroke="#c8d6d8" strokeWidth="2" />
    <circle cx="419" cy="74" r="2" fill="#8fdbb5" />
    {/* Equipo de la esclusa, fuera de la ruta de salida. */}
    <rect x="479" y="63" width="88" height="171" rx="7" fill="#213b4f" stroke="#102b3e" strokeWidth="1" />
    <path d="M485 70 H560 M485 226 H560" stroke="#7795a4" strokeWidth="1" />
    <text x="523" y="82" textAnchor="middle" fontSize="5.1" fontFamily="monospace" fill="#b5cbd3">EQUIPO / EVA</text>
    <circle cx="523" cy="108" r="15" fill="#93aab7" stroke="#d6e1df" strokeWidth="2" />
    <path d="M511 105 Q523 93 535 105 V115 Q523 124 511 115Z" fill="#28485d" stroke="#b5ccd4" strokeWidth="0.7" />
    {[500, 535].map((x, i) => <g key={x}>
      <rect x={x} y="143" width="14" height="59" rx="5" fill={i ? "#7e9eac" : "#b7c4c6"} stroke="#102b3e" strokeWidth="1" />
      <path d={`M${x + 3} 150 h8 M${x + 3} 191 h8`} stroke="#405f72" strokeWidth="1" />
    </g>)}
    <path d="M491 210 h64" stroke="#7998a8" strokeWidth="3" />
    <rect y="262" width="800" height="38" fill="url(#airlock-floor)" />
    {[0, 120, 240, 360, 480, 600, 720, 800].map(x => <path key={x} d={`M${x} 262 L${400 + (x - 400) * 1.2} 300`} stroke="#87a2ad" strokeWidth="0.6" opacity="0.2" />)}
    <path d="M0 285 H800" stroke="#87a2ad" strokeWidth="0.6" opacity="0.2" />
    <path d="M48 268 H152" stroke="#b9bec0" strokeWidth="4" />
    <path d="M48 268 H152" stroke="#263d4c" strokeWidth="3" strokeDasharray="5 5" />
    <path d="M295 278 H224 M238 273 L224 278 L238 283" fill="none" stroke="#e2b95e" strokeWidth="1.7" opacity="0.8" />
  </g>;
}
