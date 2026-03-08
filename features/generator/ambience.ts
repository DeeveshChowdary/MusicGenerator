import { getMoodPreset } from "@/features/presets/moods";

import { createRng, hashSeed } from "./rng";
import type { AmbienceLayer, GeneratorControls } from "./types";

export function generateAmbience(controls: GeneratorControls): AmbienceLayer {
  const rng = createRng(hashSeed(controls.seed, "ambience"));
  const mood = getMoodPreset(controls.moodId);

  return {
    type: controls.ambienceType || mood.ambienceType,
    level: Math.max(0, Math.min(1, 0.22 + controls.vinylAmount * 0.25 + controls.reverbAmount * 0.1)),
    noiseColor: rng.range(0.2, 0.75),
    rainAmount: controls.ambienceType === "rain" ? rng.range(0.35, 0.75) : 0,
    roomAmount: ["cafe", "room", "nightCity"].includes(controls.ambienceType) ? rng.range(0.2, 0.55) : 0,
  };
}
