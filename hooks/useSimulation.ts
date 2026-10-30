"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tauAtBio } from "@/lib/cryo";
import { START_AGE } from "@/lib/derive";
import { buildTrip, DESTINATIONS, stateAt, tauFromT, type Destination, type TripParams } from "@/lib/relativity";

export type Chapter = 1 | 2 | 3 | 4;
export type Stage = "boarding" | "cinematic" | "flight" | "done";
export type Master = "earth" | "ship";

export const CHAPTERS: Record<Chapter, { title: string; short: string; gravity: boolean }> = {
  1: { title: "Velocidad · Relatividad Especial", short: "1 · Velocidad", gravity: false },
  2: { title: "Aceleración = Gravedad · Principio de Equivalencia", short: "2 · Equivalencia", gravity: false },
  3: { title: "Pozos gravitatorios · Relatividad General", short: "3 · Gravedad", gravity: true },
  4: { title: "Todo junto", short: "4 · Todo junto", gravity: true },
};

/** Duración (s reales) de la cinemática de embarque antes del encendido. */
export const CINEMATIC_SECONDS = 16;
/** Un segundo expresado en años. */
export const SECOND = 1 / (365.25 * 86_400);
export const DAY = 1 / 365.25;

export function useSimulation() {
  const [destination, setDestination] = useState<Destination>(DESTINATIONS.find((d) => d.id === "aldebaran")!);
  const [chapter, setChapter] = useState<Chapter>(1);
  const [beta, setBeta] = useState(0.995);
  const [accelG, setAccelG] = useState(1);
  const [roundTrip, setRoundTrip] = useState(true);
  const [stayEnabled, setStayEnabled] = useState(false);
  const [stayK, setStayK] = useState(1.0001);
  const [stayYears, setStayYears] = useState(1);
  const [lifespan, setLifespan] = useState(90);
  const [rate, setRate] = useState(0.5); // años del reloj maestro por segundo real
  const [master, setMaster] = useState<Master>("ship");
  const [director, setDirector] = useState(true);
  /** Tomás duerme en una cápsula criogénica durante el crucero. */
  const [hypersleep, setHypersleep] = useState(false);
  const [stage, setStage] = useState<Stage>("boarding");
  const [cinematicTime, setCinematicTime] = useState(0);
  const cinematicRef = useRef(0);
  const launchedAt = useRef(-Infinity);
  const [playing, setPlaying] = useState(false);
  const [tau, setTau] = useState(0);
  const tauRef = useRef(0);
  tauRef.current = tau;
  /** Años propios de la nave que avanzó por segundo real en el último fotograma. */
  const [shipSpeed, setShipSpeed] = useState(0);

  const ch = CHAPTERS[chapter];
  const params: TripParams = useMemo(
    () => ({
      beta,
      accelG,
      instant: false,
      roundTrip,
      distance: destination.distance,
      stay: destination.miller
        ? {
            // Órbita del planeta de Miller: el reloj de Tomás late 1/factor respecto a la Tierra.
            enabled: true,
            k: 1 / (1 - 1 / destination.miller.factor ** 2),
            properYears: destination.miller.hours / (365.25 * 24),
          }
        : { enabled: ch.gravity && stayEnabled, k: stayK, properYears: stayYears },
      surfaceDays: destination.planet?.surfaceDays ?? 0,
    }),
    [beta, accelG, destination, ch, roundTrip, stayEnabled, stayK, stayYears],
  );
  const trip = useMemo(() => buildTrip(params), [params]);
  // Antes del despegue y tras terminar, la nave está en reposo respecto a la Tierra.
  const ship = useMemo(() => {
    const s = stateAt(trip, tau);
    return stage === "flight" ? s : { ...s, beta: 0, gamma: 1, alpha: 0 };
  }, [trip, tau, stage]);

  /** Momentos clave (tiempo de la nave) donde el director frena la cámara. */
  const events = useMemo(() => {
    const list = trip.phases.filter((p) => p.tau1 > p.tau0).map((p) => p.tau0);
    list.push(trip.totalTau);
    const earthDeath = tauFromT(trip, lifespan - START_AGE);
    if (earthDeath < trip.totalTau) list.push(earthDeath);
    const shipDeath = tauAtBio(trip, lifespan - START_AGE, hypersleep);
    if (shipDeath < trip.totalTau) list.push(shipDeath);
    return list.filter((t) => t > 0);
  }, [trip, lifespan, hypersleep]);

  // Si cambia el viaje, conservar la fracción recorrida.
  const prevTrip = useRef(trip);
  useEffect(() => {
    const prev = prevTrip.current;
    if (prev !== trip) {
      setTau((t) => (t / prev.totalTau) * trip.totalTau);
      prevTrip.current = trip;
    }
  }, [trip]);

  // Bucle de animación del vuelo.
  const live = useRef({ trip, master, rate, director, events });
  live.current = { trip, master, rate, director, events };
  useEffect(() => {
    if (!playing || stage !== "flight") return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      const { trip, master, rate, director, events } = live.current;
      const tau = tauRef.current;
      const s = stateAt(trip, tau);
      let next = master === "ship" ? tau + rate * dt : tauFromT(trip, s.t + rate * dt);
      if (director) {
        // Despegue casi en tiempo real que luego acelera exponencialmente; cámara lenta cerca de cada evento.
        // ~4 s de despegue en tiempo real; luego cada ~1,7 s el ritmo se multiplica por e.
        let cap = Math.max(SECOND, (tau - 4 * SECOND) * 0.6);
        for (const e of events) cap = Math.min(cap, Math.max(DAY * 3, Math.abs(tau - e) * 0.5));
        if (s.phase.kind === "stay" || s.phase.kind === "surface") cap = Math.min(cap, (s.phase.tau1 - s.phase.tau0) / 8);
        next = Math.min(next, tau + cap * dt);
        // No saltarse un evento en un solo fotograma.
        const upcoming = events.find((e) => e > tau + 1e-9);
        if (upcoming !== undefined && next > upcoming) next = upcoming + 1e-9;
      }
      if (next >= trip.totalTau) {
        setTau(trip.totalTau);
        setShipSpeed(0);
        setPlaying(false);
        setStage("done");
        return;
      }
      tauRef.current = next;
      setShipSpeed(dt > 0 ? (next - tau) / dt : 0);
      setTau(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, stage]);

  // Cinemática de embarque con el reloj real: sigue aunque la pestaña quede en segundo plano.
  useEffect(() => {
    if (stage !== "cinematic" || !playing) return;
    const start = performance.now() - cinematicRef.current * 1000;
    const id = setInterval(() => {
      const t = (performance.now() - start) / 1000;
      cinematicRef.current = t;
      if (t >= CINEMATIC_SECONDS) {
        clearInterval(id);
        tauRef.current = 0;
        setTau(0);
        setCinematicTime(CINEMATIC_SECONDS);
        setStage("flight");
      } else {
        setCinematicTime(t);
      }
    }, 40);
    return () => clearInterval(id);
  }, [stage, playing]);

  const launch = useCallback(() => {
    launchedAt.current = performance.now();
    cinematicRef.current = 0;
    tauRef.current = 0;
    setTau(0);
    setCinematicTime(0);
    setStage("cinematic");
    setPlaying(true);
  }, []);

  const reset = useCallback(() => {
    cinematicRef.current = 0;
    setPlaying(false);
    setTau(0);
    setCinematicTime(0);
    setShipSpeed(0);
    setStage("boarding");
  }, []);

  const seek = useCallback(
    (newTau: number) => {
      const t = Math.min(Math.max(newTau, 0), trip.totalTau);
      setTau(t);
      setStage(t >= trip.totalTau ? "done" : "flight");
    },
    [trip.totalTau],
  );

  const togglePlay = useCallback(() => {
    if (stage === "boarding") return launch();
    // Un doble clic en "Subir al cohete" no debe pausar la cuenta regresiva recién iniciada.
    if (performance.now() - launchedAt.current < 1200) return;
    if (stage === "done") {
      setTau(0);
      setStage("flight");
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  }, [stage, launch]);

  /** Velocidad de reproducción de cada mitad: años propios por segundo real. */
  const dtdtau = ship.phase.kind === "stay" && stage === "flight" ? 1 / trip.stayRate : ship.gamma;
  const nominalShip = master === "ship" ? rate : rate / dtdtau;
  const shipPlayback = stage === "cinematic" ? SECOND : playing && stage === "flight" ? shipSpeed || nominalShip : nominalShip;
  const earthPlayback = stage === "cinematic" ? SECOND : shipPlayback * dtdtau;

  return {
    destination, setDestination,
    chapter, setChapter, ch,
    beta, setBeta, accelG, setAccelG, roundTrip, setRoundTrip,
    stayEnabled, setStayEnabled, stayK, setStayK, stayYears, setStayYears,
    lifespan, setLifespan,
    rate, setRate, master, setMaster, director, setDirector, hypersleep, setHypersleep,
    stage, cinematicTime, playing, launch, reset, seek, togglePlay,
    trip, ship, tau, shipPlayback, earthPlayback,
  };
}

export type Sim = ReturnType<typeof useSimulation>;
