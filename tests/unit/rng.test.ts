import { describe, expect, it } from "vitest";

import { createRng, hashSeed } from "@/features/generator/rng";

describe("rng", () => {
  it("produces deterministic sequence for same seed", () => {
    const a = createRng(42);
    const b = createRng(42);

    const seqA = [a.next(), a.next(), a.next()];
    const seqB = [b.next(), b.next(), b.next()];

    expect(seqA).toEqual(seqB);
  });

  it("changes hash with salt", () => {
    expect(hashSeed(123, "drums")).not.toBe(hashSeed(123, "melody"));
  });
});
