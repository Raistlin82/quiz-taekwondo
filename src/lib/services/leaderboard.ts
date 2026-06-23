/* ============================================================
   Leaderboard service — shared (Supabase) with local fallback.
   Returns a uniform ScoreRow[] regardless of the source.
   ============================================================ */

import { SUPABASE_URL, SUPABASE_KEY, SHARED, LB_KEY } from '../config';
import { beltGroupOf, leaderboardPoints } from '../data/belts';

export interface ScoreRow {
  id: string;
  name: string;
  score: number;
  total: number;
  pct: number;
  belt: number;
  diff: string;
  ts?: number;
  points?: number; // difficulty-weighted ranking points (computed client-side)
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
  groupLabel: string; // belt-group this board is for (e.g. "Gialla")
}

const sbHeaders = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

/* ---- local storage ---- */
function loadLocal(): ScoreRow[] {
  try {
    const v = JSON.parse(localStorage.getItem(LB_KEY) || '[]');
    return Array.isArray(v) ? v : [];
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

/** Attach difficulty-weighted points to each row. */
const withPoints = (rows: ScoreRow[]): ScoreRow[] =>
  rows.map((r) => ({ ...r, points: leaderboardPoints(r.pct, r.diff) }));

/** Rank by difficulty-weighted points first (harder runs win at equal belt),
 *  then accuracy, then raw correct, then earliest submission. */
const rankRows = (a: ScoreRow, b: ScoreRow) =>
  (b.points ?? 0) - (a.points ?? 0) ||
  b.pct - a.pct ||
  b.score - a.score ||
  (a.ts ?? 0) - (b.ts ?? 0);

// Names used for connectivity/setup tests that must never appear on the board.
const JUNK_NAMES = new Set(['__smoketest__']);
const dropJunk = (rows: ScoreRow[]): ScoreRow[] => rows.filter((r) => !JUNK_NAMES.has(r.name));

/**
 * Submit a score and return the (sorted, top-100) leaderboard.
 * Falls back to localStorage when Supabase is unavailable.
 *
 * `userId` (the authenticated/guest Supabase user id) is attached to the row
 * when present. It's sent via an optional `user_id` column: if that column
 * hasn't been added to the table yet, the insert is retried WITHOUT it so the
 * online leaderboard keeps working before the DB migration is applied.
 */
export async function submitAndFetch(
  entry: SubmitInput,
  userId: string | null = null,
): Promise<LeaderboardResult> {
  // The board is scoped to the player's belt GROUP (colour + its grades).
  const group = beltGroupOf(entry.belt);
  if (SHARED) {
    let posted = false;
    let myId: string | null = null;
    let postedRow: ScoreRow | null = null;

    const postScore = (withUser: boolean) =>
      fetch(`${SUPABASE_URL}/rest/v1/scores`, {
        method: 'POST',
        headers: { ...sbHeaders(), Prefer: 'return=representation' },
        body: JSON.stringify(withUser && userId ? { ...entry, user_id: userId } : entry),
      });

    // Step 1: submit. Only a failure HERE should fall back to local storage.
    try {
      let res = await postScore(true);
      // If the optional user_id column isn't there yet, retry without it.
      if (!res.ok && userId) res = await postScore(false);
      if (!res.ok) throw new Error('post failed');
      const ins = await res.json();
      postedRow = (ins?.[0] as ScoreRow) ?? null;
      myId = postedRow?.id ?? null;
      posted = true;
    } catch {
      // POST itself failed → fall through to the local fallback below.
    }

    // Step 2: the score IS saved server-side. Fetch the board, but a GET
    // failure must NOT trigger a second (local) write of the same score.
    if (posted) {
      try {
        // Only this belt group's rows — boards are never mixed across colours.
        const inList = group.beltIds.join(',');
        const r2 = await fetch(
          `${SUPABASE_URL}/rest/v1/scores?select=*&belt=in.(${inList})&order=pct.desc&limit=200`,
          { headers: sbHeaders() },
        );
        if (!r2.ok) throw new Error('get failed');
        const rows = withPoints(dropJunk((await r2.json()) as ScoreRow[])).sort(rankRows);
        return { rows, myId, online: true, groupLabel: group.label };
      } catch {
        // Submission succeeded; only the board read failed. Show what we have.
        return {
          rows: postedRow ? withPoints([postedRow]) : [],
          myId,
          online: true,
          groupLabel: group.label,
        };
      }
    }
  }

  // local fallback (SHARED disabled, or the POST itself failed)
  const board = loadLocal();
  const id = 'L' + Date.now() + Math.random().toString(36).slice(2, 6);
  const row: ScoreRow = { ...entry, id, ts: Date.now() };
  board.push(row);
  const ranked = withPoints(board).sort(rankRows);
  if (ranked.length > 50) ranked.length = 50;
  storeLocal(ranked);
  // Display only the player's belt group.
  const rows = ranked.filter((r) => group.beltIds.includes(r.belt));
  return { rows, myId: id, online: false, groupLabel: group.label };
}
