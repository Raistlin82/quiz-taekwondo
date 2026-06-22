# Quiz Taekwon-Do ITF — Bug & UX Audit

Date: 2026-06-23
Scope: Svelte 5 (runes) + Vite + TypeScript single-page app. Consolidation of an adversarially-verified audit (8 confirmed bugs, 43 UX findings) into a single deduplicated, prioritized action list.

## Summary

All bugs were re-verified against source; several had their severity corrected down after verification (the dramatic symptoms in the original reports were not reachable). After deduplication, the confirmed-bug set collapses from 8 to 7 distinct defects (the two "load() type validation" entries are the same root cause). None are critical: there are no crashes, data loss, or security issues reachable through normal use. The two most actionable bugs on the live path are the leaderboard double-write on a partial Supabase failure (medium) and the confetti ignoring `prefers-reduced-motion` (medium, accessibility).

The UX set (43) deduplicates to roughly 30 distinct workstreams. The dominant theme is dark-mode theming debt: a single hardcoded "amber/gold pill" recipe is copy-pasted across five components and several other pastel chips and borders have no dark variant — all fixable by promoting a small set of CSS tokens. The second theme is accessibility: no visible focus state anywhere, no live-region announcements for the quiz loop, color-only answer state, and multiple sub-AA contrast tokens. The third is mobile: a flexbox-centering overflow that can make the End screen unreachable, the absolute top-right controls colliding with screen headers, and sub-44px touch targets.

Highest-leverage moves: (1) one global `:focus-visible` rule, (2) the amber/chip token set that fixes ~6 dark-mode findings in one edit, (3) the leaderboard double-write fix, (4) confetti reduced-motion guard, (5) the End-screen scroll fix.

## Confirmed Bugs (by severity)

### Medium

**B1 — Partial Supabase failure (POST ok, GET fails) double-writes the score to localStorage**
`src/lib/services/leaderboard.ts` (submitAndFetch, lines 67-99).
The online branch wraps both the POST and the follow-up GET in one try block. If the POST commits server-side but the GET throws (network blip / 5xx / rate-limit / CORS), the empty catch falls through to the local fallback, which unconditionally pushes the same row into localStorage and returns `online: false`. Result: the score is persisted twice (server + a sticky local orphan with a fresh random id) and the user sees the misleading "Classifica online non raggiungibile" message even though their submission reached the server.
Fix: split the two network steps. After a successful POST, capture `myId` and set `posted = true`; wrap only the GET in its own try/catch. On GET failure when `posted`, return `{ rows: [row], myId, online: true }` (or a cached board) and skip the local push. Only do the local insert when `SHARED` is false or the POST itself threw.

**B2 — Confetti rAF loop and `rain()` ignore `prefers-reduced-motion` at runtime**
`src/lib/confetti.ts` (burst() line 84, rain() line 90), invoked from `src/lib/stores/game.svelte.ts` (burst at 179, rain at 218).
The only reduced-motion handling in the codebase is CSS-only (`src/app.css:291`), which cannot affect the JS/canvas particle animation. A user with OS-level reduce-motion still gets the full burst on every correct answer and full-screen rain on a passing exam (WCAG 2.3.3).
Fix: add a runtime guard `const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;` and early-return from `burst()` and `rain()` when it is true. Optionally cache the MediaQueryList and listen for changes.

### Low

**B3 — load() does not validate field types (badges / xp / srs)** *(dedup: merges the persistence-lens and edge-lens reports of the same defect)*
`src/lib/stores/progress.svelte.ts` (load, lines 41-57).
`return { ...base, ...saved, srs: saved.srs ?? {} }` blindly overwrites typed fields; `?? {}` only guards null/undefined, not a wrong type, and the try/catch only catches JSON.parse. A non-object `srs` makes `this.data.srs[key] = {...}` throw; a non-array `badges` makes `.push`/`.includes` throw during `recordGame()`; a string `xp` makes `this.data.xp += xpGained` string-concatenate and silently corrupt XP. Reachable only via manual DevTools tampering (the app only ever writes well-typed data via `persist()`, single schema version, no migration), hence low.
Fix: coerce each field after parsing — `xp = Number.isFinite(saved.xp) ? saved.xp : 0`, `badges = Array.isArray(saved.badges) ? saved.badges.filter(b => typeof b === 'string') : []`, `srs = (saved.srs && typeof saved.srs === 'object' && !Array.isArray(saved.srs)) ? saved.srs : {}`, and guard `gamesPlayed/bestStreak/fastAnswers/studySessions` with `Number.isFinite` fallbacks. Build the returned object explicitly instead of `...saved`.

