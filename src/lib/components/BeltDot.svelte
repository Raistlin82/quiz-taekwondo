<script lang="ts">
  import type { Belt } from '../data/belts';
  let { belt, size = 72, height = 27 }: { belt: Belt; size?: number; height?: number } = $props();
</script>

<span class="belt-art" style="width:{size}px;height:{height}px">
  <img src={`ui/belts/belt-${belt.id}.png`} alt={belt.name} loading="lazy" />
</span>

<style>
  .belt-art {
    display: inline-grid;
    place-items: center;
    flex: 0 0 auto;
  }
  img {
    width: 100%;
    height: auto;
    display: block;
    filter: drop-shadow(0 4px 5px rgba(45, 28, 14, 0.18));
  }
</style>
