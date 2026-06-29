/* ============================================================
   Active-game state machine (runes). Replaces the old module-
   level globals. Drives the screen router in App.svelte.
   ============================================================ */

import { POOL } from '../data/questions';
import { DIFFICULTIES, TIME_PER_Q, type DifficultyKey, type Question } from '../data/belts';
import { shuffleWith } from '../rng';
import { buildBalancedSet, shuffleOptions } from '../quizbuild';
import { playSound, vibrate } from '../audio';
import { burst } from '../confetti';
import { themeStore } from './theme.svelte';
import { progressStore, answerXp, type GameResult, type CatStat } from './progress.svelte';

export type Screen = 'start' | 'quiz' | 'end' | 'study' | 'ranking' | 'challenge' | 'challengeLadder';
export type GameMode = 'quiz' | 'review' | 'challenge';

/** Stable key for a question (used by the SRS queue). */
export const qKey = (q: Question): string => q.q;

/** Center of the on-screen score pill, so confetti erupts from the score (U37). */
function scorePillOrigin(): { x: number; y: number } | undefined {
  if (typeof document === 'undefined') return undefined;
  const el = document.getElementById('scorePill');
  if (!el) return undefined;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export interface EndSummary {
  newBadges: string[];
  xpGained: number;
  leveledTo: number | null;
}

class GameStore {
  screen = $state<Screen>('start');
  mode = $state<GameMode>('quiz');

  // selections
  selBelt = $state(5); // default: Verde-Blu (id 5 in the 10-belt scale)
  selDiff = $state<DifficultyKey>('medio');
  playerName = $state('');

  // active game
  questions = $state<Question[]>([]);
  idx = $state(0);
  score = $state(0);
  answered = $state(false);
  selected = $state<number | null>(null);
  streak = $state(0);
  maxStreak = $state(0);
  fastCount = $state(0);
  gameXp = $state(0);
  lastGain = $state(0); // XP gained on the last answer (for the popup)
  wrong = $state<Question[]>([]);
  timeLeft = $state(TIME_PER_Q);
  timeUsed = $state(0); // total seconds spent answering (leaderboard speed tiebreak)

  // end-of-game
  summary = $state<EndSummary | null>(null);

  // challenge (best-of-3) — current round bookkeeping for the QuizScreen badge.
  challengeRound = $state(0); // 0-based
  challengeTotalRounds = $state(0);
  private chRoundPoints = 0; // speed-weighted points scored in the current round
  /** Set by the challenge store; called when a challenge round finishes so the
   *  store can advance to the interstitial / next round / final result. */
  onChallengeRoundEnd: ((points: number, secs: number) => void) | null = null;

  private correctKeys: string[] = [];
  // SRS cards already graded in the CURRENT review session — prevents a
  // "Ricomincia" replay from re-grading (and skewing) the Leitner boxes.
  private gradedKeys = new Set<string>();
  private timerId: ReturnType<typeof setInterval> | null = null;

  get current(): Question | undefined {
    return this.questions[this.idx];
  }
  get total(): number {
    return this.questions.length;
  }
  get isLast(): boolean {
    return this.idx === this.total - 1;
  }
  get pct(): number {
    return this.total ? this.score / this.total : 0;
  }
  get progressPct(): number {
    return this.total ? Math.round((this.idx / this.total) * 100) : 0;
  }
  get isReview(): boolean {
    return this.mode === 'review';
  }

  /** Per-category breakdown of the just-played game (weakest first). */
  get lastPerCat(): CatStat[] {
    const correct = new Set(this.correctKeys);
    const acc = new Map<string, { total: number; correct: number }>();
    for (const q of this.questions) {
      const e = acc.get(q.cat) ?? { total: 0, correct: 0 };
      e.total += 1;
      if (correct.has(qKey(q))) e.correct += 1;
      acc.set(q.cat, e);
    }
    return [...acc.entries()]
      .map(([cat, v]) => ({ cat, total: v.total, correct: v.correct }))
      .sort((a, b) => a.correct / a.total - b.correct / b.total);
  }

  /** Build a balanced quiz: filter by belt+difficulty, round-robin by category. */
  private buildGame(): Question[] {
    return buildBalancedSet(POOL, {
      maxBelt: this.selBelt,
      maxLvl: DIFFICULTIES[this.selDiff].maxLvl,
      count: DIFFICULTIES[this.selDiff].count,
    });
  }

  /** Build a review session from SRS-due questions (study mode). */
  private buildReview(limit = 15): Question[] {
    // dueKeys() is sorted most-overdue-first; slice the KEYS (not the shuffled
    // items) so truncation always keeps the most urgent cards. Shuffle then only
    // randomises presentation order. (bug-hunt)
    const chosen = new Set(progressStore.dueKeys().slice(0, limit));
    const items = POOL.filter((q) => chosen.has(qKey(q)));
    return shuffleWith(items).map((q) => shuffleOptions(q));
  }

  private resetCounters(resetGraded = true): void {
    this.idx = 0;
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.fastCount = 0;
    this.gameXp = 0;
    this.lastGain = 0;
    this.timeUsed = 0;
    this.chRoundPoints = 0;
    this.wrong = [];
    this.correctKeys = [];
    if (resetGraded) this.gradedKeys.clear();
    this.summary = null;
  }

  startQuiz(): void {
    this.playerName = (this.playerName.trim() || 'Ospite').slice(0, 18);
    playSound('start', themeStore.sound);
    this.mode = 'quiz';
    this.questions = this.buildGame();
    this.resetCounters();
    this.screen = 'quiz';
    this.beginQuestion();
  }

  startReview(): void {
    const review = this.buildReview();
    // Guard the empty case so the button is never a silent no-op (B4).
    if (!review.length) {
      this.goHome();
      return;
    }
    this.playerName = (this.playerName.trim() || 'Ospite').slice(0, 18);
    playSound('review', themeStore.sound);
    this.mode = 'review';
    this.questions = review;
    this.resetCounters();
    this.screen = 'quiz';
    this.beginQuestion();
  }

  /** Faithful restart of the current session — replays the SAME question set
   *  rather than rebuilding (which, in review mode, would drop already-graded
   *  cards from the shrunken due set). Used by "Ricomincia". (B4) */
  restart(): void {
    if (this.mode === 'review') {
      if (!this.questions.length) {
        this.goHome();
        return;
      }
      this.questions = this.questions.map((q) => shuffleOptions(q));
      this.resetCounters(false);
      this.screen = 'quiz';
      this.beginQuestion();
    } else {
      this.startQuiz();
    }
  }

  private beginQuestion(): void {
    this.answered = false;
    this.selected = null;
    this.lastGain = 0;
    this.startTimer();
  }

  /** Reveal the answer. `i` is the chosen index, or null on timeout. */
  answer(i: number | null): void {
    if (this.answered) return;
    this.answered = true;
    this.stopTimer();
    const q = this.current;
    if (!q) return;
    this.selected = i;
    // Accumulate time spent on this question (full TIME_PER_Q on a timeout).
    this.timeUsed += Math.max(0, TIME_PER_Q - this.timeLeft);

    const correct = i === q.answer;
    if (correct) {
      this.score += 1;
      this.streak += 1;
      this.maxStreak = Math.max(this.maxStreak, this.streak);
      // Only the normal quiz earns XP/progress. Review is XP-free (SRS only),
      // and challenge mode scores speed-weighted ROUND points instead (no XP).
      if (this.mode === 'quiz') {
        const gain = answerXp(this.timeLeft);
        this.lastGain = gain;
        this.gameXp += gain;
        if (this.timeLeft > 7) this.fastCount += 1;
      } else if (this.mode === 'challenge') {
        this.chRoundPoints += answerXp(this.timeLeft);
      }
      this.correctKeys.push(qKey(q));
      playSound(this.streak > 0 && this.streak % 5 === 0 ? 'streak' : 'good', themeStore.sound);
      vibrate(30, themeStore.haptics);
      // burst from the score pill, bigger on streak milestones (U37)
      burst(scorePillOrigin(), this.streak >= 5 ? 30 : 18);
      // In review mode, grade each SRS card at most once per session (a restart
      // replays the same set, but must not re-mutate the Leitner schedule).
      this.gradeOnce(q, true);
    } else {
      this.streak = 0;
      this.wrong = [...this.wrong, q];
      playSound(i === null ? 'timeout' : 'bad', themeStore.sound);
      vibrate([40, 30, 40], themeStore.haptics);
      this.gradeOnce(q, false);
    }
  }

  /** Grade an SRS card once per review session (no-op outside review / on repeats). */
  private gradeOnce(q: Question, correct: boolean): void {
    if (!this.isReview) return;
    const key = qKey(q);
    if (this.gradedKeys.has(key)) return;
    this.gradedKeys.add(key);
    progressStore.reviewGraded(key, correct);
  }

  next(): void {
    if (this.isLast) {
      this.endGame();
    } else {
      this.idx += 1;
      this.beginQuestion();
    }
  }

  private endGame(): void {
    this.stopTimer();
    // Challenge: a "game" is one round of the best-of-3. Hand the round's
    // points/seconds to the challenge store, which drives what happens next
    // (interstitial → next round, or the final head-to-head result).
    if (this.mode === 'challenge') {
      this.onChallengeRoundEnd?.(this.chRoundPoints, this.timeUsed);
      return;
    }
    if (this.isReview) {
      const newBadges = progressStore.completeStudySession();
      this.summary = { newBadges, xpGained: 0, leveledTo: null };
    } else {
      const result: GameResult = {
        belt: this.selBelt,
        correct: this.score,
        total: this.total,
        maxStreak: this.maxStreak,
        fastCount: this.fastCount,
        passed: this.pct >= 0.87,
        xpGained: this.gameXp,
        missedKeys: this.wrong.map(qKey),
        correctKeys: this.correctKeys,
        perCat: this.lastPerCat,
      };
      this.summary = progressStore.recordGame(result);
      // The passing-run rain() is fired by EndScreen after the ring fills (U35).
    }
    this.screen = 'end';
  }

  goHome(): void {
    this.stopTimer();
    this.screen = 'start';
  }

  goStudy(): void {
    this.stopTimer();
    this.screen = 'study';
  }

  goRanking(): void {
    this.stopTimer();
    this.screen = 'ranking';
  }

  goChallenge(): void {
    this.stopTimer();
    this.screen = 'challenge';
  }

  goChallengeLadder(): void {
    this.stopTimer();
    this.screen = 'challengeLadder';
  }

  /** Play one round (5 questions) of a challenge match. The challenge store
   *  builds the rounds from the shared seed and calls this per round. */
  startChallengeRound(questions: Question[], roundIndex: number, totalRounds: number): void {
    this.mode = 'challenge';
    this.questions = questions;
    this.resetCounters();
    this.challengeRound = roundIndex;
    this.challengeTotalRounds = totalRounds;
    this.screen = 'quiz';
    this.beginQuestion();
  }

  /* ---- timer ---- */
  private lastTickSec = 0;
  private startTimer(): void {
    this.stopTimer();
    this.timeLeft = TIME_PER_Q;
    this.lastTickSec = 0;
    this.timerId = setInterval(() => {
      this.timeLeft = Math.max(0, Math.round((this.timeLeft - 0.1) * 10) / 10);
      // Heartbeat: one tick + soft buzz per second over the final 3 seconds (U32).
      const sec = Math.ceil(this.timeLeft);
      if (sec > 0 && sec <= 3 && sec !== this.lastTickSec) {
        this.lastTickSec = sec;
        playSound('tick', themeStore.sound);
        vibrate(15, themeStore.haptics);
      }
      if (this.timeLeft <= 0) {
        this.stopTimer();
        this.answer(null);
      }
    }, 100);
  }
  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

export const gameStore = new GameStore();
