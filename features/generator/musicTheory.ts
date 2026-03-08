import type { ScaleMode } from "./types";

export const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export const SCALE_INTERVALS: Record<ScaleMode, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
};

export const CHORD_INTERVALS: Record<string, number[]> = {
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
  sus2: [0, 2, 7, 10],
  sus4: [0, 5, 7, 10],
  add9: [0, 4, 7, 14],
  min9: [0, 3, 7, 10, 14],
  maj9: [0, 4, 7, 11, 14],
  eleventh: [0, 3, 7, 10, 14, 17],
};

export function noteNameToSemitone(note: string): number {
  const normalized = note.replace(/b/g, "#").toUpperCase();
  const idx = NOTE_NAMES.findIndex((n) => n === normalized);
  return idx >= 0 ? idx : 0;
}

export function midiToNoteName(midi: number): string {
  return NOTE_NAMES[((midi % 12) + 12) % 12] ?? "C";
}

export function scaleMidiNotes(key: string, scale: ScaleMode, octave = 4): number[] {
  const root = noteNameToSemitone(key) + octave * 12;
  return SCALE_INTERVALS[scale].map((interval) => root + interval);
}

export function quantizeToScale(
  midi: number,
  key: string,
  scale: ScaleMode,
  octaveFloor = 2,
  octaveCeil = 7,
): number {
  const scaleNotes: number[] = [];
  for (let octave = octaveFloor; octave <= octaveCeil; octave += 1) {
    scaleNotes.push(...scaleMidiNotes(key, scale, octave));
  }

  let best = scaleNotes[0] ?? midi;
  let minDistance = Number.POSITIVE_INFINITY;
  for (const note of scaleNotes) {
    const distance = Math.abs(note - midi);
    if (distance < minDistance) {
      minDistance = distance;
      best = note;
    }
  }

  return best;
}

export function chordFromDegree(
  key: string,
  scale: ScaleMode,
  degree: number,
  quality: string,
  octave = 4,
): number[] {
  const scaleNotes = scaleMidiNotes(key, scale, octave);
  const root = scaleNotes[(degree % scaleNotes.length + scaleNotes.length) % scaleNotes.length] ?? scaleNotes[0] ?? 60;
  const intervals = CHORD_INTERVALS[quality] ?? CHORD_INTERVALS.min7;
  return intervals.map((interval) => root + interval);
}

export function bestVoiceLeading(previous: number[] | null, next: number[]): number[] {
  if (!previous?.length) {
    return next;
  }

  const candidates: number[][] = [];
  for (const shift of [-12, 0, 12]) {
    candidates.push(next.map((n) => n + shift));
  }

  let best = candidates[0] ?? next;
  let smallest = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const score = candidate.reduce((acc, note, i) => {
      const prev = previous[Math.min(i, previous.length - 1)] ?? previous[0] ?? note;
      return acc + Math.abs(prev - note);
    }, 0);
    if (score < smallest) {
      smallest = score;
      best = candidate;
    }
  }

  return best;
}

export function constrainRange(notes: number[], minMidi: number, maxMidi: number): number[] {
  return notes.map((note) => {
    let current = note;
    while (current < minMidi) current += 12;
    while (current > maxMidi) current -= 12;
    return current;
  });
}
