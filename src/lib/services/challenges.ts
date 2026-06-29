/* ============================================================
   Challenge ("sfida") data access — Supabase (table `challenges`).
   See docs/supabase/challenges.sql for the schema, RLS and RPCs.

   Mirrors the other services: writes go through the supabase-js client
   (so the session JWT is sent), reads are best-effort, and everything
   no-ops gracefully when Supabase/the table is unavailable. The opponent
   write and random matchmaking go through SECURITY DEFINER RPCs.
   ============================================================ */

import { supabase } from '../config';
import { aggregateLadder, type ChallengeRow, type LadderEntry } from '../challenge';

const JUNK = ['ospite', '__smoketest__', '__probe__'];

export function challengesAvailable(): boolean {
  return !!supabase;
}

/** Short, human-shareable match code. The DB primary key enforces uniqueness;
 *  on the rare collision the insert fails and the caller retries. */
export function newChallengeCode(): string {
  let s = '';
  for (let i = 0; i < 7; i++) s += Math.floor(Math.random() * 36).toString(36);
  return s;
}

export interface CreatePayload {
  seed: number;
  isRandom: boolean;
  name: string;
  userId: string | null;
  roundPoints: number[];
  secs: number;
  score: number;
}

/** Insert the creator's finished attempt as an open challenge. */
export async function createChallenge(p: CreatePayload): Promise<ChallengeRow | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('challenges')
      .insert({
        id: newChallengeCode(),
        seed: p.seed,
        is_random: p.isRandom,
        status: 'awaiting_opponent',
        creator_name: p.name,
        creator_user_id: p.userId,
        creator_round_points: p.roundPoints,
        creator_secs: p.secs,
        creator_score: p.score,
      })
      .select()
      .single();
    if (error || !data) return null;
    return data as ChallengeRow;
  } catch {
    return null;
  }
}

/** Load a challenge by its code (for a friend link). */
export async function loadChallenge(code: string): Promise<ChallengeRow | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', code)
      .maybeSingle();
    if (error || !data) return null;
    return data as ChallengeRow;
  } catch {
    return null;
  }
}

/** Claim one open random challenge to play against (none → null). */
export async function claimRandomChallenge(userId: string | null): Promise<ChallengeRow | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('claim_random_challenge', { p_user_id: userId });
    if (error || !data) return null;
    // The function returns a composite row; when no match is available it comes
    // back as a row of NULLs (so check a NOT NULL column).
    const row = (Array.isArray(data) ? data[0] : data) as ChallengeRow | null;
    return row && row.id ? row : null;
  } catch {
    return null;
  }
}

export interface SubmitPayload {
  code: string;
  name: string;
  userId: string | null;
  roundPoints: number[];
  secs: number;
  score: number;
}

/** Submit the opponent's result; the RPC resolves the winner and returns the
 *  completed row. Returns null if the challenge was already played or is gone. */
export async function submitChallengeResult(p: SubmitPayload): Promise<ChallengeRow | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('submit_challenge_result', {
      p_code: p.code,
      p_name: p.name,
      p_user_id: p.userId,
      p_round_points: p.roundPoints,
      p_secs: p.secs,
      p_score: p.score,
    });
    if (error || !data) return null;
    const row = (Array.isArray(data) ? data[0] : data) as ChallengeRow | null;
    return row && row.id ? row : null;
  } catch {
    return null;
  }
}

/** Win/loss/draw ladder, aggregated from completed challenges by player name.
 *  Returns null on a read error, [] when there is genuinely nothing yet. */
export async function fetchChallengeLadder(): Promise<LadderEntry[] | null> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('status', 'completed')
      .limit(5000);
    if (error) return null;
    return aggregateLadder((data ?? []) as ChallengeRow[], JUNK);
  } catch {
    return null;
  }
}

/** Challenges the current user is involved in (most recent first), for the
 *  "Le mie sfide" list — so resolved random matches can be found after the fact. */
export async function fetchMyChallenges(userId: string | null): Promise<ChallengeRow[]> {
  if (!supabase || !userId) return [];
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .or(`creator_user_id.eq.${userId},opponent_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error || !data) return [];
    return data as ChallengeRow[];
  } catch {
    return [];
  }
}

/** Subscribe (Supabase Realtime) to a specific challenge resolving. Calls
 *  `onResolved` when it flips to 'completed'. Returns an unsubscribe fn. */
export function subscribeChallenge(
  code: string,
  onResolved: (row: ChallengeRow) => void,
): () => void {
  const client = supabase;
  if (!client) return () => {};
  const channel = client
    .channel(`challenge-${code}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'challenges', filter: `id=eq.${code}` },
      (payload) => {
        const row = payload.new as ChallengeRow;
        if (row?.status === 'completed') onResolved(row);
      },
    )
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}