**B4 — Review "Altro ripasso" can be a silent no-op when the due queue empties**
`src/lib/stores/game.svelte.ts` (startReview/buildReview, lines 113, 140-149); trigger at `src/lib/components/screens/EndScreen.svelte:94`.
In review mode `answer()` grades each card synchronously, promoting correct cards out of the due set. `startReview()` rebuilds via `buildReview()` which re-reads the live due set; if it is empty it hits `if (!review.length) return;` before changing screen/questions/timer. EndScreen's "Altro ripasso" has no guard, so after a fully-correct review with no other due cards the button does nothing. (Verification refuted the more dramatic claims: StartScreen's button is correctly `disabled` when `due === 0`, and the mid-review "stuck timer" state is not reachable since `answer()` stops the timer.) Benign — "Home" sits beside it — hence low.
Fix: guard the empty case in `startReview()` to route somewhere sensible (e.g. `goHome()` or a "niente da ripassare" message) instead of an early `return`. Optionally add `disabled` to the EndScreen "Altro ripasso" button mirroring StartScreen.

**B5 — `dueCount()/dueKeys()` default `Date.now()` makes the "Ripasso" enabled-state stale over wall-clock time**
`src/lib/stores/progress.svelte.ts` (lines 103-111); consumed at `src/lib/components/screens/StartScreen.svelte:10,72`.
`const due = $derived(progressStore.dueCount())` only re-runs when its tracked dep (`data.srs`) changes, not when wall-clock time passes. A box-2+ card scheduled `now + DAY` that becomes due while the Start screen stays mounted (idle) won't flip the button until a remount or data mutation. Very narrow (smallest interval is one day; the screen remounts on every navigation via `{#key screen}`), hence low.
Fix: recompute on screen entry/visibility — e.g. a `visibilitychange`/interval that bumps a `$state` tick the derived reads, or treat box>=2 future-due cards as non-gating and refresh the count on mount.

**B6 — `loadLocal()` does not validate parsed JSON is an array**
`src/lib/services/leaderboard.ts` (loadLocal line 43; local fallback 91-99).
`JSON.parse(... || '[]')` succeeds for well-formed non-array JSON (e.g. `{}`); the fallback then calls `board.push`/`board.sort` on a non-array and throws, rejecting the promise and leaving EndScreen permanently showing "Impossibile caricare la classifica." until the key is cleared. Tamper-only trigger, hence low.
Fix: `const v = JSON.parse(...); return Array.isArray(v) ? v : [];` and treat a non-array as empty before push/sort.

**B7 — Offline-failure message hides the just-saved local board**
`src/lib/components/screens/EndScreen.svelte:55-56`; `src/lib/components/Leaderboard.svelte:27-47`.
On a genuine network outage with `SHARED` true, `submitAndFetch` falls back to local and returns a populated board with `online: false`. EndScreen sets the "Mostro quella locale" message, but Leaderboard's if/else-if cascade renders `{:else if error}` before the rows branch — so the local rows the message promises are hidden behind the error text. The user's own numeric score is still visible via the ScoreRing, hence low.
Fix: render `error` as a non-blocking banner above the rows when both exist (keep an `{#if error}` banner, then always render rows when `rows.length`), or in EndScreen pass `error` only when `rows` is empty.

## UX Improvements (by area)

### Visual / theming (dark-mode debt)

