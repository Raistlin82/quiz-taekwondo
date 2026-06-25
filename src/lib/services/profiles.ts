/* ============================================================
   Player career profiles (public Supabase table `profiles`).
   One row per user aggregating overall progress: XP, level,
   trophies (badge count), cumulative leaderboard points and a
   per-belt-colour breakdown. Powers the global "Classifica
   Giocatori" (career ranking).

   Writes use the supabase-js client so the session JWT is sent
   (RLS lets a user write only their own row). Best-effort: every
   call no-ops when Supabase/the table is unavailable.
   ============================================================ */

import { supabase } from '../config';
import { beltGroupOf, leaderboardPoints } from '../data/belts';

const BADGE_BONUS = 200; // each trophy is worth this much career score

/** Composite career score: lifetime XP + trophies + cumulative quiz points. */
export function careerScore(xp: number, badges: number, cumPoints: number): number {
  return Math.round(xp + badges * BADGE_BONUS + cumPoints);
}

export interface PlayerProfile {
  user_id: string;
  name: string;
  xp: number;
  level: number;
  badges: number;
  cum_points: number;
  by_color: Record<string, number>;
  career: number;
  updated_at?: string;
}

export interface RecordRunInput {
  name: string;
  xp: number;
  level: number;
  badges: number;
  runPoints: number; // this run's difficulty-weighted points
  colorLabel: string; // belt-group label (e.g. "Verde")
}

// Serialise career writes within this tab so the read-modify-write below can't
// interleave on rapid replays (a later write reading stale cum_points and
// overwriting an earlier one). Cross-tab/device races would need a server-side
// atomic increment (RPC) — out of scope here.
let writeChain: Promise<void> = Promise.resolve();

/**
 * Update the player's career profile after a finished quiz: accumulates this
 * run's points (overall and per colour) and refreshes XP/level/trophies.
 * Calls are serialised per tab to avoid lost updates.
 */
export function recordProfileRun(input: RecordRunInput): Promise<void> {
  writeChain = writeChain.then(() => doRecordProfileRun(input)).catch(() => {});
  return writeChain;
}

async function doRecordProfileRun(input: RecordRunInput): Promise<void> {
  if (!supabase) return;
  try {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user?.id;
    // Guests (anonymous sessions) are NOT ranked: no career profile is written.
    if (!uid || sess.session?.user?.is_anonymous) return;

    // Preferred path: atomic server-side increment (correct even across tabs
    // and devices — no lost updates). Requires the increment_profile_run()
    // Postgres function (see README); BADGE_BONUS there must match here.
    const { error: rpcErr } = await supabase.rpc('increment_profile_run', {
      p_name: input.name,
      p_xp: input.xp,
      p_level: input.level,
      p_badges: input.badges,
      p_run_points: input.runPoints,
      p_color: input.colorLabel,
    });
    if (!rpcErr) return;

    // Fallback (function not created yet): read-modify-write. recordProfileRun
    // serialises calls per tab, so this is safe within a tab.
    const { data: existing } = await supabase
      .from('profiles')
      .select('cum_points,by_color')
      .eq('user_id', uid)
      .maybeSingle();

    const cum = (existing?.cum_points ?? 0) + input.runPoints;
    const byColor: Record<string, number> = { ...((existing?.by_color as Record<string, number>) ?? {}) };
    byColor[input.colorLabel] = (byColor[input.colorLabel] ?? 0) + input.runPoints;

    await supabase.from('profiles').upsert(
      {
        user_id: uid,
        name: input.name,
        xp: input.xp,
        level: input.level,
        badges: input.badges,
        cum_points: cum,
        by_color: byColor,
        career: careerScore(input.xp, input.badges, cum),
      },
      { onConflict: 'user_id' },
    );
  } catch {
    /* table not created yet / offline — career board simply stays inactive */
  }
}

/**
 * Top career profiles, ranked by composite score.
 * Returns [] for a confirmed-empty board, or null on a read ERROR (network/RLS)
 * so the UI can tell "feature not set up yet" apart from "temporary glitch".
 */
export async function fetchTopProfiles(limit = 100): Promise<PlayerProfile[] | null> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('career', { ascending: false })
      .limit(limit);
    if (error) return null;
    return (data ?? []) as PlayerProfile[];
  } catch {
    return null;
  }
}

export interface CareerEntry {
  name: string;
  career: number;
  cumPoints: number;
  xp: number;
  level: number;
  badges: number;
  byColor: Record<string, number>;
  account: boolean; // has a permanent-account profile (XP/trophies counted)
}

const JUNK_NAMES = new Set(['__smoketest__', '__probe__']);

/**
 * Build the players (career) board by aggregating the whole `scores` table by
 * NAME — so every named player who ever played appears, not just those with a
 * post-feature account ("backfill"). cum_points & per-colour come from scores;
 * XP/level/trophies are merged in from `profiles` (by name) when the player has
 * an account, and add to their career score. Live, not a one-off.
 * Returns null on read error, [] when there's genuinely nothing.
 */
export async function fetchCareerBoard(): Promise<CareerEntry[] | null> {
  if (!supabase) return [];
  try {
    const { data: scores, error } = await supabase
      .from('scores')
      .select('name,pct,diff,belt')
      .limit(5000);
    if (error) return null;

    // Key by a normalized name (trim + lowercase) so "Mario" / "mario" / "Mario "
    // are one player; keep the first-seen casing for display.
    const norm = (n?: string | null) => (n ?? '').trim().toLowerCase();

    const { data: profs } = await supabase.from('profiles').select('name,xp,level,badges');
    const profByName = new Map((profs ?? []).map((p) => [norm(p.name), p]));

    const agg = new Map<string, { name: string; cumPoints: number; byColor: Record<string, number> }>();
    for (const s of scores ?? []) {
      const display = (s.name ?? '').trim();
      const key = norm(s.name);
      if (!key || JUNK_NAMES.has(key) || key === 'ospite') continue;
      const pts = leaderboardPoints(s.pct, s.diff);
      const e = agg.get(key) ?? { name: display, cumPoints: 0, byColor: {} as Record<string, number> };
      e.cumPoints += pts;
      const label = beltGroupOf(s.belt).label;
      e.byColor[label] = (e.byColor[label] ?? 0) + pts;
      agg.set(key, e);
    }

    const entries: CareerEntry[] = [...agg.values()].map((e) => {
      const prof = profByName.get(norm(e.name)) as { xp?: number; level?: number; badges?: number } | undefined;
      const xp = prof?.xp ?? 0;
      const badges = prof?.badges ?? 0;
      const level = prof?.level ?? 1;
      return {
        name: e.name,
        cumPoints: e.cumPoints,
        byColor: e.byColor,
        xp,
        level,
        badges,
        account: !!prof,
        career: careerScore(xp, badges, e.cumPoints),
      };
    });
    entries.sort((a, b) => b.career - a.career);
    return entries;
  } catch {
    return null;
  }
}

/** Fetch a single player's profile (e.g. the current user), or null. */
export async function fetchProfile(userId: string): Promise<PlayerProfile | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return data as PlayerProfile;
  } catch {
    return null;
  }
}
