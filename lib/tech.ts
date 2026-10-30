// Cómo avanza la tecnología en la Tierra con los años (especulativo, para la animación).

export interface Tech {
  level: 0 | 1 | 2 | 3 | 4;
  name: string;
  /** Dispositivo en el escritorio. */
  screen: "monitor" | "glass" | "hologram";
  /** Hay un robot asistente en casa. */
  robot: boolean;
  /** Vehículos que se ven por la ventana / en el horizonte. */
  vehicles: "cars" | "drones" | "flying" | "maglev";
  /** Altura relativa del horizonte urbano (0–1). */
  skyline: number;
}

export function techAt(year: number): Tech {
  if (year < 2045) return { level: 0, name: "Tecnología actual", screen: "monitor", robot: false, vehicles: "cars", skyline: 0.3 };
  if (year < 2070) return { level: 1, name: "Pantallas de vidrio y drones de reparto", screen: "glass", robot: false, vehicles: "drones", skyline: 0.45 };
  if (year < 2150) return { level: 2, name: "Hologramas, robots cuidadores y autos voladores", screen: "hologram", robot: true, vehicles: "flying", skyline: 0.65 };
  if (year < 3000) return { level: 3, name: "Megaciudades y trenes magnéticos aéreos", screen: "hologram", robot: true, vehicles: "maglev", skyline: 0.85 };
  return { level: 4, name: "Una civilización irreconocible", screen: "hologram", robot: true, vehicles: "maglev", skyline: 1 };
}
