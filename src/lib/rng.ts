/* ============================================================
   Seeded pseudo-random number generator.

   Used by the challenge ("sfida") mode: a match is fully described
   by a single integer seed, so two players who play the same seed
   get the IDENTICAL question set, order and option layout — the
   fairness guarantee behind a head-to-head duel (Ruzzle-style).

   mulberry32 is a tiny, fast, well-distributed 32-bit PRNG. It is
   NOT cryptographic — it only needs to be deterministic and evenly
   spread, which it is. Math.random remains the default everywhere
   that doesn't need reproducibility.
   ============================================================ */

/** A function returning a float in [0, 1), like Math.random. */
export type Rng = () => number;

/** Deterministic PRNG seeded by a 32-bit integer. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mix a base seed with extra integer parts (e.g. a round index) into a new
 *  32-bit seed. Lets one match seed deterministically derive per-round seeds. */
export function deriveSeed(base: number, ...parts: number[]): number {
  let h = base >>> 0;
  for (const p of parts) {
    h ^= p >>> 0;
    h = Math.imul(h, 0x01000193) >>> 0; // FNV-style mix
  }
  return h >>> 0;
}

/** A fresh random 32-bit seed (for creating a new match). */
export function randomSeed(): number {
  return (Math.random() * 0x100000000) >>> 0;
}

/** Fisher–Yates shuffle driven by an Rng (defaults to Math.random). */
export function shuffleWith<T>(arr: T[], rng: Rng = Math.random): T[] {
  const x = arr.slice();
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}
