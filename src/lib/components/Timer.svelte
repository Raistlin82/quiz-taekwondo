<script lang="ts">
  import { TIME_PER_Q } from '../data/belts';
  let { timeLeft }: { timeLeft: number } = $props();
  const pct = $derived((timeLeft / TIME_PER_Q) * 100);
  const secs = $derived(Math.ceil(timeLeft));
  const warn = $derived(timeLeft <= 5 && timeLeft > 0);
</script>

<div class="timer" role="timer" aria-label="Tempo rimasto: {secs} second{secs === 1 ? 'o' : 'i'}">
  <img class="timer-icon" src="ui/icons/hourglass.png" alt="" aria-hidden="true" />
  <div class="timer-track" class:warn aria-hidden="true">
    <div class="timer-fill" style="width:{pct}%"></div>
  </div>
  <div class="timer-num" class:warn aria-hidden="true">{secs} sec</div>
</div>
{#if warn}
  <span class="sr-only" role="alert">Ultimi secondi!</span>
{/if}

<style>
  .timer {
    display: grid;
    grid-template-columns: 26px 1fr 60px;
    align-items: center;
    gap: 10px;
    margin-top: 7px;
  }
  .timer-icon {
    width: 22px;
    height: 22px;
    object-fit: contain;
    opacity: 0.9;
  }
  :global([data-theme='dark']) .timer-icon {
    filter: invert(1) sepia(0.14) saturate(0.8) brightness(1.12) contrast(1.04);
  }
  .timer-track {
    height: 6px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--track) 84%, var(--surface));
    overflow: hidden;
    box-shadow: inset 0 1px 2px color-mix(in srgb, var(--ink) 13%, transparent);
    transition: box-shadow 0.25s;
  }
  .timer-track.warn {
    box-shadow:
      inset 0 1px 2px color-mix(in srgb, var(--ink) 13%, transparent),
      0 0 0 2px color-mix(in srgb, var(--danger) 24%, transparent);
  }
  .timer-fill {
    height: 100%;
    border-radius: 999px;
    background: var(--primary);
    transition: width 0.12s linear;
  }
  .timer-num {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 0.82rem;
    color: var(--ink);
    text-align: right;
    white-space: nowrap;
  }
  .timer-num.warn {
    color: var(--danger-d);
    animation: heartbeat 1s ease-in-out infinite;
  }
  @keyframes heartbeat {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
</style>
