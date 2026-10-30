// Hipersueño: durante el crucero Tomás duerme en una cápsula criogénica y su cuerpo casi no envejece.
// El reloj de la nave sigue marcando su tiempo propio; lo que se frena es la biología.

import type { Trip } from "./relativity";

/** En hipersueño el cuerpo envejece un día por cada cien. */
export const CRYO_RATE = 0.01;

const sleeps = (kind: string, hyper: boolean) => hyper && kind === "cruise";

/** ¿Está Tomás dentro de la cápsula en el instante τ? */
export function inCryo(trip: Trip, tau: number, hyper: boolean) {
  if (!hyper) return false;
  const p = trip.phases.find((ph) => tau >= ph.tau0 && tau < ph.tau1);
  return !!p && sleeps(p.kind, hyper);
}

/** Años que envejeció el cuerpo de Tomás hasta el tiempo propio τ (después del viaje, a ritmo normal). */
export function bioYears(trip: Trip, tau: number, hyper: boolean) {
  if (!hyper) return tau;
  let bio = 0;
  for (const p of trip.phases) {
    const span = Math.max(0, Math.min(tau, p.tau1) - p.tau0);
    bio += span * (sleeps(p.kind, hyper) ? CRYO_RATE : 1);
  }
  return bio + Math.max(0, tau - trip.totalTau);
}

/** Tiempo propio en que el cuerpo de Tomás alcanza `bio` años (Infinity si no ocurre durante el viaje). */
export function tauAtBio(trip: Trip, bio: number, hyper: boolean) {
  if (bioYears(trip, trip.totalTau, hyper) < bio) return Infinity;
  let lo = 0;
  let hi = trip.totalTau;
  for (let k = 0; k < 80; k++) {
    const mid = (lo + hi) / 2;
    if (bioYears(trip, mid, hyper) < bio) lo = mid;
    else hi = mid;
  }
  return hi;
}
