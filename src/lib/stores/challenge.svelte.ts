/* ============================================================
   Challenge ("sfida") store — orchestrates a Ruzzle-style best-of-3
   duel and the in-app Realtime notification.

   Flow (phases):
     menu          → choose "amico" / "casuale" / accept a link
     intro         → opponent sees "X ti sfida", taps Accetta
     (plays 3 rounds via gameStore in challenge mode)
     interstitial  → brief "Round n di 3" between rounds
     await         → creator's match is stored, waiting for an opponent
                     (subscribed to Realtime → toast + result on resolve)
     result        → head-to-head outcome
     loading/error → transient

   Imports gameStore (to drive the rounds) but never the reverse — the
   round-end hook breaks the cycle.
   ============================================================ */

import { gameStore } from './game.svelte';
import { authStore } from './auth.svelte';
import { randomSeed } from '../rng';
import { ROUNDS, buildMatch, decideWinner, type ChallengeRow } from '../challenge';
import {
  challengesAvailable,
  claimRandomChallenge,
  createChallenge,
  loadChallenge,
  submitChallengeResult,
  subscribeChallenge,
} from '../services/challenges';
import type { Question } from '../data/belts';

const INTERSTITIAL_MS = 1800;

export type ChallengePhase =
  | 'menu'
  | 'intro'
  | 'interstitial'
  | 'await'
  | 'result'
  | 'loading'
  | 'error';
export type ChallengeRole = 'creator' | 'opponent';

class ChallengeStore {
  phase = $state<ChallengePhase>('menu');
  role = $state<ChallengeRole>('creator');
  isRandom = $state(false);
  error = $state<string | null>(null);
  toast = $state<string | null>(null);

  /** The created/loaded row (for the await link and the intro card). */
  loadedRow = $state<ChallengeRow | null>(null);
  /** Resolved head-to-head row shown on the result screen. */
  result = $state<ChallengeRow | null>(null);
  /** Code of the match in play (for the share link). */
  code = $state<string | null>(null);
  /** 1-based number of the round about to play (for the interstitial). */
  roundNo = $state(1);

  private seed = 0;
  private rounds: Question[][] = [];
  private roundIdx = 0;
  private myRoundPoints: number[] = [];
  private mySecs = 0;
  private unsub: (() => void) | null = null;

  get available(): boolean {
    return challengesAvailable();
  }

  get shareUrl(): string | null {
    if (!this.code || typeof window === 'undefined') return null;
    return `${window.location.origin}${window.location.pathname}?sfida=${this.code}`;
  }

  private playerName(): string {
    return (gameStore.playerName.trim() || authStore.displayName || 'Ospite').slice(0, 18);
  }

  /** Open the hub from the nav. */
  open(): void {
    this.reset();
    gameStore.goChallenge();
  }

  dismissToast(): void {
    this.toast = null;
  }

  private reset(): void {
    this.phase = 'menu';
    this.error = null;
    this.loadedRow = null;
    this.result = null;
    this.code = null;
    this.roundIdx = 0;
    this.myRoundPoints = [];
    this.mySecs = 0;
    this.clearSub();
  }

  private clearSub(): void {
    this.unsub?.();
    this.unsub = null;
  }

  // ---- start flows ----

  /** Create a friend challenge: play first, then share a link. */
  startFriend(): void {
    this.reset();
    this.beginAsCreator(randomSeed(), false);
  }

  /** Random matchmaking: claim an open match to play; else create one and wait. */
  async startRandom(): Promise<void> {
    this.reset();
    if (!this.available) {
      this.beginAsCreator(randomSeed(), true);
      return;
    }
    this.phase = 'loading';
    const claimed = await claimRandomChallenge(authStore.userId);
    if (claimed) this.beginAsOpponent(claimed);
    else this.beginAsCreator(randomSeed(), true);
  }

  /** Arrive via a friend link (?sfida=CODE): load and show the intro. */
  async accept(code: string): Promise<void> {
    this.reset();
    this.phase = 'loading';
    gameStore.goChallenge();
    const row = await loadChallenge(code);
    if (!row) {
      this.phase = 'error';
      this.error = 'Sfida non trovata o scaduta.';
      return;
    }
    if (row.status === 'completed') {
      this.result = row;
      this.role = 'opponent';
      this.phase = 'result';
      return;
    }
    this.loadedRow = row;
    this.role = 'opponent';
    this.isRandom = row.is_random;
    this.seed = row.seed;
    this.phase = 'intro';
  }

