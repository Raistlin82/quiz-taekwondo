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
    <div class="lb-empty">Carico la classifica… ⏳</div>
  {:else if error}
    <div class="lb-empty">⚠️ {error}</div>
  {:else if !rows.length}
    <div class="lb-empty">Ancora nessun punteggio. Sii il primo! 🥇</div>
  {:else}
    {#if online}
      <div class="lb-tag">🌍 Classifica online · tutti i giocatori</div>
    {/if}
    {#each display as { row, rank } (row.id)}
      {@const belt = beltById(row.belt) ?? UNKNOWN_BELT}
      <div class="lb-row" class:me={row.id === myId}>
        <span class="lb-rank">{medals[rank] ?? rank + 1}</span>
        <BeltDot {belt} />
        <span class="lb-name">{row.name}</span>
        <span class="lb-meta">{belt.name} · {row.diff}</span>
        <span class="lb-pts">{row.score}/{row.total}</span>
      </div>
    {/each}
  {/if}
</div>

<style>
  .lb {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .lb-tag {
    text-align: center;
    color: var(--ink-soft);
    font-weight: 600;
    font-size: 0.78rem;
    padding-bottom: 2px;
  }
  .lb-row {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 9px 12px;
    font-weight: 700;
    font-size: 0.9rem;
  }
  .lb-row.me {
    border-color: var(--verde);
    background: color-mix(in srgb, var(--verde) 14%, var(--surface));
    box-shadow: 0 4px 12px -6px rgba(34, 197, 94, 0.6);
  }
  .lb-rank {
    font-family: 'Baloo 2';
    font-weight: 800;
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
    font-weight: 600;
  }
  .lb-pts {
    font-family: 'Baloo 2';
    font-weight: 800;
    color: var(--blu-d);
  }
  .lb-empty {
    text-align: center;
    color: var(--ink-soft);
    font-weight: 600;
    font-size: 0.9rem;
    padding: 8px;
  }
</style>
