# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## What this is

An Italian-language Taekwon-Do ITF belt-exam quiz built with **Svelte 5 (runes) + Vite + TypeScript**.
It was rewritten from a single legacy `index.html` (still in git history) into a component-based app
with gamification (XP, streak, badges), a study/spaced-repetition mode, light/dark themes, audio +
haptic feedback, and an online leaderboard (Supabase) with a localStorage fallback.

Design specs and audits live in `docs/`: the original design doc in `docs/superpowers/specs/`, and
bug/UX + redesign notes in `docs/audit/`. Read these for the *why* behind current behaviour before
changing it.

## Commands

```bash
npm run dev      # dev server (http://localhost:5173)
npm run build    # production build → dist/
npm run preview  # serve the production build
npm run check    # svelte-check + tsc — run this after changes; CI-equivalent gate
```

There is no unit-test suite. Verification is `npm run check` + `npm run build` + a manual/Playwright
play-through. `.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to
`main`; `Codex.yml` and `Codex-review.yml` wire up the `@Codex` bot and automatic PR review.

## Architecture

State lives in three runes-based singleton stores in `.svelte.ts` modules (classes with `$state`
fields, exported as instances). Components read/mutate these directly — there is no prop-drilling
of game state.

- `src/lib/stores/game.svelte.ts` — **the state machine**. Holds `screen` ('start'|'quiz'|'end'|'study'),
  belt/difficulty selection, the active question list, score/streak/XP/timer, and the `mode`
  ('quiz'|'review'). `App.svelte` is a router keyed on `gameStore.screen`. This is where the quiz
  lifecycle, the `setInterval` timer, and the round-robin question selection live.
- `src/lib/stores/progress.svelte.ts` — **persistent** player progress (XP, level, best streak,
  unlocked badges) and a **Leitner spaced-repetition queue** (`srs`), all in localStorage. XP is
  accumulated per-answer by the game store (`answerXp`) and passed into `recordGame` so the live
  counter and the final total always agree. Badge-unlock thresholds are hardcoded here (in
  `recordGame` / `completeStudySession`); the badge catalog is `src/lib/data/badges.ts`.
- `src/lib/stores/theme.svelte.ts` — light/dark theme + sound/haptic settings, persisted. `apply()`
  is called from `main.ts` before first paint and sets `data-theme` on `<html>`.

## Domain model (preserved from the original)

`src/lib/data/belts.ts` + `questions.ts`:

- **Belt selection is cumulative**: choosing belt N includes every question with `belt <= N`. `belt`
  on a question is its *minimum* belt, not an exact match.
- `lvl` (1/2/3) is the difficulty tier; `DIFFICULTIES[key].maxLvl` is the ceiling and `count` the target.
- `buildGame()` filters by `belt<=selBelt && lvl<=maxLvl`, then picks **round-robin across categories**
  (`q.cat`) for a balanced set, and shuffles each question's options (re-pointing `answer`). The actual
  length can be less than `count` if the filtered pool is small.
- SRS cards are keyed by question text (`qKey(q) = q.q`).
- A run **passes** at `pct >= 0.87` (87% correct); passing at belt ≥ 10 (Nera) unlocks the
  black-belt badge. `TIME_PER_Q` (10s) bounds each question and drives the speed XP bonus.

When adding questions: set `belt` to the lowest belt that should ever see it, set `lvl`, and reuse an
existing `cat` emoji-label string exactly (categories are derived from `q.cat`, not an enum). The
belt→form (tul) mapping is in the comment header of `questions.ts`.

## Leaderboard / Supabase

`src/lib/services/leaderboard.ts` is source-agnostic: `submitAndFetch()` POSTs+GETs to Supabase when
`SHARED` is true, else falls back to localStorage (capped at 50, sorted pct→score→ts). Config is in
`src/lib/config.ts`: the project URL + **anon public** key are committed defaults (anon key is
public-safe — protected by RLS; never commit the `service_role` key). Override at build time with
`VITE_SUPABASE_URL` / `VITE_SUPABASE_KEY` (see `.env.example`; copy to a gitignored `.env.local` or
set them as GitHub Action secrets). The `scores` table + RLS policies are documented in `README.md`.
Note: the table currently has **select + insert** policies only (no delete/update) — anon clients
cannot remove rows.

## Conventions

- **Visual identity — "Hanji" (Sumi & Cinnabar):** rice-paper surfaces, sumi-ink text, cinnabar
  hero/seal accent, celadon for "correct/positive", expressive serif fonts (Fraunces display +
  Newsreader body, as `--font-display` / `--font-body`). Semantic token mapping: `--verde` = celadon
  (correct), `--blu` = cinnabar (hero/selected/CTA/focus), `--rosso` = sumi-sepia (wrong). Keep new
  UI on-theme via the tokens; don't reintroduce the old green→blue glassmorphism.
- Styling: scoped `<style>` per component using the CSS custom properties (design tokens) defined in
  `src/app.css`. Both themes are driven by those vars + `[data-theme]`; use them rather than hardcoding
  colors so dark mode keeps working.
- Animations use Svelte transitions (`fly`/`fade`). CSS animations respect `prefers-reduced-motion`
  via the `@media` block in `app.css`; JS/canvas animations (confetti, the ScoreRing count-up) and
  transition durations gate on `src/lib/motion.ts` (`prefersReducedMotion()` / `motionMs()`) since the
  CSS rule can't reach them.
- `src/lib/audio.ts` and `confetti.ts` are guarded utilities (no-op when unsupported); the canvas
  confetti targets `#confetti` in `App.svelte` and accepts an optional origin (the score pill).
- Accessibility baseline: a global `:focus-visible` ring and `.sr-only` utility live in `app.css`;
  the quiz uses an `aria-live` region for question changes and `role="status"` feedback.
