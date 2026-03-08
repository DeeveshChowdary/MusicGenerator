import { describe, expect, it } from "vitest";

import { generateLoopPattern } from "@/features/generator";
import { DEFAULT_CONTROLS } from "@/features/presets/moods";

describe("core generation behavior", () => {
  it("produces musically bounded MIDI note ranges", () => {
    const loop = generateLoopPattern(
      {
        ...DEFAULT_CONTROLS,
        seed: 7007,
        complexity: 0.6,
        loopBars: 8,
      },
      null,
      { drums: false, harmony: false, bass: false, melody: false, ambience: false },
    );

    loop.chords.forEach((chord) => {
      chord.notes.forEach((note) => {
        expect(note).toBeGreaterThanOrEqual(45);
        expect(note).toBeLessThanOrEqual(90);
      });
    });

    loop.bass.forEach((note) => {
      expect(note.midi).toBeGreaterThanOrEqual(24);
      expect(note.midi).toBeLessThanOrEqual(72);
    });

    loop.melody.forEach((note) => {
      expect(note.midi).toBeGreaterThanOrEqual(48);
      expect(note.midi).toBeLessThanOrEqual(96);
    });
  });
});
