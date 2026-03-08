import type { GeneratorControls } from "@/features/generator/types";

export function buildWavFilename(controls: GeneratorControls): string {
  const mood = controls.moodId.replace(/\s+/g, "-").toLowerCase();
  return `lofi-foundry-${mood}-${controls.seed}-${controls.exportBars}bars.wav`;
}

export function buildSessionFilename(seed: number): string {
  return `lofi-foundry-session-${seed}.json`;
}
