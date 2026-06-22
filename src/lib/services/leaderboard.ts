/* ============================================================
   Leaderboard service — shared (Supabase) with local fallback.
   Returns a uniform ScoreRow[] regardless of the source.
   ============================================================ */

import { SUPABASE_URL, SUPABASE_KEY, SHARED, LB_KEY } from '../config';

export interface ScoreRow {
  id: string;
  name: string;
  score: number;
  total: number;
  pct: number;
  belt: number;
  diff: string;
  ts?: number;
}

export interface SubmitInput {
  name: string;
  score: number;
  total: number;
  pct: number;
  belt: number;
  diff: string;
}

export interface LeaderboardResult {
  rows: ScoreRow[];
  myId: string | null;
  online: boolean;
}

const sbHeaders = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

/* ---- local storage ---- */
function loadLocal(): ScoreRow[] {
  try {
    return JSON.parse(localStorage.getItem(LB_KEY) || '[]');
  } catch {
    return [];
  }
}
function storeLocal(rows: ScoreRow[]): void {
  try {
    localStorage.setItem(LB_KEY, JSON.stringify(rows));
  } catch {
    /* private mode — ignore */
  }
}

export function clearLocal(): void {
  storeLocal([]);
}

const sortRows = (a: ScoreRow, b: ScoreRow) =>
  b.pct - a.pct || b.score - a.score || (a.ts ?? 0) - (b.ts ?? 0);

/**
 * Submit a score and return the (sorted, top-100) leaderboard.
 * Falls back to localStorage when Supabase is unavailable.
 */
export async function submitAndFetch(entry: SubmitInput): Promise<LeaderboardResult> {
  if (SHARED) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
        method: 'POST',
        headers: { ...sbHeaders(), Prefer: 'return=representation' },
        body: JSON.stringify(entry),
      });
      if (!res.ok) throw new Error('post failed');
      const ins = await res.json();
      const myId: string | null = ins?.[0]?.id ?? null;

      const r2 = await fetch(
        `${SUPABASE_URL}/rest/v1/scores?select=*&order=pct.desc,score.desc,created_at.asc&limit=100`,
        { headers: sbHeaders() },
      );
      if (!r2.ok) throw new Error('get failed');
      const rows = (await r2.json()) as ScoreRow[];
      return { rows, myId, online: true };
    } catch {
      // fall through to local
    }
  }

  // local fallback
  const board = loadLocal();
  const id = 'L' + Date.now() + Math.random().toString(36).slice(2, 6);
  const row: ScoreRow = { ...entry, id, ts: Date.now() };
  board.push(row);
  board.sort(sortRows);
  if (board.length > 50) board.length = 50;
  storeLocal(board);
  return { rows: board, myId: id, online: false };
}
