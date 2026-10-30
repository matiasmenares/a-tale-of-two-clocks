/** Colores del cielo según la hora; en cámara rápida se promedia para evitar parpadeos. */
export function skyColors(hour: number, timelapse: boolean) {
  if (timelapse) return { top: "#1e3a5f", bottom: "#4b6a8f", night: 0.35, sunElev: 0 };
  const elev = Math.sin(((hour - 6) / 12) * Math.PI); // −1 medianoche, 1 mediodía
  const day = Math.min(1, Math.max(0, (elev + 0.15) / 0.5));
  const dusk = Math.max(0, 1 - Math.abs(elev) / 0.25) * (elev > -0.2 ? 1 : 0);
  const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const toHex = (c: number[]) => `rgb(${c.join(",")})`;
  let top = mix([4, 8, 30], [56, 140, 230], day);
  let bottom = mix([12, 20, 50], [186, 230, 253], day);
  bottom = mix(bottom, [251, 146, 60], dusk * 0.7);
  top = mix(top, [88, 60, 140], dusk * 0.4);
  return { top: toHex(top), bottom: toHex(bottom), night: 1 - day, sunElev: elev };
}

export const STAR_POINTS = Array.from({ length: 70 }, (_, i) => ({
  x: (i * 137.5) % 800,
  y: (i * 61.7) % 170,
  r: i % 5 === 0 ? 1.4 : 0.8,
}));
