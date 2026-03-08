"use client";

import toWav from "audiobuffer-to-wav";
import * as Tone from "tone";

import type { AmbienceType, ChordEvent, DrumHit, LoopPattern, NoteEvent } from "@/features/generator/types";

interface StepMaps {
  drums: Map<number, DrumHit[]>;
  chords: Map<number, ChordEvent[]>;
  bass: Map<number, NoteEvent[]>;
  melody: Map<number, NoteEvent[]>;
}

export interface MeterSnapshot {
  drums: number;
  chords: number;
  bass: number;
  melody: number;
  ambience: number;
  master: number;
}

const AMBIENCE_FILES: Record<AmbienceType, string> = {
  vinyl: "/assets/ambience/vinyl.wav",
  rain: "/assets/ambience/rain.wav",
  cafe: "/assets/ambience/cafe.wav",
  nightCity: "/assets/ambience/night_city.wav",
  room: "/assets/ambience/room.wav",
  field: "/assets/ambience/room.wav",
  hiss: "/assets/ambience/vinyl.wav",
};

function dbToLinear(db: number): number {
  const v = Number.isFinite(db) ? db : -60;
  return Math.max(0, Math.min(1, (v + 60) / 60));
}

function groupByStep<T extends { step: number }>(items: T[]): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const item of items) {
    const list = map.get(item.step) ?? [];
    list.push(item);
    map.set(item.step, list);
  }
  return map;
}

function safeTime(time: number): number {
  return Number.isFinite(time) ? Math.max(0, time) : 0;
}

export class LoFiAudioEngine {
  private initialized = false;

  private pattern: LoopPattern | null = null;

  private stepMaps: StepMaps = {
    drums: new Map(),
    chords: new Map(),
    bass: new Map(),
    melody: new Map(),
  };

  private transportStep = 0;

  private transportEventId: number | null = null;

  private ambiencePath: string | null = null;

  private masterInput = new Tone.Gain(0.95);

  private lowPass = new Tone.Filter({
    frequency: 12_000,
    type: "lowpass",
    rolloff: -24,
  });

  private highPass = new Tone.Filter({
    frequency: 28,
    type: "highpass",
  });

  private compressor = new Tone.Compressor({ threshold: -20, ratio: 2.3, attack: 0.05, release: 0.23 });

  private limiter = new Tone.Limiter(-0.3);

  private drumsBus = new Tone.Gain(0.9);

  private chordsBus = new Tone.Gain(0.9);

  private bassBus = new Tone.Gain(0.86);

  private melodyBus = new Tone.Gain(0.8);

  private ambienceBus = new Tone.Gain(0.35);

  private reverb = new Tone.Reverb({ decay: 4.5, wet: 0.3, preDelay: 0.02 });

  private delay = new Tone.PingPongDelay({ delayTime: "8n", feedback: 0.12, wet: 0.14 });

  private wow = new Tone.Vibrato({ frequency: 3.2, depth: 0.08, wet: 0.2 });

  private drumSamples = new Tone.Players({
    kick: "/assets/samples/kick.wav",
    snare: "/assets/samples/snare.wav",
    hatClosed: "/assets/samples/hat_closed.wav",
    hatOpen: "/assets/samples/hat_open.wav",
    perc: "/assets/samples/perc.wav",
  });

  private ambiencePlayer = new Tone.Player({ loop: true, fadeIn: 0.2, fadeOut: 0.2 });

