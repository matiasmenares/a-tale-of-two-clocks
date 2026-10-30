// Cinemática relativista del viaje (unidades: años, años luz, c = 1).

/** 1 g expresado en años luz / año². */
export const G_LY_YR2 = (9.80665 * (365.25 * 86_400) ** 2) / 9.4607e15; // ≈ 1,032

/** Distancia Tierra–Andrómeda en años luz. */
export const ANDROMEDA_LY = 2.537e6;

/** Una unidad astronómica en años luz. */
export const AU_LY = 1 / 63_241;

/** Cuerpo del sistema solar donde la nave aterriza y Tomás baja a explorar. */
export interface PlanetInfo {
  /** Planeta que domina el cielo (el mismo, o el planeta madre si es una luna). */
  parent: "mars" | "jupiter" | "saturn" | "neptune";
  /** Días que pasa Tomás en la superficie. */
  surfaceDays: number;
  ground: string;
  groundDark: string;
  sky: string;
  rock: string;
  /** Gravedad de superficie en g (afecta cómo camina). */
  gravity: number;
  diameterKm: number;
}

export interface Destination {
  id: string;
  name: string;
  distance: number;
  kind: "star" | "cluster" | "galaxy" | "custom" | "planet" | "blackhole";
  planet?: PlanetInfo;
  /** Agujero negro con un planeta en órbita muy cercana: cada hora allí son años en la Tierra. */
  miller?: { hours: number; factor: number };
}

export const DESTINATIONS: Destination[] = [
  {
    id: "marte", name: "Marte", distance: 1.5 * AU_LY, kind: "planet",
    planet: { parent: "mars", surfaceDays: 30, ground: "#c2410c", groundDark: "#7c2d12", sky: "#e8b98a", rock: "#9a3412", gravity: 0.38, diameterKm: 6_779 },
  },
  {
    id: "europa", name: "Europa (luna de Júpiter)", distance: 5.2 * AU_LY, kind: "planet",
    planet: { parent: "jupiter", surfaceDays: 20, ground: "#e7e5e4", groundDark: "#a8a29e", sky: "#020617", rock: "#d6d3d1", gravity: 0.13, diameterKm: 139_820 },
  },
  {
    id: "titan", name: "Titán (luna de Saturno)", distance: 9.5 * AU_LY, kind: "planet",
    planet: { parent: "saturn", surfaceDays: 20, ground: "#a16207", groundDark: "#713f12", sky: "#d97706", rock: "#78350f", gravity: 0.14, diameterKm: 116_460 },
  },
  {
    id: "triton", name: "Tritón (luna de Neptuno)", distance: 30 * AU_LY, kind: "planet",
    planet: { parent: "neptune", surfaceDays: 15, ground: "#f5d0fe", groundDark: "#c4b5fd", sky: "#020617", rock: "#a78bfa", gravity: 0.08, diameterKm: 49_244 },
  },
  { id: "proxima", name: "Próxima Centauri", distance: 4.24, kind: "star" },
  {
    id: "gargantua", name: "Gargantúa · planeta de Miller (ficticio)", distance: 15, kind: "blackhole",
    // Como en Interstellar: 1 hora en el planeta = 7 años en la Tierra (factor 61.320).
    miller: { hours: 3, factor: 61_320 },
  },
  { id: "sirio", name: "Sirio", distance: 8.6, kind: "star" },
  { id: "vega", name: "Vega", distance: 25, kind: "star" },
  { id: "aldebaran", name: "Aldebarán", distance: 65, kind: "star" },
  { id: "pleyades", name: "Las Pléyades", distance: 444, kind: "cluster" },
  { id: "betelgeuse", name: "Betelgeuse", distance: 548, kind: "star" },
  { id: "centro", name: "Centro de la Vía Láctea", distance: 26_000, kind: "cluster" },
  { id: "andromeda", name: "Andrómeda", distance: ANDROMEDA_LY, kind: "galaxy" },
  { id: "cuasar", name: "Cuásar 3C 273", distance: 2.44e9, kind: "galaxy" },
];

export const gamma = (beta: number) => 1 / Math.sqrt(1 - beta * beta);

export type PhaseKind = "accel" | "cruise" | "decel" | "stay" | "surface";
export type Leg = "ida" | "vuelta";

export interface Phase {
  kind: PhaseKind;
  leg: Leg;
  dir: 1 | -1;
  tau0: number;
  tau1: number;
  t0: number;
  t1: number;
  x0: number;
  x1: number;
}

export interface TripParams {
  beta: number;
  accelG: number;
  instant: boolean;
  roundTrip: boolean;
  distance: number;
  stay: { enabled: boolean; k: number; properYears: number };
  /** Días en la superficie del destino (planetas y lunas). */
  surfaceDays?: number;
}

export interface Trip {
  params: TripParams;
  phases: Phase[];
  totalTau: number;
  totalT: number;
  /** Rapidez alcanzada (puede ser menor que la pedida si la aceleración es muy baja). */
  phi: number;
  /** Aceleración propia en al/año² (Infinity si es instantánea). */
  a: number;
  stayRate: number;
}

