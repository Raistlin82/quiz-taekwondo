# Quiz Taekwon-Do 2.0 — Design Spec

**Date:** 2026-06-22
**Status:** Approved direction (brainstorming)
**Branch:** `feature/svelte-rewrite`

## Goal

Rebuild the single-file `index.html` Taekwon-Do belt-exam quiz (Italian) into a memorable,
polished web app using a modern framework, while preserving the existing visual identity
(glassmorphism, green→blue gradients, animated blobs, confetti) and all current behavior
(belt selection, difficulty tiers, 10s timer, leaderboard).

## Decisions (locked)

- **Stack:** Svelte 5 (runes) + Vite + TypeScript.
- **Deploy:** GitHub Actions → GitHub Pages on every push to `main`. `base: '/quiz-taekwondo/'`.
- **Migration:** Replace the monolithic `index.html` on `main` (via this branch → merge). Old file stays in git history.
- **Content:** Migrate the existing ~60 questions 1:1, then expand the bank across belts/categories/levels.
- **New features:** Gamification (streak, XP, badges), Study mode + spaced-repetition review, audio/haptic polish + dark mode.

## Architecture

```
src/
├── main.ts                      # mount App
├── app.css                      # design tokens (CSS vars), base styles, light/dark themes
├── App.svelte                   # screen router + global chrome (background, mute, theme toggle)
├── lib/
│   ├── data/
│   │   ├── belts.ts             # BELTS[], DIFFICULTY config, types
│   │   └── questions.ts         # POOL (Question[]) — migrated + expanded
│   ├── stores/
│   │   ├── game.svelte.ts       # active-game state machine (runes class)
│   │   ├── progress.svelte.ts   # XP, badges, streak, SRS review queue (localStorage)
│   │   └── theme.svelte.ts      # light/dark, persisted
│   ├── services/
│   │   └── leaderboard.ts       # Supabase REST + localStorage fallback
│   ├── audio.ts                 # Web Audio beeps + navigator.vibrate haptics
│   ├── confetti.ts              # canvas confetti (burst/rain)
│   └── components/
│       ├── screens/
│       │   ├── StartScreen.svelte
│       │   ├── QuizScreen.svelte
│       │   ├── EndScreen.svelte
│       │   └── StudyScreen.svelte
│       ├── BeltPicker.svelte
│       ├── DifficultyPicker.svelte
│       ├── QuestionCard.svelte
│       ├── AnswerButton.svelte
│       ├── Timer.svelte
│       ├── ProgressBelt.svelte
│       ├── ScoreRing.svelte
│       ├── BadgeShelf.svelte
│       └── Leaderboard.svelte
```

## Domain model (preserved)

- `Belt { id 1..8, name, main color, stripe? }` — selection is **cumulative** (belt N includes all `belt <= N`).
- `Difficulty { facile|medio|difficile → maxLvl, count }`.
- `Question { cat, belt (minimum), lvl (1..3), q, options[], answer (index), explain }`.
- `buildGame()`: filter `belt<=selBelt && lvl<=maxLvl`, round-robin pick by category, shuffle options & re-index answer.

## State machine

`screen: 'start' | 'quiz' | 'end' | 'study'` drives `App.svelte` with Svelte transitions.
`game.svelte.ts` exposes a reactive class instance (runes `$state`/`$derived`) replacing the
old module-level globals (`idx`, `score`, `answered`, `wrongList`, timer).

## Features

1. **Gamification**: live streak (🔥) of consecutive correct; XP = base points + speed bonus;
   badges/achievements ("Esame perfetto", "Fulmine" fast answers, "Serie da 10", belt unlocks).
   Persisted in `progress.svelte.ts`.
2. **Study mode**: browse questions for a belt without a timer; missed questions enter a
   spaced-repetition queue (local) and resurface in a "Ripasso" session.
3. **Polish**: refined Web Audio feedback + `navigator.vibrate`; light/dark theme toggle
   (persisted, respects `prefers-color-scheme`); curated micro-animations via Svelte transitions.

## Leaderboard / Supabase

- Config via Vite env (`VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`), baked at build (anon key is public-safe).
- Project URL: `https://klfigmugksrwaxtjlevw.supabase.co`.
- `scores` table + RLS policies as already documented in README (public select + insert).
- Service returns a uniform shape regardless of online/local source; UI unchanged in spirit.

## Error handling

- Supabase unreachable → silent fallback to localStorage board, with a small notice.
- AudioContext / vibrate guarded in try/catch (already the pattern).
- localStorage access wrapped (private-mode safe).

## Testing

- `npm run build` must pass (TS + Svelte check).
- Playwright smoke test: load → pick belt/difficulty → answer → reach end screen → leaderboard renders.

## Specialized-agent plan

`code-architect` (blueprint) → parallel implementation agents per domain (data, stores, components, leaderboard) → `code-reviewer`.
