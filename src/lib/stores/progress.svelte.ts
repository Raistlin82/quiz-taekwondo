/* ============================================================
   Persistent player progress: XP, level, all-time stats,
   unlocked badges, and a Leitner spaced-repetition queue for
   missed questions. Runes-based, persisted to localStorage.
   ============================================================ */

import { PROGRESS_KEY } from '../config';
import { BADGES } from '../data/badges';
import { fetchCloudProgress, pushCloudProgress } from '../services/progressSync';

export interface SrsCard {
  box: number; // Leitner box 1..5 (higher = seen less often)
  due: number; // timestamp when due for review
}

/** Per-category performance breakdown. */
export interface CatStat {
  cat: string;
  total: number;
  correct: number;
}
type CatTally = Record<string, { total: number; correct: number }>;

export interface ProgressData {
  xp: number;
  gamesPlayed: number;
  bestStreak: number;
  fastAnswers: number;
  studySessions: number;
  badges: string[];
  srs: Record<string, SrsCard>;
  catStats: CatTally;
}

export interface GameResult {
  belt: number;
  correct: number;
  total: number;
  maxStreak: number;
  fastCount: number; // correct answers with >7s remaining
  passed: boolean; // >= 87%
  xpGained: number; // XP accumulated during the game (source of truth)
  missedKeys: string[]; // questions answered wrong (or timed out)
  correctKeys: string[]; // questions answered right
  perCat: CatStat[]; // per-category breakdown of this game
}

const DAY = 24 * 60 * 60 * 1000;
// Leitner intervals per box (box 1 = due ~immediately).
const BOX_INTERVAL = [0, 0, 1 * DAY, 3 * DAY, 7 * DAY, 16 * DAY];

function emptyProgress(): ProgressData {
  return {
    xp: 0,
    gamesPlayed: 0,
    bestStreak: 0,
    fastAnswers: 0,
    studySessions: 0,
    badges: [],
    srs: {},
    catStats: {},
  };
}

/** Coerce an arbitrary value (localStorage string or cloud JSONB) into ProgressData. */
function sanitize(saved: unknown): ProgressData {
  const base = emptyProgress();
  if (!saved || typeof saved !== 'object') return base;
  const s = saved as Record<string, unknown>;
  const num = (v: unknown, d: number) => (Number.isFinite(v) ? (v as number) : d);
  return {
    xp: num(s.xp, 0),
    gamesPlayed: num(s.gamesPlayed, 0),
    bestStreak: num(s.bestStreak, 0),
    fastAnswers: num(s.fastAnswers, 0),
    studySessions: num(s.studySessions, 0),
    badges: Array.isArray(s.badges) ? (s.badges.filter((b) => typeof b === 'string') as string[]) : [],
    srs: s.srs && typeof s.srs === 'object' && !Array.isArray(s.srs) ? (s.srs as Record<string, SrsCard>) : {},
    catStats:
      s.catStats && typeof s.catStats === 'object' && !Array.isArray(s.catStats)
        ? (s.catStats as CatTally)
        : {},
  };
}

function load(): ProgressData {
  try {
    return sanitize(JSON.parse(localStorage.getItem(PROGRESS_KEY) || ''));
  } catch {
    return emptyProgress();
  }
}

/**
 * Non-destructive merge of two progress snapshots (e.g. local + cloud), taking
 * the better of each so a sign-in/sync never loses earned XP, badges or cards.
 */