- **U1 — Amber/gold pill token set (highest-leverage cleanup).** The same gold-pill recipe is reimplemented five times with copy-paste drift: QuizScreen `.review-flag` and `.score` (`linear-gradient(#fde68a,#fbbf24)`), StartScreen `.ripasso.active` and StudyScreen `.nav .flag` (`#fde68a,var(--giallo)`), EndScreen `.badge-pop` (`#fef3c7,#fde68a`) — all hardcode `color:#7c4a02`. In dark mode these stay bright pastel islands floating on the dark card. Introduce theme-aware tokens (`--amber-bg`, `--amber-ink`, `--amber-glow`) in `app.css` with dark variants and replace every literal. Fixes the QuizScreen amber pill, the drift, the EndScreen `.badge-pop`, and StudyScreen/StartScreen flags in one edit. Files: `src/app.css`, `src/lib/components/screens/QuizScreen.svelte`, `StartScreen.svelte`, `EndScreen.svelte`, `StudyScreen.svelte`.
- **U2 — Category pill (`.cat`) has no dark variant.** `linear-gradient(135deg,#dbeafe,#ede9fe)` stays a bright pastel on the dark card; duplicated verbatim in QuizScreen and StudyScreen. Add `--chip-bg`/`--chip-ink` tokens (dark = `color-mix(in srgb,var(--blu) 22%, var(--surface))` / `#bcd4ff`) and use in both. Files: `src/app.css`, QuizScreen, StudyScreen.
- **U3 — New-badge chip `.nb` uses `#fff` background → invisible text in dark mode.** `--ink` is near-white in dark, so light-on-white. Change to `var(--card-solid)`/`var(--surface)`; fold the parent `.badge-pop` into the amber tokens (U1). File: `src/lib/components/screens/EndScreen.svelte`.
- **U4 — Belt swatch borders use `rgba(0,0,0,.1)` → invisible on dark.** White/yellow belts bleed shapelessly, black belt vanishes against `--surface`. Replace with `border: 1px solid var(--glass-brd)` (or `color-mix(in srgb,var(--ink) 22%, transparent)`). Files: `src/lib/components/BeltDot.svelte`, `BeltPicker.svelte`.
- **U5 — Wrong-answer feedback color hardcoded `#b91c1c`, no dark variant.** Sibling `.feedback.good` correctly uses `var(--verde-d)`; the bad state is asymmetric and low-contrast on the dark red-tint panel. Add a `--rosso-d` token (light `#b91c1c` / dark `#fca5a5`) or `light-dark(#b91c1c,#fca5a5)`. File: `src/lib/components/screens/QuizScreen.svelte`.
- **U6 — Start-screen hero medal is a hardcoded white disc, dull on dark.** The signature visual: give the disc a brand-gradient rim (`--verde`→`--blu`) and a theme-reactive face (`--medal-face`), and a glow drop-shadow for dark. File: `src/lib/components/screens/StartScreen.svelte`.
- **U7 — Radii are ad-hoc literals (14/16/18/11px) with no tokens.** Introduce `--radius-md:18px` and `--radius-xs:11px`; pick one radius for the selectable-card family (BeltPicker/DifficultyPicker/AnswerButton) so the pickers rhyme. Files: `src/app.css`, BeltPicker, DifficultyPicker, AnswerButton.
- **U8 — Selected-state accent is split blue vs green across the two pickers.** BeltPicker uses `--blu`, DifficultyPicker uses `--verde` for the identical "selected" meaning. Standardize one accent for both. Files: BeltPicker, DifficultyPicker.
- **U9 — Quiz visual hierarchy: amber `.score` pill out-shouts the question.** Reduce the score pill's glow shadow so the `.question` is the focal point; optionally drop the `.timer-num` border. Files: QuizScreen, ProgressBelt, Timer.
- **U10 — ProgressBelt knot emoji overflows the track at 0%/100%** *(dedup: two near-identical entries merged).* `left:{pct}%` with `translate(-50%,-50%)` hangs half the 🥋 outside the rounded track / past the card edge. Clamp with `left: clamp(12px, {pct}%, calc(100% - 12px))` and add horizontal padding; optionally base `progressPct` on `(idx+1)/total` so the belt advances on lock-in. File: `src/lib/components/ProgressBelt.svelte`.

