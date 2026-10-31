/** El regreso terrestre dura 25 minutos simulados después de que la nave alcanza 100 km. */
export function earthDeparture(seconds: number, accelG: number, instant = false) {
  const spaceAt = instant ? 0 : Math.sqrt(2 * 100_000 / (Math.max(0.001, accelG) * 9.80665) + (100_000 / 299_792_458) ** 2);
  const progress = Math.max(0, Math.min(1, (seconds - spaceAt) / 1500));
  const setting = seconds < spaceAt ? "launch" : progress < 1 ? "return" : "home";
  const label = progress < 0.9 ? "Conduciendo a casa" : progress < 0.94 ? "Estacionando frente a casa" : "Bajando del auto y entrando a casa";
  return { setting, progress, label, spaceAt } as const;
}

/** La cámara acompaña el viaje; la casa solo entra en cuadro al final del recorrido. */
export function returnJourney(progress: number) {
  const drive = Math.max(0, Math.min(1, progress / 0.9));
  const travelled = drive * drive * (3 - 2 * drive) * 8335;
  const carWorldX = 235 + travelled;
  const cameraX = Math.max(0, Math.min(8000, carWorldX - 320));
  const walk = Math.max(0, Math.min(1, (progress - 0.95) / 0.05));
  return { travelled, cameraX, carX: carWorldX - cameraX, walk };
}
