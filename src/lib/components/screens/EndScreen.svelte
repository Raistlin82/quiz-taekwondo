<script lang="ts">
  import { onMount } from 'svelte';
  import { beltById, beltGroupOf, leaderboardPoints, DIFFICULTIES } from '../../data/belts';
  import { gameStore } from '../../stores/game.svelte';
  import { progressStore } from '../../stores/progress.svelte';
  import { badgeById } from '../../data/badges';
  import { submitAndFetch, clearLocal, type ScoreRow } from '../../services/leaderboard';
  import { recordProfileRun } from '../../services/profiles';
  import { authStore } from '../../stores/auth.svelte';
  import { SHARED } from '../../config';
  import { rain } from '../../confetti';
  import { playSound } from '../../audio';
  import { themeStore } from '../../stores/theme.svelte';
  import ScoreRing from '../ScoreRing.svelte';
  import Leaderboard from '../Leaderboard.svelte';
  import BadgeShelf from '../BadgeShelf.svelte';

  const pct = $derived(gameStore.pct);
  const beltName = $derived(beltById(gameStore.selBelt)?.name ?? '');
  const isReview = gameStore.isReview;
  const newBadges = $derived(gameStore.summary?.newBadges ?? []);
  const leveledTo = $derived(gameStore.summary?.leveledTo ?? null);

  const verdict = $derived.by(() => {
    if (isReview)
      return { emoji: '📚', title: 'Ripasso completato!', stars: '⭐⭐⭐', msg: 'Ottimo lavoro: le domande sbagliate torneranno meno spesso. Continua così!' };
    if (pct >= 0.87)
      return { emoji: '🏆', title: 'ESAME SUPERATO!', stars: '⭐⭐⭐', msg: `Sei pronto per la cintura ${beltName}! Teoria, coreano e forme: tutto al loro posto. Fantastico!` };
    if (pct >= 0.67)
      return { emoji: '😀', title: 'Ci sei quasi!', stars: '⭐⭐☆', msg: 'Molto bene! Ripassa le domande sbagliate e la prossima volta fai en plein.' };
    return { emoji: '📚', title: 'Continua ad allenarti!', stars: '⭐☆☆', msg: 'Ogni campione ha iniziato sbagliando. Ripassa il manuale e riprova. Spirito Indomito! 💪' };
  });

  // Leaderboard state (quiz mode only).
  let rows = $state<ScoreRow[]>([]);
  let myId = $state<string | null>(null);
  let online = $state(false);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let groupLabel = $state('');

  let showReview = $state(false);

  // One-shot submission. onMount runs exactly once per end screen
  // (the screen is freshly mounted via {#key screen} in App.svelte) and is
  // NOT reactive, so resetting the game on "Rigioca" cannot re-trigger it.
  onMount(() => {
    if (isReview) {
      loading = false;
      return;
    }
    submitAndFetch(
      {
        name: gameStore.playerName,
        score: gameStore.score,
        total: gameStore.total,
        pct: Math.round(pct * 100),
        belt: gameStore.selBelt,
        diff: DIFFICULTIES[gameStore.selDiff].nm,
      },
      authStore.userId,
    )
      .then((res) => {
        rows = res.rows;
        myId = res.myId;
        online = res.online;
        groupLabel = res.groupLabel;
        if (SHARED && !res.online) error = 'Classifica online non raggiungibile. Mostro quella locale.';
      })
      .catch(() => (error = 'Impossibile caricare la classifica.'))
      .finally(() => (loading = false));

    // Update the player's career profile (XP, trophies, cumulative points,
    // per-colour). Best-effort, fire-and-forget — independent of the board.
    void recordProfileRun({
      name: gameStore.playerName,
      xp: progressStore.xp,
      level: progressStore.level.level,
      badges: progressStore.unlockedBadges.length,
      runPoints: leaderboardPoints(Math.round(pct * 100), DIFFICULTIES[gameStore.selDiff].nm),
      colorLabel: beltGroupOf(gameStore.selBelt).label,
    });
  });

  // Celebration, timed to land as the score ring finishes filling (U35/U31/U38).
  onMount(() => {
    const s = gameStore.summary;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const passed = !isReview && pct >= 0.87;
    if (passed || s?.leveledTo != null) {
      timers.push(setTimeout(() => rain(), 820)); // rain() self-guards reduced-motion
    }
    if (passed) timers.push(setTimeout(() => playSound('win', themeStore.sound), 820));
    if (s?.leveledTo != null) timers.push(setTimeout(() => playSound('levelup', themeStore.sound), 620));
    if (s && s.newBadges.length) timers.push(setTimeout(() => playSound('badge', themeStore.sound), 460));
    return () => timers.forEach(clearTimeout);
  });

  function resetLocal() {
    if (confirm('Vuoi cancellare la classifica locale di questo dispositivo?')) {
      clearLocal();
      rows = [];
      myId = null;
    }
  }
