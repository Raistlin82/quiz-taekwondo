<script lang="ts">
  import { TIME_PER_Q } from '../data/belts';
  let { timeLeft }: { timeLeft: number } = $props();
  const pct = $derived((timeLeft / TIME_PER_Q) * 100);
  // DOJANG: primary while there's time, danger under 5s.
  const color = $derived(timeLeft <= 5 ? 'var(--danger)' : 'var(--primary)');
  const secs = $derived(Math.ceil(timeLeft));
  const warn = $derived(timeLeft <= 5 && timeLeft > 0);
</script>

<div class="timer" role="timer" aria-label="Tempo rimasto: {secs} second{secs === 1 ? 'o' : 'i'}">
  <div class="timer-track" class:warn aria-hidden="true">
    <div class="timer-fill" style="width:{pct}%;background:{color}"></div>
  </div>
  <div class="timer-num" class:warn aria-hidden="true">{secs}</div>
</div>
{#if warn}
  <span class="sr-only" role="alert">Ultimi secondi!</span>
{/if}

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
    transition: box-shadow 0.25s;
  }
  .timer-track.warn {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--danger) 45%, transparent);
  }
  .timer-fill {
    height: 100%;
    border-radius: 999px;
    transition:
      width 0.12s linear,
      background 0.25s;
  }
  .timer-num {
    font-family: var(--font-display);
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
  /* low-time cue also works without motion: red text + tinted bg/border */
  .timer-num.warn {
    color: #fff;
    background: var(--danger);
    border-color: var(--danger);
    animation: heartbeat 1s ease-in-out infinite;
  }
  @keyframes heartbeat {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.14);
    }
  }
</style>
