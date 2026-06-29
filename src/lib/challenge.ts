/* ============================================================
   Challenge ("sfida") core — pure logic, no networking, no UI.

   A match is fully described by a single integer seed: both players
   replay that seed and get the IDENTICAL set of questions. One fixed
   format (not belt- or difficulty-based): 15 questions drawn from the
   whole bank, all levels, split into 3 rounds of 5 (Ruzzle best-of-3).

   The networking store and the screens build on these helpers.
   ============================================================ */

import { POOL } from './data/questions';
import { buildBalancedSet } from './quizbuild';
import { mulberry32 } from './rng';
import { answerXp } from './stores/progress.svelte';
import type { Question } from './data/belts';

export const ROUNDS = 3;
export const ROUND_SIZE = 5;
export const MATCH_SIZE = ROUNDS * ROUND_SIZE; // 15

/** Points for one correct answer — reuses the speed-rewarding XP curve, so a
 *  faster correct answer is worth more (both correctness and speed count). */
export const roundAnswerPoints = answerXp;

/** A challenge row as stored in Supabase (see docs/supabase/challenges.sql). */
export interface ChallengeRow {
  id: string;
  seed: number;
  rounds: number;
  round_size: number;
  is_random: boolean;
  status: 'awaiting_opponent' | 'claimed' | 'completed';
  creator_name: string;
  creator_user_id: string | null;
  creator_round_points: number[];
  creator_secs: number;
  creator_score: number;
  opponent_name: string | null;
  opponent_user_id: string | null;
  opponent_round_points: number[] | null;
  opponent_secs: number | null;
  opponent_score: number | null;
  winner: Winner | null;
  created_at: string;
  completed_at: string | null;
}

/** Deterministic match questions from a seed: MATCH_SIZE questions (whole bank,
 *  all levels) split into ROUNDS chunks of ROUND_SIZE. Same seed → same match
 *  for both players — the fairness guarantee of the duel. */
export function buildMatch(seed: number): Question[][] {
  const set = buildBalancedSet(
    POOL,
    { maxBelt: 12, maxLvl: 3, count: MATCH_SIZE },
    mulberry32(seed >>> 0),
  );
  const rounds: Question[][] = [];
  for (let r = 0; r < ROUNDS; r++) {
    rounds.push(set.slice(r * ROUND_SIZE, (r + 1) * ROUND_SIZE));
  }
  return rounds;
}

export type Winner = 'creator' | 'opponent' | 'draw';

export interface Side {
  roundPoints: number[];
  score: number;
  secs: number;
}

/** Decide the winner, mirroring submit_challenge_result() in the DB so the
 *  result screen can show the outcome without a round-trip: most rounds won;
 *  ties broken by total points, then by fewer total seconds. */
export function decideWinner(a: Side, b: Side): Winner {
  let aw = 0;
  let bw = 0;
  const n = Math.max(a.roundPoints.length, b.roundPoints.length);
  for (let i = 0; i < n; i++) {
    const ap = a.roundPoints[i] ?? 0;
    const bp = b.roundPoints[i] ?? 0;
    if (ap > bp) aw++;
    else if (ap < bp) bw++;
  }
  if (aw !== bw) return aw > bw ? 'creator' : 'opponent';
  if (a.score !== b.score) return a.score > b.score ? 'creator' : 'opponent';
  if (a.secs !== b.secs) return a.secs < b.secs ? 'creator' : 'opponent';
  return 'draw';
}

export interface LadderEntry {
  name: string;
  wins: number;
  losses: number;
  draws: number;
  played: number;
  points: number; // 3 per win, 1 per draw (league-style)
}

/** Build the win/loss/draw ladder from completed challenges, aggregated by
 *  normalised player name (like the career board). Guests are excluded. */
export function aggregateLadder(
  rows: ChallengeRow[],
  excludeNames: string[] = ['ospite'],
): LadderEntry[] {
  const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();
  const skip = new Set(excludeNames.map(norm));
  const byName = new Map<string, LadderEntry>();

  const bump = (rawName: string | null, outcome: 'win' | 'loss' | 'draw') => {
    const key = norm(rawName);
    if (!key || skip.has(key)) return;
    const e =
      byName.get(key) ??
      { name: (rawName ?? '').trim(), wins: 0, losses: 0, draws: 0, played: 0, points: 0 };
    if (outcome === 'win') e.wins++;
    else if (outcome === 'loss') e.losses++;
    else e.draws++;
    e.played++;
    e.points = e.wins * 3 + e.draws;
    byName.set(key, e);
  };

  for (const r of rows) {
    if (r.status !== 'completed' || !r.winner) continue;
    if (r.winner === 'draw') {
      bump(r.creator_name, 'draw');
      bump(r.opponent_name, 'draw');
    } else if (r.winner === 'creator') {
      bump(r.creator_name, 'win');
      bump(r.opponent_name, 'loss');
    } else {
      bump(r.opponent_name, 'win');
      bump(r.creator_name, 'loss');
    }
  }

  const winRate = (e: LadderEntry) => (e.played ? e.wins / e.played : 0);
  return [...byName.values()].sort(
    (a, b) => b.points - a.points || winRate(b) - winRate(a) || b.wins - a.wins,
  );
}