### Accessibility

- **U11 — No visible focus state anywhere (highest-impact a11y).** Exactly one `:focus` rule exists (`.name-box:focus`, which sets `outline:none`). Add a global `:focus-visible { outline: 3px solid var(--blu); outline-offset: 2px; border-radius: 12px; }` plus `:focus:not(:focus-visible){ outline:none }` in `app.css`. Fixes every belt chip, difficulty card, answer button, nav button and study card at once (WCAG 2.4.7). File: `src/app.css`.
- **U12 — Quiz question changes and correct/wrong feedback never announced.** No aria-live anywhere in the loop. Add `role="status" aria-live="polite"` to the `.feedback` box, and a visually-hidden live region inside the `{#key gameStore.idx}` block restating progress + question text. Depends on the sr-only utility (U16). File: `src/lib/components/screens/QuizScreen.svelte`.
- **U13 — Answer buttons convey correct/wrong by color + emoji only.** Add `aria-label` including the letter and outcome (`— risposta corretta`/`— risposta sbagliata`), mark `.mark` emoji `aria-hidden="true"` (WCAG 1.4.1 / 4.1.3). File: `src/lib/components/AnswerButton.svelte`.
- **U14 — Multiple text colors fail WCAG AA (4.5:1).** Token-level fixes in `app.css`: `--ink-faint` light `#94a3b8`→`#64748b`, dark `#6b7a8f`→`#8595a8`; `.feedback.good` green → `#0e6b34`; gold-pill brown `#7c4a02`→`#6b3f00` (folds into U1). High reach, shared variables. File: `src/app.css` (+ minor component overrides).
- **U15 — Timer is invisible to screen readers and the low-time cue is motion-only.** Add `role="timer"` + `aria-label` to the wrapper, `aria-hidden` on the bar; for `<=3s` add a non-motion fallback (red number background/border) plus a one-shot sr-only `aria-live="assertive"` "Ultimi secondi!", since the pulse is neutralized under reduced-motion. File: `src/lib/components/Timer.svelte`.
- **U16 — No shared `.sr-only` utility; decorative SVGs/emoji read literally.** Add the standard `.sr-only` class to `app.css` (unblocks U12/U15). Give ScoreRing `role="img" aria-label="Punteggio: X su Y"`, fix StartScreen belt badge label, `aria-hidden` the ProgressBelt knot. Files: `src/app.css`, ScoreRing, StartScreen, ProgressBelt.
- **U17 — Pickers/study chips are an unlabeled set of toggles.** Wrap each grid in `role="group"` with `aria-label`; add `type="button"` + `aria-pressed` to the Study belt chips (they have neither); add combined `aria-label` to DifficultyPicker buttons. Files: BeltPicker, DifficultyPicker, StudyScreen.
- **U18 — Study flashcard reveal not announced; prompt is mouse-centric.** Add `aria-expanded={revealed}` + `aria-label` to the card button, wrap `.answer` in `role="region" aria-live="polite"`, change "👆 Tocca per vedere" to "Tocca o premi Invio…". File: StudyScreen.
- **U19 — Disabled "Ripasso" button gives no reason and dims via opacity only.** Add an explanatory `aria-label`/`title` ("Ripasso non disponibile: nessuna domanda da rivedere") and a helper line when `due === 0`. File: StartScreen.
- **U20 — Leaderboard lacks list semantics; "you" row distinguished by color only.** Add `role="list"`/`role="listitem"`, `aria-current="true"` + sr-only "(tu)" on the player row, `role="status"` on the empty/loading state. File: `src/lib/components/Leaderboard.svelte`.
- **U21 — JS-driven Svelte transitions bypass reduced-motion.** `fade`/`fly` screen and question transitions, the ScoreRing setTimeout stroke draw, and StudyScreen card fly still animate under reduce-motion. Add a small `motion.ts` helper reading `matchMedia('(prefers-reduced-motion: reduce)').matches` and gate transition durations to 0. Files: `src/app.css`, App.svelte, QuizScreen, ScoreRing, StudyScreen. (Canvas confetti is covered by bug B2.)

