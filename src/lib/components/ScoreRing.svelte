<script lang="ts">
  interface Props {
    score: number;
    total: number;
    emoji: string;
  }
  let { score, total, emoji }: Props = $props();

  const CIRC = 389.6; // 2πr, r=62
  const pct = $derived(total ? score / total : 0);
  // Start full, animate to target after mount.
  let offset = $state(CIRC);
  $effect(() => {
    const target = CIRC * (1 - pct);
    const t = setTimeout(() => (offset = target), 60);
    return () => clearTimeout(t);
  });
</script>

<div class="ring-wrap">
  <svg width="150" height="150" viewBox="0 0 150 150">
    <defs>
      <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#22c55e" />
        <stop offset="1" stop-color="#3b82f6" />
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
    <text x="75" y="66" text-anchor="middle" font-size="34">{emoji}</text>
    <text
      x="75"
      y="98"
      text-anchor="middle"
      font-family="Baloo 2"
      font-weight="800"
      font-size="22"
      fill="var(--ink)">{score}/{total}</text
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
