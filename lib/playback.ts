/** El embarque es una secuencia de 16 s, con velocidad manual hasta 16×. */
export function boardingSpeed(rate: number, director: boolean): number {
  return director ? 1 : Math.max(0.25, Math.min(16, rate / 0.5));
}
