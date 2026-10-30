import { EARTH_CLOCK_RATE } from "./gravity";
import {
  dopplerEarthSeenByShip,
  earthRateInShipFrame,
  earthTimeInShipFrame,
  shipTauSeenFromEarth,
  stateAt,
  type ShipState,
  type Trip,
} from "./relativity";

export const START_AGE = 30;
export const HUMAN_LIFESPAN = 80;

export interface Derived {
  earthRate: number;
  /** Tiempo propio del gemelo terrestre. */
  earthProper: number;
  shipProper: number;
  /** Lo que la Tierra calcula que marca la nave "ahora" (su plano de simultaneidad). */
  shipCalcFromEarth: number;
  shipRateFromEarth: number;
  /** Lo que la Tierra ve por telescopio. */
  shipSeenFromEarth: number;
  shipSeenRateFromEarth: number;
  /** Lo que la nave calcula que marca la Tierra "ahora". */
  earthCalcFromShip: number;
  earthRateFromShip: number;
  /** Lo que la nave ve por telescopio. */
  earthSeenFromShip: number;
  earthSeenRateFromShip: number;
  remainingProperDistance: number;
  remainingContracted: number;
}

export function derive(trip: Trip, s: ShipState, gravity: boolean): Derived {
  const earthRate = gravity ? EARTH_CLOCK_RATE : 1;
  const seenTau = shipTauSeenFromEarth(trip, s.t);
  const emit = stateAt(trip, Math.min(seenTau, trip.totalTau));
  const seenRate = seenTau >= trip.totalTau ? 1 : emit.phase.kind === "stay" ? trip.stayRate : 1 / (emit.gamma * (1 + emit.beta));
  const target = s.phase.leg === "ida" ? trip.params.distance : 0;
  const remaining = Math.abs(target - s.x);
  return {
    earthRate,
    earthProper: s.t * earthRate,
    shipProper: s.tau,
    shipCalcFromEarth: s.tau,
    shipRateFromEarth: s.phase.kind === "stay" ? trip.stayRate : 1 / s.gamma,
    shipSeenFromEarth: seenTau,
    shipSeenRateFromEarth: seenRate,
    earthCalcFromShip: Math.max(0, earthTimeInShipFrame(s)) * earthRate,
    earthRateFromShip: earthRateInShipFrame(trip, s) * earthRate,
    earthSeenFromShip: Math.max(0, s.t - Math.abs(s.x)) * earthRate,
    earthSeenRateFromShip: dopplerEarthSeenByShip(trip, s) * earthRate,
    remainingProperDistance: remaining,
    remainingContracted: remaining / s.gamma,
  };
}

/** Desglose de la diferencia de edad final entre gemelos por efecto. */
export function breakdown(trip: Trip, gravity: boolean) {
  const sum = { cruise: 0, accel: 0, stay: 0 };
  for (const p of trip.phases) {
    const d = p.t1 - p.t0 - (p.tau1 - p.tau0);
    if (p.kind === "cruise") sum.cruise += d;
    else if (p.kind === "stay") sum.stay += d;
    else sum.accel += d;
  }
  const earthGravity = gravity ? -trip.totalT * (1 - EARTH_CLOCK_RATE) : 0;
  return { ...sum, earthGravity, total: sum.cruise + sum.accel + sum.stay + earthGravity };
}
