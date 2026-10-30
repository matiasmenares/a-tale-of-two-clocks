"use client";

import { ChapterTabs, ControlPanel } from "@/components/ControlPanel";
import { DataPanel } from "@/components/DataPanel";
import { GravityWell } from "@/components/GravityWell";
import { InfoBox } from "@/components/InfoBox";
import { Modal } from "@/components/Modal";
import { SpacetimeDiagram } from "@/components/SpacetimeDiagram";
import { useSimulation } from "@/hooks/useSimulation";
import { derive } from "@/lib/derive";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

// La animación y el mapa dependen de requestAnimationFrame y de cálculos en coma flotante: solo en el navegador.
const TwinsTheater = dynamic(() => import("@/components/theater/TwinsTheater").then((m) => m.TwinsTheater), {
  ssr: false,
  loading: () => <section className="h-[100svh] bg-black" />,
});
const MissionMap = dynamic(() => import("@/components/MissionMap").then((m) => m.MissionMap), { ssr: false });

export type Panel = "map" | "control" | "data";

export default function Home() {
  const sim = useSimulation();
  const d = derive(sim.trip, sim.ship, sim.ch.gravity);
  const [panel, setPanel] = useState<Panel | null>(null);
  const close = useCallback(() => setPanel(null), []);

  return (
    <>
      <TwinsTheater sim={sim} d={d} onOpen={setPanel} />
      <main className="mx-auto max-w-7xl space-y-4 px-4 py-6">
        <header className="flex justify-end">
          <ChapterTabs chapter={sim.chapter} setChapter={sim.setChapter} />
        </header>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <InfoBox sim={sim} d={d} />
          <div className="space-y-4">
            <SpacetimeDiagram sim={sim} />
            {sim.ch.gravity && <GravityWell sim={sim} />}
          </div>
        </div>
      </main>

      {panel === "map" && (
        <Modal title="¿Dónde está la nave?" label="Mapa de navegación" onClose={close}>
          <MissionMap sim={sim} />
        </Modal>
      )}
      {panel === "control" && (
        <Modal title="Panel de control" label="Parámetros de la misión" onClose={close}>
          <ControlPanel sim={sim} />
        </Modal>
      )}
      {panel === "data" && (
        <Modal title="Datos del viaje" label="Comunicaciones y misión" onClose={close}>
          <DataPanel sim={sim} d={d} />
        </Modal>
      )}
    </>
  );
}
