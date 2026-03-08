import { getMoodPreset } from "@/features/presets/moods";

import { quantizeToScale } from "./musicTheory";
import { createRng, hashSeed } from "./rng";
import type { ChordEvent, GeneratorControls, MelodyDensity, NoteEvent } from "./types";

const DENSITY_TO_PROB: Record<MelodyDensity, number> = {
  none: 0,
  sparse: 0.26,
  balanced: 0.44,
  expressive: 0.62,
};

const MOTIFS: number[][] = [
  [0, 2, -1, 2],
  [0, 3, 2, 0],
  [0, -2, 1, 2],
  [0, 5, 2, 0],
  [0, 2, 4, 2],
];

function chooseMotif(rng: ReturnType<typeof createRng>): number[] {
  return [...rng.pick(MOTIFS)];
}

export function generateMelody(controls: GeneratorControls, chords: ChordEvent[]): NoteEvent[] {
  const rng = createRng(hashSeed(controls.seed, "melody"));
  const mood = getMoodPreset(controls.moodId);

  if (controls.melodyDensity === "none") {
    return [];
  }

  const events: NoteEvent[] = [];
  const probability = DENSITY_TO_PROB[controls.melodyDensity] + mood.melodicComplexity * 0.15;
  const baseMotif = chooseMotif(rng);

  for (let bar = 0; bar < controls.loopBars; bar += 1) {
    const shouldSpeak = rng.chance(probability);
    if (!shouldSpeak) continue;

    const referenceChord =
      chords.find((chord) => chord.bar === bar && chord.beat === 0) ??
      chords.find((chord) => chord.bar === bar) ??
      chords[0];

    if (!referenceChord) continue;

    const base = (referenceChord.notes[1] ?? referenceChord.notes[0] ?? 60) + 12;
    const motif = bar % 2 === 0 ? baseMotif : baseMotif.map((n, idx) => (idx % 2 === 0 ? n : n + rng.pick([-1, 1])));

    const phraseStart = bar * 16 + (bar % 2 === 0 ? 2 : 6);

    motif.forEach((interval, idx) => {
      if (rng.chance(0.18) && idx > 1) return;

      const note = quantizeToScale(base + interval + (rng.chance(0.16) ? 12 : 0), controls.key, controls.scale, 3, 6);
      const step = phraseStart + idx * 2;

      events.push({
        step,
        midi: note,
        velocity: rng.range(0.32, 0.64),
        durationSteps: rng.chance(0.3) ? 3 : 2,
        offset: rng.range(-0.014, 0.02),
      });
    });

    // Call-and-response over 4 bars.
    if (controls.loopBars >= 4 && bar % 4 === 2 && rng.chance(0.68)) {
      const responseStart = bar * 16 + 10;
      const response = motif.slice(0, 3).map((n) => n - 2);
      response.forEach((interval, idx) => {
        events.push({
          step: responseStart + idx * 2,
          midi: quantizeToScale(base + interval, controls.key, controls.scale, 3, 6),
          velocity: rng.range(0.28, 0.52),
          durationSteps: 2,
          offset: rng.range(-0.01, 0.016),
        });
      });
    }
  }

  return events.sort((a, b) => a.step - b.step);
}
