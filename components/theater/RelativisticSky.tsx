"use client";

import type { PlanetInfo } from "@/lib/relativity";
import { useEffect, useRef } from "react";

export interface SkyProps {
  /** Rapidez φ = atanh(|β|). */
  phi: number;
  /** Distancia que falta hasta lo que hay adelante (al). */
  aheadDistance: number;
  /** Altitud sobre la Tierra en km (para el cielo azul del despegue). */
  altitudeKm: number;
  aheadKind: "star" | "cluster" | "galaxy" | "sun" | "planet";
  /** Planeta de destino (viajes dentro del sistema solar). */
  planet?: PlanetInfo;
  blackHole: boolean;
  /** Densidad de estrellas de fondo (0–1): fuera de la galaxia casi no hay. */
  starDensity: number;
  /** Temperatura real de lo que hay adelante (K). */
  aheadTemp?: number;
  /** Dibujar guías y rótulos explicativos (vista grande). */
  guides?: boolean;
}

/** Longitud de onda visible (550 nm) en kelvin: hc/(λk). */
const X_VIS = 26_160;
/** La ventana muestra el cielo completo: centro = adelante, borde = atrás (proyección equidistante). */
const FOV = Math.PI;

/** Color aproximado de un cuerpo negro (algoritmo de Tanner Helland). */
export function blackbody(T: number): [number, number, number] {
  const t = Math.min(40_000, Math.max(1_000, T)) / 100;
  const r = t <= 66 ? 255 : 329.7 * (t - 60) ** -0.1332;
  const g = t <= 66 ? 99.47 * Math.log(t) - 161.1 : 288.1 * (t - 60) ** -0.0755;
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5 * Math.log(t - 10) - 305;
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v)));
  return [c(r), c(g), c(b)];
}

/**
 * Gargantúa en la ventana: sombra, anillo de fotones, la parte de atrás del disco curvada por la lente
 * gravitacional y el disco delantero más brillante del lado que se acerca (Doppler).
 */
function drawBlackHole(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.07);
  const glow = ctx.createRadialGradient(0, 0, r, 0, 0, r * 5);
  glow.addColorStop(0, "rgba(253,230,138,0.45)");
  glow.addColorStop(0.4, "rgba(245,158,11,0.15)");
  glow.addColorStop(1, "rgba(245,158,11,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 5, 0, Math.PI * 2);
  ctx.fill();
  const beam = (w: number) => {
    const g = ctx.createLinearGradient(-w, 0, w, 0);
    g.addColorStop(0, "rgba(255,247,237,0.2)");
    g.addColorStop(0.12, "#fefce8");
    g.addColorStop(0.4, "#fde68a");
    g.addColorStop(0.62, "#f59e0b");
    g.addColorStop(0.88, "#9a3412");
    g.addColorStop(1, "rgba(124,45,18,0.2)");
    return g;
  };
  // Parte de atrás del disco, desviada por arriba (gruesa) y por abajo (fina).
  ctx.lineCap = "round";
  ctx.strokeStyle = beam(r * 1.6);
  ctx.lineWidth = r * 0.42;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.55, r * 1.5, 0, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = r * 0.14;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.3, r * 1.2, 0, 0, Math.PI);
  ctx.stroke();
  // Anillo de fotones y sombra.
  ctx.strokeStyle = "rgba(255,247,237,0.95)";
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.06, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  // Disco delantero casi de canto, con grumos que giran.
  ctx.fillStyle = beam(r * 4.2);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 4.2, r * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = Math.max(0.6, r * 0.03);
  ctx.setLineDash([r * 0.9, r * 0.4]);
  ctx.lineDashOffset = -t * r * 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 3.4, r * 0.09, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

interface Star {
  theta: number; // ángulo respecto a la dirección de avance (marco en reposo)
  az: number;
  T: number;
  mag: number;
}