### Mobile / responsive

- **U22 — End screen can be clipped/unreachable in landscape & short viewports.** `body` uses centering flex; when `.app` is taller than the viewport the classic flexbox bug pins the top above the scroll origin so the ScoreRing/title can't be scrolled to. Lowest-risk: `body { display:grid; place-items:center; min-height:100dvh; } .app { max-block-size:100%; }` (grid doesn't clip the overflow edge). File: `src/app.css`.
- **U23 — Top-right controls cluster overlaps Quiz/Study headers (and the Ripasso flag) at <=360px.** `.controls` is `position:absolute; top:16px; right:16px` over whatever renders top-right. Reserve space (`padding-right: 96px` on `.quiz-head`/`.topbar`) or, better, move `.controls` into a slim flex header bar in normal flow. Add `top: max(16px, env(safe-area-inset-top))`. Files: App.svelte, QuizScreen, StudyScreen, `src/app.css`.
- **U24 — Several touch targets below 44px.** `.icon-btn` 42→44, `.restart-btn` ~30px tall → `min-height:44px`, study `.chip` ~26px → `min-height:36px` (or `::after{inset:-8px}` to expand the hit area), `.lb-clear` link → `padding:8px 12px; min-height:44px`. Files: `src/app.css`, StudyScreen, QuizScreen.
- **U25 — Belt grid wraps awkwardly / truncates long names at ~360px.** `auto-fit minmax(80px,1fr)` yields a ragged 3+3+2. Switch to `repeat(4,1fr)` under `@media (max-width:420px)` for a clean 4x2, relax `line-height` to ~1.15, add `min-height`. File: BeltPicker.
- **U26 — Quiz topbar can overflow on narrow screens (belt tag + flame + score).** Add `flex-wrap:wrap; row-gap:6px`; let `.beltTag` truncate (`max-width; overflow:hidden; text-overflow:ellipsis; white-space:nowrap`); keep `.qnum`/`.score` `flex:0 0 auto`. File: QuizScreen.
- **U27 — Safe-area insets not applied left/right.** Body applies top/bottom only; in landscape on notched iPhones the card and controls slide under the housing. Add `padding-left/right: max(18px, env(safe-area-inset-left/right))` to body and `right: max(16px, env(safe-area-inset-right))` to `.controls`. File: `src/app.css`.
- **U28 — Hover-only affordances give no touch feedback.** `.ans`/`.belt-opt`/`.diff-opt` lift only under `:hover`, which sticks or no-ops on touch. Wrap hover in `@media (hover:hover)` and add `:active` mirrors. Files: AnswerButton, BeltPicker, DifficultyPicker.
- **U29 — Name input ~16.3px is fragile against iOS focus-zoom.** Pin `.name-box { font-size: max(16px, 1.02rem); }`. File: StartScreen.

### Interaction / delight

