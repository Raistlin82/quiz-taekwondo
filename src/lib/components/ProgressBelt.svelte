<script lang="ts">
  let { pct }: { pct: number } = $props();
</script>

<div class="beltbar">
  <div class="belt-track"><div class="belt-fill" style="width:{pct}%"></div></div>
  <div class="knot" style="left:clamp(12px, {pct}%, calc(100% - 12px))" aria-hidden="true">🥋</div>
  <div class="belt-pct">{pct}%</div>
</div>

<style>
  .beltbar {
    margin: 10px 0 0;
    position: relative;
  }
  .belt-track {
    height: 18px;
    border-radius: 999px;
    background: repeating-linear-gradient(
      45deg,
      var(--track),
      var(--track) 8px,
      var(--border) 8px,
      var(--border) 16px
    );
    border: 1px solid var(--border);
    overflow: hidden;
  }
  .belt-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--success), var(--primary));
    transition: width 0.5s cubic-bezier(0.2, 0.9, 0.3, 1);
    box-shadow: inset 0 -3px 6px rgba(0, 0, 0, 0.12);
  }
  .knot {
    position: absolute;
    top: 9px;
    transform: translate(-50%, -50%);
    font-size: 1.05rem;
    transition: left 0.5s cubic-bezier(0.2, 0.9, 0.3, 1);
    filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3));
  }
  .belt-pct {
    text-align: right;
    font-size: 0.68rem;
    color: var(--ink-soft);
    font-weight: 700;
    margin-top: 4px;
  }
</style>
