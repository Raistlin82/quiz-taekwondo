/* ============================================================
   Belts, difficulty levels and shared domain types.
   Belt selection is CUMULATIVE: choosing belt N includes every
   question with belt <= N.
   ============================================================ */

export interface Belt {
  id: number; // 1..12
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

/** Belts in progression order (10° → 1° gup, then 1° dan). Forms (tul)
 *  mapping — standard ITF, one tul per gup:
 *  1 Bianca sup=Chon-Ji · 2 Gialla=Dan-Gun · 3 Gialla sup=Do-San ·
 *  4 Verde=Won-Hyo · 5 Verde-Blu=Yul-Gok · 6 Blu=Joong-Gun ·
 *  7 Blu sup=Toi-Gye · 8 Rossa=Hwa-Rang · 9 Rossa sup=Choong-Moo ·
 *  10 Nera=Kwang-Gae (1° dan) · 11 Nera 2° dan=Eui-Am/Choong-Jang/Juche ·
 *  12 Nera 3° dan=Sam-Il/Yoo-Sin/Choi-Yong. The plain white belt is the
 *  starting grade (no exam) and is intentionally not a selectable target. */
export const BELTS: Belt[] = [
  { id: 1, name: 'Bianca superiore', main: '#ffffff', stripe: '#fbbf24' },
  { id: 2, name: 'Gialla', main: '#fbbf24', stripe: null },
  { id: 3, name: 'Gialla superiore', main: '#fbbf24', stripe: '#22c55e' },
  { id: 4, name: 'Verde', main: '#22c55e', stripe: null },
  { id: 5, name: 'Verde-Blu', main: '#22c55e', stripe: '#1d4ed8' },
  { id: 6, name: 'Blu', main: '#3b82f6', stripe: null },
  { id: 7, name: 'Blu superiore', main: '#3b82f6', stripe: '#ef4444' },
  { id: 8, name: 'Rossa', main: '#ef4444', stripe: null },
  { id: 9, name: 'Rossa superiore', main: '#ef4444', stripe: '#1f2937' },
  { id: 10, name: 'Nera', main: '#1f2937', stripe: null },
  { id: 11, name: 'Nera 2° dan', main: '#1f2937', stripe: '#fbbf24' },
  { id: 12, name: 'Nera 3° dan', main: '#111827', stripe: '#f59e0b' },
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
