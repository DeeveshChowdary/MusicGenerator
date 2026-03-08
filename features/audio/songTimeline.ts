import { quantizeToScale } from "@/features/generator/musicTheory";
import { createRng, hashSeed } from "@/features/generator/rng";
import type { ArrangementSection, ChordEvent, DrumHit, LoopPattern, NoteEvent } from "@/features/generator/types";

export interface SongTimeline {
  totalBars: number;
  totalSteps: number;
  drums: DrumHit[];
  chords: ChordEvent[];
  bass: NoteEvent[];
  melody: NoteEvent[];
  sectionByBar: ArrangementSection[];
}

function inBarStep(step: number): number {
  return ((step % 16) + 16) % 16;
}

function sourceBar(step: number): number {
  return Math.floor(step / 16);
}

function cloneChord(chord: ChordEvent, barShift: number, notes: number[] = chord.notes): ChordEvent {
  return {
    ...chord,
    bar: chord.bar + barShift,
    notes,
  };
}

export function buildSongTimeline(pattern: LoopPattern): SongTimeline {
  const arrangement = pattern.arrangement;
  const totalBars = Math.max(
    pattern.controls.loopBars,
    arrangement.reduce((sum, section) => sum + section.bars, 0),
  );
  const totalSteps = totalBars * 16;
  const loopBars = pattern.controls.loopBars;

  const rng = createRng(hashSeed(pattern.seed, "song-timeline"));

  const drums: DrumHit[] = [];
  const chords: ChordEvent[] = [];
  const bass: NoteEvent[] = [];
  const melody: NoteEvent[] = [];
  const sectionByBar: ArrangementSection[] = [];

  let barCursor = 0;

  for (const section of arrangement) {
    for (let localBar = 0; localBar < section.bars; localBar += 1) {
      const globalBar = barCursor + localBar;
      if (globalBar >= totalBars) break;

      const srcBar = globalBar % loopBars;
      const progress = section.bars > 1 ? localBar / (section.bars - 1) : 0;
      sectionByBar[globalBar] = section;

      const barDrums = pattern.drums.filter((hit) => sourceBar(hit.step) === srcBar);
      for (const hit of barDrums) {
        const localStep = inBarStep(hit.step);
        const globalStep = globalBar * 16 + localStep;

        // Keep groove foundation stable while varying hats/perc density by section.
        if (hit.instrument === "hatClosed" && rng.next() > section.hatsDensity) continue;
        if (hit.instrument === "hatOpen" && rng.next() > section.hatsDensity * 0.75) continue;
        if (hit.instrument === "perc" && rng.next() > section.hatsDensity * 0.7) continue;

        drums.push({
          ...hit,
          step: globalStep,
          velocity: Math.max(0.1, Math.min(1, hit.velocity * (0.88 + section.hatsDensity * 0.2) + rng.range(-0.03, 0.03))),
          offset: hit.offset + rng.range(-0.002, 0.003),
        });
      }

      // Pickup behavior near section boundaries.
      if (localBar === section.bars - 1 && rng.chance(section.fillChance)) {
        const base = globalBar * 16 + 12;
        for (let s = 0; s < 4; s += 1) {
          drums.push({
            instrument: s % 2 === 0 ? "snare" : "hatClosed",
            step: base + s,
            velocity: 0.42 + s * 0.06,
            offset: rng.range(-0.003, 0.006),
          });
        }
      }

      const barChords = pattern.chords.filter((chord) => chord.bar === srcBar);
      for (const chord of barChords) {
        let notes = chord.notes;
        if (section.name === "variation" && rng.chance(0.22 + progress * 0.12)) {
          notes = chord.notes.map((note, idx) => {
            if (idx !== chord.notes.length - 1) return note;
            return quantizeToScale(note + 2, pattern.controls.key, pattern.controls.scale, 3, 7);
          });
        }
        chords.push(cloneChord(chord, globalBar - srcBar, notes));
      }

      const barBass = pattern.bass.filter((note) => sourceBar(note.step) === srcBar);
      for (const note of barBass) {
        const step = globalBar * 16 + inBarStep(note.step);
        if (section.name === "strip" && inBarStep(note.step) > 8 && rng.chance(0.35)) continue;
        bass.push({
          ...note,
          step,
          velocity: Math.max(0.2, Math.min(0.92, note.velocity * (0.9 + section.filterCutoff * 0.2) + rng.range(-0.03, 0.03))),
        });
      }

      const barMelody = pattern.melody.filter((note) => sourceBar(note.step) === srcBar);
      for (const note of barMelody) {
        if (rng.next() > section.melodyPresence) continue;

        const shouldBend = section.name === "variation" && rng.chance(0.18);
        const nextMidi = shouldBend
          ? quantizeToScale(note.midi + rng.pick([-2, 2]), pattern.controls.key, pattern.controls.scale, 3, 7)
          : note.midi;

        melody.push({
          ...note,
          step: globalBar * 16 + inBarStep(note.step),
          midi: nextMidi,
          velocity: Math.max(0.12, Math.min(0.86, note.velocity * (0.82 + section.melodyPresence * 0.3) + rng.range(-0.03, 0.04))),
          offset: note.offset + rng.range(-0.003, 0.004),
        });
      }
    }

    barCursor += section.bars;
    if (barCursor >= totalBars) break;
  }

  // Ensure every bar has a section mapping.
  if (sectionByBar.length < totalBars) {
    const fallback = arrangement[arrangement.length - 1] ?? pattern.arrangement[0];
    for (let i = sectionByBar.length; i < totalBars; i += 1) {
      if (fallback) sectionByBar[i] = fallback;
    }
  }

  return {
    totalBars,
    totalSteps,
    drums: drums.sort((a, b) => a.step - b.step),
    chords: chords.sort((a, b) => a.bar * 4 + a.beat - (b.bar * 4 + b.beat)),
    bass: bass.sort((a, b) => a.step - b.step),
    melody: melody.sort((a, b) => a.step - b.step),
    sectionByBar,
  };
}
