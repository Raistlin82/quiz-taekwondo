/* ============================================================
   Belts, difficulty levels and shared domain types.
   Belt selection is CUMULATIVE: choosing belt N includes every
   question with belt <= N.
   ============================================================ */

export interface Belt {
  id: number; // 1..8
  name: string;
  main: string; // primary colour
  stripe: string | null; // optional stripe colour
}

export type DifficultyKey = 'facile' | 'medio' | 'difficile';

export interface Difficulty {
  key: DifficultyKey;
  nm: string;
  em: string;
  ds: string;
  maxLvl: 1 | 2 | 3; // highest question level included
  count: number; // target number of questions
}

export interface Question {
  cat: string; // category label (with emoji) — also used for round-robin
  belt: number; // minimum belt at which the question appears
  lvl: 1 | 2 | 3; // difficulty tier
  q: string;
  options: string[];
  answer: number; // index into options
  explain: string;
}

/** Belts in progression order. Forms (tul) mapping:
 *  1 Gialla=Chon-Ji · 2 Gialla sup=Dan-Gun/Do-San · 3 Verde=Won-Hyo ·
 *  4 Verde-Blu=Yul-Gok · 5 Blu=Joong-Gun · 6 Blu sup=Toi-Gye ·
 *  7 Rossa=Hwa-Rang · 8 Nera=Choong-Moo */
export const BELTS: Belt[] = [
  { id: 1, name: 'Gialla', main: '#fbbf24', stripe: null },
  { id: 2, name: 'Gialla superiore', main: '#fbbf24', stripe: '#22c55e' },
  { id: 3, name: 'Verde', main: '#22c55e', stripe: null },
  { id: 4, name: 'Verde-Blu', main: '#22c55e', stripe: '#1d4ed8' },
  { id: 5, name: 'Blu', main: '#3b82f6', stripe: null },
  { id: 6, name: 'Blu superiore', main: '#3b82f6', stripe: '#ef4444' },
  { id: 7, name: 'Rossa', main: '#ef4444', stripe: null },
  { id: 8, name: 'Nera', main: '#1f2937', stripe: null },
];

export const DIFFICULTIES: Record<DifficultyKey, Difficulty> = {
  facile: { key: 'facile', nm: 'Facile', em: '😊', ds: '10 domande', maxLvl: 1, count: 10 },
  medio: { key: 'medio', nm: 'Medio', em: '⚡', ds: '15 domande', maxLvl: 2, count: 15 },
  difficile: { key: 'difficile', nm: 'Tosto', em: '🔥', ds: '20 · tutte!', maxLvl: 3, count: 20 },
};

export const TIME_PER_Q = 10; // seconds per question

export const beltById = (id: number): Belt | undefined => BELTS.find((b) => b.id === id);

/** Fallback belt used when an id is unknown (e.g. stale leaderboard rows). */
export const UNKNOWN_BELT: Belt = { id: 0, name: '-', main: '#cbd5e1', stripe: null };
