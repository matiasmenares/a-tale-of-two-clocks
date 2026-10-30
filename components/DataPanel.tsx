"use client";

import type { Sim } from "@/hooks/useSimulation";
import { bioYears } from "@/lib/cryo";
import { earthToShip, freakFacts, heartbeats, RADIO_GHZ, SHIP_MASS_KG, shipToEarth } from "@/lib/comms";
import { START_AGE, type Derived } from "@/lib/derive";
import { formatAge, formatLy, formatYears, fmt } from "@/lib/format";
import { EARTH_NAME, LAUNCH_YEAR, SHIP_NAME } from "@/lib/life";
import { stateAt } from "@/lib/relativity";
import { useState, type ReactNode } from "react";
import { ChapterTabs } from "./ControlPanel";
import { GravityWell } from "./GravityWell";
import { InfoBox } from "./InfoBox";
import { SpacetimeDiagram } from "./SpacetimeDiagram";

const big = (n: number) =>
  !isFinite(n) ? "∞" : n >= 1e6 ? new Intl.NumberFormat("es-CL", { notation: "compact", maximumFractionDigits: 2 }).format(n) : fmt(n, n < 10 ? 2 : 0);

function Row({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-baseline gap-3 border-b border-white/5 py-1.5">
      <div>
        <div className="text-sm text-slate-300">{label}</div>
        {note && <div className="text-[11px] text-slate-500">{note}</div>}
      </div>
      <div className="text-right font-mono text-sm text-white">{value}</div>
    </div>
  );
}

type Tab = "live" | "lab";

const TABS: { id: Tab; label: string }[] = [
  { id: "live", label: "📡 En vivo" },
  { id: "lab", label: "🧪 Laboratorio" },
];

