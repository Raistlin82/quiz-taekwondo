<script lang="ts">
  import { fly } from 'svelte/transition';
  import { beltById } from '../../data/belts';
  import { gameStore } from '../../stores/game.svelte';
  import BeltDot from '../BeltDot.svelte';
  import Timer from '../Timer.svelte';
  import ProgressBelt from '../ProgressBelt.svelte';
  import AnswerButton from '../AnswerButton.svelte';

  const LETTERS = ['A', 'B', 'C', 'D'];
  const belt = $derived(beltById(gameStore.selBelt)!);
  const q = $derived(gameStore.current);
  const correctIdx = $derived(q?.answer ?? -1);

  const praises = ['Grande!', 'Campione!', 'Bravissimo!', 'Ottimo!', 'Top!', 'Perfetto!'];
  let praise = $state(praises[0]);

  function stateFor(i: number): 'idle' | 'correct' | 'wrong' | 'dim' {
    if (!gameStore.answered) return 'idle';
    if (i === correctIdx) return 'correct';
    if (i === gameStore.selected) return 'wrong';
    return 'dim';
  }

  function pick(i: number) {
    if (gameStore.answered) return;
    praise = praises[Math.floor(Math.random() * praises.length)];
    gameStore.answer(i);
  }

  const isCorrect = $derived(gameStore.answered && gameStore.selected === correctIdx);
  const timedOut = $derived(gameStore.answered && gameStore.selected === null);
</script>

<section class="screen">
  <div class="quiz-head">
    <button
      class="restart-btn"
      onclick={() => (gameStore.isReview ? gameStore.startReview() : gameStore.startQuiz())}
    >
      ↺ Ricomincia
    </button>
    {#if gameStore.isReview}<span class="review-flag">🔁 Ripasso</span>{/if}
  </div>

  <div class="topbar">
    <span class="qnum">Domanda {gameStore.idx + 1} / {gameStore.total}</span>
    <span class="beltTag"><BeltDot {belt} />{belt.name}</span>
    <span class="score">
      {#if gameStore.streak >= 2}<span class="flame">🔥{gameStore.streak}</span>{/if}
      ⭐ {gameStore.score}
    </span>
  </div>

  <ProgressBelt pct={gameStore.progressPct} />
  <Timer timeLeft={gameStore.timeLeft} />

  {#if q}
    {#key gameStore.idx}
      <div in:fly={{ y: 12, duration: 280 }}>
        <span class="cat">{q.cat}</span>
        <div class="question">{q.q}</div>

        <div class="answers">
          {#each q.options as opt, i (i)}
            <AnswerButton
              letter={LETTERS[i]}
              text={opt}
              state={stateFor(i)}
              locked={gameStore.answered}
              delay={i * 0.05}
              onpick={() => pick(i)}
            />
          {/each}
        </div>
      </div>
    {/key}

    {#if gameStore.answered}
      <div class="feedback {isCorrect ? 'good' : 'bad'}" transition:fly={{ y: 8, duration: 200 }}>
        {#if isCorrect}
          <span class="h">✅ Esatto! {praise} <span class="xp">+{gameStore.lastGain} XP</span></span>
          {q.explain}
        {:else}
          <span class="h">{timedOut ? '⏰ Tempo scaduto!' : 'Quasi!'}</span>
          La risposta giusta è <b>{q.options[correctIdx]}</b>. {q.explain}
        {/if}
      </div>

      <button class="cta blu next-btn" onclick={() => gameStore.next()}>
        {gameStore.isLast ? 'Vedi risultato 🏆' : 'Avanti →'}
      </button>
    {/if}
  {/if}
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
  .restart-btn:hover {
    background: var(--border);
  }
  .review-flag {
    font-family: 'Baloo 2';
    font-weight: 700;
    font-size: 0.78rem;
    color: #7c4a02;
    background: linear-gradient(135deg, #fde68a, var(--giallo));
    padding: 5px 12px;
    border-radius: 999px;
  }
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
  }
  .qnum {
    font-family: 'Baloo 2';
    font-weight: 700;
    color: var(--ink-soft);
    font-size: 0.92rem;
  }
  .beltTag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: 'Baloo 2';
    font-weight: 700;
    font-size: 0.78rem;
    color: var(--ink);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 4px 10px;
  }
  .score {
    display: flex;
    align-items: center;
    gap: 5px;
    background: linear-gradient(135deg, #fde68a, #fbbf24);
    color: #7c4a02;
    font-family: 'Baloo 2';
    font-weight: 800;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 0.92rem;
    box-shadow: 0 4px 10px -3px rgba(251, 191, 36, 0.6);
  }
  .flame {
    font-size: 0.82rem;
  }
  .cat {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: linear-gradient(135deg, #dbeafe, #ede9fe);
    color: var(--blu-d);
    font-family: 'Baloo 2';
    font-weight: 700;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 0.82rem;
    margin: 14px 0 2px;
  }
  .question {
    font-family: 'Baloo 2';
    font-weight: 700;
    font-size: 1.28rem;
    line-height: 1.3;
    margin: 10px 0 4px;
    color: var(--ink);
  }
  .answers {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 12px;
  }
  .feedback {
    margin-top: 14px;
    border-radius: 18px;
    padding: 13px 16px;
    font-weight: 700;
    font-size: 0.95rem;
    line-height: 1.45;
  }
  .feedback.good {
    background: color-mix(in srgb, var(--verde) 14%, var(--surface));
    border: 2px solid var(--verde);
    color: var(--verde-d);
  }
  .feedback.bad {
    background: color-mix(in srgb, var(--rosso) 12%, var(--surface));
    border: 2px solid var(--rosso);
    color: #b91c1c;
  }
  .feedback .h {
    font-family: 'Baloo 2';
    font-weight: 800;
    font-size: 1.05rem;
    display: block;
    margin-bottom: 3px;
  }
  .xp {
    color: var(--blu-d);
  }
  .next-btn {
    margin-top: 14px;
  }
  @media (max-width: 420px) {
    .question {
      font-size: 1.12rem;
    }
  }
</style>
