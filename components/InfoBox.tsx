"use client";

import type { Sim } from "@/hooks/useSimulation";
import { bioYears } from "@/lib/cryo";
import { breakdown, START_AGE, type Derived } from "@/lib/derive";
import { formatFactor, formatLy, formatYears, fmt } from "@/lib/format";
import { G_LY_YR2 } from "@/lib/relativity";
import { Tex } from "./Tex";

function PhaseHint({ sim, d }: { sim: Sim; d: Derived }) {
  const { ship, stage, ch } = sim;
  if (stage === "boarding")
    return <>Los dos gemelos tienen {START_AGE} años y sincronizan sus relojes. Uno se queda; el otro sube al cohete rumbo a {sim.destination.name}.</>;
  if (stage === "cinematic") return <>Embarque y cuenta regresiva… ambos relojes marcan lo mismo.</>;
  if (stage === "done")
    return (
      <>
        {sim.roundTrip ? "¡Reencuentro! " : `¡Llegada a ${sim.destination.name}! `}Ambos están ahora en reposo relativo, así que <b>los dos están de acuerdo</b>:
        el terrícola vivió <b className="text-sky-300">{formatYears(d.earthProper)}</b> y el astronauta solo{" "}
        <b className="text-orange-300">{formatYears(d.shipProper)}</b>. No hay paradoja: el astronauta es quien cambió de marco (aceleró).
        {sim.hypersleep && (
          <> Además durmió en hipersueño: su reloj marcó ese tiempo, pero su cuerpo envejeció solo <b className="text-sky-300">{formatYears(bioYears(sim.trip, d.shipProper, true))}</b>.</>
        )}
      </>
    );
  switch (ship.phase.kind) {
    case "cruise":
      return (
        <>
          <b>Crucero.</b> Cada gemelo calcula que el reloj del <i>otro</i> va {formatFactor(ship.gamma).slice(1)} veces más lento. ¡Ambos tienen razón!
          Es la <b>relatividad de la simultaneidad</b>: no comparten el mismo «ahora» (mira las dos líneas punteadas del diagrama).
          {ship.phase.leg === "vuelta" && ship.phase.kind === "cruise" && (
            <>
              {" "}
              <b className="text-amber-300">Al frenar y dar la vuelta, el «ahora» del astronauta giró</b> y el reloj terrestre que él calcula dio un
              gran salto: ahí está la asimetría.
            </>
          )}
        </>
      );
    case "accel":
    case "decel": {
      const g = Math.abs(ship.alpha) / G_LY_YR2;
      const above = (ship.phase.kind === "decel") === (ship.phase.dir === 1);
      return (
        <>
          <b>{ship.phase.kind === "accel" ? "Acelerando" : "Frenando"} a {fmt(g, 1)} g.</b> Por el <b>principio de equivalencia</b> el astronauta
          no puede distinguir esto de estar en un campo gravitatorio. La Tierra está a {formatLy(Math.abs(ship.x))} {above ? "«arriba»" : "«abajo»"} en ese
          campo, así que su reloj corre a ritmo <b className="text-sky-300">{formatFactor(d.earthRateFromShip)}</b>
          {above ? " — ¡el reloj terrestre se dispara!" : "."}
        </>
      );
    }
    case "stay":
      return (
        <>
          <b>Junto a un agujero negro supermasivo.</b> El astronauta está en reposo, pero hondo en un pozo gravitatorio: su reloj late{" "}
          {formatFactor(sim.trip.stayRate)} respecto al resto del universo. {ch.gravity && "Esto es Relatividad General pura."}
        </>
      );
  }
}

