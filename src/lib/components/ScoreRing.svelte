<script lang="ts">
  import { prefersReducedMotion } from '../motion';

  interface Props {
    score: number;
    total: number;
    emoji?: string;
  }
  let { score, total }: Props = $props();

  const pct = $derived(total ? score / total : 0);
  const percent = $derived(Math.round(pct * 100));
  const passed = $derived(pct >= 0.87);
  const ringSrc = $derived(passed ? '/ui/brush-ring-green.png' : '/ui/brush-ring-red.png');
  let shown = $state(0);

  $effect(() => {
    if (prefersReducedMotion()) {
      shown = score;
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 850;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      shown = Math.round(p * score);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  });
</script>

<div class="ring-wrap" class:passed>
  <img class="ring-img" src={ringSrc} alt="" aria-hidden="true" />
  <div class="score-text" aria-label="Punteggio: {score} su {total}, {percent}%">
    <div class="score-line"><span class="score">{shown}</span><span class="total">/{total}</span></div>
    <span class="pct">{percent}%</span>
  </div>
</div>

<style>
  .ring-wrap {
    position: relative;
    width: 212px;
    height: 212px;
    display: grid;
    place-items: center;
    margin: -8px auto -4px;
  }
  .ring-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 14px 24px color-mix(in srgb, var(--ink) 12%, transparent));
  }
  .score-text {
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    margin-top: 2px;
    color: var(--danger-d);
    font-family: var(--font-display);
    font-variant-numeric: lining-nums tabular-nums;
    text-align: center;
  }
  .passed .score-text {
    color: var(--success-d);
  }
  .score-line {
    display: flex;
    align-items: baseline;
    justify-content: center;
    min-width: 120px;
  }
  .score {
    font-size: 3.8rem;
    font-weight: 800;
    line-height: 0.95;
  }
  .total {
    margin-left: 6px;
    color: var(--ink);
    font-size: 1.72rem;
    font-weight: 700;
  }
  .pct {
    margin-top: 4px;
    font-size: 1.08rem;
    font-weight: 800;
  }
</style>
