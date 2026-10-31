const random = (n: number) => {
  const value = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

/** Vapor de la plataforma: nace en el foso, se expande hacia los lados y pierde opacidad. */
export function LaunchSmoke({ elapsed, altitude, front = false }: { elapsed: number; altitude: number; front?: boolean }) {
  if (elapsed <= 0 || altitude > 100_000) return null;
  const strength = Math.min(1, elapsed / 1.5);
  const fade = Math.max(0, 1 - altitude / 100_000);
  return <g opacity={strength * fade} pointerEvents="none">
    {Array.from({ length: front ? 12 : 22 }, (_, i) => {
      const lifetime = 4.5 + random(i + 20) * 3;
      const emission = i * 0.13;
      if (elapsed < emission) return null;
      const age = (elapsed - emission) % lifetime;
      const progress = age / lifetime;
      const direction = i % 2 ? 1 : -1;
      const speed = (front ? 23 : 30) + random(i) * 23;
      const x = 632 + direction * (8 + age * speed);
      const y = 251 - age * (front ? 2.5 : 5) - random(i + 3) * 7;
      const size = 6 + progress * (front ? 27 : 39);
      return <g key={i} transform={`translate(${x} ${y}) scale(${size / 20})`} opacity={(1 - progress) * (front ? 0.45 : 0.65)}>
        <path d="M-22 4 C-30 -3 -20 -17 -11 -15 C-8 -25 8 -25 13 -15 C27 -19 35 -5 25 3 C29 15 12 21 3 16 C-8 23 -24 18 -22 4Z" fill={front ? "#b6b8b2" : "#d5d8d4"} />
        <path d="M-21 6 Q-10 17 0 11 Q12 18 26 5 Q27 18 6 17 Q-13 24 -21 6Z" fill="#8f9ca2" opacity="0.3" />
      </g>;
    })}
  </g>;
}

/** Pluma pulsante anclada a las toberas y animada con el tiempo del lanzamiento. */
export function EnginePlume({ t, power }: { t: number; power: number }) {
  const length = 0.65 + power * 0.5 + Math.sin(t * 29) * 0.06 + Math.sin(t * 47) * 0.04;
  const sway = Math.sin(t * 37) * 2;
  return <g opacity={Math.min(1, power * 2)} transform={`scale(${0.6 + power * 0.4} ${length * Math.min(1, power * 2)})`}>
    <path d={`M-20 -2 Q-29 24 -14 55 L${sway} 110 L18 52 Q29 20 20 -2Z`} fill="#ef7027" opacity="0.4" />
    <path d={`M-16 -2 Q-22 20 -10 49 L${sway} 90 L12 47 Q23 18 16 -2Z`} fill="#ffb84f" opacity="0.8" />
    <path d={`M-10 -2 Q-14 22 -5 44 L${sway * 0.5} 64 L7 42 Q15 19 10 -2Z`} fill="#fff0b9" />
    {[-14, 0, 14].map(x => <path key={x} d={`M${x - 3} -2 Q${x - 4} 11 ${x} 26 Q${x + 4} 11 ${x + 3} -2Z`} fill="#f5fbff" />)}
    {[25, 43, 61].map((y, i) => <path key={y} d={`M${-7 + i * 1.8} ${y} l${7 - i * 1.8} -4 l${7 - i * 1.8} 4 l${-7 + i * 1.8} 4Z`} fill="#fff8d8" opacity="0.5" />)}
  </g>;
}