- **U30 — XP gain is static text, never a popup.** Add an absolutely-positioned `.xp-pop` near the `.score` chip, rendered `{#key gameStore.idx}` when correct, with a ~900ms `xpPop` keyframe; scale by gain tier (>18 XP → larger + ⚡) to make the speed bonus legible. Gate behind reduced-motion. File: QuizScreen. (Highest-frequency reward; cheap delight.)
- **U31 — No level-up moment despite a full level/XP system.** In `recordGame()` capture level before/after adding xp and return `leveledTo`; in EndScreen render a "LEVEL UP!" banner (reuse `.badge-pop`/`pop`) and a one-shot `rain()` when set. Files: progress.svelte.ts, game.svelte.ts, EndScreen. (Biggest missing memorable moment.)
- **U32 — Timer has no heartbeat; the `tick` sound is dead code.** Wire the existing `playSound('tick')` + `vibrate(15)` once per second for the final 3s; add a `.warn` class + soft red glow to `.timer-track`; change the pulse to `1s ease-in-out` so it reads as a heartbeat. Files: Timer, game.svelte.ts.
- **U33 — Answer reveal lacks a lock-in pop/shake.** Add `correctPop` (scale 1→1.03→1) on `.ans.correct`, `wrongShake` translateX on the tapped `.ans.wrong`, and a `markIn` scale on `.mark`; reinforces right/wrong beyond color (helps color-blind). File: AnswerButton.
- **U34 — Streak flame is flat, no escalation or milestone.** Wrap in `{#key gameStore.streak}` with a `flameKick` scale, grow font-size with streak via `clamp`, flash a floating label at streak 5/10. Files: QuizScreen, game.svelte.ts.
- **U35 — ScoreRing number doesn't count up; confetti fires before the ring fills.** Animate the score number 0→score over ~1s via rAF into `$state` (jump to final under reduced-motion); move the passing-run `rain()` to an EndScreen `onMount` `setTimeout` ~700-900ms so it lands at the crescendo. Files: ScoreRing, EndScreen, game.svelte.ts.
- **U36 — Screen/question transitions only fade-in (flash on swap).** Add a short `out:fade` to the `{#key screen}` router and the `{#key idx}` question block; stabilize question-container height to stop the feedback/Next layout shift. Files: App.svelte, QuizScreen.
- **U37 — Confetti always bursts from screen center.** Give `burst(x?, y?)` optional origin coords and pass the `.score` chip's bounding-rect center; scale particle count down for routine answers and reserve the big burst for milestones. (Reduced-motion gating handled by bug B2.) Files: confetti.ts, game.svelte.ts.
- **U38 — EndScreen new-badge banner is static while the shelf tiles animate.** Apply the existing `pop` keyframe / fly-in to `.badge-pop`, stagger the `.nb` chips, optionally play the `win` sound on badge unlock. Files: EndScreen, BadgeShelf.
- **U39 — Answer-tag letter stays neutral grey on hover.** Add `.ans:not(.locked):hover .tag { background: var(--blu); color:#fff; }` mirroring the correct/wrong tag fill. File: AnswerButton.
- **U40 — No press feedback on answer buttons before lock.** Add `.ans:not(.locked):active{ transform:scale(.98); box-shadow:0 2px 8px -4px rgba(0,0,0,.35) }`. File: AnswerButton. (Overlaps U28; ship together.)

## Prioritized Action List

Order: must-fix bugs first (by severity), then UX by impact/effort. See the structured `topActions` for the machine-readable list. Top of the queue:

1. **B1** leaderboard double-write (bug, medium) — live data-integrity path.
2. **B2** confetti reduced-motion guard (bug, medium) — accessibility, trivial fix.
3. **U11** global `:focus-visible` (ux, high impact / small) — one rule, fixes all controls.
4. **U1** amber/gold token set (ux, high / small) — fixes ~5 dark-mode findings in one edit.
5. **U2 + U3 + U4 + U5** remaining dark-mode chip/border/feedback tokens (ux, high-medium / small) — same token workstream.
6. **U22** End-screen scroll fix (ux, high / small) — content can be unreachable.
7. **U14** AA contrast token tweaks (ux, high / small) — shared variables.
8. **U12 + U13 + U16** quiz announcements + answer aria + sr-only utility (ux, high / small-medium) — makes the core loop usable non-visually.
9. **U23 + U24** controls overlap + 44px touch targets (ux, high / small-medium).
10. **U30 + U31** XP popup + level-up moment (ux, high / small-medium) — top delight wins.

Then the remaining medium/low UX items (U6-U10, U15, U17-U21, U25-U29, U32-U40) and the low-severity bugs (B3-B7, all tamper-only or benign hardening) as polish/hardening passes.
