// Dilatación temporal gravitacional (Relatividad General, campo débil y Schwarzschild).

export const G = 6.674e-11; // m³ kg⁻¹ s⁻²
export const C = 299_792_458; // m/s
export const M_SUN = 1.989e30; // kg
export const M_EARTH = 5.972e24; // kg
export const R_EARTH = 6.371e6; // m
export const AU = 1.496e11; // m
export const V_EARTH_ORBIT = 29_780; // m/s

/** Masa del agujero negro central de Andrómeda (M31*), en masas solares. */
export const M31_BH_MASSES = 1.4e8;

/** Potencial adimensional GM/(rc²). */
export const potential = (mass: number, r: number) => (G * mass) / (r * C * C);

/** Radio de Schwarzschild r_s = 2GM/c² en metros. */
export const schwarzschildRadius = (mass: number) => (2 * G * mass) / (C * C);

/** Ritmo de un reloj estático a r = k·r_s respecto a uno lejano: √(1 − r_s/r). */
export const schwarzschildRate = (k: number) => Math.sqrt(Math.max(0, 1 - 1 / k));

/** Contribuciones (fraccionales) que hacen que un reloj en la superficie terrestre atrase respecto al espacio profundo. */
export const EARTH_CLOCK_SHIFTS = {
  earthSurface: potential(M_EARTH, R_EARTH), // ~6,96e-10
  sunAt1AU: potential(M_SUN, AU), // ~9,87e-9
  orbitalSpeed: (V_EARTH_ORBIT * V_EARTH_ORBIT) / (2 * C * C), // ~4,93e-9 (efecto de velocidad de RE)
};

export const EARTH_CLOCK_DEFICIT =
  EARTH_CLOCK_SHIFTS.earthSurface + EARTH_CLOCK_SHIFTS.sunAt1AU + EARTH_CLOCK_SHIFTS.orbitalSpeed;

/** Ritmo del reloj del gemelo terrestre respecto al tiempo del espacio profundo. */
export const EARTH_CLOCK_RATE = 1 - EARTH_CLOCK_DEFICIT;

/** Ejemplo GPS: microsegundos por día que se adelantan los relojes en órbita (h ≈ 20.200 km). */
export function gpsMicrosecondsPerDay() {
  const rOrbit = R_EARTH + 20_200e3;
  const grav = potential(M_EARTH, R_EARTH) - potential(M_EARTH, rOrbit);
  const v = Math.sqrt((G * M_EARTH) / rOrbit);
  const vel = (v * v) / (2 * C * C);
  const day = 86_400e6;
  return { grav: grav * day, vel: -vel * day, net: (grav - vel) * day };
}
