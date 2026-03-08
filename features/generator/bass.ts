import { getMoodPreset } from "@/features/presets/moods";

import { quantizeToScale } from "./musicTheory";
import { createRng, hashSeed } from "./rng";
import type { ChordEvent, GeneratorControls, NoteEvent } from "./types";

function rootFromChord(chord: ChordEvent): number {
  const root = chord.notes[0] ?? 48;
  return root - 24;
}

export function generateBass(controls: GeneratorControls, chords: ChordEvent[]): NoteEvent[] {
  const rng = createRng(hashSeed(controls.seed, "bass"));
  const mood = getMoodPreset(controls.moodId);
  const events: NoteEvent[] = [];
  const stepsPerBar = 16;

  for (const chord of chords) {
    const startStep = chord.bar * stepsPerBar + Math.round(chord.beat * 4);
    const rootMidi = rootFromChord(chord);

    const sustainStyle = mood.bassMotion < 0.38 || controls.drumStyle === "minimal";
    if (sustainStyle && chord.durationBeats >= 2) {
      events.push({
        step: startStep,
        midi: quantizeToScale(rootMidi, controls.key, controls.scale, 1, 4),
        velocity: rng.range(0.52, 0.68),
        durationSteps: Math.max(4, Math.round(chord.durationBeats * 4)),
        offset: rng.range(-0.01, 0.015),
      });
      continue;
    }

    const pulseCount = chord.durationBeats >= 4 ? 2 : 1;
    for (let pulse = 0; pulse < pulseCount; pulse += 1) {
      const step = startStep + pulse * 8;
      const withOctave = rng.chance(0.14 + controls.complexity * 0.16) ? rootMidi + 12 : rootMidi;
      events.push({
        step,
        midi: quantizeToScale(withOctave, controls.key, controls.scale, 1, 5),
        velocity: rng.range(0.48, 0.72),
        durationSteps: pulseCount === 1 ? 8 : 6,
        offset: rng.range(-0.008, 0.012),
      });

      if (mood.bassMotion > 0.45 && rng.chance(0.45)) {
        const passing = quantizeToScale(withOctave + rng.pick([-2, 2, 5]), controls.key, controls.scale, 1, 5);
        events.push({
          step: step + 4,
          midi: passing,
          velocity: rng.range(0.34, 0.58),
          durationSteps: 3,
          offset: rng.range(-0.005, 0.009),
        });
      }
    }
  }

  return events.sort((a, b) => a.step - b.step);
}
