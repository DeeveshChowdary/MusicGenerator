import type { DrumHit } from "@/features/generator/types";

export interface ExportDrumVoice {
  play: (time: number, velocity: number) => void;
  availableAt: number;
  lastScheduled: number;
}

export type ExportDrumPools = Record<DrumHit["instrument"], ExportDrumVoice[]>;

export const EXPORT_DRUM_DURATION_STEPS: Record<DrumHit["instrument"], number> = {
  kick: 2,
  snare: 1,
  hatClosed: 0.5,
  hatOpen: 2,
  perc: 1,
};

function safeTime(time: number): number {
  return Number.isFinite(time) ? Math.max(0, time) : 0;
}

export function pickExportVoice(voices: ExportDrumVoice[]): ExportDrumVoice {
  return voices.reduce((best, voice) => (voice.availableAt < best.availableAt ? voice : best), voices[0]!);
}

export function scheduleExportDrumHit(
  pools: ExportDrumPools,
  hit: DrumHit,
  requestedTime: number,
  stepDuration: number,
): number {
  const voice = pickExportVoice(pools[hit.instrument]);
  const durationSeconds = EXPORT_DRUM_DURATION_STEPS[hit.instrument] * stepDuration;

  // Ensure the assigned voice receives strictly increasing, non-negative, finite times.
  const scheduled = Math.max(safeTime(requestedTime), voice.lastScheduled + 0.001, voice.availableAt + 0.001);

  voice.play(scheduled, hit.velocity);
  voice.lastScheduled = scheduled;
  voice.availableAt = scheduled + durationSeconds;

  return scheduled;
}