function mergeProgress(a: ProgressData, b: ProgressData): ProgressData {
  const srs: Record<string, SrsCard> = { ...a.srs };
  for (const [k, c] of Object.entries(b.srs)) {
    const cur = srs[k];
    // Keep the more-advanced card (higher Leitner box); tie → the later due date.
    if (!cur || c.box > cur.box || (c.box === cur.box && c.due > cur.due)) srs[k] = c;
  }
  const catStats: CatTally = { ...a.catStats };
  for (const [cat, v] of Object.entries(b.catStats)) {
    const cur = catStats[cat];
    // Keep the richer tally (more answers recorded).
    if (!cur || v.total > cur.total) catStats[cat] = v;
  }
  return {
    xp: Math.max(a.xp, b.xp),
    gamesPlayed: Math.max(a.gamesPlayed, b.gamesPlayed),
    bestStreak: Math.max(a.bestStreak, b.bestStreak),
    fastAnswers: Math.max(a.fastAnswers, b.fastAnswers),
    studySessions: Math.max(a.studySessions, b.studySessions),
    badges: Array.from(new Set([...a.badges, ...b.badges])),
    srs,
    catStats,
  };
}

/** XP for a single correct answer given seconds remaining (0..10). */
export function answerXp(secondsLeft: number): number {
  const base = 10;
  const speedBonus = Math.round(Math.max(0, secondsLeft) * 1.5);
  return base + speedBonus;
}

/** Level curve: level N needs 100*N cumulative XP within the level band. */
export function levelFromXp(xp: number): { level: number; into: number; need: number; pct: number } {
  let level = 1;
  let need = 100;
  let remaining = xp;
  while (remaining >= need) {
    remaining -= need;
    level += 1;
    need = 100 * level;
  }
  return { level, into: remaining, need, pct: Math.round((remaining / need) * 100) };
}

class ProgressStore {
  data = $state<ProgressData>(load());

  /** Current Supabase user id once auth resolves; null = local-only mode. */
  private cloudUserId: string | null = null;
  private pushTimer: ReturnType<typeof setTimeout> | null = null;

  get xp() {
    return this.data.xp;
  }
  get level() {
    return levelFromXp(this.data.xp);
  }
  get bestStreak() {
    return this.data.bestStreak;
  }
  get gamesPlayed() {
    return this.data.gamesPlayed;
  }
  get unlockedBadges(): string[] {
    return this.data.badges;
  }
  /** All-time per-category stats, weakest accuracy first. */
  get categoryStats(): CatStat[] {
    return Object.entries(this.data.catStats)
      .map(([cat, v]) => ({ cat, total: v.total, correct: v.correct }))
      .sort((a, b) => a.correct / a.total - b.correct / b.total);
  }

  hasBadge(id: string): boolean {
    return this.data.badges.includes(id);
  }

  /** Number of SRS cards currently due. */
  dueCount(now = Date.now()): number {
    return Object.values(this.data.srs).filter((c) => c.due <= now).length;
  }
  dueKeys(now = Date.now()): string[] {
    return Object.entries(this.data.srs)
      .filter(([, c]) => c.due <= now)
      .sort((a, b) => a[1].due - b[1].due)
      .map(([k]) => k);
  }

  private unlock(id: string, into: string[]): void {
    if (!this.data.badges.includes(id)) {
      this.data.badges.push(id);
      into.push(id);
    }
  }

  /** Schedule/refresh an SRS card after a miss (drops to box 1, due now). */
  private missCard(key: string, now: number): void {
    this.data.srs[key] = { box: 1, due: now };
  }
  /** Promote an SRS card after a correct review; remove once mastered. */
  reviewGraded(key: string, correct: boolean, now = Date.now()): void {
    const card = this.data.srs[key];
    if (!card) {
      if (!correct) {
        this.data.srs[key] = { box: 1, due: now };
        this.persist();
      }
      return;
    }
    if (correct) {
      const box = card.box + 1;
      if (box >= BOX_INTERVAL.length) {
        delete this.data.srs[key]; // mastered
      } else {
        this.data.srs[key] = { box, due: now + BOX_INTERVAL[box] };
      }
    } else {
      this.data.srs[key] = { box: 1, due: now };
    }
    this.persist();
  }

