<script lang="ts">
  import { prefersReducedMotion } from '../motion';

  interface Props {
    score: number;
    total: number;
    emoji: string;
  }
  let { score, total, emoji }: Props = $props();

  const CIRC = 389.6; // 2πr, r=62
  const pct = $derived(total ? score / total : 0);

  // Ring sweep: start full, animate to target after mount.
  let offset = $state(CIRC);
  // Score counts up 0 → score (jumps under reduced motion).
  let shown = $state(0);

  $effect(() => {
    const target = CIRC * (1 - pct);
    if (prefersReducedMotion()) {
      offset = target;
      shown = score;
      return;
    }
    const t = setTimeout(() => (offset = target), 60);
    let raf = 0;
    const start = performance.now();
    const dur = 900;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      shown = Math.round(p * score);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  });
</script>

<div class="ring-wrap">
  <svg width="150" height="150" viewBox="0 0 150 150" role="img" aria-label="Punteggio: {score} su {total}">
    <defs>
      <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="var(--success)" />
        <stop offset="1" stop-color="var(--primary)" />
      </linearGradient>
    </defs>
    <circle cx="75" cy="75" r="62" fill="none" stroke="var(--track)" stroke-width="14" />
    <circle
      cx="75"
      cy="75"
      r="62"
      fill="none"
      stroke="url(#ring)"
      stroke-width="14"
      stroke-linecap="round"
      stroke-dasharray={CIRC}
      stroke-dashoffset={offset}
      transform="rotate(-90 75 75)"
      style="transition: stroke-dashoffset 1s cubic-bezier(.2,.9,.3,1)"
    />
    <text x="75" y="66" text-anchor="middle" font-size="34" aria-hidden="true">{emoji}</text>
    <text
      x="75"
      y="98"
      text-anchor="middle"
      font-family="Space Grotesk"
      font-weight="700"
      font-size="22"
      fill="var(--ink)"
      aria-hidden="true">{shown}/{total}</text
    >
  </svg>
</div>

<style>
  .ring-wrap {
    display: flex;
    justify-content: center;
    margin: 6px 0 2px;
  }
</style>
