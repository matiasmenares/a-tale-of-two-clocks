// Vida cotidiana de cada hermano: agenda diaria, aspecto según la edad y épocas de la Tierra.

export const LAUNCH_YEAR = 2030;
export const EARTH_NAME = "Martín";
export const SHIP_NAME = "Tomás";

export type Pose =
  | "stand" | "walk" | "run" | "sit" | "type" | "eat" | "sleep" | "wave" | "lookUp" | "float" | "kneel" | "mourn"
  | "exercise" | "reach" | "water" | "guitar" | "violin" | "read" | "offer";

/** Objeto que lleva en la mano. */
export type Prop = "book" | "mug" | "can" | "tool" | "camera" | "guitar" | "violin" | "tablet" | "rock" | "flag";

export interface Activity {
  label: string;
  pose: Pose;
  prop?: Prop;
  /** Lugar dentro de la escena (0–1 en horizontal). */
  place: number;
}

/** Hora del día (0–24) a partir del tiempo propio en años; el despegue es a las 9:00. */
export const hourOfDay = (years: number) => (((years * 365.25 + 9 / 24) % 1) + 1) % 1 * 24;

export const EARTH_PLACES = { bed: 0.12, table: 0.36, desk: 0.6, window: 0.84, armchair: 0.46, plant: 0.925, center: 0.5 };
export const SHIP_PLACES = { bunk: 0.1, table: 0.32, treadmill: 0.52, console: 0.75, window: 0.88, hydro: 0.43, repair: 0.44, gym: 0.45 };

/** Calendario a partir del tiempo propio: el despegue es el 1 de enero a las 9:00 (un martes). */
export function calendar(years: number) {
  const days = years * 365.25 + 9 / 24;
  const dayIndex = Math.floor(days);
  return { dayIndex, dayOfYear: ((days % 365.25) + 365.25) % 365.25, weekday: (dayIndex + 2) % 7 };
}
/** Mascotas de Martín: dos perros y un gato, cada uno en una etapa de su vida (años desde el despegue). */
export const PETS = [
  { kind: "dog" as const, name: "Toby", from: 3, to: 15, color: "#a16207" },
  { kind: "cat" as const, name: "Mishi", from: 16, to: 33, color: "#9ca3af" },
  { kind: "dog" as const, name: "Luna", from: 28, to: 41, color: "#1c1917" },
];
export type Pet = (typeof PETS)[number];

export const DOG_PERIODS = PETS.filter((p) => p.kind === "dog");
export function dogAt(years: number) {
  const p = DOG_PERIODS.find((d) => years >= d.from && years < d.to);
  return p ? { ...p, life: years - p.from, left: p.to - years } : null;
}
export function catAt(years: number) {
  const p = PETS.find((d) => d.kind === "cat" && years >= d.from && years < d.to);
  return p ? { ...p, life: years - p.from, left: p.to - years } : null;
}
/** Mascotas que ya murieron: sus cenizas quedan en urnas en el estante. */
export const petUrns = (years: number) => PETS.filter((p) => years >= p.to);
/** Mascota que murió hace menos de un mes (Martín está triste). */
export const recentPetLoss = (years: number) => PETS.find((p) => years >= p.to && years - p.to < 30 / 365.25) ?? null;

export type Season = "verano" | "otoño" | "invierno" | "primavera";
/** Estación del año en el hemisferio sur. */
export function season(dayOfYear: number): Season {
  if (dayOfYear < 59 || dayOfYear >= 335) return "verano";
  if (dayOfYear < 152) return "otoño";
  if (dayOfYear < 244) return "invierno";
  return "primavera";
}
export const SEASON_ICON: Record<Season, string> = { verano: "☀️", otoño: "🍂", invierno: "❄️", primavera: "🌸" };