function Breakdown({ sim }: { sim: Sim }) {
  const b = breakdown(sim.trip, sim.ch.gravity);
  const rows: [string, number, string][] = [
    ["Velocidad (crucero, RE)", b.cruise, "bg-orange-400"],
    ["Aceleración / frenado (equivalencia)", b.accel, "bg-amber-300"],
    ["Pozo del agujero negro (RG)", b.stay, "bg-violet-400"],
    ["Gravedad en la Tierra (RG)", b.earthGravity, "bg-sky-400"],
  ];
  const max = Math.max(...rows.map((r) => Math.abs(r[1])), 1e-30);
  return (
    <div className="space-y-1.5">
      <div className="text-xs text-slate-300">
        ¿De dónde sale la diferencia de edad final de <b className="text-white">{formatYears(b.total)}</b>?
      </div>
      {rows.map(([label, v, color]) => (
        <div key={label} className="grid grid-cols-[1fr_auto] items-center gap-2 text-[11px] text-slate-400">
          <div>
            <div>{label}</div>
            <div className="h-1.5 rounded bg-white/5">
              <div className={`h-1.5 rounded ${color}`} style={{ width: `${Math.max(v === 0 ? 0 : 0.5, (Math.abs(v) / max) * 100)}%` }} />
            </div>
          </div>
          <span className="font-mono text-slate-200">{v < 0 ? "−" : "+"}{formatYears(Math.abs(v))}</span>
        </div>
      ))}
      <div className="text-[11px] text-slate-500">
        Nota: la contribución de la aceleración es pequeña en tiempo propio, pero es la que rompe la simetría: sin ella los gemelos nunca podrían
        reencontrarse ni detenerse para comparar relojes.
      </div>
    </div>
  );
}

export function InfoBox({ sim, d }: { sim: Sim; d: Derived }) {
  const { chapter, ship, trip } = sim;
  return (
    <section className="space-y-3 glass p-4 text-sm text-slate-300">
      <h3 className="font-semibold text-slate-100">{sim.ch.title}</h3>
      <div className="rounded-lg bg-white/5 p-3 text-[13px] leading-relaxed">
        <PhaseHint sim={sim} d={d} />
      </div>

      {chapter === 1 && (
        <>
          <p>
            Al moverse con velocidad <Tex>v</Tex>, el tiempo propio del viajero transcurre más despacio según el <b>factor de Lorentz</b>:
          </p>
          <Tex block>{String.raw`\Delta\tau = \frac{\Delta t}{\gamma},\qquad \gamma = \frac{1}{\sqrt{1 - v^2/c^2}} = ${fmt(ship.gamma > 1.0001 ? ship.gamma : 1 / Math.sqrt(1 - trip.params.beta ** 2), 3)}`}</Tex>
          <p>
            Y las distancias en la dirección del movimiento se contraen: para el astronauta {sim.destination.name} está a solo{" "}
            <Tex>{String.raw`L = L_0/\gamma`}</Tex>. Por eso, para él, el viaje es corto sin superar nunca <Tex>c</Tex>.
          </p>
          <p className="text-xs text-slate-400">
            Durante el crucero los motores están apagados: el astronauta flota y su movimiento es uniforme. Pasa al capítulo 2 para ver qué ocurre al acelerar.
          </p>
        </>
      )}
      {chapter === 2 && (
        <>
          <p>
            Einstein: <i>estar en un cohete que acelera con <Tex>a</Tex> es indistinguible de estar quieto en un campo gravitatorio <Tex>g = a</Tex></i>.
            En un campo gravitatorio, los relojes más «arriba» corren más rápido (métrica de Rindler):
          </p>
          <Tex block>{String.raw`\frac{dt_{\oplus}}{d\tau} = \frac{1 + a\,h/c^2}{\gamma}`}</Tex>
          <p>
            Al <b>frenar</b> cerca del destino, la Tierra está a una «altura» <Tex>h</Tex> de muchos años luz: el factor{" "}
            <Tex>{String.raw`a h/c^2`}</Tex> es gigantesco y el astronauta calcula que el reloj terrestre avanza muchísimo en poco tiempo suyo. Esto
            resuelve la paradoja: la asimetría está en quién acelera.
          </p>
          <p className="text-xs text-slate-400">Activa «cámara lenta» y avanza según el reloj de la nave para verlo en vivo.</p>
        </>
      )}
      {chapter === 3 && (
        <>
          <p>
            La masa curva el espacio-tiempo: cuanto más hondo en un pozo gravitatorio, más lento late un reloj. El gemelo terrestre vive dentro
            del pozo de la Tierra y del Sol; el astronauta, al llegar, puede acercarse a un agujero negro supermasivo (como M31*, el de Andrómeda).
          </p>
          <Tex block>{String.raw`\frac{d\tau}{dt} \approx 1 - \frac{GM}{rc^2}\ \text{(campo débil)}`}</Tex>
        </>
      )}
      {chapter === 4 && (
        <p>
          Todos los efectos juntos: velocidad (Relatividad Especial), aceleración (principio de equivalencia) y pozos gravitatorios (Relatividad General).
        </p>
      )}
      {(chapter === 4 || sim.stage === "done") && <Breakdown sim={sim} />}
    </section>
  );
}