  private kickSynth = new Tone.MembraneSynth({
    pitchDecay: 0.03,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.26, sustain: 0, release: 0.2 },
  });

  private snareSynth = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.001, decay: 0.16, sustain: 0 },
  });

  private hatSynth = new Tone.MetalSynth({
    octaves: 1.5,
    envelope: { attack: 0.001, decay: 0.08, release: 0.02 },
    harmonicity: 5,
    modulationIndex: 42,
    resonance: 1700,
  });

  private percSynth = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.12 },
  });

  private chordSynth = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 1.1,
    modulationIndex: 4,
    oscillator: { type: "sine" },
    envelope: { attack: 0.03, decay: 0.2, sustain: 0.55, release: 1.4 },
  });

  private bassSynth = new Tone.MonoSynth({
    oscillator: { type: "triangle" },
    filter: { Q: 2, type: "lowpass", rolloff: -24 },
    envelope: { attack: 0.01, decay: 0.12, sustain: 0.38, release: 0.3 },
    filterEnvelope: {
      attack: 0.02,
      decay: 0.22,
      sustain: 0.1,
      baseFrequency: 110,
      octaves: 1.4,
    },
  });

  private melodySynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.02, decay: 0.2, sustain: 0.2, release: 0.35 },
  });

  private ambienceNoise = new Tone.Noise("pink");

  private ambienceNoiseFilter = new Tone.Filter({ frequency: 1900, type: "lowpass" });

  private ambienceNoiseGain = new Tone.Gain(0.08);

  private meters = {
    drums: new Tone.Meter(),
    chords: new Tone.Meter(),
    bass: new Tone.Meter(),
    melody: new Tone.Meter(),
    ambience: new Tone.Meter(),
    master: new Tone.Meter(),
  };

  constructor() {
    this.drumsBus.chain(this.meters.drums, this.masterInput);
    this.chordsBus.chain(this.meters.chords, this.reverb, this.wow, this.masterInput);
    this.bassBus.chain(this.meters.bass, this.masterInput);
    this.melodyBus.chain(this.meters.melody, this.delay, this.reverb, this.wow, this.masterInput);
    this.ambienceBus.chain(this.meters.ambience, this.masterInput);

    this.masterInput.chain(this.lowPass, this.highPass, this.compressor, this.limiter, this.meters.master, Tone.Destination);

    this.kickSynth.connect(this.drumsBus);
    this.snareSynth.connect(this.drumsBus);
    this.hatSynth.connect(this.drumsBus);
    this.percSynth.connect(this.drumsBus);
    this.drumSamples.connect(this.drumsBus);

    this.chordSynth.connect(this.chordsBus);
    this.bassSynth.connect(this.bassBus);
    this.melodySynth.connect(this.melodyBus);

    this.ambiencePlayer.connect(this.ambienceBus);
    this.ambienceNoise.chain(this.ambienceNoiseFilter, this.ambienceNoiseGain, this.ambienceBus);
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    await Tone.start();
    await Tone.loaded();
    this.ambienceNoise.start();
    this.initialized = true;
  }

  private clearSchedule(): void {
    if (this.transportEventId !== null) {
      Tone.Transport.clear(this.transportEventId);
      this.transportEventId = null;
    }
    this.transportStep = 0;
  }

  setPattern(pattern: LoopPattern): void {
    this.pattern = pattern;
    this.stepMaps = {
      drums: groupByStep(pattern.drums),
      chords: groupByStep(pattern.chords.map((chord) => ({ ...chord, step: chord.bar * 16 + Math.round(chord.beat * 4) }))),
      bass: groupByStep(pattern.bass),
      melody: groupByStep(pattern.melody),
    };

    this.applyMixFromPattern();
    this.loadAmbience(pattern.ambience.type).catch(() => {
      // Keep running even if ambience file load fails.
    });

    Tone.Transport.bpm.rampTo(pattern.controls.bpm, 0.1);
    Tone.Transport.swing = pattern.controls.swing;
    Tone.Transport.swingSubdivision = "8n";
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = `${pattern.controls.loopBars}m`;

    this.clearSchedule();
    this.transportEventId = Tone.Transport.scheduleRepeat((time) => {
      this.runStep(time);
      this.transportStep = (this.transportStep + 1) % (pattern.controls.loopBars * 16);
    }, "16n");
  }

  private async loadAmbience(type: AmbienceType): Promise<void> {
    const path = AMBIENCE_FILES[type];
    if (!path || path === this.ambiencePath) return;
    this.ambiencePath = path;
    await this.ambiencePlayer.load(path);
  }

  private applyMixFromPattern(): void {
    if (!this.pattern) return;
    const { controls, ambience } = this.pattern;

    this.lowPass.frequency.rampTo(2_500 + (1 - controls.lowPassWarmth) * 14_000, 0.12);
    this.reverb.wet.rampTo(Math.min(0.68, controls.reverbAmount), 0.12);
    this.wow.wet.rampTo(Math.min(0.55, controls.wowFlutter), 0.12);
    this.wow.depth.value = 0.01 + controls.wowFlutter * 0.16;

    this.masterInput.gain.rampTo(controls.masterVolume, 0.12);
    this.drumsBus.gain.rampTo(0.82 + controls.complexity * 0.12, 0.12);
    this.chordsBus.gain.rampTo(0.78 + controls.reverbAmount * 0.12, 0.12);
    this.bassBus.gain.rampTo(0.68 + (1 - controls.complexity) * 0.1, 0.12);
    this.melodyBus.gain.rampTo(controls.melodyDensity === "none" ? 0 : 0.7, 0.12);
    this.ambienceBus.gain.rampTo(Math.min(0.62, ambience.level + controls.vinylAmount * 0.22), 0.12);
    this.ambienceNoiseGain.gain.rampTo(0.02 + controls.vinylAmount * 0.12, 0.12);

    if (this.ambiencePlayer.loaded) {
      if (ambience.level > 0.02 && this.ambiencePlayer.state !== "started") {
        this.ambiencePlayer.start();
      } else if (ambience.level <= 0.02 && this.ambiencePlayer.state === "started") {
        this.ambiencePlayer.stop();
      }
    }
  }

  private runStep(time: number): void {
    if (!this.pattern) return;
    const step = this.transportStep;

    const drumHits = this.stepMaps.drums.get(step) ?? [];
    for (const hit of drumHits) {
      if (hit.muted) continue;
      this.triggerDrum(hit, safeTime(time + hit.offset));
    }

    const chordEvents = this.stepMaps.chords.get(step) ?? [];
    for (const chord of chordEvents) {
      this.chordSynth.triggerAttackRelease(
        chord.notes.map((note) => Tone.Frequency(note, "midi").toFrequency()),
        `${chord.durationBeats}n`,
        time,
        0.5,
      );
    }

    const bassEvents = this.stepMaps.bass.get(step) ?? [];
    for (const note of bassEvents) {
      this.bassSynth.triggerAttackRelease(
        Tone.Frequency(note.midi, "midi").toFrequency(),
        Tone.Time(`${Math.max(1, note.durationSteps)}*16n`).toSeconds(),
        safeTime(time + note.offset),
        note.velocity,
      );
    }

    const melodyEvents = this.stepMaps.melody.get(step) ?? [];
    for (const note of melodyEvents) {
      this.melodySynth.triggerAttackRelease(
        Tone.Frequency(note.midi, "midi").toFrequency(),
        Tone.Time(`${Math.max(1, note.durationSteps)}*16n`).toSeconds(),
        safeTime(time + note.offset),
        note.velocity,
      );
    }
  }

  private triggerDrum(hit: DrumHit, time: number): void {
    if (!this.pattern) return;

    if (this.pattern.controls.drumSource === "sample") {
      const player = this.drumSamples.player(hit.instrument);
      if (player?.loaded) {
        player.volume.value = Tone.gainToDb(Math.max(0.05, hit.velocity));
        player.start(time);
        return;
      }
    }

    switch (hit.instrument) {
      case "kick":
        this.kickSynth.triggerAttackRelease("C1", "8n", time, hit.velocity);
        break;
      case "snare":
        this.snareSynth.triggerAttackRelease("16n", time, hit.velocity);
        break;
      case "hatClosed":
        this.hatSynth.triggerAttackRelease("32n", time, hit.velocity * 0.7);
        break;
      case "hatOpen":
        this.hatSynth.triggerAttackRelease("8n", time, hit.velocity * 0.65);
        break;
      case "perc":
        this.percSynth.triggerAttackRelease("C4", "16n", time, hit.velocity * 0.7);
        break;
      default:
        break;
    }
  }

  async play(): Promise<void> {
    await this.init();
    if (!this.pattern) return;

    if (this.transportEventId === null) {
      this.setPattern(this.pattern);
    }

    if (this.ambiencePlayer.loaded && this.pattern.ambience.level > 0.02 && this.ambiencePlayer.state !== "started") {
      this.ambiencePlayer.start();
    }

    Tone.Transport.start("+0.01");
  }

  pause(): void {
    Tone.Transport.pause();
  }

  stop(): void {
    Tone.Transport.stop();
    this.transportStep = 0;
  }

  getMeters(): MeterSnapshot {
    return {
      drums: dbToLinear(this.meters.drums.getValue() as number),
      chords: dbToLinear(this.meters.chords.getValue() as number),
      bass: dbToLinear(this.meters.bass.getValue() as number),
      melody: dbToLinear(this.meters.melody.getValue() as number),
      ambience: dbToLinear(this.meters.ambience.getValue() as number),
      master: dbToLinear(this.meters.master.getValue() as number),
    };
  }

  async exportLoopToWav(bars: number): Promise<Blob> {
    if (!this.pattern) {
      throw new Error("No pattern available to export.");
    }

    const pattern = this.pattern;
    const secondsPerBar = (60 / pattern.controls.bpm) * 4;
    const duration = Math.max(2, bars * secondsPerBar + 1.2);

    const rendered = await Tone.Offline(({ transport }) => {
      const chordSynth = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 1.1,
        modulationIndex: 4,
        oscillator: { type: "sine" },
        envelope: { attack: 0.03, decay: 0.2, sustain: 0.55, release: 1.4 },
      }).toDestination();

      const bassSynth = new Tone.MonoSynth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.01, decay: 0.12, sustain: 0.36, release: 0.3 },
      }).toDestination();

      const melodySynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.2, release: 0.35 },
      }).toDestination();

      const kickSynth = new Tone.MembraneSynth().toDestination();
      const snareSynth = new Tone.NoiseSynth({ envelope: { attack: 0.001, decay: 0.16, sustain: 0 } }).toDestination();
      const hatSynth = new Tone.MetalSynth({
        octaves: 1.5,
        envelope: { attack: 0.001, decay: 0.08, release: 0.02 },
        harmonicity: 5,
        modulationIndex: 42,
        resonance: 1700,
      }).toDestination();

      const percSynth = new Tone.Synth({ oscillator: { type: "triangle" } }).toDestination();

      const totalSteps = bars * 16;
      const loopSteps = pattern.controls.loopBars * 16;
      const stepDuration = Tone.Time("16n").toSeconds();

      for (let step = 0; step < totalSteps; step += 1) {
        const time = step * stepDuration;
        const localStep = step % loopSteps;

        const drums = this.stepMaps.drums.get(localStep) ?? [];
        drums.forEach((hit) => {
          if (hit.muted) return;
          const t = safeTime(time + hit.offset);
          switch (hit.instrument) {
            case "kick":
              kickSynth.triggerAttackRelease("C1", "8n", t, hit.velocity);
              break;
            case "snare":
              snareSynth.triggerAttackRelease("16n", t, hit.velocity);
              break;
            case "hatClosed":
              hatSynth.triggerAttackRelease("32n", t, hit.velocity * 0.65);
              break;
            case "hatOpen":
              hatSynth.triggerAttackRelease("8n", t, hit.velocity * 0.55);
              break;
            case "perc":
              percSynth.triggerAttackRelease("C4", "16n", t, hit.velocity * 0.6);
              break;
            default:
              break;
          }
        });

        const chords = this.stepMaps.chords.get(localStep) ?? [];
        chords.forEach((chord) => {
          chordSynth.triggerAttackRelease(
            chord.notes.map((n) => Tone.Frequency(n, "midi").toFrequency()),
            `${chord.durationBeats}n`,
            time,
            0.5,
          );
        });

        const bass = this.stepMaps.bass.get(localStep) ?? [];
        bass.forEach((note) => {
          bassSynth.triggerAttackRelease(
            Tone.Frequency(note.midi, "midi").toFrequency(),
            stepDuration * Math.max(1, note.durationSteps),
            safeTime(time + note.offset),
            note.velocity,
          );
        });

        const melody = this.stepMaps.melody.get(localStep) ?? [];
        melody.forEach((note) => {
          melodySynth.triggerAttackRelease(
            Tone.Frequency(note.midi, "midi").toFrequency(),
            stepDuration * Math.max(1, note.durationSteps),
            safeTime(time + note.offset),
            note.velocity,
          );
        });
      }

      transport.bpm.value = pattern.controls.bpm;
      transport.start(0);
    }, duration);

    const audioBuffer = (rendered as unknown as { get?: () => AudioBuffer }).get?.() ?? (rendered as unknown as AudioBuffer);
    const wav = toWav(audioBuffer);

    return new Blob([wav], { type: "audio/wav" });
  }

  dispose(): void {
    this.stop();
    this.clearSchedule();
    this.ambienceNoise.stop();

    this.drumSamples.dispose();
    this.ambiencePlayer.dispose();
    this.kickSynth.dispose();
    this.snareSynth.dispose();
    this.hatSynth.dispose();
    this.percSynth.dispose();
    this.chordSynth.dispose();
    this.bassSynth.dispose();
    this.melodySynth.dispose();
    this.ambienceNoise.dispose();
    this.masterInput.dispose();
    this.lowPass.dispose();
    this.highPass.dispose();
    this.compressor.dispose();
    this.limiter.dispose();
    this.reverb.dispose();
    this.delay.dispose();
    this.wow.dispose();
    this.drumsBus.dispose();
    this.chordsBus.dispose();
    this.bassBus.dispose();
    this.melodyBus.dispose();
    this.ambienceBus.dispose();
    this.ambienceNoiseFilter.dispose();
    this.ambienceNoiseGain.dispose();

    Object.values(this.meters).forEach((meter) => meter.dispose());
  }
}
