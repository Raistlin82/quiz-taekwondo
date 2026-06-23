/* ============================================================
   Leaderboard service — shared (Supabase) with local fallback.
   Returns a uniform ScoreRow[] regardless of the source.
   ============================================================ */

import { SUPABASE_URL, SUPABASE_KEY, SHARED, LB_KEY, supabase } from '../config';
import { beltGroupOf, leaderboardPoints } from '../data/belts';

export interface ScoreRow {
  id: string;
  name: string;
  score: number;
  total: number;
  pct: number;
  belt: number;
  diff: string;
  secs?: number; // total seconds taken (speed tiebreak; lower is better)
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
  secs?: number;
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
 *  then — at equal points — by OVERALL SPEED (less total time wins), then
 *  accuracy, then raw correct, then earliest submission. Rows without a
 *  recorded time sort after those that have one. */
const rankRows = (a: ScoreRow, b: ScoreRow) =>
  (b.points ?? 0) - (a.points ?? 0) ||
  (a.secs ?? Infinity) - (b.secs ?? Infinity) ||
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
  online = true,
): Promise<LeaderboardResult> {
  // The board is scoped to the player's belt GROUP (colour + its grades).
  // `online` is false for guests (anonymous) → they never write to the shared
  // board and instead keep a local, device-only leaderboard.
  const group = beltGroupOf(entry.belt);
  if (SHARED && online) {
    let posted = false;
    let myId: string | null = null;
    let postedRow: ScoreRow | null = null;

    // Base row (always-present columns) + optional columns (user_id, secs) that
    // may not exist yet. Try richest body first, then degrade so the online
    // board keeps working before the DB migrations are applied.
    const { secs, ...base } = entry;

    // Step 1: submit via the supabase-js CLIENT so the session JWT is sent —
    // then auth.uid() matches and the row's user_id (anon uid for a named guest,
    // permanent uid for a logged-in player) is actually stored (RLS-compliant).
    // Only a failure HERE should fall back to local storage.
    try {
      if (!supabase) throw new Error('no client');
      const row = { ...base, secs, user_id: userId ?? null };
      let res = await supabase.from('scores').insert(row).select().single();
      // If the optional `secs` column doesn't exist yet, retry without it.
      if (res.error) {
        res = await supabase
          .from('scores')
          .insert({ ...base, user_id: userId ?? null })
          .select()
          .single();
      }
      if (res.error) throw res.error;
      postedRow = (res.data as ScoreRow) ?? null;
      myId = postedRow?.id ?? null;
      posted = true;
    } catch {
      // Submit failed → fall through to the local fallback below.
    }

    // Step 2: the score IS saved server-side. Fetch the board, but a GET
    // failure must NOT trigger a second (local) write of the same score.
    if (posted) {
      try {
        // Only this belt group's rows — boards are never mixed across colours.
        // Don't order by pct server-side (the real ranking is difficulty-weighted
        // points, computed client-side): a pct-based cap could drop a high-points
        // low-accuracy row. Fetch the whole group, rank client-side, then bound.
        const inList = group.beltIds.join(',');
        const r2 = await fetch(
          `${SUPABASE_URL}/rest/v1/scores?select=*&belt=in.(${inList})&order=created_at.desc&limit=1000`,
          { headers: sbHeaders() },
        );
        if (!r2.ok) throw new Error('get failed');
        const rows = withPoints(dropJunk((await r2.json()) as ScoreRow[]))
          .sort(rankRows)
          .slice(0, 100);
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
