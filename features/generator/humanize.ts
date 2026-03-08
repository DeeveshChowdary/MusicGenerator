import { createRng, hashSeed } from "./rng";
import type { DrumHit, NoteEvent } from "./types";

export function evolveDrums(hits: DrumHit[], seed: number): DrumHit[] {
  const rng = createRng(hashSeed(seed, "evolve-drums"));
  return hits.map((hit) => {
    const shouldMute = hit.instrument === "hatClosed" && rng.chance(0.08);
    return {
      ...hit,
      velocity: Math.max(0.15, Math.min(1, hit.velocity + rng.range(-0.05, 0.05))),
      offset: hit.offset + rng.range(-0.003, 0.003),
      muted: shouldMute ? true : hit.muted,
    };
  });
}

export function evolveMelody(notes: NoteEvent[], seed: number): NoteEvent[] {
  const rng = createRng(hashSeed(seed, "evolve-melody"));
  return notes
    .map((note) => {
      if (rng.chance(0.12)) return null;
      return {
        ...note,
        velocity: Math.max(0.2, Math.min(0.8, note.velocity + rng.range(-0.08, 0.08))),
        offset: note.offset + rng.range(-0.005, 0.005),
      };
    })
    .filter((note): note is NoteEvent => Boolean(note));
}
