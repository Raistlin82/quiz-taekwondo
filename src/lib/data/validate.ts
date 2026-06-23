/* ============================================================
   Question-bank validation. Pure function, runs at build time
   (and on dev-server start) via a Vite plugin — see vite.config.ts.
   Errors fail the build; warnings are printed but non-fatal.
   ============================================================ */

import type { Belt, Difficulty, DifficultyKey, Question } from './belts';

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export function validateQuestions(
  pool: Question[],
  belts: Belt[],
  difficulties: Record<DifficultyKey, Difficulty>,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const beltIds = new Set(belts.map((b) => b.id));
  const maxLvl = Math.max(...Object.values(difficulties).map((d) => d.maxLvl));
  const facileCount = difficulties.facile.count;

  const catCounts = new Map<string, number>();
  const seenText = new Map<string, number>();

  pool.forEach((q, i) => {
    const at = `Q${i} «${(q.q ?? '').slice(0, 48)}»`;

    if (!q.cat || !q.cat.trim()) errors.push(`${at}: categoria mancante`);
    else catCounts.set(q.cat, (catCounts.get(q.cat) ?? 0) + 1);

    if (!q.q || !q.q.trim()) errors.push(`${at}: testo domanda mancante`);
    if (!q.explain || !q.explain.trim()) warnings.push(`${at}: spiegazione mancante`);

    if (!beltIds.has(q.belt)) errors.push(`${at}: belt ${q.belt} inesistente`);
    if (![1, 2, 3].includes(q.lvl)) errors.push(`${at}: lvl ${q.lvl} non valido (1..3)`);
    else if (q.lvl > maxLvl) warnings.push(`${at}: lvl ${q.lvl} oltre il massimo difficoltà (${maxLvl})`);

    if (!Array.isArray(q.options) || q.options.length !== 4) {
      errors.push(`${at}: deve avere esattamente 4 opzioni (ne ha ${q.options?.length ?? 0})`);
    } else {
      q.options.forEach((o, k) => {
        if (!o || !o.trim()) errors.push(`${at}: opzione ${k} vuota`);
      });
      const norm = q.options.map((o) => (o ?? '').trim().toLowerCase());
      if (new Set(norm).size !== norm.length) errors.push(`${at}: contiene opzioni duplicate`);
    }

    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) {
      errors.push(`${at}: answer ${q.answer} fuori range (0..3)`);
    } else if (Array.isArray(q.options) && q.options[q.answer] == null) {
      errors.push(`${at}: answer ${q.answer} non punta a un'opzione esistente`);
    }

    const key = (q.q ?? '').trim().toLowerCase();
    if (key) {
      if (seenText.has(key)) errors.push(`${at}: domanda duplicata (anche a Q${seenText.get(key)})`);
      else seenText.set(key, i);
    }
  });

  // A category used only once is almost always a typo in `cat`
  // (categories drive the round-robin grouping).
  for (const [cat, n] of catCounts) {
    if (n === 1) warnings.push(`Categoria «${cat}» usata una sola volta — possibile refuso?`);
  }

  // Scalable difficulty guarantee: every selectable belt must have enough
  // EASY (lvl 1) questions in its cumulative pool so "Facile" stays simple
  // and doesn't repeat — this is what keeps low belts (Bianca sup., Gialla) easy.
  for (const b of belts) {
    const easy = pool.filter((q) => q.belt <= b.id && q.lvl === 1).length;
    if (easy === 0) errors.push(`Cintura «${b.name}»: nessuna domanda Facile (lvl 1)`);
    else if (easy < facileCount)
      warnings.push(
        `Cintura «${b.name}»: solo ${easy} domande Facile (lvl 1) per un quiz da ${facileCount} — aggiungine di semplici`,
      );
  }

  return { errors, warnings };
}