/** Datos del viaje en pestañas: lo que pasa en vivo y la ficha de la misión. */
export function DataPanel({ sim, d }: { sim: Sim; d: Derived }) {
  const [tab, setTab] = useState<Tab>("live");
  return (
    <div className="space-y-4">
      <nav className="flex gap-1.5" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-3 py-1 text-sm transition ${tab === t.id ? "border-cyan-300 bg-cyan-400/20 text-cyan-100 shadow-[0_0_16px_-4px_rgba(34,211,238,0.9)]" : "border-white/15 text-slate-300 hover:border-white/40"}`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      {tab === "live" ? <LiveData sim={sim} d={d} /> : <Lab sim={sim} d={d} />}
    </div>
  );
}

/** Laboratorio: la explicación por capítulos, el diagrama espacio-tiempo y el pozo gravitatorio. */
function Lab({ sim, d }: { sim: Sim; d: Derived }) {
  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="hud-label text-cyan-300">Laboratorio de relatividad · Misión TERRA-1</div>
          <h3 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            La paradoja de los <span className="glow-cyan text-cyan-300">gemelos</span>
          </h3>
          <p className="text-sm text-slate-400">Dilatación del tiempo por velocidad, aceleración y gravedad.</p>
        </div>
        <ChapterTabs chapter={sim.chapter} setChapter={sim.setChapter} />
      </header>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <InfoBox sim={sim} d={d} />
        <div className="space-y-4">
          <SpacetimeDiagram sim={sim} />
          {sim.ch.gravity && <GravityWell sim={sim} />}
        </div>
      </div>
    </div>
  );
}

/** Datos en vivo: comunicaciones por luz desde ambos lados y curiosidades físicas del viaje. */
function LiveData({ sim, d }: { sim: Sim; d: Derived }) {
  const { ship, trip, lifespan } = sim;
  const flying = sim.stage === "flight" || sim.stage === "done";
  const toShip = earthToShip(trip, ship, sim.hypersleep);
  const toEarth = shipToEarth(ship, d.earthRate);
  const f = freakFacts(trip, ship);
  // Evento de la nave cuya luz llega hoy a la Tierra: salió hace x_e años (tiempo terrestre).
  const seenEvent = stateAt(trip, Math.min(d.shipSeenFromEarth, trip.totalTau));
  const imageAge = Math.max(0, ship.t - seenEvent.t);
  const deathAge = lifespan;
  const ageLabel = (age: number) => (age >= deathAge ? <span className="text-rose-300">ya habrá muerto</span> : formatAge(age));

  if (!flying)
    return <p className="text-sm text-slate-400">Los datos aparecen cuando la nave despega. Pulsa «Subir al cohete».</p>;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section>
        <div className="hud-label mb-1 text-cyan-300">🌍 Desde la Tierra · {EARTH_NAME}</div>
        <Row
          label="Telescopio: ve a Tomás con"
          value={formatAge(START_AGE + d.shipSeenFromEarth)}
          note={`esa luz salió de la nave hace ${formatYears(imageAge)}`}
        />
        <Row label="Distancia a la nave" value={formatLy(ship.x)} note={`${big(f.distanceKm)} km · ${big(f.lightHours)} horas luz`} />
        <Row
          label="Un mensaje enviado hoy a Tomás"
          value={`tarda ${formatYears(toShip.earthFrameDelay)}`}
          note={<>{SHIP_NAME} lo recibe con {ageLabel(toShip.receiverAge)} (tras {formatYears(toShip.waitForReceiver)} de su reloj)</>}
        />
        <Row
          label="Mensaje de Tomás que llega ahora"
          value={`año ${LAUNCH_YEAR + Math.floor(Math.max(0, seenEvent.t))}`}
          note={`lo grabó con ${formatAge(START_AGE + d.shipSeenFromEarth)}`}
        />
        <Row label={`Radio de ${RADIO_GHZ} GHz de la nave llega a`} value={`${fmt(f.radioAtEarthGHz, 3)} GHz`} note="corrimiento Doppler al rojo" />
        <Row label="Latidos de Martín desde el despegue" value={big(heartbeats(d.earthProper))} note="a 70 por minuto" />
      </section>

      <section>
        <div className="hud-label mb-1 text-amber-300">🧑‍🚀 Desde la nave · {SHIP_NAME}</div>
        <Row
          label="Ve la Tierra como era en"
          value={`año ${LAUNCH_YEAR + Math.floor(d.earthSeenFromShip)}`}
          note={`Martín aparece con ${formatAge(Math.min(lifespan, START_AGE + d.earthSeenFromShip))}`}
        />
        <Row
          label="Una señal enviada hoy a la Tierra"
          value={`tarda ${formatYears(toEarth.earthFrameDelay)}`}
          note={<>{EARTH_NAME} la recibe con {ageLabel(toEarth.receiverAge)}</>}
        />
        <Row
          label="Mensaje de Martín enviado «ahora» en la Tierra"
          value={`llega en ${formatYears(toShip.waitForReceiver)}`}
          note={
            ship.alpha > 0 && toShip.waitForReceiver > 5 * Math.max(0.01, ship.tau)
              ? "mientras acelera, la luz casi no lo alcanza: horizonte de Rindler"
              : "medido con el reloj de la nave"
          }
        />
        <Row label={`Radio de ${RADIO_GHZ} GHz de la Tierra llega a`} value={`${fmt(f.radioAtShipGHz, 3)} GHz`} note={f.radioAtShipGHz < RADIO_GHZ ? "más grave: corrimiento al rojo" : "más aguda: corrimiento al azul"} />
        <Row
          label="El Sol visto desde la nave"
          value={f.sunMagnitude > 30 ? "invisible" : `magnitud ${fmt(f.sunMagnitude, 1)}`}
          note={
            f.sunMagnitude < 6
              ? "visible a simple vista (magnitud < 6)"
              : f.sunMagnitude > 30
                ? "su luz se corrió al infrarrojo por el efecto Doppler: el ojo ya no la ve"
                : "demasiado tenue para el ojo (magnitud > 6)"
          }
        />
        <Row
          label="Latidos de Tomás desde el despegue"
          value={big(heartbeats(bioYears(trip, d.shipProper, sim.hypersleep)))}
          note={`${big(heartbeats(d.earthProper) - heartbeats(bioYears(trip, d.shipProper, sim.hypersleep)))} menos que Martín${sim.hypersleep ? " (en hipersueño su corazón late 100 veces más lento)" : ""}`}
        />
      </section>

      <section className="lg:col-span-2">
        <div className="hud-label mb-1 text-fuchsia-300">🤓 Datos freak</div>
        <div className="grid gap-x-6 sm:grid-cols-2">
          <Row label="Velocidad" value={`${big(f.speedKms)} km/s`} note={`${fmt(Math.abs(ship.beta) * 100, 4)} % de la luz`} />
          <Row
            label="Velocidad propia (γ·v)"
            value={`${fmt(f.properSpeed, 2)} c`}
            note={`según su reloj recorre ${fmt(f.properSpeed, 2)} años luz por año: ¡puede superar a c sin romper nada!`}
          />
          <Row label="Energía cinética de la nave" value={`${big(f.kineticMt)} Mt`} note={`${fmt(SHIP_MASS_KG / 1000, 0)} t a esta velocidad; la bomba del Zar fue de 50 Mt`} />
          <Row label="Cada átomo de hidrógeno choca con" value={`${big(f.protonMeV)} MeV`} note="como un rayo cósmico: hace falta un escudo frontal" />
          <Row label="Impactos de átomos" value={`${big(f.hitsPerCm2s)} /cm²·s`} note="con ~1 átomo por cm³ en el espacio interestelar" />
          <Row label="Radiación de fondo justo adelante" value={`${big(f.cmbAheadK)} K`} note="el frío de 2,7 K del universo, calentado por el Doppler" />
          <Row label="Factor de Lorentz γ" value={fmt(f.gamma, 3)} note={`por cada día de Tomás, en la Tierra pasan ${fmt(f.gamma, 2)} días (en crucero)`} />
          <Row label="Distancia que mide Tomás hasta el destino" value={formatLy(d.remainingContracted)} note={`en la Tierra miden ${formatLy(d.remainingProperDistance)} (contracción de Lorentz)`} />
        </div>
      </section>
    </div>
  );
}
