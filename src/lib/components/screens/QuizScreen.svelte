<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { beltById } from '../../data/belts';
  import { gameStore } from '../../stores/game.svelte';
  import { motionMs } from '../../motion';
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
  const flameSize = $derived(Math.min(1.2, 0.78 + gameStore.streak * 0.04));
</script>

<section class="screen">
  <div class="quiz-head">
    <button class="restart-btn" onclick={() => gameStore.restart()}> ↺ Ricomincia </button>
    {#if gameStore.isReview}<span class="review-flag">🔁 Ripasso</span>{/if}
  </div>

  <div class="topbar">
    <span class="qnum">Domanda {gameStore.idx + 1} / {gameStore.total}</span>
    <span class="beltTag"><BeltDot {belt} />{belt.name}</span>
    <span class="score" id="scorePill">
      {#if gameStore.streak >= 2}
        {#key gameStore.streak}
          <span class="flame" style="font-size:{flameSize}rem">🔥{gameStore.streak}</span>
        {/key}
      {/if}
      ⭐ {gameStore.score}
    </span>
    {#if gameStore.answered && isCorrect && !gameStore.isReview}
      {#key gameStore.idx}
        <span class="xp-pop">+{gameStore.lastGain} XP</span>
      {/key}
    {/if}
  </div>

  <ProgressBelt pct={gameStore.progressPct} />
  <Timer timeLeft={gameStore.timeLeft} />

  <!-- persistent live region: announces each new question to screen readers -->
  {#if q}
    <div class="sr-only" aria-live="polite" aria-atomic="true">
      Domanda {gameStore.idx + 1} di {gameStore.total}: {q.q}
    </div>

    {#key gameStore.idx}
      <div in:fly={{ y: 12, duration: motionMs(280) }} out:fade={{ duration: motionMs(120) }}>
        <span class="cat" aria-hidden="true">{q.cat}</span>
        <div class="question" aria-hidden="true">{q.q}</div>

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
      <div
        class="feedback {isCorrect ? 'good' : 'bad'}"
        role="status"
        aria-live="polite"
        transition:fly={{ y: 8, duration: motionMs(200) }}
      >
        {#if isCorrect}
          <span class="h">✅ Esatto! {praise}{#if !gameStore.isReview} <span class="xp">+{gameStore.lastGain} XP</span>{/if}</span>
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
    padding-right: 92px; /* clear the absolute top-right controls (U23) */
    min-height: 44px;
  }
  .restart-btn {
    background: var(--surface-2);
    color: var(--ink);
    font-size: 0.82rem;
    padding: 9px 14px;
    min-height: 40px;
    border-radius: 999px;
  }
  @media (hover: hover) {
    .restart-btn:hover {
      background: var(--border);
    }
  }
  .review-flag {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.78rem;
    color: var(--amber-ink);
    background: var(--amber-bg);
    padding: 5px 12px;
    border-radius: 999px;
  }
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    row-gap: 6px;
    margin-bottom: 6px;
    position: relative;
  }
  .qnum {
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--ink-soft);
    font-size: 0.92rem;
    flex: 0 0 auto;
  }
  .beltTag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.78rem;
    color: var(--ink);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 4px 10px;
    max-width: 45%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .score {
    display: flex;
    align-items: center;
    gap: 5px;
    background: var(--amber-bg);
    color: var(--amber-ink);
    font-family: var(--font-display);
    font-weight: 800;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 0.92rem;
    box-shadow: 0 3px 8px -4px var(--amber-glow);
    flex: 0 0 auto;
  }
  .flame {
    display: inline-block;
    animation: flameKick 0.35s var(--ease-spring);
  }
  @keyframes flameKick {
    0% {
      transform: scale(0.7);
    }
    60% {
      transform: scale(1.25);
    }
    100% {
      transform: scale(1);
    }
  }
  .xp-pop {
    position: absolute;
    right: 0;
    top: -6px;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 0.95rem;
    color: var(--blu-d);
    pointer-events: none;
    animation: xpPop 0.9s ease forwards;
  }
  @keyframes xpPop {
    0% {
      transform: translateY(0) scale(0.8);
      opacity: 0;
    }
    20% {
      transform: translateY(-10px) scale(1.1);
      opacity: 1;
    }
    100% {
      transform: translateY(-34px) scale(1);
      opacity: 0;
    }
  }
  .cat {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: var(--chip-bg);
    color: var(--chip-ink);
    font-family: var(--font-display);
    font-weight: 700;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 0.82rem;
    margin: 14px 0 2px;
  }
  .question {
    font-family: var(--font-display);
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
    color: var(--verde-fb);
  }
  .feedback.bad {
    background: color-mix(in srgb, var(--rosso) 12%, var(--surface));
    border: 2px solid var(--rosso);
    color: var(--rosso-d);
  }
  .feedback .h {
    font-family: var(--font-display);
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
