<script lang="ts">
  import { beltById } from '../../data/belts';
  import { gameStore } from '../../stores/game.svelte';
  import { progressStore } from '../../stores/progress.svelte';
  import BeltPicker from '../BeltPicker.svelte';
  import DifficultyPicker from '../DifficultyPicker.svelte';

  const belt = $derived(beltById(gameStore.selBelt)!);
  const lvl = $derived(progressStore.level);
  const due = $derived(progressStore.dueCount());

  function start() {
    gameStore.startQuiz();
  }
</script>

<section class="screen">
  <div class="belt-hero">
    <svg class="badge" viewBox="0 0 100 100" aria-label="cintura">
      <defs>
        <linearGradient id="gv" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f1f5f9" />
          <stop offset="1" stop-color="#e2e8f0" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="#fff" stroke="#e2e8f0" stroke-width="2" />
      <circle cx="50" cy="50" r="40" fill="url(#gv)" />
      <text x="50" y="42" text-anchor="middle" font-size="26">🥋</text>
      <rect x="12" y="58" width="76" height="13" rx="3" fill={belt.main} />
      <rect
        x="12"
        y="61.5"
        width="76"
        height="5"
        rx="2"
        fill={belt.stripe ?? belt.main}
        opacity={belt.stripe ? 1 : 0}
      />
    </svg>
  </div>

  <h1>Quiz <span class="grad">Esame Taekwon-Do</span></h1>
  <p class="sub">Scegli la cintura e il livello, poi vai! 🥋</p>

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
    <button class="ghost ripasso" class:active={due > 0} disabled={due === 0} onclick={() => gameStore.startReview()}>
      🔁 Ripasso {due > 0 ? `(${due})` : ''}
    </button>
  </div>

  <p class="hint">⏱️ Hai 10 secondi per ogni risposta. Pronto?</p>
</section>

<style>
  .belt-hero {
    display: flex;
    justify-content: center;
    margin: 2px 0;
  }
  .badge {
    width: 90px;
    height: 90px;
    filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.25));
    animation: bob 3s ease-in-out infinite;
  }
  @keyframes bob {
    0%,
    100% {
      transform: translateY(0) rotate(-2deg);
    }
    50% {
      transform: translateY(-6px) rotate(2deg);
    }
  }

  .player-strip {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 14px;
  }
  .lvl {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .lvl-badge {
    font-family: 'Baloo 2';
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
    font-family: 'Baloo 2';
    font-weight: 700;
    font-size: 0.72rem;
    color: var(--ink-soft);
    flex: 0 0 auto;
  }
  .stat {
    font-family: 'Baloo 2';
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
    font-size: 1.02rem;
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
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.18);
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
    font-size: 0.95rem;
  }
  .ripasso.active {
    background: linear-gradient(135deg, #fde68a, var(--giallo));
    color: #7c4a02;
  }
  .secondary button:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
