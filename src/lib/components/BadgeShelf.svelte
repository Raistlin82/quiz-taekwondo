<script lang="ts">
  import { BADGES } from '../data/badges';
  import { progressStore } from '../stores/progress.svelte';
  let { highlight = [] }: { highlight?: string[] } = $props();
</script>

<div class="shelf">
  {#each BADGES as b (b.id)}
    {@const owned = progressStore.hasBadge(b.id)}
    <div
      class="badge"
      class:owned
      class:new={highlight.includes(b.id)}
      title={b.desc}
    >
      <div class="em">{owned ? b.emoji : '🔒'}</div>
      <div class="nm">{b.name}</div>
    </div>
  {/each}
</div>

<style>
  .shelf {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(82px, 1fr));
    gap: 8px;
  }
  .badge {
    background: color-mix(in srgb, var(--surface) 88%, var(--surface-2));
    border: 1px solid var(--border);
    border-radius: var(--radius-xs);
    padding: 10px 6px;
    text-align: center;
    opacity: 0.55;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
  }
  .badge.owned {
    opacity: 1;
  }
  .badge.new {
    border-color: var(--giallo);
    box-shadow: 0 6px 18px -8px var(--amber-glow);
    animation: pop 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.4);
  }
  .em {
    font-size: 1.6rem;
    line-height: 1.1;
  }
  .nm {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 0.68rem;
    color: var(--ink-soft);
    margin-top: 2px;
  }
  .badge.owned .nm {
    color: var(--ink);
  }
  @keyframes pop {
    0% {
      transform: scale(0.6);
    }
    60% {
      transform: scale(1.15);
    }
    100% {
      transform: scale(1);
    }
  }
</style>