/** Horas de práctica acumuladas con el instrumento. */
export function practiceHours(who: "earth" | "ship", years: number) {
  if (who === "ship") return Math.max(0, years) * 365.25; // 1 h de violín al día
  const retireAt = 67 - 30;
  const working = Math.min(years, retireAt);
  return Math.max(0, working * 365.25 * (2 / 7) * 2 + Math.max(0, years - retireAt) * 365.25 * 2);
}
/** Habilidad musical (0–1) y su nivel. */
export function musicSkill(hours: number) {
  const skill = 1 - Math.exp(-hours / 1_500);
  const level = skill < 0.2 ? "principiante" : skill < 0.5 ? "intermedio" : skill < 0.8 ? "avanzado" : "virtuoso";
  return { skill, level };
}

const SATURDAY = 6;
const SUNDAY = 0;

function earthSchedule(hour: number, age: number, years: number): Activity {
  const { weekday } = calendar(years);
  const weekend = weekday === SATURDAY || weekday === SUNDAY;
  const retired = age >= 67;
  const free = retired || weekend;
  if (hour < 7 || hour >= 23) return { label: "Durmiendo", pose: "sleep", place: EARTH_PLACES.bed };
  if (hour < 7.5)
    return age < 60
      ? { label: "Gimnasia matinal", pose: "exercise", place: EARTH_PLACES.center }
      : { label: "Estirándose despacio", pose: "reach", place: EARTH_PLACES.center };
  if (hour < 8.3) return { label: "Desayunando con café", pose: "eat", prop: "mug", place: EARTH_PLACES.table };
  if (hour < 8.7) return { label: "Regando las plantas", pose: "water", prop: "can", place: EARTH_PLACES.plant };
  if (hour < 13) {
    if (!free) return { label: "Trabajando", pose: "type", place: EARTH_PLACES.desk };
    if (weekday === SUNDAY && age >= 55) return { label: "Visita de la familia", pose: "wave", place: EARTH_PLACES.center };
    return { label: "Leyendo un libro", pose: "read", prop: "book", place: EARTH_PLACES.armchair };
  }
  if (hour < 14) return { label: "Almorzando", pose: "eat", place: EARTH_PLACES.table };
  // De joven, el PC también es para jugar: los fines de semana después de almorzar y algunas noches.
  const gamer = age < 45;
  if (hour < 16)
    return free
      ? gamer && weekend
        ? { label: "Jugando en el PC", pose: "type", place: EARTH_PLACES.desk }
        : { label: "Siesta en el sillón", pose: "sit", place: EARTH_PLACES.armchair }
      : { label: "Trabajando", pose: "type", place: EARTH_PLACES.desk };
  if (hour < 18) return free ? { label: "Tocando la guitarra", pose: "guitar", prop: "guitar", place: EARTH_PLACES.armchair } : { label: "Trabajando", pose: "type", place: EARTH_PLACES.desk };
  if (hour < 19.5) {
    const dog = dogAt(years) !== null;
    const label = age >= 75 ? "Paseo lento con bastón" : dog ? "Paseando con el perro" : "Saliendo a caminar";
    return { label: dog && age >= 75 ? `${label} y el perro` : label, pose: "walk", place: EARTH_PLACES.center };
  }
  if (hour < 20.5) return { label: "Cenando", pose: "eat", place: EARTH_PLACES.table };
  if (hour < 22)
    return gamer && weekday % 2 === 1
      ? { label: "Jugando en el PC", pose: "type", place: EARTH_PLACES.desk }
      : { label: "Mirando el cielo hacia su hermano", pose: "lookUp", place: EARTH_PLACES.window };
  return { label: "Grabando un mensaje para Tomás", pose: "type", place: EARTH_PLACES.desk };
}

