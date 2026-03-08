import { getMoodPreset } from "@/features/presets/moods";

import { createRng, hashSeed } from "./rng";
import type { DrumHit, GeneratorControls } from "./types";

const STEPS_PER_BAR = 16;

interface DrumTemplate {
  kick: number[];
  snare: number[];
  hatClosed: number[];
  hatOpen: number[];
  perc: number[];
}

const DRUM_TEMPLATES: Record<GeneratorControls["drumStyle"], DrumTemplate> = {
  boomBap: {
    kick: [0, 7, 10],
    snare: [4, 12],
    hatClosed: [2, 6, 8, 10, 14],
    hatOpen: [15],
    perc: [3, 11],
  },
  chillHop: {
    kick: [0, 8, 11],
    snare: [4, 12],
    hatClosed: [0, 2, 4, 6, 8, 10, 12, 14],
    hatOpen: [7, 15],
    perc: [5, 13],
  },
  jazzHop: {
    kick: [0, 6, 10],
    snare: [4, 12],
    hatClosed: [1, 3, 5, 7, 9, 11, 13, 15],
    hatOpen: [6, 14],
    perc: [2, 8, 15],
  },
  minimal: {
    kick: [0, 8],
    snare: [4, 12],
    hatClosed: [4, 8, 12],
    hatOpen: [15],
    perc: [10],
  },
  sleepy: {
    kick: [0, 9],
    snare: [4, 12],
    hatClosed: [2, 6, 10, 14],
    hatOpen: [15],
    perc: [11],
  },
  tapeCrunch: {
    kick: [0, 7, 10],
    snare: [4, 12],
    hatClosed: [0, 2, 3, 6, 8, 10, 11, 14],
    hatOpen: [5, 15],
    perc: [9, 13],
  },
};

function pushHits(
  hits: DrumHit[],
  instrument: DrumHit["instrument"],
  steps: number[],
  bar: number,
  rngSeed: ReturnType<typeof createRng>,
  swing: number,
  density: number,
): void {
  for (const step of steps) {
    const globalStep = bar * STEPS_PER_BAR + step;
    const isOffbeat = step % 2 === 1;
    const chanceAdjust = instrument === "hatClosed" ? density + 0.1 : density;
    if (!rngSeed.chance(Math.min(chanceAdjust, 0.98))) continue;

    const velocityBase =
      instrument === "kick" ? 0.84 : instrument === "snare" ? 0.74 : instrument === "hatOpen" ? 0.52 : 0.48;

    hits.push({
      instrument,
      step: globalStep,
      velocity: Math.max(0.1, Math.min(1, velocityBase + rngSeed.range(-0.14, 0.12))),
      offset: isOffbeat ? swing * 0.12 + rngSeed.range(-0.01, 0.02) : rngSeed.range(-0.01, 0.01),
      muted: instrument === "hatClosed" && rngSeed.chance(0.06),
    });
  }
}

export function generateDrums(controls: GeneratorControls): DrumHit[] {
  const rng = createRng(hashSeed(controls.seed, "drums"));
  const template = DRUM_TEMPLATES[controls.drumStyle] ?? DRUM_TEMPLATES.sleepy;
  const mood = getMoodPreset(controls.moodId);
  const density = Math.max(0.2, Math.min(0.95, mood.drumDensity + controls.complexity * 0.22));

  const hits: DrumHit[] = [];

  for (let bar = 0; bar < controls.loopBars; bar += 1) {
    pushHits(hits, "kick", template.kick, bar, rng, controls.swing, density);
    pushHits(hits, "snare", template.snare, bar, rng, controls.swing, 0.98);
    pushHits(hits, "hatClosed", template.hatClosed, bar, rng, controls.swing, density);
    pushHits(hits, "hatOpen", template.hatOpen, bar, rng, controls.swing, density * 0.5 + 0.2);
    pushHits(hits, "perc", template.perc, bar, rng, controls.swing, density * 0.5);

    const everyBars = controls.loopBars >= 8 ? 4 : 2;
    const shouldFill = (bar + 1) % everyBars === 0 && rng.chance(mood.fillProbability + controls.complexity * 0.12);

    if (shouldFill) {
      const fillStart = bar * STEPS_PER_BAR + 12;
      for (let step = fillStart; step < fillStart + 4; step += 1) {
        hits.push({
          instrument: step % 2 === 0 ? "snare" : "hatClosed",
          step,
          velocity: rng.range(0.35, 0.66),
          offset: rng.range(-0.012, 0.018),
        });
      }
    }
  }

  return hits.sort((a, b) => a.step - b.step);
}
