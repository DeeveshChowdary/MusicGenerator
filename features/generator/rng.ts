export interface RNG {
  next: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(items: T[]) => T;
  chance: (probability: number) => boolean;
  range: (min: number, max: number) => number;
  shuffle: <T>(items: T[]) => T[];
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(seed: number, salt: string): number {
  let h = seed ^ 0x9e3779b9;
  for (let i = 0; i < salt.length; i += 1) {
    h = Math.imul(h ^ salt.charCodeAt(i), 0x45d9f3b);
    h ^= h >>> 16;
  }
  return Math.abs(h) || 1;
}

export function createRng(seed: number): RNG {
  const random = mulberry32(seed);

  return {
    next: () => random(),
    int: (min, max) => Math.floor(random() * (max - min + 1)) + min,
    pick: (items) => items[Math.floor(random() * items.length)] as (typeof items)[number],
    chance: (probability) => random() < Math.min(Math.max(probability, 0), 1),
    range: (min, max) => random() * (max - min) + min,
    shuffle: (items) => {
      const arr = [...items];
      for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
  };
}
