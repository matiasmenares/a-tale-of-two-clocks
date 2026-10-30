// Detalles de ingeniería y de vida a bordo: combustible, escudo, bandeja de mensajes y noticias.
// Unidades: años, años luz, c = 1.

import type { ShipState, Trip } from "./relativity";

const burns = (trip: Trip) => trip.phases.filter((p) => p.kind === "accel" || p.kind === "decel");

/** Rapidez (φ) que ya cambiaron los motores hasta τ: con aceleración propia a, dφ/dτ = a. */
export function rapidityUsed(trip: Trip, tau: number) {
  if (!isFinite(trip.a)) return 0;
  return burns(trip).reduce((sum, p) => sum + Math.max(0, Math.min(tau, p.tau1) - p.tau0) * trip.a, 0);
}

/** Velocidad de escape de los gases: cohete de fotones ideal (c) y de antimateria con piones (~0,33 c). */
export const EXHAUST = { photon: 1, antimatter: 0.33 };

/**
 * Ecuación del cohete relativista: φ = (u/c)·ln(m₀/m). Devuelve cuántas veces más masa tenía la nave al
 * despegar que al terminar el viaje, y la fracción de propelente que le queda ahora.
 */
export function fuel(trip: Trip, tau: number, u = EXHAUST.photon) {
  const total = rapidityUsed(trip, trip.totalTau);
  const used = rapidityUsed(trip, tau);
  const massRatio = Math.exp(total / u);
  const left = total > 0 ? (Math.exp(-used / u) - Math.exp(-total / u)) / (1 - Math.exp(-total / u)) : 1;
  return { massRatio, left: Math.max(0, Math.min(1, left)) };
}

/**
 * Desgaste del escudo frontal: cada átomo interestelar choca con energía ∝ (γ−1) y llegan ∝ γβ por
 * segundo de a bordo. El escudo (agua y hielo) se gasta con esa dosis; la tripulación lo rellena con
 * la reserva hasta un mínimo de seguridad.
 */
export function shield(trip: Trip, tau: number) {
  const cruise = trip.phases.filter((p) => p.kind === "cruise");
  const g = Math.cosh(trip.phi);
  const gb = Math.sinh(trip.phi);
  const dose = cruise.reduce((sum, p) => sum + Math.max(0, Math.min(tau, p.tau1) - p.tau0), 0) * (g - 1) * gb;
  const left = Math.exp(-dose * 7e-4);
  return { left: Math.max(0.1, left), patched: left < 0.1 };
}

/** Martín graba un mensaje por semana. Cuántos le llegaron ya a Tomás y a qué ritmo llegan ahora. */
export function inbox(earthSeen: number, earthDeath: number, doppler: number) {
  const perWeekSent = 1;
  const received = Math.floor(Math.min(earthSeen, earthDeath) * 52.18 * perWeekSent);
  // Por cada semana de Tomás llegan `doppler` semanas de mensajes de la Tierra.
  const perShipWeek = earthSeen < earthDeath ? doppler * perWeekSent : 0;
  return { received, perShipWeek };
}

export const dopplerOf = (s: ShipState, stayRate: number) => (s.phase.kind === "stay" ? 1 / stayRate : s.gamma * (1 - s.beta));

/** Titulares de la Tierra por año: Tomás los recibe con el atraso de la luz. */
const HEADLINES: [number, string][] = [
  [2030, "Despega la misión TERRA-1"],
  [2033, "Primera base permanente en el polo sur de la Luna"],
  [2037, "La fusión nuclear da su primera electricidad a la red"],
  [2041, "Un tratamiento frena el alzhéimer en ensayos"],
  [2045, "Inauguran el primer tren de vacío entre ciudades"],
  [2049, "Llegan los primeros colonos a Marte"],
  [2054, "Los autos voladores ya son el 10 % del tránsito"],
  [2060, "Se termina el último pozo de petróleo activo"],
  [2068, "Robots cuidadores en la mitad de los hogares"],
  [2075, "Nace el primer niño en Marte"],
  [2083, "Se completa el ascensor espacial de Quito"],
  [2095, "La población mundial empieza a bajar"],
  [2110, "Telescopio en la Luna fotografía planetas de Próxima"],
  [2140, "Ciudades flotantes en el Pacífico"],
  [2200, "Ya viven más personas fuera de la Tierra que en ella"],
  [2400, "Primera sonda llega a Próxima Centauri"],
  [3000, "Tercer milenio: la humanidad ocupa todo el sistema solar"],
  [12000, "Termina el interglaciar: avanzan los hielos"],
  [1e6, "Un millón de años: las constelaciones ya no se parecen a las de 2030"],
  [1e8, "Los continentes se juntan en un nuevo supercontinente"],
  [1e9, "El Sol más brillante empieza a evaporar los océanos"],
];

/** Último titular de la Tierra publicado hasta ese año (el que Tomás alcanza a leer). */
export function headlineFor(year: number) {
  let last: [number, string] | null = null;
  for (const h of HEADLINES) if (h[0] <= year) last = h;
  return last;
}
