<script lang="ts">
  import { TIME_PER_Q } from '../data/belts';
  let { timeLeft }: { timeLeft: number } = $props();
  const pct = $derived((timeLeft / TIME_PER_Q) * 100);
  const color = $derived(pct > 50 ? 'var(--verde)' : pct > 25 ? 'var(--giallo)' : 'var(--rosso)');
  const warn = $derived(timeLeft <= 3 && timeLeft > 0);
</script>

<div class="timer">
  <div class="timer-track">
    <div class="timer-fill" style="width:{pct}%;background:{color}"></div>
  </div>
  <div class="timer-num" class:warn>{Math.ceil(timeLeft)}</div>
</div>

<style>
  .timer {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
  }
  .timer-track {
    flex: 1;
    height: 12px;
    border-radius: 999px;
    background: var(--track);
    overflow: hidden;
    border: 1px solid var(--border);
  }
  .timer-fill {
    height: 100%;
    border-radius: 999px;
    transition:
      width 0.12s linear,
      background 0.25s;
  }
  .timer-num {
    font-family: 'Baloo 2';
    font-weight: 800;
    font-size: 1.05rem;
    min-width: 46px;
    text-align: center;
    padding: 3px 0;
    border-radius: 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--ink);
  }
  .timer-num.warn {
    color: var(--rosso);
    animation: pulse 0.5s infinite;
  }
  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.12);
    }
  }
</style>
