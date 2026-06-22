<script lang="ts">
  import type { Belt } from '../data/belts';
  let { belt, size = 22, height = 10 }: { belt: Belt; size?: number; height?: number } = $props();
</script>

<span class="dot" style="width:{size}px;height:{height}px;background:{belt.main}">
  {#if belt.stripe}
    <span class="str" style="background:{belt.stripe}"></span>
  {/if}
</span>

<style>
  .dot {
    border-radius: 4px;
    position: relative;
    overflow: hidden;
    display: inline-block;
    flex: 0 0 auto;
    border: 1px solid rgba(0, 0, 0, 0.12);
  }
  .str {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 40%;
  }
</style>
