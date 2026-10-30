const nf = (d: number) => new Intl.NumberFormat("es-CL", { maximumFractionDigits: d, minimumFractionDigits: d });

export function formatYears(y: number): string {
  const a = Math.abs(y);
  if (a === 0) return "0 años";
  if (a < 1 / 365.25 / 24) return `${nf(1).format(y * 365.25 * 86_400)} s`;
  if (a < 1 / 365.25) return `${nf(1).format(y * 365.25 * 24)} h`;
  if (a < 1) return `${nf(1).format(y * 365.25)} días`;
  if (a < 1000) return `${nf(2).format(y)} años`;
  if (a < 1e6) return `${nf(0).format(y)} años`;
  return `${nf(3).format(y / 1e6)} M años`;
}

export function formatLy(ly: number): string {
  const a = Math.abs(ly);
  // Dentro del sistema solar es más claro en unidades astronómicas.
  if (a > 0 && a < 0.01) return `${nf(a * 63_241 < 10 ? 2 : 1).format(ly * 63_241)} UA`;
  if (a < 1000) return `${nf(2).format(ly)} al`;
  if (a < 1e6) return `${nf(0).format(ly)} al`;
  return `${nf(3).format(ly / 1e6)} M al`;
}

export function formatFactor(f: number): string {
  if (!isFinite(f)) return "∞";
  if (f >= 1000) return `×${new Intl.NumberFormat("es-CL", { notation: "compact", maximumFractionDigits: 2 }).format(f)}`;
  if (f >= 0.01) return `×${nf(f < 10 ? 3 : 1).format(f)}`;
  return `×${f.toExponential(2).replace(".", ",")}`;
}

export function formatBeta(b: number): string {
  const digits = Math.min(12, Math.max(3, Math.ceil(-Math.log10(1 - b + 1e-15)) + 2));
  return `${b.toFixed(digits).replace(".", ",")} c`;
}

export const fmt = (n: number, d = 2) => nf(d).format(n);

/** Edad humana legible: "57 años y 3 meses". */
export function formatAge(a: number): string {
  const years = Math.floor(a);
  const months = Math.floor((a - years) * 12);
  if (a >= 1000) return formatYears(a);
  return months > 0 ? `${years} años y ${months} ${months === 1 ? "mes" : "meses"}` : `${years} años`;
}

/** Velocidad de reproducción: cuánto tiempo propio pasa por segundo real. */
export function formatPlayback(yearsPerSec: number): string {
  const s = yearsPerSec * 365.25 * 86_400;
  if (s < 90) return `${nf(s < 10 ? 1 : 0).format(s)} s`;
  if (s < 5_400) return `${nf(0).format(s / 60)} min`;
  if (s < 172_800) return `${nf(1).format(s / 3_600)} h`;
  if (yearsPerSec < 0.2) return `${nf(1).format(s / 86_400)} días`;
  return formatYears(yearsPerSec);
}
