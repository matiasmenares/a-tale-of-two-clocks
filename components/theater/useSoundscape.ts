"use client";

import { useEffect, useRef } from "react";

/** Lo que suena en este momento (se recalcula en cada fotograma). */
export interface SoundState {
  /** Rugido del despegue (0–1). */
  rumble: number;
  /** Zumbido de la cabina de la nave. */
  hum: boolean;
  /** Lluvia en la Tierra (0–1). */
  rain: number;
  /** Martín toca la guitarra: destreza 0–1, o null. */
  guitar: number | null;
  /** Tomás toca el violín: destreza 0–1, o null. */
  violin: number | null;
  /** Le están cantando «Cumpleaños feliz» a Martín (número de cumpleaños, para cantarlo una vez). */
  singing: number | null;
}

/** Nota MIDI → frecuencia. */
const hz = (n: number) => 440 * 2 ** ((n - 69) / 12);

// Acordes de la guitarra (Do, La menor, Fa, Sol) y frases del violín.
const CHORDS = [
  [48, 52, 55, 60, 64],
  [45, 52, 57, 60, 64],
  [41, 48, 53, 57, 60],
  [43, 50, 55, 59, 62],
];
const VIOLIN = [76, 74, 72, 74, 76, 76, 76, 74, 74, 74, 76, 79, 79];
// «Cumpleaños feliz»: [nota, duración en tiempos]
const BIRTHDAY: [number, number][] = [
  [67, 0.75], [67, 0.25], [69, 1], [67, 1], [72, 1], [71, 2],
  [67, 0.75], [67, 0.25], [69, 1], [67, 1], [74, 1], [72, 2],
  [67, 0.75], [67, 0.25], [79, 1], [76, 1], [72, 1], [71, 1], [69, 2],
  [77, 0.75], [77, 0.25], [76, 1], [72, 1], [74, 1], [72, 2],
];

class Engine {
  ctx: AudioContext;
  master: GainNode;
  noise: AudioBuffer;
  rumble: GainNode;
  rain: GainNode;
  hum: GainNode;
  nextGuitar = 0;
  nextViolin = 0;
  step = 0;
  vstep = 0;
  sungFor: number | null = null;

  constructor() {
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.6;
    this.master.connect(this.ctx.destination);
    // Ruido blanco de 2 s en bucle: base del rugido y de la lluvia.
    this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.rumble = this.loopNoise("lowpass", 120, 0.7);
    this.rain = this.loopNoise("bandpass", 2800, 0.6);
    // Zumbido grave de la ventilación de la nave.
    this.hum = this.ctx.createGain();
    this.hum.gain.value = 0;
    this.hum.connect(this.master);
    for (const [f, g] of [[55, 1], [110, 0.4], [165, 0.15]]) {
      const o = this.ctx.createOscillator();
      const og = this.ctx.createGain();
      o.frequency.value = f;
      og.gain.value = g;
      o.connect(og).connect(this.hum);
      o.start();
    }
  }

  loopNoise(type: BiquadFilterType, freq: number, q: number) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(this.master);
    src.start();
    return gain;
  }

  /** Una nota con envolvente: pulsada (guitarra) o frotada con vibrato (violín, voz). */
  note(freq: number, at: number, dur: number, kind: "pluck" | "bow" | "voice", vol: number) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    o.type = kind === "pluck" ? "triangle" : kind === "bow" ? "sawtooth" : "sine";
    o.frequency.setValueAtTime(freq, at);
    f.type = "lowpass";
    f.frequency.value = kind === "bow" ? 2600 : 4000;
    if (kind !== "pluck") {
      const lfo = this.ctx.createOscillator();
      const depth = this.ctx.createGain();
      lfo.frequency.value = 5.5;
      depth.gain.value = freq * 0.006;
      lfo.connect(depth).connect(o.frequency);
      lfo.start(at);
      lfo.stop(at + dur + 0.1);
    }
    g.gain.setValueAtTime(0, at);
    if (kind === "pluck") {
      g.gain.linearRampToValueAtTime(vol, at + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    } else {
      g.gain.linearRampToValueAtTime(vol, at + 0.08);
      g.gain.setValueAtTime(vol, at + dur * 0.8);
      g.gain.linearRampToValueAtTime(0, at + dur);
    }
    o.connect(f).connect(g).connect(this.master);
    o.start(at);
    o.stop(at + dur + 0.05);
  }

  /** Desafinación según la destreza: los principiantes erran por hasta ~70 centésimas de tono. */
  detune(freq: number, skill: number) {
    const cents = (Math.random() * 2 - 1) * 70 * (1 - skill) ** 2;
    return freq * 2 ** (cents / 1200);
  }

  update(s: SoundState) {
    const now = this.ctx.currentTime;
    this.rumble.gain.setTargetAtTime(s.rumble * 0.9, now, 0.3);
    this.rain.gain.setTargetAtTime(s.rain * 0.18, now, 0.5);
    this.hum.gain.setTargetAtTime(s.hum ? 0.025 : 0, now, 0.5);

    if (s.guitar !== null && now >= this.nextGuitar) {
      // Rasgueo: cada acorde dura dos tiempos; mejor ritmo y más cuerdas con la práctica.
      const beat = 0.62 - s.guitar * 0.12;
      const chord = CHORDS[Math.floor(this.step / 2) % CHORDS.length];
      chord.forEach((n, i) => this.note(this.detune(hz(n), s.guitar!), now + i * 0.018, 1.4, "pluck", 0.05));
      this.step++;
      this.nextGuitar = now + beat * (1 + (1 - s.guitar) * (Math.random() - 0.5) * 0.4);
    }
    if (s.guitar === null) this.nextGuitar = 0;

    if (s.violin !== null && now >= this.nextViolin) {
      const dur = 0.5 + s.violin * 0.3;
      this.note(this.detune(hz(VIOLIN[this.vstep % VIOLIN.length]), s.violin), now, dur, "bow", 0.045);
      this.vstep++;
      this.nextViolin = now + dur;
    }
    if (s.violin === null) this.nextViolin = 0;

    if (s.singing !== null && this.sungFor !== s.singing) {
      // Se canta una vez por cumpleaños.
      this.sungFor = s.singing;
      let at = now + 0.1;
      for (const [n, d] of BIRTHDAY) {
        this.note(hz(n), at, d * 0.42, "voice", 0.08);
        this.note(hz(n - 12), at, d * 0.42, "voice", 0.04);
        at += d * 0.45;
      }
    }
  }
}

/** Paisaje sonoro opcional. El audio solo se crea al activarlo (los navegadores lo exigen tras un clic). */
export function useSoundscape(enabled: boolean, state: SoundState) {
  const engine = useRef<Engine | null>(null);
  const latest = useRef(state);
  latest.current = state;

  useEffect(() => {
    if (!enabled) {
      engine.current?.ctx.suspend();
      return;
    }
    engine.current ??= new Engine();
    engine.current.ctx.resume();
    const id = setInterval(() => engine.current?.update(latest.current), 100);
    return () => clearInterval(id);
  }, [enabled]);

  useEffect(() => () => void engine.current?.ctx.close(), []);
}
