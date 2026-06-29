<script lang="ts">
  import { onMount } from 'svelte';
  import { gameStore } from '../../stores/game.svelte';
  import { authStore } from '../../stores/auth.svelte';
  import { fetchChallengeLadder } from '../../services/challenges';
  import type { LadderEntry } from '../../challenge';

  let rows = $state<LadderEntry[]>([]);
  let loading = $state(true);
  let errored = $state(false);

  const medals = ['🥇', '🥈', '🥉'];
  const myKey = $derived(
    (gameStore.playerName.trim() || authStore.displayName || '').trim().toLowerCase(),
  );

  const display = $derived.by(() => {
    const top = rows.slice(0, 20).map((r, i) => ({ row: r, rank: i }));
    const myIndex = myKey ? rows.findIndex((r) => r.name.toLowerCase() === myKey) : -1;
    if (myIndex >= 20) top.push({ row: rows[myIndex], rank: myIndex });
    return top;
  });

  const unavailable = $derived(!loading && !errored && rows.length === 0);

  onMount(async () => {
    const board = await fetchChallengeLadder();
    if (board == null) errored = true;
    else rows = board;
    loading = false;
  });
</script>

<section class="screen">
  <div class="head">
    <button class="restart-btn" onclick={() => gameStore.goChallenge()}>← Sfide</button>
  </div>

  <h1 class="title">Classifica <span class="grad">Sfide</span></h1>
  <p class="sub">Vittoria = 3 punti · Pareggio = 1 · Sconfitta = 0</p>

  {#if loading}
    <div class="empty" role="status">Carico la classifica… ⏳</div>
  {:else if errored}
    <div class="empty" role="status">⚠️ Impossibile caricare la classifica ora. Riprova più tardi.</div>
  {:else if unavailable}
    <div class="empty" role="status">
      🏗️ Ancora nessuna sfida completata.<br />Lancia un duello per aprire la classifica!
    </div>
  {:else}
    <div role="list" class="list">
      {#each display as { row, rank } (row.name)}
        {@const mine = !!myKey && row.name.toLowerCase() === myKey}
        <div class="row" class:me={mine} role="listitem" aria-current={mine ? 'true' : undefined}>
          <span class="rank">{medals[rank] ?? rank + 1}</span>
          <span class="name">{row.name || 'Anonimo'}{#if mine}<span class="sr-only"> (tu)</span>{/if}</span>
          <span class="record" title="Vittorie · Pareggi · Sconfitte">
            <b class="w">{row.wins}V</b> · <b class="d">{row.draws}P</b> · <b class="l">{row.losses}S</b>
          </span>
          <span class="pts">{row.points}<span class="u">pt</span></span>
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    min-height: 44px;
  }
  .restart-btn {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--ink);
    font-size: 0.82rem;
    padding: 9px 14px;
    min-height: 40px;
    border-radius: 999px;
  }
  .title {
    text-align: left;
    margin-bottom: 2px;
  }
  .sub {
    text-align: left;
    color: var(--ink-soft);
    font-size: 0.82rem;
    font-weight: 500;
    margin-bottom: 14px;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .row {
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
  .row.me {
    border-color: var(--primary);
    background: var(--primary-soft);
    box-shadow: 0 4px 12px -6px color-mix(in srgb, var(--primary) 45%, transparent);
  }
  .rank {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1rem;
    min-width: 26px;
    text-align: center;
  }
  .name {
    flex: 1;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .record {
    font-size: 0.72rem;
    color: var(--ink-soft);
    font-weight: 700;
    flex: 0 0 auto;
    font-variant-numeric: tabular-nums;
  }
  .record .w {
    color: var(--verde-d, var(--verde));
  }
  .record .d {
    color: var(--ink-soft);
  }
  .record .l {
    color: var(--rosso-d, var(--rosso));
  }
  .pts {
    font-family: var(--font-display);
    font-weight: 800;
    color: var(--blu-d);
    flex: 0 0 auto;
    white-space: nowrap;
  }
  .u {
    font-size: 0.62rem;
    font-weight: 700;
    margin-left: 3px;
    color: var(--ink-soft);
  }
  .empty {
    text-align: center;
    color: var(--ink-soft);
    font-weight: 600;
    font-size: 0.9rem;
    padding: 18px 8px;
    line-height: 1.5;
  }
</style>
