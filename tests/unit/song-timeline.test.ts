import { describe, expect, it } from "vitest";

import { buildSongTimeline } from "@/features/audio/songTimeline";
import { generateLoopPattern } from "@/features/generator";
import { DEFAULT_CONTROLS } from "@/features/presets/moods";

describe("buildSongTimeline", () => {
  it("expands a loop into deterministic arranged timeline", () => {
    const pattern = generateLoopPattern(
      {
        ...DEFAULT_CONTROLS,
        seed: 424242,
        bpm: 80,
        arrangementMinutes: 1,
        loopBars: 4,
      },
      null,
      { drums: false, harmony: false, bass: false, melody: false, ambience: false },
    );

    const a = buildSongTimeline(pattern);
    const b = buildSongTimeline(pattern);

    expect(a.totalBars).toBeGreaterThanOrEqual(16);
    expect(a.totalBars).toBe(b.totalBars);
    expect(a.drums).toEqual(b.drums);
    expect(a.melody).toEqual(b.melody);
  });

  it("creates section-level variation while staying continuous", () => {
    const pattern = generateLoopPattern(
      {
        ...DEFAULT_CONTROLS,
        seed: 8989,
        bpm: 78,
        arrangementMinutes: 1,
        loopBars: 4,
      },
      null,
      { drums: false, harmony: false, bass: false, melody: false, ambience: false },
    );

    const timeline = buildSongTimeline(pattern);

    const earlyHits = timeline.drums.filter((hit) => hit.step < 16 * 4).length;
    const lateHits = timeline.drums.filter((hit) => hit.step >= (timeline.totalBars - 4) * 16).length;

    expect(timeline.totalBars).toBeGreaterThan(pattern.controls.loopBars);
    expect(earlyHits).toBeGreaterThan(0);
    expect(lateHits).toBeGreaterThan(0);
    expect(Math.abs(earlyHits - lateHits)).toBeGreaterThanOrEqual(1);
  });
});
