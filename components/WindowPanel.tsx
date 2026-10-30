"use client";

import type { Sim } from "@/hooks/useSimulation";
import { formatBeta, formatLy, fmt } from "@/lib/format";
import { SHIP_NAME } from "@/lib/life";
import { useState } from "react";
import { blackbody, RelativisticSky } from "./theater/RelativisticSky";
import { shipSky, SUN_TEMP } from "./theater/shipSky";

/** Muestra de color de un cuerpo negro a temperatura T (lo que vería el ojo). */
function Swatch({ T }: { T: number }) {
  const [r, g, b] = blackbody(T);
  return <span className="inline-block h-3 w-3 rounded-full border border-white/20 align-middle" style={{ background: `rgb(${r},${g},${b})` }} />;
}

/** Cómo percibe el ojo una fuente cuyo cuerpo negro quedó a temperatura T. */
function eyeNote(T: number) {
  if (T < 1_500) return "casi toda su luz pasó al infrarrojo: el ojo apenas la ve";
  if (T < 3_500) return "rojiza";
  if (T < 5_000) return "anaranjada";
  if (T < 7_000) return "blanca amarillenta";
  if (T < 12_000) return "blanca azulada";
  if (T < 40_000) return "azul intensa";
  return "su luz se corrió al ultravioleta y a los rayos X; en el visible solo queda un brillo azul blanquecino";
}

const fmtK = (T: number) => (T >= 1e6 ? `${fmt(T / 1e6, 1)} millones de K` : T < 10 ? `${fmt(T, T < 1 ? 3 : 2)} K` : `${fmt(T, 0)} K`);

/** Mirar por la ventana de la nave: el cielo con aberración y Doppler, comparado con el cielo en reposo. */
export function WindowPanel({ sim }: { sim: Sim }) {
  const [compare, setCompare] = useState(false);
  const sky = shipSky(sim);
  const { phi } = sky;
  const beta = Math.tanh(phi);
  const gamma = Math.cosh(phi);
  const Dfront = Math.exp(phi);
  const Dback = Math.exp(-phi);
  const sideDeg = (2 * Math.atan(Math.exp(-phi)) * 180) / Math.PI;
  const T0 = sky.aheadTemp ?? 6_000;
  const aheadName = sim.ship.phase.leg === "ida" ? sim.destination.name : "el Sol";
  const behindName = sim.ship.phase.leg === "ida" ? "el Sol" : sim.destination.name;
  const Tbehind = sim.ship.phase.leg === "ida" ? SUN_TEMP : (sim.destination.tempK ?? 6_000);
  const moving = phi > 0.005;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-300">
          {moving ? (
            <>
              {SHIP_NAME} viaja a <b className="text-cyan-200">{formatBeta(beta)}</b> (γ = {fmt(gamma, gamma < 10 ? 3 : 1)}). El centro es <b>adelante</b> y el borde es <b>atrás</b>: se ve el cielo completo.
            </>
          ) : (
            <>La nave está en reposo: el cielo se ve normal. Prueba durante el crucero para ver la aberración y el Doppler.</>
          )}
        </p>
        <button
          onClick={() => setCompare((c) => !c)}
          className={`rounded-full border px-3 py-1 text-xs transition ${compare ? "border-cyan-300 bg-cyan-400/15 text-cyan-100" : "border-white/15 text-slate-300 hover:border-white/40"}`}
        >
          {compare ? "Ocultar el cielo en reposo" : "Comparar con el cielo en reposo"}
        </button>
      </div>

      <div className={`grid gap-4 ${compare ? "md:grid-cols-2" : ""}`}>
        <figure>
          <div className={`mx-auto aspect-square w-full overflow-hidden rounded-full border-[10px] border-slate-300/80 ${compare ? "max-w-[24rem]" : "max-w-[34rem]"}`}>
            <RelativisticSky {...sky} guides />
          </div>
          <figcaption className="mt-1 text-center text-xs text-slate-400">Lo que ve {SHIP_NAME} a esta velocidad</figcaption>
        </figure>
        {compare && (
          <figure>
            <div className="mx-auto aspect-square w-full max-w-[24rem] overflow-hidden rounded-full border-[10px] border-slate-600/80">
              <RelativisticSky {...sky} phi={0} guides />
            </div>
            <figcaption className="mt-1 text-center text-xs text-slate-400">El mismo cielo si la nave estuviera quieta en este lugar</figcaption>
          </figure>
        )}
      </div>

      <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="hud-label mb-1 text-cyan-300">Aberración: el cielo se amontona adelante</div>
          {moving ? (
            <p>
              La luz que llega de los costados entra «inclinada» por el movimiento (como la lluvia en el parabrisas). Todo lo que en reposo estaba en la mitad delantera
              del cielo ahora cabe en un cono de <b className="text-cyan-200">{fmt(sideDeg, sideDeg < 10 ? 1 : 0)}°</b> alrededor del frente (el círculo celeste), con{" "}
              <code>tan(θ′/2) = e<sup>−φ</sup>·tan(θ/2)</code>.
            </p>
          ) : (
            <p>En reposo cada estrella está donde corresponde: no hay aberración.</p>
          )}
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="hud-label mb-1 text-amber-300">Doppler: color y brillo</div>
          <p>
            Cada estrella se ve como un cuerpo negro a su temperatura multiplicada por el factor Doppler D = cos²(θ/2)·e<sup>φ</sup> + sin²(θ/2)·e<sup>−φ</sup>: justo
            adelante <b className="text-sky-300">×{fmt(Dfront, Dfront < 10 ? 2 : 1)}</b>, justo atrás <b className="text-rose-300">×{fmt(Dback, Dback < 0.1 ? 3 : 2)}</b>. Dentro del
            círculo punteado la luz llega más azul; fuera, más roja y tenue.
          </p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="hud-label mb-1 text-slate-300">Adelante: {aheadName}</div>
          <p>
            Su luz real <Swatch T={T0} /> {fmtK(T0)} llega como <Swatch T={T0 * Dfront} /> <b>{fmtK(T0 * Dfront)}</b>: se ve {eyeNote(T0 * Dfront)}.
            {sky.aheadDistance < 1e5 && sim.stage !== "done" && <> Faltan {formatLy(sky.aheadDistance)}.</>}
          </p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="hud-label mb-1 text-slate-300">Atrás: {behindName}</div>
          <p>
            Su luz real <Swatch T={Tbehind} /> {fmtK(Tbehind)} llega como <Swatch T={Tbehind * Dback} /> <b>{fmtK(Tbehind * Dback)}</b>: se ve {eyeNote(Tbehind * Dback)}.
          </p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:col-span-2">
          <div className="hud-label mb-1 text-fuchsia-300">El fondo de microondas</div>
          <p>
            El universo está lleno de la luz del Big Bang, enfriada a 2,725 K. Adelante la nave la ve a <b>{fmtK(2.725 * Dfront)}</b> y atrás a <b>{fmtK(2.725 * Dback)}</b>.
            {2.725 * Dfront > 600
              ? " A esta velocidad ya se corrió hasta el visible: adelante brilla un disco de luz que no viene de ninguna estrella."
              : " A esta velocidad sigue siendo invisible (microondas); haría falta γ de varios miles para que se viera adelante como un resplandor."}
          </p>
        </section>
      </div>
    </div>
  );
}
