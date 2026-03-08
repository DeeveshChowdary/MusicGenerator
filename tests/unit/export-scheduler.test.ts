import { describe, expect, it } from "vitest";

import { pickExportVoice, scheduleExportDrumHit, type ExportDrumPools, type ExportDrumVoice } from "@/features/audio/exportScheduler";
import type { DrumHit } from "@/features/generator/types";

function makeVoice(log: number[]): ExportDrumVoice {
  return {
    play: (time) => {
      log.push(time);
    },
    availableAt: 0,
    lastScheduled: 0,
  };
}

function makePools(overrides?: Partial<ExportDrumPools>): ExportDrumPools {
  const sharedLog: number[] = [];
  const defaults: ExportDrumPools = {
    kick: [makeVoice(sharedLog)],
    snare: [makeVoice(sharedLog)],
    hatClosed: [makeVoice(sharedLog)],
    hatOpen: [makeVoice(sharedLog)],
    perc: [makeVoice(sharedLog)],
  };
  return {
    ...defaults,
    ...overrides,
  };
}

function hit(instrument: DrumHit["instrument"], step = 0, offset = 0): DrumHit {
  return {
    instrument,
    step,
    velocity: 0.6,
    offset,
  };
}

describe("exportScheduler", () => {
  it("picks the voice with earliest availability", () => {
    const aLog: number[] = [];
    const bLog: number[] = [];
    const a = makeVoice(aLog);
    const b = makeVoice(bLog);

    a.availableAt = 2;
    b.availableAt = 0.5;

    const picked = pickExportVoice([a, b]);
    expect(picked).toBe(b);
  });

  it("schedules non-negative and strictly increasing times for one voice", () => {
    const log: number[] = [];
    const pools = makePools({ hatClosed: [makeVoice(log)] });
    const stepDuration = 0.125;

    scheduleExportDrumHit(pools, hit("hatClosed"), -0.003, stepDuration);
    scheduleExportDrumHit(pools, hit("hatClosed"), 0, stepDuration);
    scheduleExportDrumHit(pools, hit("hatClosed"), 0.001, stepDuration);

    expect(log.length).toBe(3);
    expect(log[0]).toBeGreaterThanOrEqual(0);
    expect(log[1]).toBeGreaterThan(log[0]);
    expect(log[2]).toBeGreaterThan(log[1]);
  });

  it("keeps each voice monotonic under dense hat scheduling", () => {
    const v1Log: number[] = [];
    const v2Log: number[] = [];
    const pools = makePools({
      hatClosed: [makeVoice(v1Log), makeVoice(v2Log)],
    });

    const stepDuration = 0.125;
    for (let i = 0; i < 64; i += 1) {
      const base = (i % 8) * 0.01;
      const requested = i % 2 === 0 ? base - 0.004 : base;
      scheduleExportDrumHit(pools, hit("hatClosed"), requested, stepDuration);
    }

    const checkMonotonic = (arr: number[]) => {
      for (let i = 1; i < arr.length; i += 1) {
        expect(arr[i]).toBeGreaterThan(arr[i - 1]);
      }
    };

    expect(v1Log.length + v2Log.length).toBe(64);
    checkMonotonic(v1Log);
    checkMonotonic(v2Log);
  });
});
