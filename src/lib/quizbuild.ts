/* ============================================================
   Shared quiz-building helpers.

   Used by the normal game (random) and by challenge matches (seeded,
   reproducible). Keeping one implementation guarantees both paths pick
   and shuffle questions the same way — the only difference is the Rng.
   ============================================================ */

import type { Question } from './data/belts';
import { shuffleWith, type Rng } from './rng';

/** Shuffle a question's options and re-point `answer` to the new index.
 *  A seeded Rng makes the option layout reproducible for challenge matches. */
export function shuffleOptions(q: Question, rng: Rng = Math.random): Question {
  const correct = q.options[q.answer];
  const options = shuffleWith(q.options, rng);
  return { ...q, options, answer: options.indexOf(correct) };
}

export interface BuildOpts {
  /** Highest belt to include (questions with belt <= maxBelt). */
  maxBelt: number;
  /** Highest difficulty tier to include (lvl <= maxLvl). */
  maxLvl: number;
  /** Target number of questions (capped at the available pool size). */
  count: number;
}

/** Build a balanced question set: filter by belt+level, then pick round-robin
 *  across categories so the mix is even. With a seeded Rng the result is fully
 *  reproducible — two players sharing a seed get the identical set, order and
 *  option layout. */
export function buildBalancedSet(
  pool: Question[],
  opts: BuildOpts,
  rng: Rng = Math.random,
): Question[] {
  const avail = pool.filter((q) => q.belt <= opts.maxBelt && q.lvl <= opts.maxLvl);
  const byCat: Record<string, Question[]> = {};
  for (const q of avail) (byCat[q.cat] = byCat[q.cat] || []).push(q);
  const cats = shuffleWith(Object.keys(byCat), rng);
  for (const c of cats) byCat[c] = shuffleWith(byCat[c], rng);

  const picked: Question[] = [];
  const target = Math.min(opts.count, avail.length);
  let safety = 0;
  while (picked.length < target && safety < 800) {
    for (const c of cats) {
      const item = byCat[c].pop();
      if (item) picked.push(item);
      if (picked.length >= target) break;
    }
    safety++;
  }
  return shuffleWith(picked, rng).map((q) => shuffleOptions(q, rng));
}
