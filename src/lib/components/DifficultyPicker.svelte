<script lang="ts">
  import { DIFFICULTIES, type DifficultyKey } from '../data/belts';
  let { value = $bindable() }: { value: DifficultyKey } = $props();
  const items = Object.values(DIFFICULTIES);
</script>

<div class="diff-grid" role="group" aria-label="Scegli il livello di difficoltà">
  {#each items as d (d.key)}
    <button
      type="button"
      class="diff-opt"
      class:sel={d.key === value}
      aria-pressed={d.key === value}
      aria-label={`${d.nm}: ${d.ds}`}
      onclick={() => (value = d.key)}
    >
      <div class="em">{d.em}</div>
      <div class="nm">{d.nm}</div>
      <div class="ds">{d.ds}</div>
    </button>
  {/each}
</div>

<style>
  .diff-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 9px;
  }
  .diff-opt {
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: 16px;
    padding: 12px 6px;
    cursor: pointer;
    text-align: center;
    transition:
      transform 0.12s,
      border-color 0.15s,
      box-shadow 0.15s;
  }
  @media (hover: hover) {
    .diff-opt:hover {
      transform: translateY(-2px);
      border-color: var(--border-strong);
    }
  }
  .diff-opt:active {
    transform: translateY(0) scale(0.98);
  }
  .diff-opt.sel {
    border-color: var(--accent);
    box-shadow: 0 8px 18px -8px rgba(59, 130, 246, 0.55);
  }
  .em {
    font-size: 1.5rem;
  }
  .nm {
    font-family: 'Baloo 2';
    font-weight: 800;
    font-size: 0.95rem;
    margin-top: 2px;
    color: var(--ink);
  }
  .ds {
    font-size: 0.72rem;
    color: var(--ink-soft);
    font-weight: 600;
    margin-top: 2px;
  }
</style>
