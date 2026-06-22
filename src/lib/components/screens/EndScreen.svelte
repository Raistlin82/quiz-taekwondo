<script lang="ts">
  import { onMount } from 'svelte';
  import { beltById, DIFFICULTIES } from '../../data/belts';
  import { gameStore } from '../../stores/game.svelte';
  import { badgeById } from '../../data/badges';
  import { submitAndFetch, clearLocal, type ScoreRow } from '../../services/leaderboard';
  import { SHARED } from '../../config';
  import ScoreRing from '../ScoreRing.svelte';
  import Leaderboard from '../Leaderboard.svelte';
  import BadgeShelf from '../BadgeShelf.svelte';

  const pct = $derived(gameStore.pct);
  const beltName = $derived(beltById(gameStore.selBelt)?.name ?? '');
  const isReview = gameStore.isReview;
  const newBadges = $derived(gameStore.summary?.newBadges ?? []);

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

  let showReview = $state(false);

  // One-shot submission. onMount runs exactly once per end screen
  // (the screen is freshly mounted via {#key screen} in App.svelte) and is
  // NOT reactive, so resetting the game on "Rigioca" cannot re-trigger it.
  onMount(() => {
    if (isReview) {
      loading = false;
      return;
    }
    submitAndFetch({
      name: gameStore.playerName,
      score: gameStore.score,
      total: gameStore.total,
      pct: Math.round(pct * 100),
      belt: gameStore.selBelt,
      diff: DIFFICULTIES[gameStore.selDiff].nm,
    })
      .then((res) => {
        rows = res.rows;
        myId = res.myId;
        online = res.online;
        if (SHARED && !res.online) error = 'Classifica online non raggiungibile. Mostro quella locale.';
      })
      .catch(() => (error = 'Impossibile caricare la classifica.'))
      .finally(() => (loading = false));
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

  {#if newBadges.length}
    <div class="badge-pop">
      🎉 Nuovo traguardo!
      <div class="new-badges">
        {#each newBadges as id (id)}
          {@const b = badgeById(id)}
          {#if b}<span class="nb">{b.emoji} {b.name}</span>{/if}
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

  {#if !isReview}
    <div class="lb-title">🏁 Classifica</div>
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
    font-family: 'Baloo 2';
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
    font-family: 'Baloo 2';
    font-weight: 800;
    color: var(--blu-d);
    margin-top: 10px;
  }
  .badge-pop {
    text-align: center;
    font-family: 'Baloo 2';
    font-weight: 800;
    color: #7c4a02;
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    border: 1px solid var(--giallo);
    border-radius: 16px;
    padding: 12px;
    margin-top: 12px;
  }
  .new-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
    margin-top: 6px;
  }
  .nb {
    background: #fff;
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 0.82rem;
    color: var(--ink);
    box-shadow: 0 3px 8px -3px rgba(0, 0, 0, 0.25);
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
    font-family: 'Baloo 2';
    font-weight: 800;
    font-size: 1.15rem;
    margin: 20px 0 8px;
    color: var(--ink);
  }
  .lb-clear {
    display: block;
    margin: 10px auto 0;
    background: transparent;
    color: var(--ink-faint);
    font-size: 0.8rem;
    font-family: 'Nunito';
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
