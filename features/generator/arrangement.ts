import { createRng, hashSeed } from "./rng";
import type { ArrangementSection, GeneratorControls } from "./types";

function barsFromMinutes(minutes: number, bpm: number): number {
  const beats = minutes * bpm;
  return Math.max(16, Math.round(beats / 4));
}

export function generateArrangement(controls: GeneratorControls): ArrangementSection[] {
  const rng = createRng(hashSeed(controls.seed, "arrangement"));
  const totalBars = barsFromMinutes(controls.arrangementMinutes, controls.bpm);

  const introBars = Math.max(4, Math.round(totalBars * 0.14));
  const mainBars = Math.max(8, Math.round(totalBars * 0.42));
  const stripBars = Math.max(4, Math.round(totalBars * 0.16));
  const variationBars = Math.max(6, Math.round(totalBars * 0.2));
  const outroBars = Math.max(4, totalBars - introBars - mainBars - stripBars - variationBars);

  return [
    {
      name: "intro",
      bars: introBars,
      hatsDensity: 0.45,
      melodyPresence: 0.25,
      ambienceIntensity: 0.65,
      filterCutoff: 0.42,
      dropoutChance: 0.04,
      fillChance: 0.06,
    },
    {
      name: "main",
      bars: mainBars,
      hatsDensity: 0.86,
      melodyPresence: 0.72,
      ambienceIntensity: 0.58,
      filterCutoff: 0.74,
      dropoutChance: 0.06,
      fillChance: 0.16,
    },
    {
      name: "strip",
      bars: stripBars,
      hatsDensity: 0.38,
      melodyPresence: 0.2,
      ambienceIntensity: 0.7,
      filterCutoff: 0.38,
      dropoutChance: 0.2,
      fillChance: 0.02,
    },
    {
      name: "variation",
      bars: variationBars,
      hatsDensity: 0.78,
      melodyPresence: 0.65,
      ambienceIntensity: 0.62,
      filterCutoff: 0.7,
      dropoutChance: 0.1 + rng.range(0, 0.08),
      fillChance: 0.18 + rng.range(0, 0.12),
    },
    {
      name: "outro",
      bars: outroBars,
      hatsDensity: 0.3,
      melodyPresence: 0.18,
      ambienceIntensity: 0.78,
      filterCutoff: 0.3,
      dropoutChance: 0.15,
      fillChance: 0.04,
    },
  ];
}
