<script lang="ts">
  import { BELTS, beltById } from '../data/belts';
  import BeltDot from './BeltDot.svelte';

  let { value = $bindable() }: { value: number } = $props();
  const selected = $derived(beltById(value) ?? BELTS[0]);
</script>

<label class="belt-select">
  <span class="face" aria-hidden="true">
    <span class="belt-icon"><BeltDot belt={selected} /></span>
    <span class="belt-name">{selected.name}</span>
    <span class="chev">⌄</span>
  </span>
  <span class="sr-only">Scegli la cintura d'esame</span>
  <select bind:value aria-label="Scegli la cintura d'esame">
    {#each BELTS as b (b.id)}
      <option value={b.id}>{b.name}</option>
    {/each}
  </select>
</label>

<style>
  .belt-select {
    position: relative;
    display: block;
    min-height: 50px;
  }
  .face {
    min-height: 50px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 14px;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    background: color-mix(in srgb, var(--surface) 92%, var(--surface-2));
    box-shadow: 0 8px 18px -16px rgba(45, 28, 14, 0.45);
  }
  .belt-icon {
    width: 76px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .belt-name {
    flex: 1;
    min-width: 0;
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 850;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .chev {
    color: var(--ink-soft);
    font-size: 1.1rem;
    font-weight: 900;
  }
  select {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
  /* The native <select> is transparent, so surface keyboard focus on the
     visible .face instead (keyboard parity with the difficulty picker). */
  .belt-select:has(select:focus-visible) .face {
    outline: 3px solid var(--primary);
    outline-offset: 2px;
  }
  @supports not selector(:has(*)) {
    .belt-select:focus-within .face {
      outline: 3px solid var(--primary);
      outline-offset: 2px;
    }
  }
</style>
