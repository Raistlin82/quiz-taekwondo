<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { gameStore } from '../../stores/game.svelte';
  import { progressStore } from '../../stores/progress.svelte';
  import { authStore } from '../../stores/auth.svelte';
  import BeltPicker from '../BeltPicker.svelte';
  import DifficultyPicker from '../DifficultyPicker.svelte';
  import AuthBar from '../AuthBar.svelte';

  const lvl = $derived(progressStore.level);

  // Prefill the player name from the signed-in account (auth resolves async,
  // after mount). `untrack` keeps the effect dependent ONLY on displayName, so
  // it runs when the account name arrives — not on every keystroke — and never
  // re-fills the field after the user clears it.
  $effect(() => {
    const name = authStore.displayName;
    if (name && !untrack(() => gameStore.playerName.trim())) {
      gameStore.playerName = name;
    }
  });

  // `tick` lets the due count re-evaluate on wall-clock events (a card can
  // become due while the start screen sits idle past midnight). (B5)
  let tick = $state(0);
  const due = $derived.by(() => {
    void tick;
    return progressStore.dueCount();
  });

  onMount(() => {
    const bump = () => (tick += 1);
    document.addEventListener('visibilitychange', bump);
    const id = setInterval(bump, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', bump);
      clearInterval(id);
    };
  });

  function start() {
    gameStore.startQuiz();
  }
</script>

<section class="screen">
  <header class="brand">
    <span class="logo" aria-hidden="true">🥋</span>
    <span class="brand-name">Taekwon-Do ITF</span>
  </header>

  <h1 class="hero-title">Esame Cinture</h1>
  <p class="hero-sub">Quiz d'allenamento · storia, coreano, principi e forme</p>

  <AuthBar />

  <div class="player-strip">
    <div class="lvl">
      <span class="lvl-badge">Lv {lvl.level}</span>
      <div class="xp-track"><div class="xp-fill" style="width:{lvl.pct}%"></div></div>
      <span class="xp-num">{progressStore.xp} XP</span>
    </div>
    <div class="stat" title="Miglior serie">🔥 {progressStore.bestStreak}</div>
  </div>

  <input
    class="name-box"
    maxlength="18"
    placeholder="Come ti chiami?"
    bind:value={gameStore.playerName}
    onkeydown={(e) => e.key === 'Enter' && start()}
  />

  <div class="label">🎯 Per quale cintura fai l'esame?</div>
  <BeltPicker bind:value={gameStore.selBelt} />

  <div class="label">🔥 Livello di difficoltà</div>
  <DifficultyPicker bind:value={gameStore.selDiff} />

  <button class="cta" onclick={start}>▶ Inizia il quiz</button>

  <div class="secondary">
    <button class="ghost" onclick={() => gameStore.goStudy()}>📖 Studia</button>
    <button
      class="ghost ripasso"
      class:active={due > 0}
      disabled={due === 0}
      title={due > 0
        ? `Ripassa ${due} domand${due === 1 ? 'a' : 'e'} sbagliate`
        : 'Ripasso non disponibile: nessuna domanda da rivedere'}
      aria-label={due > 0
        ? `Ripasso: ${due} domande da rivedere`
        : 'Ripasso non disponibile: nessuna domanda da rivedere'}
      onclick={() => gameStore.startReview()}
    >
      🔁 Ripasso {due > 0 ? `(${due})` : ''}
    </button>
  </div>

  <button class="ghost ranking-btn" onclick={() => gameStore.goRanking()}>
    🏆 Classifica giocatori
  </button>

  {#if due > 0}
    <p class="hint">🔁 Hai {due} domand{due === 1 ? 'a' : 'e'} da ripassare.</p>
  {:else}
    <p class="hint">⏱️ Hai 10 secondi per ogni risposta. Pronto?</p>
  {/if}
</section>

<style>
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .logo {
    width: 38px;
    height: 38px;
    border-radius: 9px;
    background: var(--text);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.15rem;
    flex: 0 0 auto;
  }
  .brand-name {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.05rem;
    letter-spacing: -0.3px;
    color: var(--text);
  }
  .hero-title {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.9rem;
    line-height: 1.08;
    letter-spacing: -0.8px;
    text-align: left;
    color: var(--text);
    margin-top: 18px;
  }
  .hero-sub {
    text-align: left;
    color: var(--text-muted);
    margin-top: 6px;
    font-weight: 500;
    font-size: 0.95rem;
  }

  .player-strip {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
  }
  .lvl {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .lvl-badge {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 0.8rem;
    color: #fff;
    background: linear-gradient(135deg, var(--verde), var(--blu));
    padding: 4px 9px;
    border-radius: 999px;
    flex: 0 0 auto;
  }
  .xp-track {
    flex: 1;
    height: 8px;
    border-radius: 999px;
    background: var(--track);
    overflow: hidden;
    border: 1px solid var(--border);
  }
  .xp-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--verde), var(--blu));
    transition: width 0.5s var(--ease-out);
  }
  .xp-num {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.72rem;
    color: var(--ink-soft);
    flex: 0 0 auto;
  }
  .stat {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 0.85rem;
    color: var(--ink);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 4px 10px;
  }

  .name-box {
    width: 100%;
    margin-top: 14px;
    padding: 13px 16px;
    border: 2px solid var(--border);
    border-radius: 16px;
    /* >=16px prevents iOS Safari from zooming on focus (U29) */
    font-size: max(16px, 1.02rem);
    font-family: inherit;
    font-weight: 700;
    text-align: center;
    background: var(--surface);
    color: var(--ink);
    transition: 0.2s;
  }
  .name-box::placeholder {
    color: var(--ink-faint);
    font-weight: 600;
  }
  .name-box:focus {
    outline: none;
    border-color: var(--blu);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary) 20%, transparent);
  }

  .cta {
    margin-top: 20px;
  }
  .secondary {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }
  .secondary button {
    flex: 1;
    padding: 12px;
    min-height: 44px;
    font-size: 0.95rem;
  }
  .ripasso.active {
    background: var(--amber-bg);
    color: var(--amber-ink);
  }
  .secondary button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .ranking-btn {
    width: 100%;
    margin-top: 10px;
    padding: 12px;
    min-height: 44px;
    font-size: 0.95rem;
  }
</style>
