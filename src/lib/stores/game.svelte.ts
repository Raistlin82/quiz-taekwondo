/* ============================================================
   Active-game state machine (runes). Replaces the old module-
   level globals. Drives the screen router in App.svelte.
   ============================================================ */

import { POOL } from '../data/questions';
import { DIFFICULTIES, TIME_PER_Q, type DifficultyKey, type Question } from '../data/belts';
import { playSound, vibrate } from '../audio';
import { burst } from '../confetti';
import { themeStore } from './theme.svelte';
import { progressStore, answerXp, type GameResult, type CatStat } from './progress.svelte';

export type Screen = 'start' | 'quiz' | 'end' | 'study';
export type GameMode = 'quiz' | 'review';

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

const shuffle = <T>(a: T[]): T[] => {
  const x = a.slice();
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
};

/** Shuffle a question's options and re-point answer to the new index. */
function shuffleOptions(q: Question): Question {
  const correct = q.options[q.answer];
  const options = shuffle(q.options);
  return { ...q, options, answer: options.indexOf(correct) };
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

  // end-of-game
  summary = $state<EndSummary | null>(null);

  private correctKeys: string[] = [];
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
    const maxLvl = DIFFICULTIES[this.selDiff].maxLvl;
    const avail = POOL.filter((q) => q.belt <= this.selBelt && q.lvl <= maxLvl);
    const byCat: Record<string, Question[]> = {};
    for (const q of avail) (byCat[q.cat] = byCat[q.cat] || []).push(q);
    const cats = shuffle(Object.keys(byCat));
    for (const c of cats) byCat[c] = shuffle(byCat[c]);

    const picked: Question[] = [];
    const target = Math.min(DIFFICULTIES[this.selDiff].count, avail.length);
    let safety = 0;
    while (picked.length < target && safety < 800) {
      for (const c of cats) {
        const item = byCat[c].pop();
        if (item) picked.push(item);
        if (picked.length >= target) break;
      }
      safety++;
    }
    return shuffle(picked).map(shuffleOptions);
  }

  /** Build a review session from SRS-due questions (study mode). */
  private buildReview(limit = 15): Question[] {
    // dueKeys() is sorted most-overdue-first; slice the KEYS (not the shuffled
    // items) so truncation always keeps the most urgent cards. Shuffle then only
    // randomises presentation order. (bug-hunt)
    const chosen = new Set(progressStore.dueKeys().slice(0, limit));
    const items = POOL.filter((q) => chosen.has(qKey(q)));
    return shuffle(items).map(shuffleOptions);
  }

  private resetCounters(): void {
    this.idx = 0;
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.fastCount = 0;
    this.gameXp = 0;
    this.lastGain = 0;
    this.wrong = [];
    this.correctKeys = [];
    this.summary = null;
  }

  startQuiz(): void {
    this.playerName = (this.playerName.trim() || 'Ospite').slice(0, 18);
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
      this.resetCounters();
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

    const correct = i === q.answer;
    if (correct) {
      this.score += 1;
      this.streak += 1;
      this.maxStreak = Math.max(this.maxStreak, this.streak);
      // Review mode is intentionally XP-free (endGame hardcodes xpGained: 0 and
      // never calls recordGame). Gate the accumulation so the live "+XP" popup
      // can't promise XP that is then discarded. (bug-hunt)
      if (!this.isReview) {
        const gain = answerXp(this.timeLeft);
        this.lastGain = gain;
        this.gameXp += gain;
        if (this.timeLeft > 7) this.fastCount += 1;
      }
      this.correctKeys.push(qKey(q));
      playSound('good', themeStore.sound);
      vibrate(30, themeStore.haptics);
      // burst from the score pill, bigger on streak milestones (U37)
      burst(scorePillOrigin(), this.streak >= 5 ? 30 : 18);
      // In review mode, grade the SRS card immediately.
      if (this.isReview) progressStore.reviewGraded(qKey(q), true);
    } else {
      this.streak = 0;
      this.wrong = [...this.wrong, q];
      playSound('bad', themeStore.sound);
      vibrate([40, 30, 40], themeStore.haptics);
      if (this.isReview) progressStore.reviewGraded(qKey(q), false);
    }
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
