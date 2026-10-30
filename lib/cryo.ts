// Hipersueño: durante el crucero Tomás duerme en una cápsula criogénica y su cuerpo casi no envejece.
// El reloj de la nave sigue marcando su tiempo propio; lo que se frena es la biología.

import type { Trip } from "./relativity";

/**
 * Animación suspendida: el cuerpo envejece ~1 segundo cada 30 años. Tiene que ser así de lento para
 * que Tomás sobreviva incluso al viaje al cuásar (casi 500 millones de años de crucero).
 */
export const CRYO_RATE = 1e-9;

/**
 * Tramos del tiempo propio de la nave [desde, hasta) en que el hipersueño estuvo activado.
 * Solo cuenta desde que se activa: activarlo a mitad del viaje no rejuvenece lo ya vivido.
 */
export type Sleep = readonly (readonly [number, number])[];
export const NEVER: Sleep = [];
export const ALWAYS: Sleep = [[0, Infinity]];

/** Tiempo dormido dentro de [a, b): solo en el crucero y dentro de los tramos activados. */
function asleepWithin(trip: Trip, a: number, b: number, sleep: Sleep) {
  let total = 0;
  for (const p of trip.phases) {
    if (p.kind !== "cruise") continue;
    for (const [s, e] of sleep) total += Math.max(0, Math.min(b, p.tau1, e) - Math.max(a, p.tau0, s));
  }
  return total;
}

/** ¿Está Tomás dentro de la cápsula en el instante τ? */
export function inCryo(trip: Trip, tau: number, sleep: Sleep) {
  if (!sleep.length) return false;
  const p = trip.phases.find((ph) => tau >= ph.tau0 && tau < ph.tau1);
  return !!p && p.kind === "cruise" && sleep.some(([s, e]) => tau >= s && tau < e);
}

/** Años que envejeció el cuerpo de Tomás hasta el tiempo propio τ. */
export function bioYears(trip: Trip, tau: number, sleep: Sleep) {
  if (!sleep.length) return tau;
  return tau - asleepWithin(trip, 0, tau, sleep) * (1 - CRYO_RATE);
}

/** Tiempo propio en que el cuerpo de Tomás alcanza `bio` años (Infinity si no ocurre durante el viaje). */
export function tauAtBio(trip: Trip, bio: number, sleep: Sleep) {
  if (bioYears(trip, trip.totalTau, sleep) < bio) return Infinity;
  let lo = 0;
  let hi = trip.totalTau;
  for (let k = 0; k < 80; k++) {
    const mid = (lo + hi) / 2;
    if (bioYears(trip, mid, sleep) < bio) lo = mid;
    else hi = mid;
  }
  return hi;
}