  /** Opponent confirms the intro and starts playing. */
  playLoaded(): void {
    if (this.loadedRow) this.beginAsOpponent(this.loadedRow);
  }

  /** New duel against the same kind (used by "Rivincita"). */
  rematch(): void {
    if (this.isRandom) void this.startRandom();
    else this.startFriend();
  }

  private beginAsCreator(seed: number, isRandom: boolean): void {
    this.role = 'creator';
    this.isRandom = isRandom;
    this.seed = seed;
    this.startMatch();
  }

  private beginAsOpponent(row: ChallengeRow): void {
    this.role = 'opponent';
    this.isRandom = row.is_random;
    this.seed = row.seed;
    this.loadedRow = row;
    this.startMatch();
  }

  private startMatch(): void {
    this.rounds = buildMatch(this.seed);
    this.roundIdx = 0;
    this.roundNo = 1;
    this.myRoundPoints = [];
    this.mySecs = 0;
    gameStore.onChallengeRoundEnd = (points, secs) => this.onRoundEnd(points, secs);
    gameStore.startChallengeRound(this.rounds[0], 0, ROUNDS);
  }

  private onRoundEnd(points: number, secs: number): void {
    this.myRoundPoints.push(points);
    this.mySecs += secs;
    if (this.roundIdx + 1 < ROUNDS) {
      this.roundIdx += 1;
      this.roundNo = this.roundIdx + 1;
      this.phase = 'interstitial';
      gameStore.goChallenge();
      setTimeout(() => {
        if (this.phase === 'interstitial') {
          gameStore.startChallengeRound(this.rounds[this.roundIdx], this.roundIdx, ROUNDS);
        }
      }, INTERSTITIAL_MS);
    } else {
      void this.finish();
    }
  }

  private async finish(): Promise<void> {
    gameStore.onChallengeRoundEnd = null;
    const score = this.myRoundPoints.reduce((a, b) => a + b, 0);
    // timeUsed accumulates fractional seconds (the timer ticks in 0.1s); the DB
    // columns are integers, so round before sending / comparing.
    const secs = Math.round(this.mySecs);
    const name = this.playerName();
    const uid = authStore.userId;
    this.clearSub();
    this.phase = 'loading';
    gameStore.goChallenge();

    if (this.role === 'opponent' && this.loadedRow) {
      const resolved = await submitChallengeResult({
        code: this.loadedRow.id,
        name,
        userId: uid,
        roundPoints: this.myRoundPoints,
        secs,
        score,
      });
      this.result = resolved ?? this.localResult(name, uid, this.myRoundPoints, secs, score);
      this.phase = 'result';
      return;
    }

    // creator: store the match and wait for an opponent.
    const created = await createChallenge({
      seed: this.seed,
      isRandom: this.isRandom,
      name,
      userId: uid,
      roundPoints: this.myRoundPoints,
      secs,
      score,
    });
    if (!created) {
      this.phase = 'error';
      this.error = 'Sfida online non disponibile (offline o non configurata).';
      return;
    }
    this.code = created.id;
    this.loadedRow = created;
    this.phase = 'await';
    this.unsub = subscribeChallenge(created.id, (row) => {
      this.result = row;
      this.toast = `${row.opponent_name ?? 'Qualcuno'} ha risposto alla tua sfida!`;
      this.phase = 'result';
    });
  }

  /** Build a result row locally when the online submit could not run, so the
   *  player still sees the head-to-head outcome against the creator's stored run. */
  private localResult(
    name: string,
    uid: string | null,
    roundPoints: number[],
    secs: number,
    score: number,
  ): ChallengeRow {
    const row = this.loadedRow as ChallengeRow;
    const winner = decideWinner(
      { roundPoints: row.creator_round_points, score: row.creator_score, secs: row.creator_secs },
      { roundPoints, score, secs },
    );
    return {
      ...row,
      opponent_name: name,
      opponent_user_id: uid,
      opponent_round_points: roundPoints,
      opponent_secs: secs,
      opponent_score: score,
      winner,
      status: 'completed',
    };
  }
}

export const challengeStore = new ChallengeStore();