function makeStars(n: number): Star[] {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, () => ({
    theta: Math.acos(1 - 2 * rnd()),
    az: rnd() * Math.PI * 2,
    T: 3_000 + rnd() ** 2 * 12_000,
    mag: 0.15 + rnd() ** 3 * 0.85,
  }));
}

/**
 * Vista frontal desde la nave. Aberración: tan(θ'/2) = e^{-φ}·tan(θ/2).
 * Doppler: D = cos²(θ/2)·e^{φ} + sin²(θ/2)·e^{-φ}. Brillo visible ∝ (e^x − 1)/(e^{x/D} − 1).
 */
export function RelativisticSky(props: SkyProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef(props);
  live.current = props;

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const stars = makeStars(1400);
    let raf = 0;
    const draw = () => {
      const { phi, aheadDistance, altitudeKm, aheadKind, blackHole, starDensity, planet, aheadTemp, guides } = live.current;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const dpr = devicePixelRatio || 1;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.max(cx, cy) * 1.02;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      const eP = Math.exp(phi);
      const eM = Math.exp(-phi);
      // Escala radial que amplía el centro (r ∝ √θ'): solo cambia el dibujo, no la física.
      const radius = (tp: number) => Math.sqrt(tp / FOV) * R;
      const project = (theta: number, az: number) => {
        const tp = 2 * Math.atan(eM * Math.tan(theta / 2));
        if (tp > FOV) return null;
        const r = radius(tp);
        return [cx + r * Math.cos(az), cy + r * Math.sin(az), tp] as const;
      };
      const doppler = (theta: number) => {
        const c = Math.cos(theta / 2) ** 2;
        return c * eP + (1 - c) * eM;
      };

      // Radiación de fondo de microondas: con γ ≳ 1000 se corre al visible justo adelante.
      if (phi > 5) {
        for (let i = 40; i >= 1; i--) {
          const tp = (i / 40) * FOV * 0.25;
          const theta = 2 * Math.atan(eP * Math.tan(tp / 2));
          const T = 2.725 * doppler(theta);
          const I = 1 / Math.expm1(X_VIS / T);
          if (I < 1e-4) continue;
          const [r, g, b] = blackbody(T);
          ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, I * 30)})`;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1.5, radius(tp)), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const n = Math.floor(stars.length * starDensity);
      for (let i = 0; i < n; i++) {
        const s = stars[i];
        const p = project(s.theta, s.az);
        if (!p) continue;
        const D = doppler(s.theta);
        const x = X_VIS / s.T;
        // Radiancia visible: un cuerpo negro a T se ve como uno a D·T. Flujo de una estrella puntual:
        // la aberración achica su tamaño aparente (ángulo sólido ÷ D²), por eso el factor 1/D².
        const bright = (s.mag * Math.expm1(x)) / Math.expm1(x / D) / (D * D);
        if (bright < 0.03) continue;
        const [r, g, b] = blackbody(s.T * D);
        const a = Math.min(1, bright);
        const size = Math.min(2.6, 0.6 + Math.sqrt(bright) * 0.7);
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
        ctx.beginPath();
        ctx.arc(p[0], p[1], size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ángulo aparente donde D = 1: dentro, luz corrida al azul; fuera, al rojo.
      if (phi > 0.05) {
        const c2 = (1 - eM) / (eP - eM);
        const theta = 2 * Math.acos(Math.sqrt(Math.min(1, c2)));
        const tp = 2 * Math.atan(eM * Math.tan(theta / 2));
        const r = radius(tp);
        ctx.setLineDash([4, 5]);
        ctx.strokeStyle = "rgba(226,232,240,0.45)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Objeto de destino justo adelante (θ = 0): su luz llega con D = e^{φ}.
      const D0 = eP;
      const near = 1 / Math.max(1e-6, aheadDistance);
      if (blackHole) {
        // Crece a medida que la nave se acerca; en órbita ocupa buena parte de la ventana.
        const rr = Math.min(R * 0.2, Math.max(4, (R * 0.004) / Math.max(1e-6, aheadDistance)));
        drawBlackHole(ctx, cx, cy, rr, performance.now() / 1000);
      } else if (aheadKind === "planet" && planet) {
        // El planeta crece en la ventana según su tamaño angular real (diámetro / distancia).
        const ang = planet.diameterKm / 9.4607e12 / Math.max(1e-12, aheadDistance);
        const rr = Math.min(R * 0.48, Math.max(2.5, radius(Math.min(FOV, ang / 2))));
        const colors: Record<PlanetInfo["parent"], [string, string]> = {
          mars: ["#c2410c", "#fdba74"],
          jupiter: ["#d6a46a", "#b45309"],
          saturn: ["#eab308", "#fde68a"],
          neptune: ["#3b82f6", "#93c5fd"],
        };
        const [base, accent] = colors[planet.parent];
        if (planet.parent === "saturn") {
          ctx.strokeStyle = "#fde68a";
          ctx.lineWidth = Math.max(1, rr * 0.18);
          ctx.beginPath();
          ctx.ellipse(cx, cy, rr * 2.1, rr * 0.45, -0.25, 0, Math.PI * 2);
          ctx.stroke();
        }
        const grad = ctx.createRadialGradient(cx - rr * 0.35, cy - rr * 0.35, rr * 0.1, cx, cy, rr);
        grad.addColorStop(0, accent);
        grad.addColorStop(1, base);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.fill();
        if (planet.parent === "jupiter" && rr > 6) {
          ctx.fillStyle = "rgba(146,64,14,0.45)";
          for (let k = -2; k <= 2; k++) ctx.fillRect(cx - rr, cy + k * rr * 0.32, rr * 2, rr * 0.12);
        }
      } else {
        const T = aheadTemp ?? (aheadKind === "sun" ? 5_772 : aheadKind === "galaxy" ? 6_000 : 9_000);
        const x = X_VIS / T;
        const boost = Math.expm1(x) / Math.expm1(x / D0);
        const angular = aheadKind === "galaxy" ? Math.min(0.9, 60_000 * near) : Math.min(0.5, 0.004 * near);
        const glow = Math.min(h * 0.45, 3 + Math.log10(1 + near * 50) * 8 + Math.log10(1 + boost) * 4 + angular * R * 2);
        const [r, g, b] = blackbody(T * D0);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glow);
        grad.addColorStop(0, `rgba(255,255,255,1)`);
        grad.addColorStop(0.15, `rgba(${r},${g},${b},0.9)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        if (aheadKind === "galaxy") {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(-0.4);
          ctx.scale(1, 0.35);
          ctx.beginPath();
          ctx.arc(0, 0, glow * 1.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(cx, cy, glow, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Guías (vista grande): el horizonte de 90° del marco en reposo y los rótulos adelante/atrás.
      if (guides) {
        ctx.font = "12px ui-sans-serif, system-ui";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(226,232,240,0.75)";
        ctx.fillText("adelante", cx, cy + Math.min(60, R * 0.12) + 14);
        ctx.fillText("atrás (borde)", cx, cy + R * 0.97 - 8 > h ? h - 10 : cy + R * 0.97 - 8);
        const side = 2 * Math.atan(eM); // donde aparece lo que en reposo estaba a 90°, al costado
        const rs = radius(side);
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = "rgba(103,232,249,0.7)";
        ctx.beginPath();
        ctx.arc(cx, cy, rs, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(103,232,249,0.9)";
        ctx.fillText("lo que estaba al costado", cx, cy - rs - 6);
      }

      // Atmósfera terrestre durante el despegue.
      const air = Math.max(0, 1 - altitudeKm / 90);
      if (air > 0) {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, `rgba(56,140,230,${air})`);
        grad.addColorStop(1, `rgba(186,230,253,${air})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="h-full w-full" />;
}
