<script lang="ts">
  import { onMount } from 'svelte';
  import { gameStore } from '../../stores/game.svelte';
  import { authStore } from '../../stores/auth.svelte';
  import { BELT_GROUPS } from '../../data/belts';
  import { fetchTopProfiles, fetchProfile, type PlayerProfile } from '../../services/profiles';

  let rows = $state<PlayerProfile[]>([]);
  let me = $state<PlayerProfile | null>(null);
  let loading = $state(true);
  let errored = $state(false);
  let fetchedFor: string | null = null;

  const medals = ['🥇', '🥈', '🥉'];
  // Reactive: auth resolves asynchronously (anonymous sign-in / magic-link
  // return) and may settle AFTER this screen mounts.
  const myId = $derived(authStore.userId);

  // Top 20, plus the player's own row if they rank lower.
  const display = $derived.by(() => {
    const top = rows.slice(0, 20).map((r, i) => ({ row: r, rank: i }));
    const myIndex = rows.findIndex((r) => r.user_id === myId);
    if (myIndex >= 20) top.push({ row: rows[myIndex], rank: myIndex });
    return top;
  });

  // "Active but empty" — kept distinct from a network/read error.
  const unavailable = $derived(!loading && !errored && rows.length === 0 && me == null);

  onMount(async () => {
    const top = await fetchTopProfiles(100);
    if (top == null) errored = true;
    else rows = top;
    loading = false;
  });

  // Resolve the player's own profile reactively once auth settles (and if the
  // id changes). Fetches at most once per id.
  $effect(() => {
    const id = myId;
    if (!id) {
      me = null;
      return;
    }
    const found = rows.find((r) => r.user_id === id);
    if (found) {
      me = found;
      return;
    }
    if (fetchedFor !== id) {
      fetchedFor = id;
      void fetchProfile(id).then((p) => {
        if (p) me = p;
      });
    }
  });
</script>

<section class="screen">
  <div class="head">
    <button class="restart-btn" onclick={() => gameStore.goHome()}>← Home</button>
  </div>

  <h1 class="title">Classifica <span class="grad">Giocatori</span></h1>
  <p class="sub">Punteggio carriera = XP + trofei + punti cumulati</p>

  {#if me}
    <div class="me-card">
      <div class="me-top">
        <span class="me-name">👤 {me.name || 'Tu'}</span>
        <span class="me-career">{me.career}<span class="u">pt carriera</span></span>
      </div>
      <div class="me-stats">
        <span class="stat">Lv {me.level}</span>
        <span class="stat">✨ {me.xp} XP</span>
        <span class="stat">🏆 {me.badges}</span>
        <span class="stat">🎯 {me.cum_points} pt</span>
      </div>
      <div class="by-color">
        {#each BELT_GROUPS as g (g.key)}
          {@const pts = me.by_color?.[g.label] ?? 0}
          <div class="cc" class:zero={pts === 0}>
            <span class="dot" style="background:{g.color}"></span>
            <span class="cc-label">{g.label}</span>
            <span class="cc-pts">{pts}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="empty" role="status">Carico la classifica… ⏳</div>
  {:else if errored}
    <div class="empty" role="status">⚠️ Impossibile caricare la classifica ora. Riprova più tardi.</div>
  {:else if unavailable}
    <div class="empty" role="status">
      🏗️ Classifica giocatori non ancora attiva.<br />Gioca una partita (da loggato) per comparire.
    </div>
  {:else if !rows.length}
    <div class="empty" role="status">Ancora nessun giocatore in classifica. Sii il primo! 🥇</div>
  {:else}
    <div role="list" class="list">
      {#each display as { row, rank } (row.user_id)}
        {@const mine = row.user_id === myId}
        <div class="row" class:me={mine} role="listitem" aria-current={mine ? 'true' : undefined}>
          <span class="rank">{medals[rank] ?? rank + 1}</span>
          <span class="name">{row.name || 'Anonimo'}{#if mine}<span class="sr-only"> (tu)</span>{/if}</span>
          <span class="meta">Lv {row.level} · 🏆 {row.badges}</span>
          <span class="pts">{row.career}<span class="u">pt</span></span>
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
    padding-right: var(--controls-gutter);
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

  .me-card {
    background: var(--primary-soft);
    border: 1px solid var(--primary);
    border-radius: var(--radius);
    padding: 14px;
    margin-bottom: 16px;
  }
  .me-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }
  .me-name {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.05rem;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .me-career {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.3rem;
    color: var(--blu-d);
    flex: 0 0 auto;
  }
  .u {
    font-size: 0.62rem;
    font-weight: 700;
    margin-left: 3px;
    color: var(--ink-soft);
  }
  .me-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }
  .stat {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.78rem;
    color: var(--ink);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 3px 10px;
  }
  .by-color {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin-top: 12px;
  }
  .cc {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 6px 8px;
    font-size: 0.76rem;
    font-weight: 700;
  }
  .cc.zero {
    opacity: 0.5;
  }
  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid var(--belt-brd);
    flex: 0 0 auto;
  }
  .cc-label {
    flex: 1;
    color: var(--ink-soft);
  }
  .cc-pts {
    font-family: var(--font-display);
    font-weight: 800;
    color: var(--ink);
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
  .meta {
    font-size: 0.72rem;
    color: var(--ink-soft);
    font-weight: 600;
    flex: 0 0 auto;
  }
  .pts {
    font-family: var(--font-display);
    font-weight: 800;
    color: var(--blu-d);
    flex: 0 0 auto;
    white-space: nowrap;
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
