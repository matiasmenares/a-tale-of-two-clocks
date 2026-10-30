"use client";

import { CHAPTERS, type Chapter, type Sim } from "@/hooks/useSimulation";
import { formatBeta, formatFactor, formatLy, formatPlayback, formatYears, fmt } from "@/lib/format";
import { gamma, PHASE_LABEL, tauFromT } from "@/lib/relativity";
import { schwarzschildRate } from "@/lib/gravity";
import { bioYears } from "@/lib/cryo";
import { START_AGE } from "@/lib/derive";
import type { ReactNode } from "react";

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  display: ReactNode;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint?: ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex justify-between gap-2 text-xs text-slate-300">
        <span>{label}</span>
        <span className="text-right font-mono text-slate-100">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-cyan-400"
      />
      {hint && <div className="text-[11px] text-slate-500">{hint}</div>}
    </label>
  );
}

function Toggle({ on, onChange, children }: { on: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`rounded-lg border px-2.5 py-1 text-xs transition ${on ? "border-cyan-300 bg-cyan-400/15 text-cyan-100" : "border-white/15 text-slate-400 hover:text-slate-200"}`}
    >
      {children}
    </button>
  );
}

export function ControlPanel({ sim }: { sim: Sim }) {
  const { trip, ship, ch } = sim;
  const nines = -Math.log10(1 - sim.beta);
  const byEarth = sim.master === "earth";
  const progress = byEarth ? ship.t / trip.totalT : ship.tau / trip.totalTau;
  const seekFraction = (f: number) => sim.seek(byEarth ? tauFromT(trip, f * trip.totalT) : f * trip.totalTau);
  const jumps = trip.phases.map((p, i) => ({ p, i })).filter(({ p }) => p.tau1 > p.tau0);
  const reachedBeta = Math.tanh(trip.phi);
  const shipAlive = START_AGE + bioYears(trip, sim.tau, sim.sleep) < sim.lifespan;

  return (
    <section className="space-y-4">
      {/* En pantallas chicas estos ajustes salen de la consola para no tapar las escenas: aquí siguen a mano. */}
      <div className="hidden space-y-3 rounded-xl border border-white/10 p-3 max-sm:block [@media(max-height:520px)]:block">
        <div className="hud-label text-cyan-300">Ajustes rápidos</div>
        <Slider
          label="Ritmo"
          value={Math.log10(sim.rate)}
          display={`${formatPlayback(sim.rate)}/s`}
          min={-7.5}
          max={4}
          step={0.01}
          onChange={(v) => sim.setRate(10 ** v)}
        />
        <div className="flex flex-wrap gap-2">
          <Toggle on={sim.roundTrip} onChange={sim.setRoundTrip}>↩ ida y vuelta</Toggle>
          <Toggle on={sim.director} onChange={sim.setDirector}>🎬 director</Toggle>
          {shipAlive ? (
            <Toggle on={sim.hypersleep} onChange={sim.setHypersleep}>❄️ hipersueño</Toggle>
          ) : (
            <span className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-500">❄️ hipersueño (Tomás murió)</span>
          )}
        </div>
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs text-slate-300">
          <span>Progreso del viaje ({byEarth ? "tiempo terrestre" : "tiempo de la nave"})</span>
          <span className="font-mono">{fmt(progress * 100, 1)} %</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.0005}
          value={progress}
          onChange={(e) => seekFraction(Number(e.target.value))}
          className="w-full accent-cyan-400"
        />
        <div className="mt-1 flex flex-wrap gap-1">
          {jumps.map(({ p, i }) => (
            <button
              key={i}
              onClick={() => sim.seek(p.tau0 + 1e-6)}
              className={`rounded border px-2 py-0.5 text-[11px] ${ship.phaseIndex === i ? "border-sky-400 text-sky-200" : "border-white/10 text-slate-400 hover:text-slate-200"}`}
            >
              {PHASE_LABEL[p.kind]} ({p.leg})
            </button>
          ))}
          <button onClick={() => sim.seek(trip.totalTau)} className="rounded border border-white/10 px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-200">
            Final
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Slider
          label="Velocidad máxima de crucero"
          value={nines}
          min={0.3}
          max={10}
          step={0.001}
          onChange={(n) => sim.setBeta(1 - 10 ** -n)}
          display={<>{formatBeta(sim.beta)} · γ = {fmt(gamma(sim.beta), gamma(sim.beta) > 100 ? 0 : 2)}</>}
          hint={
            <>
              <span className="flex flex-wrap gap-1">
                {[0.5, 0.9, 0.995, 0.9999, 1 - 1e-9].map((b) => (
                  <button key={b} onClick={() => sim.setBeta(b)} className="rounded bg-white/5 px-1.5 hover:bg-white/10">
                    {formatBeta(b)}
                  </button>
                ))}
              </span>
              {reachedBeta < sim.beta - 1e-12 && (
                <span>Con esta distancia y aceleración solo alcanza {formatBeta(reachedBeta)} antes de tener que frenar.</span>
              )}
            </>
          }
        />
        <Slider
          label="Aceleración del cohete"
          value={Math.log10(sim.accelG)}
          min={-1}
          max={1}
          step={0.01}
          onChange={(n) => sim.setAccelG(10 ** n)}
          display={`${fmt(sim.accelG, sim.accelG < 1 ? 2 : 1)} g`}
          hint={<>Cada fase de acelerar o frenar dura {formatYears(trip.phi / trip.a)} de la nave. 1 g = el astronauta siente su peso normal.</>}
        />
        <Slider
          label="Distancia del destino"
          value={Math.log10(trip.params.distance)}
          min={-5.5}
          max={10}
          step={0.01}
          onChange={(n) => sim.setDestination({ id: "custom", name: "Destino personalizado", distance: 10 ** n, kind: "custom" })}
          display={`${sim.destination.name} · ${formatLy(trip.params.distance)}`}
        />
        <Slider
          label="Esperanza de vida de ambos hermanos"
          value={sim.lifespan}
          min={60}
          max={110}
          step={1}
          onChange={sim.setLifespan}
          display={`${sim.lifespan} años`}
          hint="Parten con 30 años. Si un hermano la alcanza, muere."
        />
        <Slider
          label="Velocidad de la simulación"
          value={Math.log10(sim.rate)}
          min={-7.5}
          max={6}
          step={0.01}
          onChange={(n) => sim.setRate(10 ** n)}
          display={`${formatPlayback(sim.rate)} / s`}
          hint={
            <span className="flex flex-wrap items-center gap-2">
              Avanzar según el reloj de:
              <Toggle on={byEarth} onChange={() => sim.setMaster("earth")}>la Tierra</Toggle>
              <Toggle on={!byEarth} onChange={() => sim.setMaster("ship")}>la nave</Toggle>
            </span>
          }
        />
        {ch.gravity && (
          <div className="space-y-2 rounded-xl border border-white/10 p-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Al llegar: orbitar un agujero negro supermasivo</span>
              <Toggle on={sim.stayEnabled} onChange={sim.setStayEnabled}>{sim.stayEnabled ? "activado" : "desactivado"}</Toggle>
            </div>
            {sim.stayEnabled && (
              <>
                <Slider
                  label="Distancia al agujero negro"
                  value={Math.log10(sim.stayK - 1)}
                  min={-6}
                  max={1}
                  step={0.01}
                  onChange={(n) => sim.setStayK(1 + 10 ** n)}
                  display={<>r = {sim.stayK < 1.01 ? `(1 + ${(sim.stayK - 1).toExponential(1)})` : fmt(sim.stayK, 2)} r_s · ritmo {formatFactor(schwarzschildRate(sim.stayK))}</>}
                />
                <Slider
                  label="Tiempo que pasa allí el astronauta (su reloj)"
                  value={sim.stayYears}
                  min={0.1}
                  max={10}
                  step={0.1}
                  onChange={sim.setStayYears}
                  display={`${fmt(sim.stayYears, 1)} años → ${formatYears(sim.stayYears / schwarzschildRate(sim.stayK))} lejos`}
                />
              </>
            )}
          </div>
        )}
      </div>
      <p className="text-[11px] text-slate-500">
        Fase actual: <b className="text-slate-300">{PHASE_LABEL[ship.phase.kind]}</b> · Viaje completo: {formatYears(trip.totalTau)} en la nave,{" "}
        {formatYears(trip.totalT)} en la Tierra.
      </p>
    </section>
  );
}

export function ChapterTabs({ chapter, setChapter }: { chapter: Chapter; setChapter: (c: Chapter) => void }) {
  return (
    <nav className="flex flex-wrap gap-1.5">
      {([1, 2, 3, 4] as Chapter[]).map((c) => (
        <button
          key={c}
          onClick={() => setChapter(c)}
          className={`rounded-full border px-3 py-1 text-sm transition ${chapter === c ? "border-cyan-300 bg-cyan-400/20 text-cyan-100 shadow-[0_0_16px_-4px_rgba(34,211,238,0.9)]" : "border-white/15 text-slate-300 hover:border-white/40"}`}
        >
          {CHAPTERS[c].short}
        </button>
      ))}
    </nav>
  );
}