function shipSchedule(hour: number, years: number): Activity {
  const { weekday } = calendar(years);
  if (hour < 7 || hour >= 23) return { label: "Durmiendo en la litera", pose: "sleep", place: SHIP_PLACES.bunk };
  if (hour < 8) return { label: "Desayuno liofilizado y café", pose: "eat", prop: "mug", place: SHIP_PLACES.table };
  if (hour < 10) return { label: "Revisando navegación y motores", pose: "type", place: SHIP_PLACES.console };
  if (hour < 11) return { label: "Cuidando el huerto hidropónico", pose: "reach", place: SHIP_PLACES.hydro };
  if (hour < 12)
    return weekday % 2 === 0
      ? { label: "Reparando un panel", pose: "kneel", prop: "tool", place: SHIP_PLACES.repair }
      : { label: "Revisando navegación y motores", pose: "type", place: SHIP_PLACES.console };
  if (hour < 13) return { label: "Almorzando", pose: "eat", place: SHIP_PLACES.table };
  if (hour < 14.5) return { label: "Ejercicio en la cinta (1 g)", pose: "run", place: SHIP_PLACES.treadmill };
  if (hour < 15.2) return { label: "Ejercicios de fuerza", pose: "exercise", place: SHIP_PLACES.gym };
  if (hour < 18) return { label: "Experimentos y mantenimiento", pose: "type", place: SHIP_PLACES.console };
  if (hour < 19) return { label: "Cenando", pose: "eat", place: SHIP_PLACES.table };
  if (hour < 20) return { label: "Fotografiando las estrellas", pose: "stand", prop: "camera", place: SHIP_PLACES.window };
  if (hour < 21) return { label: "Tocando el violín", pose: "violin", prop: "violin", place: SHIP_PLACES.table };
  return { label: "Leyendo mensajes de la Tierra", pose: "read", prop: "tablet", place: SHIP_PLACES.table };
}

/**
 * Qué hace Tomás en la superficie de un planeta o luna. `day` son los días desde el aterrizaje.
 * Lugares: 0–1 en horizontal; la Ranger aterrizada está en 0.78.
 */
export function surfaceActivity(hour: number, day: number): Activity & { inside?: boolean } {
  if (hour < 7 || hour >= 21) return { label: "Descansando dentro de la Ranger", pose: "stand", place: 0.78, inside: true };
  if (day < 1 && hour < 10) return { label: "Plantando la bandera de la misión", pose: "kneel", prop: "flag", place: 0.62 };
  if (hour < 10) return { label: "Explorando la superficie", pose: "walk", place: 0.4 };
  if (hour < 12) return { label: "Recogiendo rocas", pose: "kneel", prop: "rock", place: 0.3 };
  if (hour < 13) return { label: "Almorzando en la Ranger", pose: "stand", place: 0.78, inside: true };
  if (hour < 16) return { label: "Fotografiando el paisaje", pose: "stand", prop: "camera", place: 0.48 };
  if (hour < 19) return { label: "Mirando el cielo", pose: "lookUp", place: 0.5 };
  return { label: "Volviendo a la Ranger", pose: "walk", place: 0.4 };
}

/**
 * Actividad actual. Si cambió hace poco de lugar, camina desde el lugar anterior.
 * `years` es el tiempo propio del hermano.
 */
export function activityAt(who: "earth" | "ship", years: number, age: number): Activity & { walkingFrom?: number; walkT?: number } {
  const hour = hourOfDay(years);
  const sched = (h: number) => (who === "earth" ? earthSchedule(h, age, years) : shipSchedule(h, years));
  const now = sched(hour);
  const before = sched((hour - 0.2 + 24) % 24);
  if (before.place !== now.place) {
    // Cuándo empezó esta actividad (en minutos, de forma continua) para animar el traslado de 10 minutos.
    const same = (m: number) => sched((hour - m / 60 + 24) % 24).place === now.place;
    let lo = 0;
    while (lo < 12 && same(lo + 1)) lo++;
    let hi = lo + 1;
    for (let k = 0; k < 14; k++) {
      const mid = (lo + hi) / 2;
      if (same(mid)) lo = mid;
      else hi = mid;
    }
    if (lo < 10) return { ...now, pose: "walk", walkingFrom: before.place, walkT: lo / 10 };
  }
  return now;
}

