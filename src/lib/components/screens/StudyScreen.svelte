<script lang="ts">
  import { fly } from 'svelte/transition';
  import { POOL } from '../../data/questions';
  import { beltById, BELTS } from '../../data/belts';
  import { gameStore, qKey } from '../../stores/game.svelte';
  import { progressStore } from '../../stores/progress.svelte';

  // Cards for the selected belt (all levels), grouped by category order.
  const cards = $derived(POOL.filter((q) => q.belt <= gameStore.selBelt));
  const belt = $derived(beltById(gameStore.selBelt)!);

  let i = $state(0);
  let revealed = $state(false);
  const card = $derived(cards[Math.min(i, cards.length - 1)]);

  // Reset position when the belt filter changes the set.
  $effect(() => {
    void gameStore.selBelt;
    i = 0;
    revealed = false;
  });

  function go(delta: number) {
    const n = cards.length;
    i = (i + delta + n) % n;
    revealed = false;
  }
  function flagReview() {
    if (card) {
      progressStore.reviewGraded(qKey(card), false);
      go(1);
    }
  }
</script>

<section class="screen">
  <div class="quiz-head">
    <button class="restart-btn" onclick={() => gameStore.goHome()}>← Home</button>
    <span class="count">{i + 1} / {cards.length}</span>
  </div>

  <h1 class="study-h">📖 Modalità <span class="grad">Studio</span></h1>

  <div class="belt-row">
    {#each BELTS as b (b.id)}
      <button
        class="chip"
        class:sel={b.id === gameStore.selBelt}
        style="--c:{b.main}"
        onclick={() => (gameStore.selBelt = b.id)}
      >
        {b.name}
      </button>
    {/each}
  </div>

  {#if card}
    {#key i}
      <button class="card" onclick={() => (revealed = !revealed)} in:fly={{ y: 12, duration: 250 }}>
        <span class="cat">{card.cat}</span>
        <div class="q">{card.q}</div>
        {#if revealed}
          <div class="answer" transition:fly={{ y: 8, duration: 180 }}>
            <div class="a-correct">✅ {card.options[card.answer]}</div>
            <div class="a-explain">{card.explain}</div>
          </div>
        {:else}
          <div class="tap">👆 Tocca per vedere la risposta</div>
        {/if}
      </button>
    {/key}

    <div class="nav">
      <button class="ghost" onclick={() => go(-1)}>← Indietro</button>
      <button class="ghost flag" onclick={flagReview} title="Aggiungi alle domande da ripassare">🔁 Ripassa</button>
      <button class="ghost" onclick={() => go(1)}>Avanti →</button>
    </div>
  {/if}

  <p class="hint">Cintura <b style="color:{belt.main}">{belt.name}</b> · {cards.length} domande · nessun timer</p>
</section>

<style>
  .quiz-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .restart-btn {
    background: var(--surface-2);
    color: var(--ink);
    font-size: 0.82rem;
    padding: 7px 13px;
    border-radius: 999px;
  }
  .count {
    font-family: 'Baloo 2';
    font-weight: 700;
    color: var(--ink-soft);
    font-size: 0.9rem;
  }
  .study-h {
    margin-bottom: 12px;
  }
  .belt-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 14px;
    justify-content: center;
  }
  .chip {
    font-family: 'Baloo 2';
    font-weight: 700;
    font-size: 0.72rem;
    padding: 5px 10px;
    border-radius: 999px;
    background: var(--surface);
    border: 2px solid var(--border);
    color: var(--ink-soft);
  }
  .chip.sel {
    border-color: var(--c);
    color: var(--ink);
    box-shadow: 0 4px 12px -6px var(--c);
  }
  .card {
    width: 100%;
    text-align: left;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 20px 18px;
    min-height: 180px;
    cursor: pointer;
    transition: border-color 0.2s;
  }
  .card:hover {
    border-color: var(--border-strong);
  }
  .cat {
    display: inline-flex;
    background: linear-gradient(135deg, #dbeafe, #ede9fe);
    color: var(--blu-d);
    font-family: 'Baloo 2';
    font-weight: 700;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 0.78rem;
  }
  .q {
    font-family: 'Baloo 2';
    font-weight: 700;
    font-size: 1.2rem;
    line-height: 1.3;
    margin: 12px 0;
    color: var(--ink);
  }
  .tap {
    color: var(--ink-faint);
    font-weight: 600;
    font-size: 0.88rem;
    margin-top: 8px;
  }
  .answer {
    margin-top: 8px;
  }
  .a-correct {
    font-family: 'Baloo 2';
    font-weight: 800;
    color: var(--verde-d);
    font-size: 1.05rem;
  }
  .a-explain {
    margin-top: 6px;
    color: var(--ink-soft);
    font-weight: 600;
    font-size: 0.92rem;
    line-height: 1.45;
  }
  .nav {
    display: flex;
    gap: 8px;
    margin-top: 14px;
  }
  .nav button {
    flex: 1;
    padding: 12px 8px;
    font-size: 0.9rem;
  }
  .nav .flag {
    flex: 0 0 auto;
    background: linear-gradient(135deg, #fde68a, var(--giallo));
    color: #7c4a02;
  }
</style>
