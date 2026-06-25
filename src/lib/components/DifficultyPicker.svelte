<script lang="ts">
  import { DIFFICULTIES, type Difficulty, type DifficultyKey } from '../data/belts';
  let { value = $bindable() }: { value: DifficultyKey } = $props();
  const items = Object.values(DIFFICULTIES);
  // One display label for both the visible text and the accessible name
  // (WCAG 2.5.3 Label in Name): the data value is "Tosto", shown as "Difficile".
  const labelOf = (d: Difficulty) => (d.nm === 'Tosto' ? 'Difficile' : d.nm);
</script>

<div class="diff-segment" role="group" aria-label="Scegli il livello di difficoltà">
  {#each items as d (d.key)}
    <button
      type="button"
      class:sel={d.key === value}
      aria-pressed={d.key === value}
      aria-label={`${labelOf(d)}: ${d.ds}`}
      onclick={() => (value = d.key)}
    >
      {labelOf(d)}
    </button>
  {/each}
</div>

<style>
  .diff-segment {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    min-height: 42px;
    overflow: hidden;
    border: 1.5px solid var(--border);
    border-radius: 999px;
    background: color-mix(in srgb, var(--surface) 88%, var(--surface-2));
  }
  button {
    min-height: 42px;
    border-radius: 999px;
    background: transparent;
    color: var(--ink);
    font-family: var(--font-body);
    font-size: 0.86rem;
    font-weight: 650;
  }
  button.sel {
    color: #fff;
    background: var(--primary);
    box-shadow: 0 8px 16px -12px var(--primary);
  }
</style>
