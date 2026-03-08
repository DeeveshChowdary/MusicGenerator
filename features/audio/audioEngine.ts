"use client";

import toWav from "audiobuffer-to-wav";
import * as Tone from "tone";

import { scheduleExportDrumHit, type ExportDrumPools } from "@/features/audio/exportScheduler";
import { buildSongTimeline } from "@/features/audio/songTimeline";
import type { AmbienceType, ArrangementSection, ChordEvent, DrumHit, LoopPattern, NoteEvent } from "@/features/generator/types";

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

type ScheduleVoiceKey = "kick" | "snare" | "hatClosed" | "hatOpen" | "perc" | "bass" | "melody" | "chord";

function monotonicTime(target: number, last: number): number {
  const t = safeTime(target);
  if (t > last) return t;
  return last + 0.001;
}

function drumVoiceKey(instrument: DrumHit["instrument"]): "kick" | "snare" | "hatClosed" | "hatOpen" | "perc" {
  if (instrument === "hatClosed") return "hatClosed";
  if (instrument === "hatOpen") return "hatOpen";
  if (instrument === "perc") return "perc";
  if (instrument === "snare") return "snare";
  return "kick";
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

  private totalSteps = 64;

  private totalBars = 4;

  private sectionByBar: ArrangementSection[] = [];

  private activeSectionName: ArrangementSection["name"] | null = null;

  private liveCursor: Record<ScheduleVoiceKey, number> = {
    kick: 0,
    snare: 0,
    hatClosed: 0,
    hatOpen: 0,
    perc: 0,
    bass: 0,
    melody: 0,
    chord: 0,
  };

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

  private hatClosedSynth = new Tone.MetalSynth({
    octaves: 1.5,
    envelope: { attack: 0.001, decay: 0.08, release: 0.02 },
    harmonicity: 5,
    modulationIndex: 42,
    resonance: 1700,
  });

  private hatOpenSynth = new Tone.MetalSynth({
    octaves: 1.5,
    envelope: { attack: 0.001, decay: 0.16, release: 0.04 },
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
    this.hatClosedSynth.connect(this.drumsBus);
    this.hatOpenSynth.connect(this.drumsBus);
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
    this.resetLiveCursor();
  }

  private resetLiveCursor(): void {
    this.liveCursor = {
      kick: 0,
      snare: 0,
      hatClosed: 0,
      hatOpen: 0,
      perc: 0,
      bass: 0,
      melody: 0,
      chord: 0,
    };
  }

  setPattern(pattern: LoopPattern): void {
    this.pattern = pattern;
    const timeline = buildSongTimeline(pattern);

    this.totalBars = timeline.totalBars;
    this.totalSteps = timeline.totalSteps;
    this.sectionByBar = timeline.sectionByBar;
    this.activeSectionName = null;
    this.resetLiveCursor();

    this.stepMaps = {
      drums: groupByStep(timeline.drums),
      chords: groupByStep(timeline.chords.map((chord) => ({ ...chord, step: chord.bar * 16 + Math.round(chord.beat * 4) }))),
      bass: groupByStep(timeline.bass),
      melody: groupByStep(timeline.melody),
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
    Tone.Transport.loopEnd = `${timeline.totalBars}m`;

    this.clearSchedule();
    this.transportEventId = Tone.Transport.scheduleRepeat((time) => {
      this.runStep(time);
      this.transportStep = (this.transportStep + 1) % this.totalSteps;
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
    const barIndex = Math.floor(step / 16);
    const section = this.sectionByBar[barIndex];

    if (section && section.name !== this.activeSectionName) {
      this.activeSectionName = section.name;
      this.applySectionAutomation(section);
    }

    const drumHits = [...(this.stepMaps.drums.get(step) ?? [])].sort((a, b) => a.offset - b.offset);
    for (const hit of drumHits) {
      if (hit.muted) continue;
      const key = drumVoiceKey(hit.instrument);
      const scheduled = monotonicTime(time + hit.offset, this.liveCursor[key]);
      this.liveCursor[key] = scheduled;
      this.triggerDrum(hit, scheduled);
    }

    const chordEvents = this.stepMaps.chords.get(step) ?? [];
    for (const chord of chordEvents) {
      const chordTime = monotonicTime(time, this.liveCursor.chord);
      this.liveCursor.chord = chordTime;
      this.chordSynth.triggerAttackRelease(
        chord.notes.map((note) => Tone.Frequency(note, "midi").toFrequency()),
        `${chord.durationBeats}n`,
        chordTime,
        0.5,
      );
    }

    const bassEvents = [...(this.stepMaps.bass.get(step) ?? [])].sort((a, b) => a.offset - b.offset);
    for (const note of bassEvents) {
      const bassTime = monotonicTime(time + note.offset, this.liveCursor.bass);
      this.liveCursor.bass = bassTime;
      this.bassSynth.triggerAttackRelease(
        Tone.Frequency(note.midi, "midi").toFrequency(),
        Tone.Time(`${Math.max(1, note.durationSteps)}*16n`).toSeconds(),
        bassTime,
        note.velocity,
      );
    }

    const melodyEvents = [...(this.stepMaps.melody.get(step) ?? [])].sort((a, b) => a.offset - b.offset);
    for (const note of melodyEvents) {
      const melodyTime = monotonicTime(time + note.offset, this.liveCursor.melody);
      this.liveCursor.melody = melodyTime;
      this.melodySynth.triggerAttackRelease(
        Tone.Frequency(note.midi, "midi").toFrequency(),
        Tone.Time(`${Math.max(1, note.durationSteps)}*16n`).toSeconds(),
        melodyTime,
        note.velocity,
      );
    }
  }

  private applySectionAutomation(section: ArrangementSection): void {
    if (!this.pattern) return;
    const controls = this.pattern.controls;

    const targetLowPass = 1_500 + section.filterCutoff * 13_500 + (1 - controls.lowPassWarmth) * 2_000;
    const melodyBase = controls.melodyDensity === "none" ? 0 : 0.25;

    this.lowPass.frequency.rampTo(targetLowPass, 0.18);
    this.drumsBus.gain.rampTo(0.68 + section.hatsDensity * 0.34, 0.18);
    this.chordsBus.gain.rampTo(0.66 + section.filterCutoff * 0.25, 0.18);
    this.bassBus.gain.rampTo(0.62 + section.filterCutoff * 0.15, 0.18);
    this.melodyBus.gain.rampTo(melodyBase + section.melodyPresence * 0.42, 0.18);
    this.ambienceBus.gain.rampTo(0.18 + section.ambienceIntensity * 0.42 + controls.vinylAmount * 0.08, 0.18);
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
        this.hatClosedSynth.triggerAttackRelease("32n", time, hit.velocity * 0.7);
        break;
      case "hatOpen":
        this.hatOpenSynth.triggerAttackRelease("8n", time, hit.velocity * 0.65);
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

      const totalSteps = bars * 16;
      const timelineSteps = this.totalSteps;
      const stepDuration = Tone.Time("16n").toSeconds();

      const kickVoiceNodes = Array.from({ length: 4 }, () => new Tone.MembraneSynth().toDestination());
      const snareVoiceNodes = Array.from(
        { length: 4 },
        () => new Tone.NoiseSynth({ envelope: { attack: 0.001, decay: 0.16, sustain: 0 } }).toDestination(),
      );
      const hatClosedVoiceNodes = Array.from(
        { length: 8 },
        () =>
          new Tone.NoiseSynth({
            noise: { type: "white" },
            envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
          }).toDestination(),
      );
      const hatOpenVoiceNodes = Array.from(
        { length: 6 },
        () =>
          new Tone.NoiseSynth({
            noise: { type: "pink" },
            envelope: { attack: 0.001, decay: 0.14, sustain: 0 },
          }).toDestination(),
      );
      const percVoiceNodes = Array.from(
        { length: 4 },
        () => new Tone.Synth({ oscillator: { type: "triangle" } }).toDestination(),
      );

      const exportDrumPools: ExportDrumPools = {
        kick: kickVoiceNodes.map((node) => ({
          play: (time, velocity) => node.triggerAttackRelease("C1", "8n", time, velocity),
          availableAt: 0,
          lastScheduled: 0,
        })),
        snare: snareVoiceNodes.map((node) => ({
          play: (time, velocity) => node.triggerAttackRelease("16n", time, velocity),
          availableAt: 0,
          lastScheduled: 0,
        })),
        hatClosed: hatClosedVoiceNodes.map((node) => ({
          play: (time, velocity) => node.triggerAttackRelease("32n", time, velocity * 0.65),
          availableAt: 0,
          lastScheduled: 0,
        })),
        hatOpen: hatOpenVoiceNodes.map((node) => ({
          play: (time, velocity) => node.triggerAttackRelease("8n", time, velocity * 0.55),
          availableAt: 0,
          lastScheduled: 0,
        })),
        perc: percVoiceNodes.map((node) => ({
          play: (time, velocity) => node.triggerAttackRelease("C4", "16n", time, velocity * 0.6),
          availableAt: 0,
          lastScheduled: 0,
        })),
      };
      const exportCursor: Record<ScheduleVoiceKey, number> = {
        kick: 0,
        snare: 0,
        hatClosed: 0,
        hatOpen: 0,
        perc: 0,
        bass: 0,
        melody: 0,
        chord: 0,
      };

      for (let step = 0; step < totalSteps; step += 1) {
        const time = step * stepDuration;
        const sourceStep = step % timelineSteps;

        const drums = [...(this.stepMaps.drums.get(sourceStep) ?? [])].sort((a, b) => a.offset - b.offset);
        drums.forEach((hit) => {
          if (hit.muted) return;
          const key = drumVoiceKey(hit.instrument);
          const t = scheduleExportDrumHit(exportDrumPools, hit, time + hit.offset, stepDuration);
          exportCursor[key] = t;
        });

        const chords = this.stepMaps.chords.get(sourceStep) ?? [];
        chords.forEach((chord) => {
          const chordTime = monotonicTime(time, exportCursor.chord);
          exportCursor.chord = chordTime;
          chordSynth.triggerAttackRelease(
            chord.notes.map((n) => Tone.Frequency(n, "midi").toFrequency()),
            `${chord.durationBeats}n`,
            chordTime,
            0.5,
          );
        });

        const bass = [...(this.stepMaps.bass.get(sourceStep) ?? [])].sort((a, b) => a.offset - b.offset);
        bass.forEach((note) => {
          const bassTime = monotonicTime(time + note.offset, exportCursor.bass);
          exportCursor.bass = bassTime;
          bassSynth.triggerAttackRelease(
            Tone.Frequency(note.midi, "midi").toFrequency(),
            stepDuration * Math.max(1, note.durationSteps),
            bassTime,
            note.velocity,
          );
        });

        const melody = [...(this.stepMaps.melody.get(sourceStep) ?? [])].sort((a, b) => a.offset - b.offset);
        melody.forEach((note) => {
          const melodyTime = monotonicTime(time + note.offset, exportCursor.melody);
          exportCursor.melody = melodyTime;
          melodySynth.triggerAttackRelease(
            Tone.Frequency(note.midi, "midi").toFrequency(),
            stepDuration * Math.max(1, note.durationSteps),
            melodyTime,
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
    this.hatClosedSynth.dispose();
    this.hatOpenSynth.dispose();
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
