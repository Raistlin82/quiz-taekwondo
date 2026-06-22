<script lang="ts">
  import { BELTS } from '../data/belts';
  let { value = $bindable() }: { value: number } = $props();
</script>

<div class="belt-grid" role="group" aria-label="Scegli la cintura d'esame">
  {#each BELTS as b (b.id)}
    <button
      type="button"
      class="belt-opt"
      class:sel={b.id === value}
      aria-pressed={b.id === value}
      onclick={() => (value = b.id)}
    >
      <div class="mini" style="background:{b.main}">
        {#if b.stripe}<span class="str" style="background:{b.stripe}"></span>{/if}
      </div>
      {b.name}
      <div class="tick">✓</div>
    </button>
  {/each}
</div>

<style>
  .belt-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 9px;
  }
  .belt-opt {
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: 16px;
    padding: 9px 6px 8px;
    cursor: pointer;
    text-align: center;
    transition:
      transform 0.12s,
      border-color 0.15s,
      box-shadow 0.15s;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.76rem;
    color: var(--ink-soft);
    line-height: 1.05;
  }
  @media (hover: hover) {
    .belt-opt:hover {
      transform: translateY(-2px);
      border-color: var(--border-strong);
    }
  }
  .belt-opt:active {
    transform: translateY(0) scale(0.98);
  }
  .belt-opt.sel {
    border-color: var(--accent);
    box-shadow: 0 8px 18px -8px rgba(192, 67, 44, 0.5);
    color: var(--ink);
  }
  .mini {
    height: 16px;
    border-radius: 6px;
    margin-bottom: 6px;
    position: relative;
    overflow: hidden;
    border: 1px solid var(--belt-brd);
    transition: 0.15s;
  }
  .belt-opt.sel .mini {
    transform: scale(1.05);
  }
  .mini .str {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 5px;
  }
  .tick {
    font-size: 0.66rem;
    color: var(--blu);
    opacity: 0;
    margin-top: 2px;
  }
  .belt-opt.sel .tick {
    opacity: 1;
  }
  /* clean 4×2 grid on phones instead of a ragged 3+3+2 */
  @media (max-width: 420px) {
    .belt-grid {
      grid-template-columns: repeat(4, 1fr);
    }
    .belt-opt {
      font-size: 0.72rem;
      line-height: 1.15;
      min-height: 64px;
    }
  }
</style>