</script>

<section class="screen">
  <ScoreRing score={gameStore.score} total={gameStore.total} emoji={verdict.emoji} />
  <div class="end-title">{verdict.title}</div>
  <div class="stars">{verdict.stars}</div>
  <div class="end-msg">{verdict.msg}</div>

  {#if !isReview && gameStore.summary}
    <div class="xp-line">+{gameStore.summary.xpGained} XP guadagnati</div>
  {/if}

  {#if leveledTo != null}
    <div class="level-up" role="status">⬆️ LEVEL UP! Sei al livello {leveledTo}</div>
  {/if}

  {#if newBadges.length}
    <div class="badge-pop" role="status">
      🎉 Nuovo traguardo!
      <div class="new-badges">
        {#each newBadges as id, n (id)}
          {@const b = badgeById(id)}
          {#if b}<span class="nb" style="animation-delay:{n * 0.08}s">{b.emoji} {b.name}</span>{/if}
        {/each}
      </div>
    </div>
  {/if}

  <div class="row">
    <button class="cta" onclick={() => (isReview ? gameStore.startReview() : gameStore.startQuiz())}>
      🔄 {isReview ? 'Altro ripasso' : 'Rigioca'}
    </button>
    <button class="ghost" onclick={() => gameStore.goHome()}>🏠 Home</button>
  </div>

  {#if gameStore.lastPerCat.length > 1}
    <div class="lb-title">📊 Per categoria</div>
    <div class="cats">
      {#each gameStore.lastPerCat as s (s.cat)}
        {@const p = Math.round((100 * s.correct) / s.total)}
        <div class="cat-row" class:weak={p < 50}>
          <span class="cat-name">{s.cat}</span>
          <div class="cat-bar"><div class="cat-fill" style="width:{p}%"></div></div>
          <span class="cat-num">{s.correct}/{s.total}</span>
        </div>
      {/each}
    </div>
  {/if}

  {#if !isReview}
    <div class="lb-title">🏁 Classifica{#if groupLabel} · {groupLabel}{/if}</div>
    <Leaderboard {rows} {myId} {online} {loading} {error} />
    {#if !online}
      <button class="lb-clear" onclick={resetLocal}>🗑️ Azzera classifica</button>
    {/if}
  {/if}

  <div class="lb-title">🎖️ Traguardi</div>
  <BadgeShelf highlight={newBadges} />

  {#if gameStore.wrong.length}
    <button class="ghost review-btn" onclick={() => (showReview = !showReview)}>
      📖 Ripassa gli errori ({gameStore.wrong.length})
    </button>
    {#if showReview}
      <div class="review">
        <b>📖 Da ripassare:</b><br /><br />
        {#each gameStore.wrong as w, i (i)}
          • <b>{w.q}</b><br />→ {w.options[w.answer]}<br /><br />
        {/each}
      </div>
    {/if}
  {:else if !isReview}
    <div class="review perfect">🎉 <b>Nessun errore!</b> Hai risposto bene a tutto. Sei un vero maestro!</div>
  {/if}
</section>

<style>
  .end-title {
    font-family: var(--font-display);
    font-weight: 800;
    text-align: center;
    font-size: 1.5rem;
    margin-top: 6px;
    color: var(--ink);
  }
  .stars {
    text-align: center;
    font-size: 1.7rem;
    letter-spacing: 8px;
    margin: 4px 0;
  }
  .end-msg {
    text-align: center;
    color: var(--ink-soft);
    font-weight: 600;
    font-size: 1rem;
    margin: 8px 6px 0;
    line-height: 1.5;
  }
  .xp-line {
    text-align: center;
    font-family: var(--font-display);
    font-weight: 800;
    color: var(--blu-d);
    margin-top: 10px;
  }
  .level-up {
    text-align: center;
    font-family: var(--font-display);
    font-weight: 800;
    color: #fff;
    background: linear-gradient(135deg, var(--verde), var(--blu));
    border-radius: 16px;
    padding: 12px;
    margin-top: 12px;
    box-shadow: 0 12px 24px -10px color-mix(in srgb, var(--primary) 50%, transparent);
    animation: pop 0.5s var(--ease-spring);
  }
  .badge-pop {
    text-align: center;
    font-family: var(--font-display);
    font-weight: 800;
    color: var(--amber-ink);
    background: var(--amber-bg-soft);
    border: 1px solid var(--giallo);
    border-radius: 16px;
    padding: 12px;
    margin-top: 12px;
    animation: pop 0.5s var(--ease-spring);
  }
  .new-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
    margin-top: 6px;
  }
  .nb {
    background: var(--card-solid);
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 0.82rem;
    color: var(--ink);
    box-shadow: 0 3px 8px -3px rgba(0, 0, 0, 0.25);
    animation: nbIn 0.4s var(--ease-spring) both;
  }
  @keyframes pop {
    0% {
      transform: scale(0.85);
      opacity: 0;
    }
    60% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
  @keyframes nbIn {
    from {
      transform: scale(0.5);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
  .row {
    display: flex;
    gap: 12px;
    margin-top: 18px;
  }
  .row button {
    flex: 1;
    padding: 14px;
    font-size: 1.05rem;
  }
  .lb-title {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.15rem;
    margin: 20px 0 8px;
    color: var(--ink);
  }
  .cats {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .cat-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 700;
    font-size: 0.82rem;
  }
  .cat-name {
    flex: 0 0 38%;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cat-bar {
    flex: 1;
    height: 10px;
    border-radius: 999px;
    background: var(--track);
    overflow: hidden;
    border: 1px solid var(--border);
  }
  .cat-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--verde), var(--blu));
    transition: width 0.6s var(--ease-out);
  }
  .cat-row.weak .cat-fill {
    background: linear-gradient(90deg, var(--accent-warm), var(--danger));
  }
  .cat-num {
    flex: 0 0 auto;
    font-family: var(--font-display);
    font-weight: 800;
    color: var(--ink-soft);
    min-width: 38px;
    text-align: right;
  }
  .lb-clear {
    display: block;
    margin: 10px auto 0;
    padding: 8px 12px;
    min-height: 44px;
    background: transparent;
    color: var(--ink-faint);
    font-size: 0.8rem;
    font-family: var(--font-body);
    font-weight: 700;
    text-decoration: underline;
  }
  .review-btn {
    width: 100%;
    margin-top: 14px;
    padding: 14px;
  }
  .review {
    margin-top: 14px;
    background: var(--surface-2);
    border: 1.5px dashed var(--border-strong);
    border-radius: 18px;
    padding: 16px;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--ink-soft);
    line-height: 1.5;
  }
  .review b {
    color: var(--ink);
  }
  .review.perfect {
    margin-top: 14px;
  }
</style>
