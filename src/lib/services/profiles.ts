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
    if (!uid) return;

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
