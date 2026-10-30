// Comunicaciones por luz entre la Tierra y la nave, y "datos freak" del viaje.
// Unidades: años, años luz, c = 1 (salvo donde se indica).

import { bioYears } from "./cryo";
import { START_AGE } from "./derive";
import { stateAt, type ShipState, type Trip } from "./relativity";

const C_KMS = 299_792.458;
const LY_KM = 9.4607e12;
const AU_PER_LY = 63_241;
const MEV_PROTON = 938.272;
const J_PER_MT = 4.184e15;
/** Masa supuesta de la nave Ranger con su etapa de propulsión (kg). */
export const SHIP_MASS_KG = 500_000;
/** Frecuencia de la radio de la misión: banda X del espacio profundo. */
export const RADIO_GHZ = 8.4;

export interface LightLink {
  /** Tiempo (años) que tarda la señal medido por quien la recibe, desde "ahora" en su reloj. */
  waitForReceiver: number;
  /** Tiempo de tránsito en el marco de la Tierra (años). */
  earthFrameDelay: number;
  /** Edad del receptor al recibirla. */
  receiverAge: number;
}

/**
 * Señal que la Tierra envía ahora (t, x = 0): alcanza a la nave cuando t_n − x_n = t.
 * Mientras la nave acelera alejándose, puede tardar muchísimo (horizonte de Rindler).
 */
export function earthToShip(trip: Trip, s: ShipState, hyper = false): LightLink {
  const target = s.t;
  const end = stateAt(trip, trip.totalTau);
  let tauR: number;
  let tR: number;
  if (end.t - end.x < target) {
    // Llega después del fin del viaje, con la nave ya en reposo.
    tR = target + end.x;
    tauR = trip.totalTau + (tR - end.t);
  } else {
    let lo = s.tau;
    let hi = trip.totalTau;
    for (let k = 0; k < 70; k++) {
      const mid = (lo + hi) / 2;
      const m = stateAt(trip, mid);
      if (m.t - m.x < target) lo = mid;
      else hi = mid;
    }
    tauR = hi;
    tR = stateAt(trip, hi).t;
  }
  return { waitForReceiver: tauR - s.tau, earthFrameDelay: tR - s.t, receiverAge: START_AGE + bioYears(trip, tauR, hyper) };
}

/** Señal que la nave envía ahora desde (t, x): llega a la Tierra en t + x. */
export function shipToEarth(s: ShipState, earthRate: number): LightLink {
  return { waitForReceiver: s.x * earthRate, earthFrameDelay: s.x, receiverAge: START_AGE + (s.t + s.x) * earthRate };
}

/** Magnitud aparente del Sol visto desde la nave (atrás), con el oscurecimiento Doppler. */
function sunMagnitude(xLy: number, phi: number) {
  const dAu = Math.max(1, xLy * AU_PER_LY);
  const D = Math.exp(-phi); // hacia atrás
  const x = 26_160 / 5_778;
  const dim = Math.expm1(x / D) / Math.expm1(x); // pérdida de brillo visible por corrimiento al rojo
  return -26.74 + 5 * Math.log10(dAu) + 2.5 * Math.log10(Math.max(1, dim));
}

export function freakFacts(trip: Trip, s: ShipState) {
  const beta = Math.abs(s.beta);
  const gamma = s.gamma;
  const phi = Math.acosh(Math.max(1, gamma));
  const keJ = (gamma - 1) * SHIP_MASS_KG * (C_KMS * 1000) ** 2;
  return {
    /** Velocidad propia γβ: años luz recorridos por cada año del reloj de a bordo. */
    properSpeed: gamma * beta,
    speedKms: beta * C_KMS,
    /** Energía cinética de la nave en megatones de TNT. */
    kineticMt: keJ / J_PER_MT,
    /** Energía con que choca cada átomo de hidrógeno interestelar (MeV). */
    protonMeV: (gamma - 1) * MEV_PROTON,
    /** Átomos que golpean cada cm² por segundo (densidad interestelar ~1 átomo/cm³). */
    hitsPerCm2s: gamma * beta * C_KMS * 1e5,
    /** Temperatura de la radiación de fondo vista justo adelante (K). */
    cmbAheadK: 2.725 * Math.exp(phi),
    sunMagnitude: sunMagnitude(Math.max(1e-9, s.x), phi),
    /** Distancia a la Tierra en km y en horas luz. */
    distanceKm: s.x * LY_KM,
    lightHours: s.x * 365.25 * 24,
    /** Frecuencias de radio recibidas para una emisión de 8,4 GHz. */
    radioAtShipGHz: RADIO_GHZ * (s.phase.kind === "stay" ? 1 / trip.stayRate : gamma * (1 - s.beta)),
    radioAtEarthGHz: RADIO_GHZ / (gamma * (1 + s.beta)),
    gamma,
  };
}

/** Latidos acumulados a 70 por minuto. */
export const heartbeats = (years: number) => years * 365.25 * 24 * 60 * 70;

/** Tiempo de la nave en que le llega la luz emitida desde la Tierra en el instante terrestre `tEmit`. */
export function arrivalTau(trip: Trip, tEmit: number) {
  const end = stateAt(trip, trip.totalTau);
  if (end.t - end.x < tEmit) return trip.totalTau + (tEmit + end.x - end.t);
  let lo = 0;
  let hi = trip.totalTau;
  for (let k = 0; k < 70; k++) {
    const mid = (lo + hi) / 2;
    const m = stateAt(trip, mid);
    if (m.t - m.x < tEmit) lo = mid;
    else hi = mid;
  }
  return hi;
}
