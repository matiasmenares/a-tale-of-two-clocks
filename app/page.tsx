"use client";

import { ControlPanel } from "@/components/ControlPanel";
import { ClocksPanel } from "@/components/ClocksPanel";
import { DataPanel } from "@/components/DataPanel";
import { Modal } from "@/components/Modal";
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

export type Panel = "map" | "control" | "data" | "clocks";

export default function Home() {
  const sim = useSimulation();
  const d = derive(sim.trip, sim.ship, sim.ch.gravity);
  const [panel, setPanel] = useState<Panel | null>(null);
  const close = useCallback(() => setPanel(null), []);

  return (
    <>
      <TwinsTheater sim={sim} d={d} onOpen={setPanel} />

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
      {panel === "clocks" && (
        <Modal title="Comparar los relojes" label="Tierra y nave" onClose={close}>
          <ClocksPanel sim={sim} d={d} />
        </Modal>
      )}
      {panel === "data" && (
        <Modal title="Datos del viaje" label="Comunicaciones y laboratorio" onClose={close}>
          <DataPanel sim={sim} d={d} />
        </Modal>
      )}
    </>
  );
}
