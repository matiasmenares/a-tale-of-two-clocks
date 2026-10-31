"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CINEMATIC_SECONDS, type Sim } from "@/hooks/useSimulation";
import { DESTINATIONS } from "@/lib/relativity";
import { formatLy, formatPlayback } from "@/lib/format";

type Panel = "map" | "control" | "data" | "clocks" | "telescope" | "window";
const toolButton = "flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2 text-xs text-slate-200 active:bg-white/15";

/** Dos filas permanentes; las opciones de viaje solo ocupan espacio al abrirlas. */
export function MobileMissionControls({ sim, sound, onSound, onOpen, shipAlive }: {
  sim: Sim; sound: boolean; onSound: () => void; onOpen: (panel: Panel) => void; shipAlive: boolean;
}) {
  const [panel, setPanel] = useState<"rate" | "trip" | null>(null);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!panel) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
      if (event.key !== "Tab") return;
      const dialog = closeRef.current?.closest('[role="dialog"]');
      const focusable = dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), select, input:not([disabled])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = previousOverflow; previous?.focus(); };
  }, [panel]);
  const progress = sim.trip.totalTau > 0 ? Math.max(0, Math.min(1, sim.tau / sim.trip.totalTau)) : 0;
  const label = sim.stage === "boarding" ? "Subir al cohete" : sim.stage === "done" ? "Repetir viaje" : sim.playing ? "Pausar" : "Continuar";
  const countdown = sim.stage === "cinematic" ? Math.ceil(CINEMATIC_SECONDS - sim.cinematicTime) : 0;
  const openTool = (tool: Panel) => { setPanel(null); onOpen(tool); };
  return <div className="mobile-mission-controls mx-auto max-w-xl">
    <div className="flex h-11 items-center gap-2">
      <button type="button" onClick={sim.togglePlay} aria-label={label} className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-400 text-lg text-slate-950 active:bg-amber-300">
        {sim.stage === "boarding" ? "🚀" : sim.stage === "done" ? "↺" : sim.playing ? "⏸" : "▶"}
        {countdown > 0 && countdown <= 10 && <span className="absolute -right-2 -top-1 rounded-full border border-amber-300/30 bg-slate-900 px-1 font-mono text-[9px] leading-4 text-amber-200">T−{countdown}</span>}
      </button>
      <button type="button" onClick={() => setPanel("rate")} aria-haspopup="dialog" aria-expanded={panel === "rate"} aria-label={`Cambiar ritmo: ${formatPlayback(sim.rate)} por segundo`} className="flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-3 text-cyan-100 transition active:bg-cyan-400/20 focus-visible:outline-2 focus-visible:outline-cyan-300">
        <span className="shrink-0 text-xs font-semibold">Ritmo</span><span className="truncate font-mono text-[10px] text-cyan-200">{formatPlayback(sim.rate)}/s</span><span className="shrink-0 text-[10px]" aria-hidden="true">▾</span>
      </button>
      <button type="button" onClick={() => setPanel("trip")} aria-haspopup="dialog" aria-expanded={panel === "trip"} className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-white/15 px-3 text-xs text-slate-200 active:bg-white/10">☰ Viaje</button>
    </div>
    <div className="mt-0.5 flex h-7 items-center gap-2">
      <div className="relative h-7 min-w-0 flex-1">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gradient-to-r from-cyan-400 to-amber-300" style={{ width: `${progress * 100}%` }} /></div>
        <input aria-label="Progreso del viaje" type="range" min={0} max={1} step={0.0005} value={progress} onChange={event => sim.seek(Number(event.target.value) * sim.trip.totalTau)} className="timeline absolute inset-0 h-full w-full" />
      </div>
      <span className="w-9 shrink-0 text-right font-mono text-[10px] text-slate-400">{Math.round(progress * 100)} %</span>
    </div>
    {panel && createPortal(<div className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-2 backdrop-blur-sm sm:items-center" onClick={() => setPanel(null)}>
      <section role="dialog" aria-modal="true" aria-label={panel === "rate" ? "Ritmo de la simulación" : "Opciones del viaje"} className="glass flex max-h-[calc(100dvh-1rem)] w-full max-w-md flex-col overflow-hidden" onClick={event => event.stopPropagation()}>
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 py-1 pl-4 pr-1">
          <h2 className="font-semibold text-white">{panel === "rate" ? "Ritmo de la simulación" : "Viaje y herramientas"}</h2>
          <button ref={closeRef} type="button" onClick={() => setPanel(null)} aria-label="Cerrar opciones" className="h-11 w-11 shrink-0 rounded-full text-lg text-slate-300 active:bg-white/10">✕</button>
        </header>
        <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain p-4">
          {panel === "rate" ? <>
            <label className="block space-y-2"><span className="flex justify-between text-sm text-slate-300"><span>Tiempo por segundo</span><b className="font-mono text-cyan-200">{formatPlayback(sim.rate)}</b></span>
              <input type="range" min={-7.5} max={4} step={0.01} value={Math.log10(sim.rate)} onChange={event => sim.setRate(10 ** Number(event.target.value))} aria-label="Ritmo de simulación" className="h-11 w-full accent-cyan-400" />
            </label>
            <label className="flex min-h-11 items-center gap-3 text-sm text-slate-200"><input type="checkbox" checked={sim.director} onChange={event => sim.setDirector(event.target.checked)} className="h-5 w-5 accent-cyan-400" />🎬 Director automático</label>
            <p className="text-xs text-slate-400">El director ralentiza los momentos importantes. Cambiar el ritmo manualmente lo desactiva.</p>
          </> : <>
            <label className="block space-y-1"><span className="hud-label text-slate-400">Destino</span><select aria-label="Destino" value={sim.destination.id} onChange={event => { const next = DESTINATIONS.find(destination => destination.id === event.target.value); if (next) sim.setDestination(next); }} className="h-11 w-full min-w-0 rounded-xl border border-white/15 bg-slate-900 px-2 text-base text-white">
              {sim.destination.id === "custom" && <option value="custom">Destino personalizado · {formatLy(sim.destination.distance)}</option>}
              {DESTINATIONS.map(destination => <option key={destination.id} value={destination.id}>{destination.name} · {formatLy(destination.distance)}</option>)}
            </select></label>
            <div className="flex flex-wrap gap-x-4 text-sm text-slate-200">
              <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={sim.roundTrip} onChange={event => sim.setRoundTrip(event.target.checked)} className="h-5 w-5 accent-cyan-400" />Ida y vuelta</label>
              <label className={`flex min-h-11 items-center gap-2 ${!shipAlive ? "opacity-40" : ""}`}><input type="checkbox" checked={sim.hypersleep && shipAlive} disabled={!shipAlive} onChange={event => sim.setHypersleep(event.target.checked)} className="h-5 w-5 accent-cyan-400" />❄️ Hipersueño</label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([["map", "🗺 Mapa"], ["control", "⚙ Ajustes"], ["data", "📊 Datos"], ["clocks", "◷ Relojes"], ["window", "✦ Ventana"], ["telescope", "🔭 Telescopio"]] as const).map(([tool, name]) => <button key={tool} type="button" onClick={() => openTool(tool)} className={toolButton}>{name}</button>)}
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
              <button type="button" onClick={() => { sim.reset(); setPanel(null); }} className={toolButton}>↺ Reiniciar</button>
              <button type="button" onClick={onSound} aria-pressed={sound} className={toolButton}>{sound ? "🔊 Sonido" : "🔇 Sonido"}</button>
              <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(sim.shareUrl()); } catch { window.prompt("Copia este link", sim.shareUrl()); } setCopied(true); }} className={toolButton}>{copied ? "✓ Copiado" : "🔗 Compartir"}</button>
            </div>
          </>}
        </div>
      </section>
    </div>, document.body)}
  </div>;
}