  /** Record a finished quiz; returns newly unlocked badge ids and XP gained. */
  recordGame(r: GameResult): { newBadges: string[]; xpGained: number; leveledTo: number | null } {
    const now = Date.now();
    const newBadges: string[] = [];
    const levelBefore = levelFromXp(this.data.xp).level;

    // XP is accumulated per-answer by the game store (answerXp) and passed in,
    // so the live counter and the final total always agree.
    const xpGained = r.xpGained;
    this.data.xp += xpGained;
    this.data.gamesPlayed += 1;
    this.data.fastAnswers += r.fastCount;
    if (r.maxStreak > this.data.bestStreak) this.data.bestStreak = r.maxStreak;

    // SRS: schedule missed; reward correct ones that were already queued.
    for (const k of r.missedKeys) this.missCard(k, now);
    for (const k of r.correctKeys) {
      if (this.data.srs[k]) this.reviewGradedInternal(k, true, now);
    }

    // Per-category all-time tally.
    for (const c of r.perCat) {
      const e = this.data.catStats[c.cat] ?? { total: 0, correct: 0 };
      e.total += c.total;
      e.correct += c.correct;
      this.data.catStats[c.cat] = e;
    }

    // Badges
    this.unlock('first_game', newBadges);
    if (r.maxStreak >= 10) this.unlock('streak10', newBadges);
    if (r.fastCount > 0) this.unlock('speed', newBadges);
    if (r.correct === r.total && r.total > 0) this.unlock('perfect', newBadges);
    if (this.data.xp >= 500) this.unlock('xp500', newBadges);
    if (r.belt >= 10 && r.passed) this.unlock('blackbelt', newBadges);

    const levelAfter = levelFromXp(this.data.xp).level;
    this.persist();
    return { newBadges, xpGained, leveledTo: levelAfter > levelBefore ? levelAfter : null };
  }

  /** Mark a completed study/review session. */
  completeStudySession(): string[] {
    const newBadges: string[] = [];
    this.data.studySessions += 1;
    this.unlock('scholar', newBadges);
    this.persist();
    return newBadges;
  }

  private reviewGradedInternal(key: string, correct: boolean, now: number): void {
    const card = this.data.srs[key];
    if (!card) return;
    if (correct) {
      const box = card.box + 1;
      if (box >= BOX_INTERVAL.length) delete this.data.srs[key];
      else this.data.srs[key] = { box, due: now + BOX_INTERVAL[box] };
    } else {
      this.data.srs[key] = { box: 1, due: now };
    }
  }

  totalBadges(): number {
    return BADGES.length;
  }

  /**
   * Bind progress to a Supabase user (called by the auth store when the
   * session resolves or changes). Loads the cloud row, merges it with local
   * progress (no data loss), then keeps the cloud copy up to date. Best-effort.
   */
  async attachUser(userId: string | null): Promise<void> {
    if (!userId) {
      this.cloudUserId = null;
      return;
    }
    const switching = this.cloudUserId !== userId;
    this.cloudUserId = userId;
    const cloud = await fetchCloudProgress(userId);
    if (cloud) {
      this.data = mergeProgress(this.data, sanitize(cloud));
      this.persistLocal();
    }
    // Ensure the row exists / reflects the merged state. Push immediately on a
    // fresh bind so a new device's empty cloud row gets seeded right away.
    this.queueCloudPush(switching);
  }

  /** Schedule (debounced) a push of the current progress to the cloud. */
  private queueCloudPush(immediate = false): void {
    const userId = this.cloudUserId;
    if (!userId) return;
    if (this.pushTimer) {
      clearTimeout(this.pushTimer);
      this.pushTimer = null;
    }
    const run = () => void pushCloudProgress(userId, this.data);
    if (immediate) run();
    else this.pushTimer = setTimeout(run, 1500);
  }

  private persistLocal(): void {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(this.data));
    } catch {
      /* ignore */
    }
  }

  private persist(): void {
    this.persistLocal();
    this.queueCloudPush();
  }
}

export const progressStore = new ProgressStore();
