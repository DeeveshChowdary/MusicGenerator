import { generateAmbience } from "./ambience";
import { generateArrangement } from "./arrangement";
import { generateBass } from "./bass";
import { generateDrums } from "./drums";
import { generateHarmony } from "./harmony";
import { evolveDrums, evolveMelody } from "./humanize";
import { generateMelody } from "./melody";
import { createRng, hashSeed } from "./rng";
import type { GeneratorControls, LayerLocks, LoopPattern, MoodPreset } from "./types";

export function generateLoopPattern(
  controls: GeneratorControls,
  previous: LoopPattern | null,
  locks: LayerLocks,
): LoopPattern {
  const chords = locks.harmony && previous ? previous.chords : generateHarmony(controls);
  const drums = locks.drums && previous ? previous.drums : generateDrums(controls);
  const bass = locks.bass && previous ? previous.bass : generateBass(controls, chords);
  const melody = locks.melody && previous ? previous.melody : generateMelody(controls, chords);
  const ambience = locks.ambience && previous ? previous.ambience : generateAmbience(controls);
  const arrangement = generateArrangement(controls);

  return {
    id: `${controls.seed}-${Date.now()}`,
    seed: controls.seed,
    generatedAt: Date.now(),
    controls,
    chords,
    drums,
    bass,
    melody,
    ambience,
    arrangement,
  };
}

export function evolveLoop(pattern: LoopPattern, seedOffset = 1): LoopPattern {
  const nextSeed = pattern.seed + seedOffset;
  return {
    ...pattern,
    seed: nextSeed,
    generatedAt: Date.now(),
    drums: evolveDrums(pattern.drums, nextSeed),
    melody: evolveMelody(pattern.melody, nextSeed),
  };
}

export function reseedLayer(
  controls: GeneratorControls,
  previous: LoopPattern,
  layer: keyof LayerLocks,
): LoopPattern {
  const locks: LayerLocks = {
    drums: layer !== "drums",
    harmony: layer !== "harmony",
    bass: layer !== "bass",
    melody: layer !== "melody",
    ambience: layer !== "ambience",
  };
  return generateLoopPattern(controls, previous, locks);
}

export function createSurpriseControls(controls: GeneratorControls, moods: MoodPreset[]): GeneratorControls {
  const rng = createRng(hashSeed(controls.seed + 17, "surprise"));
  const mood = rng.pick(moods);
  const bpm = rng.int(mood.bpmRange[0], mood.bpmRange[1]);

  return {
    ...controls,
    moodId: mood.id,
    bpm,
    key: rng.pick(mood.keys),
    scale: rng.pick(mood.scales),
    drumStyle: mood.defaultDrumStyle,
    swing: Math.min(0.34, Math.max(0.04, mood.swing + rng.range(-0.05, 0.05))),
    ambienceType: mood.ambienceType,
    complexity: Math.min(0.85, Math.max(0.15, mood.melodicComplexity + rng.range(-0.1, 0.2))),
    melodyDensity: rng.pick(["sparse", "balanced", "balanced", "expressive"]),
    vinylAmount: Math.min(1, Math.max(0, 0.3 + mood.tapeWobble + rng.range(-0.15, 0.15))),
    reverbAmount: Math.min(1, Math.max(0, mood.reverbWidth + rng.range(-0.1, 0.1))),
    lowPassWarmth: Math.min(1, Math.max(0, mood.filterAmount + rng.range(-0.1, 0.12))),
    wowFlutter: Math.min(1, Math.max(0, mood.tapeWobble + rng.range(-0.12, 0.1))),
    loopBars: rng.pick([2, 4, 4, 8]),
    seed: rng.int(1000, 99_999_999),
  };
}
