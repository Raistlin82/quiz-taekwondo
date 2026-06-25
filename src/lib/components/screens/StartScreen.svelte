<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { gameStore } from '../../stores/game.svelte';
  import { progressStore } from '../../stores/progress.svelte';
  import { authStore } from '../../stores/auth.svelte';
  import { themeStore } from '../../stores/theme.svelte';
  import BeltPicker from '../BeltPicker.svelte';
  import DifficultyPicker from '../DifficultyPicker.svelte';
  import AuthBar from '../AuthBar.svelte';

  const lvl = $derived(progressStore.level);

  $effect(() => {
    const name = authStore.displayName;
    if (name && !untrack(() => gameStore.playerName.trim())) {
      gameStore.playerName = name;
    }
  });

  let tick = $state(0);
  let settingsOpen = $state(false);
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
    <div>
      <div class="brand-name">
        <img class="logo-wordmark" src="ui/logo-taekwondo-itf.png" alt="Taekwon-Do ITF" />
        <span class="seal" aria-hidden="true">武</span>
      </div>
      <h1>Esame Cinture</h1>
    </div>
  </header>

  <div class="ink-wash" aria-hidden="true"></div>

  <div class="player-card" aria-label="Progressi giocatore">
    <div class="avatar"><img src="ui/xp-kicker-badge.svg" alt="" /></div>
    <div class="player-main">
      <div class="player-line">
        <b>Lv {lvl.level}</b>
        <span>{progressStore.xp} XP</span>
      </div>
      <div class="xp-track"><div class="xp-fill" style="width:{lvl.pct}%"></div></div>
    </div>
  </div>

  <label class="field">
    <span>Nome</span>
    <div class="name-wrap">
      <input
        class="name-box"
        maxlength="18"
        placeholder="Come ti chiami?"
        bind:value={gameStore.playerName}
        onkeydown={(e) => e.key === 'Enter' && start()}
      />
      <span aria-hidden="true">✎</span>
    </div>
  </label>

  <div class="field">
    <span>Cintura</span>
    <BeltPicker bind:value={gameStore.selBelt} />
  </div>

  <div class="field">
    <span>Difficoltà</span>
    <DifficultyPicker bind:value={gameStore.selDiff} />
  </div>

  <button class="cta seal-btn" onclick={start}><span aria-hidden="true">篆</span> Inizia il quiz</button>

  <div class="secondary">
    <button class="ghost" onclick={() => gameStore.goStudy()}>
      <img src="ui/icons/book.png" alt="" />Studia
    </button>
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
      <img src="ui/icons/review.png" alt="" />Ripassa errori{due > 0 ? ` (${due})` : ''}
    </button>
  </div>

  <div class="home-auth">
    <AuthBar />
  </div>

  {#if settingsOpen}
    <div class="settings-panel">
      <div class="settings-title">Impostazioni</div>
      <div class="setting-row">
        <button class="ghost" onclick={() => themeStore.toggleTheme()}>
          {themeStore.theme === 'dark' ? 'Tema chiaro' : 'Tema scuro'}
        </button>
        <button class="ghost" onclick={() => themeStore.toggleSound()}>
          {themeStore.sound ? 'Suoni on' : 'Suoni off'}
        </button>
        <button class="ghost" onclick={() => themeStore.toggleMusic()}>
          {themeStore.music ? 'Musica on' : 'Musica off'}
        </button>
      </div>
    </div>
  {/if}

  <nav class="bottom-nav" aria-label="Navigazione principale">
    <button class="active" aria-current="page"><img src="ui/icons/home.png" alt="" /><span>Home</span></button>
    <button onclick={() => gameStore.goRanking()}><img src="ui/icons/chart.png" alt="" /><span>Statistiche</span></button>
    <button onclick={() => (settingsOpen = !settingsOpen)}><img src="ui/icons/settings.png" alt="" /><span>Impostazioni</span></button>
  </nav>
</section>

<style>
  .screen {
    min-height: calc(min(900px, 100dvh - 28px) - 40px);
    display: flex;
    flex-direction: column;
  }
  .brand {
    padding-top: 0;
    text-align: center;
  }
  .brand-name {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    line-height: 1;
    width: 100%;
  }
  .logo-wordmark {
    width: min(292px, 74vw);
    height: auto;
    display: block;
    filter: brightness(0) contrast(1.35);
  }
  :global([data-theme='dark']) .logo-wordmark {
    filter: invert(1) sepia(0.18) saturate(0.9) brightness(1.18) contrast(1.12);
    opacity: 0.96;
  }
  .seal {
    display: inline-grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border: 2px solid var(--primary);
    border-radius: 3px;
    color: var(--primary);
    font-family: 'Ma Shan Zheng', var(--font-display);
    font-size: 0.9rem;
    transform: rotate(3deg);
  }
  h1 {
    position: relative;
    margin-top: 4px;
    font-size: 1.78rem;
    font-weight: 700;
  }
  h1::after {
    content: '';
    display: block;
    width: 166px;
    height: 3px;
    margin: 6px auto 0;
    background: var(--primary);
    border-radius: 999px;
    opacity: 0.86;
  }
  .ink-wash {
    height: 38px;
    margin: -7px -18px -6px;
    background: var(--img-ink-mountains) center bottom / 100% auto no-repeat;
    opacity: 0.55;
  }
  :global([data-theme='dark']) .ink-wash {
    opacity: 0.34;
    filter: invert(1) sepia(0.16) hue-rotate(350deg) brightness(0.9) contrast(0.8);
  }
  .player-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 67px;
    margin-top: 0;
    padding: 11px 14px 10px 96px;
    border: 1px solid var(--border);
    border-radius: 14px;
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--surface) 94%, transparent), color-mix(in srgb, var(--surface) 82%, transparent)),
      color-mix(in srgb, var(--surface) 92%, var(--surface-2));
    box-shadow: 0 11px 22px -18px rgba(42, 28, 15, 0.55);
  }
  .avatar {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    width: 68px;
    height: 68px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--surface);
    border: 1px solid var(--border);
    box-shadow: 0 8px 16px -12px rgba(42, 28, 15, 0.6);
    overflow: hidden;
  }
  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .player-main {
    flex: 1;
    min-width: 0;
  }
  .player-line {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-family: var(--font-display);
    font-variant-numeric: lining-nums tabular-nums;
    color: var(--ink);
  }
  .player-line b {
    color: var(--primary);
    font-weight: 900;
    font-size: 1.05rem;
  }
  .player-line span {
    font-weight: 800;
    font-size: 0.98rem;
  }
  .xp-track {
    height: 6px;
    margin-top: 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--track) 80%, var(--surface));
    overflow: hidden;
  }
  .xp-fill {
    height: 100%;
    background: var(--primary);
    border-radius: inherit;
  }
  .field {
    display: block;
    margin-top: 9px;
  }
  .field > span {
    display: block;
    margin: 0 0 6px 2px;
    color: var(--ink);
    font-size: 0.86rem;
    font-weight: 700;
  }
  .name-wrap {
    position: relative;
  }
  .name-wrap > span {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--ink-soft);
  }
  .name-box {
    width: 100%;
    min-height: 44px;
    padding: 9px 42px 9px 14px;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    font-size: max(16px, 1rem);
    font-family: var(--font-body);
    font-weight: 650;
    background: color-mix(in srgb, var(--surface) 92%, var(--surface-2));
    color: var(--ink);
  }
  .name-box::placeholder {
    color: var(--ink-faint);
  }
  .name-box:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary) 16%, transparent);
  }
  .seal-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    min-height: 56px;
    margin-top: 15px;
    font-size: 1.28rem;
    border: 0;
    border-radius: 9px;
    background:
      linear-gradient(rgba(255, 255, 255, 0.03), rgba(0, 0, 0, 0.08)),
      var(--img-brush) center / 100% 100% no-repeat,
      var(--primary);
    box-shadow: 0 13px 24px -18px rgba(97, 28, 22, 0.9);
  }
  .seal-btn span {
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border: 2px solid rgba(255, 255, 255, 0.82);
    border-radius: 3px;
    font-family: 'Ma Shan Zheng', var(--font-display);
    font-size: 1rem;
  }
  .secondary {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    margin-top: 10px;
  }
  .secondary button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 44px;
    font-size: 1rem;
    border-radius: 10px;
    background: color-mix(in srgb, var(--surface) 88%, var(--surface-2));
  }
  .secondary img {
    width: 25px;
    height: 25px;
    object-fit: contain;
    opacity: 0.88;
  }
  :global([data-theme='dark']) .secondary img,
  :global([data-theme='dark']) .bottom-nav img {
    filter: invert(1) sepia(0.16) saturate(0.8) brightness(1.15) contrast(1.05);
  }
  .ripasso.active {
    color: var(--primary);
    border-color: var(--primary);
  }
  .secondary button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .settings-panel {
    margin-top: 9px;
    padding: 10px;
    border: 1px dashed var(--border);
    border-radius: 12px;
  }
  .home-auth {
    margin-top: 10px;
  }
  .settings-title {
    margin-bottom: 8px;
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 0.94rem;
    font-weight: 900;
  }
  .setting-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  .setting-row button {
    min-height: 38px;
    padding: 6px;
    font-size: 0.72rem;
  }
  .bottom-nav {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    margin-top: auto;
    padding-top: 8px;
  }
  .bottom-nav button {
    display: grid;
    gap: 3px;
    place-items: center;
    min-height: 42px;
    background: transparent;
    color: var(--ink-soft);
    font-size: 1.25rem;
    border-radius: 10px;
  }
  .bottom-nav img {
    width: 24px;
    height: 24px;
    object-fit: contain;
    opacity: 0.82;
  }
  .bottom-nav button.active img {
    filter: sepia(1) saturate(3) hue-rotate(320deg);
  }
  :global([data-theme='dark']) .bottom-nav button.active img {
    filter: invert(48%) sepia(62%) saturate(1172%) hue-rotate(322deg) brightness(102%) contrast(91%);
  }
  .bottom-nav button span {
    font-family: var(--font-body);
    font-size: 0.68rem;
    font-weight: 700;
  }
  .bottom-nav button.active {
    color: var(--primary);
  }
</style>
