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
  import { playSound } from '../../audio';
  import { themeStore } from '../../stores/theme.svelte';
  import ScoreRing from '../ScoreRing.svelte';
  import Leaderboard from '../Leaderboard.svelte';
  import BadgeShelf from '../BadgeShelf.svelte';

  const pct = $derived(gameStore.pct);
  const percent = $derived(Math.round(pct * 100));
  const beltName = $derived(beltById(gameStore.selBelt)?.name ?? '');
  const isReview = gameStore.isReview;
  const isNamed = $derived.by(() => {
    const n = gameStore.playerName.trim().toLowerCase();
    return n.length > 0 && n !== 'ospite';
  });
  const newBadges = $derived(gameStore.summary?.newBadges ?? []);
  const leveledTo = $derived(gameStore.summary?.leveledTo ?? null);
  const bestCat = $derived.by(() => {
    const cats = gameStore.lastPerCat;
    if (!cats.length) return null;
    return cats.reduce((best, cur) => (cur.correct / cur.total > best.correct / best.total ? cur : best));
  });
  const bestCatName = $derived(bestCat?.cat.replace(/^[^\s]+\s*/, '') ?? 'Coreano');
  const passed = $derived(!isReview && pct >= 0.87);
  const verdict = $derived.by(() => {
    if (isReview)
      return {
        title: 'Ripasso completato',
        msg: 'Le domande sbagliate tornano meno spesso: hai consolidato il lavoro.',
      };
    if (pct >= 0.87)
      return {
        title: 'Esame superato',
        msg: `Pronto per la cintura ${beltName}.`,
      };
    if (pct >= 0.67)
      return {
        title: 'Ci sei quasi',
        msg: 'Ripassa gli errori e riprova: manca poco alla soglia dell’esame.',
      };
    return {
      title: 'Da ripassare',
      msg: 'Rivedi le basi e torna sul tatami con le domande sbagliate.',
    };
  });

  let rows = $state<ScoreRow[]>([]);
  let myId = $state<string | null>(null);
  let online = $state(false);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let groupLabel = $state('');

  let showReview = $state(false);
  let showDetails = $state(false);
  let showAllRows = $state(false);

  const topRows = $derived(rows.slice(0, 3));

  onMount(() => {
    if (isReview) {
      loading = false;
      return;
    }

    const nm = gameStore.playerName.trim();
    const named = nm.length > 0 && nm.toLowerCase() !== 'ospite';
    submitAndFetch(
      {
        name: gameStore.playerName,
        score: gameStore.score,
        total: gameStore.total,
        pct: Math.round(pct * 100),
        belt: gameStore.selBelt,
        diff: DIFFICULTIES[gameStore.selDiff].nm,
        secs: Math.round(gameStore.timeUsed * 10) / 10,
      },
      authStore.userId,
      named,
    )
      .then((res) => {
        rows = res.rows;
        myId = res.myId;
        online = res.online;
        groupLabel = res.groupLabel;
        if (SHARED && named && !res.online)
          error = 'Classifica online non raggiungibile. Mostro quella locale.';
      })
      .catch(() => (error = 'Impossibile caricare la classifica.'))
      .finally(() => (loading = false));

    if (authStore.isLoggedIn && named) {
      void recordProfileRun({
        name: gameStore.playerName,
        xp: progressStore.xp,
        level: progressStore.level.level,
        badges: progressStore.unlockedBadges.length,
        runPoints: leaderboardPoints(Math.round(pct * 100), DIFFICULTIES[gameStore.selDiff].nm),
        colorLabel: beltGroupOf(gameStore.selBelt).label,
      });
    }
  });

  onMount(() => {
    const s = gameStore.summary;
    const timers: ReturnType<typeof setTimeout>[] = [];
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

  function rankBadge(rank: number) {
    return rank === 0 ? '1' : rank === 1 ? '2' : rank === 2 ? '3' : `${rank + 1}`;
  }
</script>

<section class="screen result-screen">
  <header class="result-head">
    <span aria-hidden="true"></span>
    <h1>Risultato</h1>
    <span class="seal" aria-hidden="true">證</span>
  </header>

  <div class="result-art" class:review={isReview}>
    <img class="pine" src="ui/pine-branch.png" alt="" aria-hidden="true" />
    <ScoreRing score={gameStore.score} total={gameStore.total} />
    <div class="hangul" aria-hidden="true">태<br />권<br />도<span>禮</span></div>
  </div>

  <h2 class:pass={passed || isReview}>{verdict.title}</h2>
  {#if !isReview && gameStore.summary}
    <div class="xp-gain">+{gameStore.summary.xpGained} XP</div>
  {/if}
  <p class="result-msg">{verdict.msg}</p>

  <div class="summary-pair">
    <div class="stat-card">
      <img class="stat-icon" src="ui/icons/book.png" alt="" aria-hidden="true" />
      <span>Da ripassare</span>
      <b>{gameStore.wrong.length}</b>
    </div>
    <div class="stat-card">
      <span class="stat-icon ink" aria-hidden="true">권</span>
      <span>Migliore categoria</span>
      <b>{bestCatName}</b>
    </div>
  </div>

  {#if !isReview}
    <div class="board">
      <div class="board-title">
        <span>Classifica <small>{groupLabel ? groupLabel : 'Top 3'}</small></span>
        <button type="button" onclick={() => (showAllRows = !showAllRows)}>
          {showAllRows ? 'Chiudi' : 'Vedi tutte'}
        </button>
      </div>

      {#if loading}
        <div class="board-empty" role="status">Carico la classifica...</div>
      {:else}
        {#if error}
          <div class="board-note" role="status">{error}</div>
        {/if}
        {#if topRows.length}
          <div class="rank-list" role="list">
            {#each topRows as row, rank (row.id)}
              {@const mine = row.id === myId}
              <div class="rank-row" class:mine={mine} role="listitem" aria-current={mine ? 'true' : undefined}>
                <span class="rank-medal r{rank + 1}" aria-hidden="true">{rankBadge(rank)}</span>
                <span class="rank-avatar" aria-hidden="true"><img src="ui/xp-kicker-badge.svg" alt="" /></span>
                <span class="rank-name">{row.name}{#if mine} <em>(Tu)</em>{/if}</span>
                <span class="rank-score">{row.score}/{row.total}</span>
                <span class="rank-xp">{row.points ?? percent} XP</span>
              </div>
            {/each}
          </div>
        {:else}
          <div class="board-empty" role="status">Ancora nessun punteggio.</div>
        {/if}
      {/if}

      {#if showAllRows}
        <div class="full-board">
          {#if !authStore.isLoggedIn && isNamed}
            <p class="guest-note">
              Sei in classifica con il tuo nome. Accedi per sommare anche XP e trofei alla carriera.
            </p>
          {:else if !authStore.isLoggedIn}
            <p class="guest-note">
              Stai giocando come Ospite: inserisci un nome per entrare in classifica.
            </p>
          {/if}
          <Leaderboard {rows} {myId} {online} {loading} {error} />
          {#if !online}
            <button class="lb-clear" onclick={resetLocal}>Azzera classifica locale</button>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  <div class="actions">
    <button class="cta replay" onclick={() => (isReview ? gameStore.startReview() : gameStore.startQuiz())}>
      <img src="ui/icons/review.png" alt="" aria-hidden="true" />
      {isReview ? 'Altro ripasso' : 'Rigioca'}
    </button>
    <button class="ghost home" onclick={() => gameStore.goHome()}>
      <img src="ui/icons/home.png" alt="" aria-hidden="true" />
      Home
    </button>
  </div>

  <button class="details-toggle" type="button" onclick={() => (showDetails = !showDetails)}>
    {showDetails ? 'Nascondi dettagli' : 'Dettagli prova'}
  </button>

  {#if showDetails}
    <div class="details">
      {#if leveledTo != null}
        <div class="level-up" role="status">Level up: ora sei al livello {leveledTo}</div>
      {/if}

      {#if newBadges.length}
        <div class="badge-pop" role="status">
          Nuovo traguardo
          <div class="new-badges">
            {#each newBadges as id, n (id)}
              {@const b = badgeById(id)}
              {#if b}<span class="nb" style="animation-delay:{n * 0.08}s">{b.emoji} {b.name}</span>{/if}
            {/each}
          </div>
        </div>
      {/if}

      {#if gameStore.lastPerCat.length > 1}
        <div class="lb-title">Per categoria</div>
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

      <div class="lb-title">Traguardi</div>
      <BadgeShelf highlight={newBadges} />

      {#if gameStore.wrong.length}
        <button class="ghost review-btn" onclick={() => (showReview = !showReview)}>
          Ripassa gli errori ({gameStore.wrong.length})
        </button>
        {#if showReview}
          <div class="review">
            <b>Da ripassare:</b><br /><br />
            {#each gameStore.wrong as w, i (i)}
              {i + 1}. <b>{w.q}</b><br />Risposta: {w.options[w.answer]}<br /><br />
            {/each}
          </div>
        {/if}
      {:else if !isReview}
        <div class="review perfect"><b>Nessun errore.</b> Hai risposto bene a tutto.</div>
      {/if}
    </div>
  {/if}
</section>

<style>
  .result-screen {
    min-height: calc(min(900px, 100dvh - 28px) - 40px);
    display: flex;
    flex-direction: column;
  }
  .result-head {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    min-height: 40px;
  }
  h1 {
    font-size: 1.5rem;
  }
  .seal {
    justify-self: start;
    margin-left: 9px;
    width: 24px;
    height: 28px;
    display: grid;
    place-items: center;
    border: 2px solid var(--primary);
    border-radius: 4px;
    color: var(--primary);
    font-family: 'Ma Shan Zheng', var(--font-display);
    font-size: 0.92rem;
  }
  .result-art {
    position: relative;
    min-height: 218px;
    display: grid;
    place-items: center;
    margin-top: 4px;
  }
  .pine {
    position: absolute;
    right: -2px;
    top: -10px;
    width: 118px;
    height: auto;
    opacity: 0.58;
    filter: grayscale(0.2);
  }
  .hangul {
    position: absolute;
    right: 16px;
    top: 84px;
    color: var(--ink);
    font-family: 'Ma Shan Zheng', var(--font-display);
    font-size: 1.85rem;
    font-weight: 900;
    line-height: 1.05;
    text-align: center;
  }
  .hangul span {
    display: grid;
    place-items: center;
    width: 26px;
    height: 31px;
    margin-top: 8px;
    border: 2px solid var(--primary);
    border-radius: 4px;
    color: var(--primary);
    font-size: 0.95rem;
  }
  h2 {
    position: relative;
    margin-top: 0;
    font-family: var(--font-display);
    font-size: 1.66rem;
    font-weight: 900;
    line-height: 1.1;
    color: var(--danger-d);
    text-align: center;
    white-space: nowrap;
  }
  h2.pass {
    color: var(--success-d);
  }
  h2::before,
  h2::after {
    content: '';
    display: inline-block;
    width: 38px;
    height: 1px;
    margin: 0 8px 7px;
    background: var(--success);
    opacity: 0.68;
  }
  .xp-gain {
    margin-top: 4px;
    text-align: center;
    color: var(--primary);
    font-family: var(--font-display);
    font-size: 1.35rem;
    font-weight: 900;
  }
  .result-msg {
    min-height: 20px;
    margin: 3px 8px 0;
    color: var(--ink-soft);
    font-size: 0.82rem;
    font-weight: 650;
    text-align: center;
    line-height: 1.35;
  }
  .summary-pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 9px;
    margin-top: 12px;
  }
  .stat-card {
    min-height: 82px;
    display: grid;
    grid-template-columns: 44px 1fr;
    column-gap: 10px;
    align-items: center;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: color-mix(in srgb, var(--surface) 91%, var(--surface-2));
    box-shadow: 0 9px 18px -17px rgba(42, 28, 15, 0.55);
  }
  .stat-icon {
    grid-row: span 2;
    width: 34px;
    height: 34px;
    object-fit: contain;
    opacity: 0.9;
  }
  :global([data-theme='dark']) .stat-icon:not(.ink),
  :global([data-theme='dark']) .home img {
    filter: invert(1) sepia(0.14) saturate(0.8) brightness(1.14) contrast(1.04);
  }
  .stat-icon.ink {
    width: auto;
    height: auto;
    color: var(--ink);
    font-family: 'Ma Shan Zheng', var(--font-display);
    font-size: 1.95rem;
    line-height: 1;
  }
  .stat-card span:not(.stat-icon) {
    color: var(--ink-soft);
    font-size: 0.78rem;
    font-weight: 700;
  }
  .stat-card b {
    min-width: 0;
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 1.18rem;
    font-weight: 900;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.12;
  }
  .board {
    margin-top: 14px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: color-mix(in srgb, var(--surface) 90%, var(--surface-2));
  }
  .board-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
    color: var(--ink);
    font-family: var(--font-display);
    font-weight: 850;
  }
  .board-title small {
    color: var(--ink-soft);
    font-family: var(--font-body);
    font-size: 0.74rem;
    font-weight: 700;
  }
  .board-title button {
    min-height: 30px;
    padding: 3px 5px;
    background: transparent;
    color: var(--primary);
    font-family: var(--font-body);
    font-size: 0.75rem;
    font-weight: 800;
  }
  .rank-list {
    display: grid;
    gap: 2px;
  }
  .rank-row {
    display: grid;
    grid-template-columns: 28px 32px 1fr auto auto;
    align-items: center;
    gap: 8px;
    min-height: 38px;
    border-top: 1px solid color-mix(in srgb, var(--border) 72%, transparent);
    color: var(--ink);
    font-size: 0.8rem;
    font-weight: 750;
  }
  .rank-row:first-child {
    border-top: 0;
  }
  .rank-row.mine {
    color: var(--primary);
  }
  .rank-medal {
    width: 24px;
    height: 24px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: #fff;
    background: var(--accent-warm);
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.28);
    font-family: var(--font-display);
    font-size: 0.82rem;
    font-weight: 900;
  }
  .rank-medal.r2 {
    background: #9b9a91;
  }
  .rank-medal.r3 {
    background: #936037;
  }
  .rank-avatar {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border: 1px solid var(--border);
    border-radius: 50%;
    background: var(--surface);
    overflow: hidden;
  }
  .rank-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .rank-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .rank-name em {
    color: var(--primary);
    font-style: normal;
  }
  .rank-score,
  .rank-xp {
    white-space: nowrap;
  }
  .rank-score {
    font-family: var(--font-display);
    font-weight: 900;
  }
  .rank-xp {
    color: var(--ink-soft);
    font-size: 0.74rem;
  }
  .board-empty,
  .board-note {
    padding: 8px;
    color: var(--ink-soft);
    font-size: 0.82rem;
    font-weight: 700;
    text-align: center;
  }
  .board-note {
    color: var(--amber-ink);
  }
  .full-board {
    margin-top: 10px;
  }
  .guest-note {
    margin-bottom: 8px;
    color: var(--ink-soft);
    font-size: 0.78rem;
    font-weight: 650;
    line-height: 1.35;
  }
  .lb-clear {
    display: block;
    margin: 9px auto 0;
    padding: 8px 10px;
    min-height: 38px;
    background: transparent;
    color: var(--ink-faint);
    font-size: 0.78rem;
    font-family: var(--font-body);
    font-weight: 700;
    text-decoration: underline;
  }
  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: auto;
    padding-top: 18px;
  }
  .actions button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 58px;
    font-size: 1.08rem;
  }
  .actions img {
    width: 25px;
    height: 25px;
    object-fit: contain;
  }
  .replay img {
    filter: brightness(0) invert(1);
  }
  .replay {
    background: var(--primary);
  }
  .home {
    color: var(--ink);
    background: transparent;
  }
  .details-toggle {
    align-self: center;
    min-height: 34px;
    margin-top: 8px;
    padding: 4px 12px;
    background: transparent;
    color: var(--ink-soft);
    font-size: 0.76rem;
    font-weight: 800;
    text-decoration: underline;
  }
  .details {
    margin-top: 10px;
  }
  .level-up,
  .badge-pop {
    text-align: center;
    font-family: var(--font-display);
    font-weight: 850;
    border-radius: 12px;
    padding: 10px;
    margin-top: 10px;
  }
  .level-up {
    color: #fff;
    background: var(--success);
  }
  .badge-pop {
    color: var(--amber-ink);
    background: var(--amber-bg-soft);
    border: 1px solid var(--giallo);
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
    box-shadow: 0 3px 8px -5px rgba(0, 0, 0, 0.25);
    animation: nbIn 0.4s var(--ease-spring) both;
  }
  .lb-title {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 1rem;
    margin: 16px 0 8px;
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
    font-weight: 750;
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
    background: linear-gradient(90deg, var(--success), var(--primary));
    transition: width 0.6s var(--ease-out);
  }
  .cat-row.weak .cat-fill {
    background: linear-gradient(90deg, var(--accent-warm), var(--danger));
  }
  .cat-num {
    flex: 0 0 auto;
    font-family: var(--font-display);
    font-weight: 900;
    color: var(--ink-soft);
    min-width: 38px;
    text-align: right;
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
    border-radius: 12px;
    padding: 14px;
    font-size: 0.86rem;
    font-weight: 600;
    color: var(--ink-soft);
    line-height: 1.45;
  }
  .review b {
    color: var(--ink);
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
  @media (max-width: 390px) {
    .summary-pair {
      gap: 7px;
    }
    .stat-card {
      grid-template-columns: 36px 1fr;
      padding: 9px;
    }
    .stat-icon {
      font-size: 1.6rem;
    }
    .stat-card b {
      font-size: 1.08rem;
    }
    .rank-row {
      grid-template-columns: 25px 28px 1fr auto;
    }
    .rank-xp {
      display: none;
    }
  }
</style>
