<script lang="ts">
  import { BELTS } from '../data/belts';
  let { value = $bindable() }: { value: number } = $props();
</script>

<div class="belt-grid">
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
    font-family: 'Baloo 2';
    font-weight: 700;
    font-size: 0.76rem;
    color: var(--ink-soft);
    line-height: 1.05;
  }
  .belt-opt:hover {
    transform: translateY(-2px);
    border-color: var(--border-strong);
  }
  .belt-opt.sel {
    border-color: var(--blu);
    box-shadow: 0 8px 18px -8px rgba(59, 130, 246, 0.6);
    color: var(--ink);
  }
  .mini {
    height: 16px;
    border-radius: 6px;
    margin-bottom: 6px;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.1);
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
</style>