/** Rasgos visuales según la edad. */
export function looks(age: number) {
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  const grey = clamp((age - 42) / 30);
  const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
  const hair = `rgb(${lerp(58, 228, grey)},${lerp(38, 228, grey)},${lerp(24, 232, grey)})`;
  return {
    hair,
    /** 0 = pelo completo, 1 = muy despejado. */
    balding: clamp((age - 48) / 35),
    wrinkles: clamp((age - 38) / 40),
    glasses: age >= 50,
    cane: age >= 76,
    /** Encorvamiento (grados). */
    stoop: clamp((age - 66) / 24) * 16,
    belly: clamp((age - 40) / 25) * 3 - clamp((age - 75) / 15) * 2,
    skin: `rgb(${lerp(236, 222, clamp((age - 30) / 60))},${lerp(196, 190, clamp((age - 30) / 60))},${lerp(160, 168, clamp((age - 30) / 60))})`,
    /** Lentitud de movimientos (multiplica la frecuencia de los gestos). */
    vigor: 1 - clamp((age - 60) / 40) * 0.6,
  };
}

export interface Epoch {
  key: "life" | "grave" | "future" | "ice" | "deep" | "warming" | "boiled" | "redgiant" | "whitedwarf";
  title: string;
  note: string;
}

/** Qué se ve en la Tierra según los años transcurridos desde el despegue (incluido el destino del Sol). */
export function earthEpoch(t: number, deathT: number): Epoch {
  const year = LAUNCH_YEAR + Math.floor(t);
  const title = `Año ${fmtYear(year)}`;
  const merged = t >= 4.5e9 ? " Andrómeda ya chocó con la Vía Láctea: el cielo nocturno es una galaxia gigante." : "";
  if (t < deathT) return { key: "life", title, note: "" };
  if (t < deathT + 300)
    return {
      key: "grave",
      title,
      note:
        t - deathT < 10
          ? `${EARTH_NAME} murió en ${LAUNCH_YEAR + Math.floor(deathT)}. Su familia le lleva flores, cada vez menos seguido.`
          : `Ya nadie visita a ${EARTH_NAME}: su tumba quedó olvidada y se deteriora.`,
    };
  if (t < 12_000) return { key: "future", title, note: "La civilización sigue sin él: ciudades que nadie de 2030 reconocería." };
  if (t < 600_000)
    return { key: "ice", title, note: "Pasan eras glaciales (ciclos de ~100.000 años). Las constelaciones se deforman lentamente." };
  if (t < 1e8) return { key: "deep", title, note: "Millones de años: costas, especies y el cielo nocturno son otros. El Sol sigue igual." };
  if (t < 1e9)
    return {
      key: "warming",
      title,
      note: "El Sol brilla cada vez más (≈1 % cada 100 millones de años) y los continentes se juntan en un supercontinente.",
    };
  if (t < 4.5e9)
    return { key: "boiled", title, note: "El Sol, más brillante, evaporó los océanos: la Tierra es un desierto ardiente." + merged };
  if (t < 7.6e9)
    return {
      key: "redgiant",
      title,
      note: "El Sol se hinchó como gigante roja y ocupa medio cielo: la superficie de la Tierra es lava." + merged,
    };
  return {
    key: "whitedwarf",
    title,
    note: "La gigante roja probablemente engulló a la Tierra. Del Sol queda una enana blanca dentro de una nebulosa planetaria." + merged,
  };
}

/** Intensidad de glaciación (0–1) para la época de eras glaciales. */
export const iceLevel = (t: number) => Math.max(0, Math.sin((t / 100_000) * Math.PI * 2 - 1)) ** 2;

export const fmtYear = (y: number) => (y < 10_000 ? String(y) : new Intl.NumberFormat("es-CL").format(y));
