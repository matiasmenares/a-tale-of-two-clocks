import type { Sim } from "@/hooks/useSimulation";
import type { SkyProps } from "./RelativisticSky";

const LY_KM = 9.4607e12;
/** Temperatura del Sol (K): es lo que queda adelante en el viaje de regreso. */
export const SUN_TEMP = 5_772;

/** Lo que se ve por la ventana de la nave en este momento (la misma vista en la cabina y en el modal). */
export function shipSky(sim: Sim): SkyProps {
  const { ship, trip, stage, destination } = sim;
  const flying = stage === "flight" || stage === "done";
  const D = trip.params.distance;
  const outbound = ship.phase.leg === "ida";
  // En órbita del agujero negro está "encima" de él.
  const aheadDistance = stage === "done" ? 1e-6 : outbound && ship.phase.kind !== "stay" ? D - ship.x : outbound ? 1e-4 : ship.x;
  const farFromGalaxy = D > 30_000 && Math.min(ship.x, D - ship.x) > 30_000;
  return {
    phi: flying && stage !== "done" ? Math.acosh(Math.max(1, ship.gamma)) : 0,
    aheadDistance: Math.max(1e-6, aheadDistance),
    altitudeKm: flying ? ship.x * LY_KM : 0,
    aheadKind: outbound ? (destination.kind === "custom" || destination.kind === "blackhole" ? "star" : destination.kind) : "sun",
    planet: outbound ? destination.planet : undefined,
    blackHole: (ship.phase.kind === "stay" && stage === "flight") || (outbound && destination.kind === "blackhole" && stage === "flight"),
    starDensity: farFromGalaxy ? 0.06 : 1,
    aheadTemp: outbound ? destination.tempK : SUN_TEMP,
  };
}
