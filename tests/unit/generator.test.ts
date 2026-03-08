import { describe, expect, it } from "vitest";

import { generateLoopPattern } from "@/features/generator";
import { DEFAULT_CONTROLS } from "@/features/presets/moods";

const unlocked = {
  drums: false,
  harmony: false,
  bass: false,
  melody: false,
  ambience: false,
};

describe("generateLoopPattern", () => {
  it("is deterministic for the same seed and controls", () => {
    const controls = { ...DEFAULT_CONTROLS, seed: 9999, loopBars: 4 as const };

    const one = generateLoopPattern(controls, null, unlocked);
    const two = generateLoopPattern(controls, null, unlocked);

    expect(one.chords).toEqual(two.chords);
    expect(one.drums).toEqual(two.drums);
    expect(one.bass).toEqual(two.bass);
    expect(one.melody).toEqual(two.melody);
    expect(one.ambience).toEqual(two.ambience);
  });

  it("supports layer locks to preserve content", () => {
    const controls = { ...DEFAULT_CONTROLS, seed: 2222 };
    const base = generateLoopPattern(controls, null, unlocked);

    const regenerated = generateLoopPattern(
      { ...controls, seed: 3333 },
      base,
      {
        drums: true,
        harmony: false,
        bass: false,
        melody: false,
        ambience: true,
      },
    );

    expect(regenerated.drums).toEqual(base.drums);
    expect(regenerated.ambience).toEqual(base.ambience);
    expect(regenerated.chords).not.toEqual(base.chords);
  });
});
