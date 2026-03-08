import { getMoodPreset } from "@/features/presets/moods";

import { bestVoiceLeading, chordFromDegree, constrainRange, midiToNoteName, quantizeToScale, SCALE_INTERVALS } from "./musicTheory";
import { createRng, hashSeed } from "./rng";
import type { ChordEvent, GeneratorControls } from "./types";

interface ProgressionStep {
  degree: number;
  quality: string;
  borrowed?: number;
}

const PROGRESSION_LIBRARY: Record<string, ProgressionStep[][]> = {
  major: [
    [
      { degree: 0, quality: "maj7" },
      { degree: 5, quality: "min7" },
      { degree: 1, quality: "min7" },
      { degree: 4, quality: "dom7" },
    ],
    [
      { degree: 1, quality: "min7" },
      { degree: 4, quality: "dom7" },
      { degree: 0, quality: "maj7" },
      { degree: 0, quality: "add9" },
    ],
    [
      { degree: 0, quality: "maj9" },
      { degree: 3, quality: "min7" },
      { degree: 4, quality: "sus2" },
      { degree: 0, quality: "maj7" },
    ],
  ],
  minor: [
    [
      { degree: 0, quality: "min9" },
      { degree: 5, quality: "maj7" },
      { degree: 2, quality: "maj7" },
      { degree: 6, quality: "dom7" },
    ],
    [
      { degree: 1, quality: "min7" },
      { degree: 4, quality: "dom7", borrowed: 1 },
      { degree: 0, quality: "min9" },
      { degree: 0, quality: "sus2" },
    ],
    [
      { degree: 0, quality: "min7" },
      { degree: 3, quality: "maj7" },
    ],
  ],
  dorian: [
    [
      { degree: 0, quality: "min7" },
      { degree: 3, quality: "maj7" },
      { degree: 6, quality: "dom7" },
      { degree: 0, quality: "min9" },
    ],
    [
      { degree: 0, quality: "sus2" },
      { degree: 4, quality: "min7" },
      { degree: 0, quality: "eleventh" },
      { degree: 6, quality: "dom7" },
    ],
  ],
  mixolydian: [
    [
      { degree: 0, quality: "dom7" },
      { degree: 3, quality: "min7" },
      { degree: 4, quality: "sus4" },
      { degree: 0, quality: "add9" },
    ],
  ],
  lydian: [
    [
      { degree: 0, quality: "maj9" },
      { degree: 1, quality: "sus2" },
      { degree: 4, quality: "maj7" },
      { degree: 0, quality: "add9" },
    ],
  ],
};

function progressionForLength(pattern: ProgressionStep[], bars: number): ProgressionStep[] {
  if (pattern.length === bars) return pattern;

  const steps: ProgressionStep[] = [];
  for (let i = 0; i < bars; i += 1) {
    steps.push(pattern[i % pattern.length]!);
  }
  return steps;
}

export function generateHarmony(controls: GeneratorControls): ChordEvent[] {
  const rng = createRng(hashSeed(controls.seed, "harmony"));
  const mood = getMoodPreset(controls.moodId);
  const templates = PROGRESSION_LIBRARY[controls.scale] ?? PROGRESSION_LIBRARY.minor;
  const template = rng.pick(templates);
  const progression = progressionForLength(template, controls.loopBars);
  const chordEvents: ChordEvent[] = [];

  let previousVoicing: number[] | null = null;
  const density = controls.complexity > 0.62 ? 2 : 1;

  for (let bar = 0; bar < controls.loopBars; bar += 1) {
    const step = progression[bar % progression.length] ?? progression[0]!;
    const baseChord = chordFromDegree(controls.key, controls.scale, step.degree, step.quality, 4);

    const chordWithBorrowed = step.borrowed
      ? baseChord.map((note, index) => (index === 0 ? note + step.borrowed! : note))
      : baseChord;

    let voiced = bestVoiceLeading(previousVoicing, chordWithBorrowed);
    voiced = constrainRange(voiced, 55, 79);
    previousVoicing = voiced;

    chordEvents.push({
      bar,
      beat: 0,
      durationBeats: density === 2 ? 2 : 4,
      notes: voiced,
      root: midiToNoteName(voiced[0] ?? 60),
      quality: step.quality,
      name: `${midiToNoteName(voiced[0] ?? 60)} ${step.quality}`,
    });

    if (density === 2) {
      const colorTone = voiced.map((note) => quantizeToScale(note + (rng.chance(0.5) ? 2 : -2), controls.key, controls.scale));
      const weighted = mood.melodicComplexity > 0.35 ? colorTone : voiced;
      chordEvents.push({
        bar,
        beat: 2,
        durationBeats: 2,
        notes: constrainRange(weighted, 55, 81),
        root: midiToNoteName(weighted[0] ?? 60),
        quality: rng.pick(mood.chordStyles),
        name: `${midiToNoteName(weighted[0] ?? 60)} alt`,
      });
    }

    if (mood.fillProbability > 0.16 && bar === controls.loopBars - 1 && rng.chance(0.35)) {
      const dominantDegree = (step.degree + 4) % SCALE_INTERVALS[controls.scale].length;
      const turnaround = chordFromDegree(controls.key, controls.scale, dominantDegree, "dom7", 4);
      chordEvents.push({
        bar,
        beat: 3,
        durationBeats: 1,
        notes: constrainRange(turnaround, 57, 82),
        root: midiToNoteName(turnaround[0] ?? 67),
        quality: "dom7",
        name: "Turnaround",
      });
    }
  }

  return chordEvents.sort((a, b) => a.bar * 4 + a.beat - (b.bar * 4 + b.beat));
}
