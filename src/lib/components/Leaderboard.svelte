<script lang="ts">
  import { beltById, UNKNOWN_BELT } from '../data/belts';
  import type { ScoreRow } from '../services/leaderboard';
  import BeltDot from './BeltDot.svelte';

  interface Props {
    rows: ScoreRow[];
    myId: string | null;
    online: boolean;
    loading: boolean;
    error: string | null;
  }
  let { rows, myId, online, loading, error }: Props = $props();

  const medals = ['🥇', '🥈', '🥉'];

  // Top 10, plus the player's own row if they rank lower.
  const display = $derived.by(() => {
    const top = rows.slice(0, 10).map((r, i) => ({ row: r, rank: i }));
    const myIndex = rows.findIndex((r) => r.id === myId);
    if (myIndex >= 10) top.push({ row: rows[myIndex], rank: myIndex });
    return top;
  });
</script>

<div class="lb">
  {#if loading}
    <div class="lb-empty" role="status">Carico la classifica… ⏳</div>
  {:else}
    {#if error}
      <div class="lb-banner" role="status">⚠️ {error}</div>
    {/if}
    {#if !rows.length}
      {#if !error}
        <div class="lb-empty" role="status">Ancora nessun punteggio. Sii il primo! 🥇</div>
      {/if}
    {:else}
      {#if online}
        <div class="lb-tag">🌍 Online · punti = accuratezza × difficoltà</div>
      {/if}
      <div role="list">
        {#each display as { row, rank } (row.id)}
          {@const belt = beltById(row.belt) ?? UNKNOWN_BELT}
          {@const mine = row.id === myId}
          <div class="lb-row" class:me={mine} role="listitem" aria-current={mine ? 'true' : undefined}>
            <span class="lb-rank">{medals[rank] ?? rank + 1}</span>
            <BeltDot belt={belt} size={38} height={15} />
            <span class="lb-name">{row.name}{#if mine}<span class="sr-only"> (tu)</span>{/if}</span>
            <span class="lb-meta">{belt.name} · {row.diff}{#if row.secs != null} · ⏱{Math.round(row.secs)}s{/if}</span>
            <span class="lb-pts">{row.points ?? 0}<span class="u">pt</span></span>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .lb {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .lb [role='list'] {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .lb-banner {
    text-align: center;
    font-weight: 800;
    font-size: 0.84rem;
    color: var(--amber-ink);
    background: var(--amber-bg-soft);
    border-radius: 12px;
    padding: 8px 10px;
  }
  .lb-tag {
    text-align: center;
    color: var(--ink-soft);
    font-weight: 650;
    font-size: 0.78rem;
    padding-bottom: 2px;
  }
  .lb-row {
    display: flex;
    align-items: center;
    gap: 10px;
    background: color-mix(in srgb, var(--surface) 90%, var(--surface-2));
    border: 1px solid var(--border);
    border-radius: var(--radius-xs);
    padding: 9px 12px;
    font-weight: 750;
    font-size: 0.9rem;
  }
  .lb-row.me {
    border-color: var(--primary);
    background: var(--primary-soft);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary) 26%, transparent);
  }
  .lb-rank {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 1rem;
    min-width: 26px;
    text-align: center;
  }
  .lb-name {
    flex: 1;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .lb-meta {
    font-size: 0.72rem;
    color: var(--ink-soft);
    font-weight: 650;
  }
  .lb-pts {
    font-family: var(--font-display);
    font-weight: 900;
    color: var(--primary-d);
    flex: 0 0 auto;
    white-space: nowrap;
  }
  .lb-pts .u {
    font-size: 0.68rem;
    font-weight: 700;
    margin-left: 2px;
    color: var(--ink-soft);
  }
  .lb-empty {
    text-align: center;
    color: var(--ink-soft);
    font-weight: 600;
    font-size: 0.9rem;
    padding: 8px;
  }
</style>