export function buildTrip(params: TripParams): Trip {
  const { distance: D, instant } = params;
  const a = instant ? Infinity : params.accelG * G_LY_YR2;
  let phi = Math.atanh(params.beta);
  if (!instant && (2 * (Math.cosh(phi) - 1)) / a > D) phi = Math.acosh(1 + (a * D) / 2);

  const accTau = instant ? 0 : phi / a;
  const accT = instant ? 0 : Math.sinh(phi) / a;
  const accX = instant ? 0 : (Math.cosh(phi) - 1) / a;
  const cruiseX = Math.max(0, D - 2 * accX);
  const cruiseTau = cruiseX / Math.sinh(phi);
  const cruiseT = cruiseX / Math.tanh(phi);
  const stayRate = params.stay.enabled ? Math.sqrt(Math.max(1e-12, 1 - 1 / params.stay.k)) : 1;

  const phases: Phase[] = [];
  let tau = 0;
  let t = 0;
  let x = 0;
  const push = (kind: PhaseKind, leg: Leg, dir: 1 | -1, dTau: number, dT: number, dX: number) => {
    phases.push({ kind, leg, dir, tau0: tau, tau1: tau + dTau, t0: t, t1: t + dT, x0: x, x1: x + dir * dX });
    tau += dTau;
    t += dT;
    x += dir * dX;
  };
  const leg = (name: Leg, dir: 1 | -1) => {
    push("accel", name, dir, accTau, accT, accX);
    push("cruise", name, dir, cruiseTau, cruiseT, cruiseX);
    push("decel", name, dir, accTau, accT, accX);
  };

  leg("ida", 1);
  if (params.surfaceDays) push("surface", "ida", 1, params.surfaceDays / 365.25, params.surfaceDays / 365.25, 0);
  if (params.stay.enabled) push("stay", "ida", 1, params.stay.properYears, params.stay.properYears / stayRate, 0);
  if (params.roundTrip) leg("vuelta", -1);

  return { params, phases, totalTau: tau, totalT: t, phi, a, stayRate };
}

export interface ShipState {
  tau: number;
  t: number;
  x: number;
  /** Velocidad con signo (+ alejándose de la Tierra). */
  beta: number;
  gamma: number;
  /** Aceleración propia con signo (al/año²), 0 en crucero / reposo. */
  alpha: number;
  phase: Phase;
  phaseIndex: number;
}

export function stateAt(trip: Trip, tauIn: number): ShipState {
  const tau = Math.min(Math.max(tauIn, 0), trip.totalTau);
  let i = trip.phases.findIndex((p) => tau <= p.tau1 && p.tau1 > p.tau0);
  if (i < 0) i = trip.phases.length - 1;
  const p = trip.phases[i];
  const s = tau - p.tau0;
  const { a, phi } = trip;
  let t: number, x: number, beta: number, alpha = 0;

  switch (p.kind) {
    case "accel": {
      const f = a * s;
      t = p.t0 + Math.sinh(f) / a;
      x = p.x0 + (p.dir * (Math.cosh(f) - 1)) / a;
      beta = p.dir * Math.tanh(f);
      alpha = p.dir * a;
      break;
    }
    case "decel": {
      const f = a * (p.tau1 - tau);
      t = p.t1 - Math.sinh(f) / a;
      x = p.x1 - (p.dir * (Math.cosh(f) - 1)) / a;
      beta = p.dir * Math.tanh(f);
      alpha = -p.dir * a;
      break;
    }
    case "cruise": {
      t = p.t0 + Math.cosh(phi) * s;
      x = p.x0 + p.dir * Math.sinh(phi) * s;
      beta = p.dir * Math.tanh(phi);
      break;
    }
    default: {
      t = p.t0 + s / (p.kind === "stay" ? trip.stayRate : 1);
      x = p.x0;
      beta = 0;
    }
  }
  return { tau, t, x, beta, gamma: gamma(beta), alpha, phase: p, phaseIndex: i };
}

/** Busca τ tal que f(τ) = target, con f creciente. */
function solveTau(trip: Trip, target: number, f: (s: ShipState) => number) {
  let lo = 0;
  let hi = trip.totalTau;
  for (let k = 0; k < 80; k++) {
    const mid = (lo + hi) / 2;
    if (f(stateAt(trip, mid)) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export const tauFromT = (trip: Trip, t: number) =>
  t <= 0 ? 0 : t >= trip.totalT ? trip.totalTau : solveTau(trip, t, (s) => s.t);

/** Tiempo propio del astronauta que la Tierra ve (por luz) en su instante t. */
export function shipTauSeenFromEarth(trip: Trip, tEarth: number) {
  const end = stateAt(trip, trip.totalTau);
  if (tEarth <= 0) return 0;
  if (tEarth >= end.t + end.x) return end.tau + (tEarth - end.t - end.x);
  return solveTau(trip, tEarth, (s) => s.t + s.x);
}

/** Tiempo terrestre "ahora" según el plano de simultaneidad de la nave. */
export const earthTimeInShipFrame = (s: ShipState) => s.t - s.beta * s.x;

/**
 * Ritmo del reloj terrestre visto desde el marco (instantáneo) de la nave: dt'/dτ.
 * En aceleración aparece el factor de Rindler (1 − α·x): principio de equivalencia.
 */
export function earthRateInShipFrame(trip: Trip, s: ShipState) {
  if (s.phase.kind === "stay") return 1 / trip.stayRate;
  return (1 - s.alpha * s.x) / s.gamma;
}

/** Factor Doppler con que el astronauta ve llegar las señales de la Tierra (dt_emisión/dτ). */
export function dopplerEarthSeenByShip(trip: Trip, s: ShipState) {
  if (s.phase.kind === "stay") return 1 / trip.stayRate;
  return s.gamma * (1 - s.beta);
}

export const PHASE_LABEL: Record<PhaseKind, string> = {
  accel: "Acelerando",
  cruise: "Crucero",
  decel: "Frenando",
  stay: "Junto al agujero negro",
  surface: "En la superficie",
};
