<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { gameStore } from '../../stores/game.svelte';
  import { themeStore } from '../../stores/theme.svelte';
  import { playSound } from '../../audio';
  import { motionMs } from '../../motion';
  import Timer from '../Timer.svelte';
  import AnswerButton from '../AnswerButton.svelte';

  const LETTERS = ['A', 'B', 'C', 'D'];
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

  function next() {
    playSound('next', themeStore.sound);
    gameStore.next();
  }

  const isCorrect = $derived(gameStore.answered && gameStore.selected === correctIdx);
  const timedOut = $derived(gameStore.answered && gameStore.selected === null);
</script>

<section class="screen quiz-screen">
  <header class="quiz-head">
    <button class="back-btn" aria-label="Torna alla home" onclick={() => gameStore.goHome()}>‹</button>
    <div class="qnum">Domanda {gameStore.idx + 1} / {gameStore.total}</div>
    <div class="streak" id="scorePill" aria-label="Serie attuale">
      <img src="ui/icons/flame.png" alt="" aria-hidden="true" />{gameStore.streak || gameStore.score}
    </div>
  </header>

  <Timer timeLeft={gameStore.timeLeft} />

  {#if q}
    <div class="sr-only" aria-live="polite" aria-atomic="true">
      Domanda {gameStore.idx + 1} di {gameStore.total}: {q.q}
    </div>

    <div class="cat-row">
      <span class="cat" aria-hidden="true"><img src="ui/icons/category.png" alt="" />{q.cat.replace(/^[^\s]+\s*/, '')}</span>
      {#if gameStore.isReview}<span class="review-flag">Ripasso</span>{/if}
      {#if gameStore.mode === 'challenge'}<span class="review-flag">⚔️ Round {gameStore.challengeRound + 1}/{gameStore.challengeTotalRounds}</span>{/if}
    </div>

    {#key gameStore.idx}
      <div class="question-panel" in:fly={{ y: 12, duration: motionMs(280) }} out:fade={{ duration: motionMs(120) }}>
        <div class="question" aria-hidden="true">{q.q}</div>
        <span class="small-seal" aria-hidden="true">稽</span>
      </div>

      <div class="answers">
        {#each q.options as opt, i (i)}
          <AnswerButton
            letter={LETTERS[i]}
            text={opt}
            state={stateFor(i)}
            locked={gameStore.answered}
            delay={i * 0.04}
            onpick={() => pick(i)}
          />
        {/each}
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
          <span class="h">Esatto! {praise}{#if !gameStore.isReview} <span class="xp">+{gameStore.lastGain} XP</span>{/if}</span>
          {q.explain}
        {:else}
          <span class="h">{timedOut ? 'Tempo scaduto' : 'Quasi!'}</span>
          La risposta giusta è <b>{q.options[correctIdx]}</b>. {q.explain}
        {/if}
      </div>

      <button class="cta next-btn" onclick={next}>
        {gameStore.isLast ? 'Vedi risultato' : 'Avanti'} <span aria-hidden="true">›</span>
      </button>
    {/if}
  {/if}
</section>

<style>
  .quiz-screen {
    min-height: calc(min(900px, 100dvh - 28px) - 40px);
    display: flex;
    flex-direction: column;
  }
  .quiz-head {
    display: grid;
    grid-template-columns: 42px 1fr 58px;
    align-items: center;
    gap: 8px;
    min-height: 48px;
  }
  .back-btn {
    width: 42px;
    height: 42px;
    border-radius: 999px;
    background: transparent;
    color: var(--ink);
    font-size: 2rem;
    line-height: 1;
  }
  .qnum {
    text-align: center;
    font-family: var(--font-display);
    font-size: 0.98rem;
    font-weight: 800;
    color: var(--ink);
  }
  .streak {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 5px;
    justify-self: end;
    min-width: 48px;
    color: var(--primary);
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 900;
    text-align: right;
  }
  .streak img {
    width: 22px;
    height: 22px;
    object-fit: contain;
  }
  .cat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 12px;
  }
  .cat,
  .review-flag {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    padding: 5px 14px;
    border-radius: 999px;
    background: var(--success);
    color: #fff;
    font-family: var(--font-body);
    font-size: 0.82rem;
    font-weight: 800;
  }
  .cat img {
    width: 18px;
    height: 18px;
    margin-right: 5px;
    object-fit: contain;
  }
  .review-flag {
    background: var(--amber-bg);
    color: var(--amber-ink);
  }
  .question-panel {
    position: relative;
    margin-top: 12px;
    min-height: 166px;
    padding: 24px 20px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background:
      radial-gradient(ellipse at 100% 50%, rgba(72, 87, 67, 0.08), transparent 36%),
      color-mix(in srgb, var(--surface) 94%, var(--surface-2));
    box-shadow: 0 10px 28px -24px rgba(42, 28, 15, 0.6);
  }
  .question {
    max-width: 91%;
    font-family: var(--font-display);
    font-size: clamp(1.28rem, 5.8vw, 1.58rem);
    font-weight: 800;
    line-height: 1.34;
    color: var(--ink);
  }
  .small-seal {
    position: absolute;
    right: 16px;
    bottom: 16px;
    width: 25px;
    height: 31px;
    display: grid;
    place-items: center;
    border: 2px solid var(--primary);
    border-radius: 4px;
    color: var(--primary);
    font-family: 'Ma Shan Zheng', var(--font-display);
    font-size: 1rem;
  }
  .answers {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 18px;
  }
  .feedback {
    margin-top: 14px;
    border-radius: 12px;
    padding: 12px 14px;
    font-weight: 650;
    font-size: 0.9rem;
    line-height: 1.45;
  }
  .feedback.good {
    background: var(--success-soft);
    border: 1.5px solid var(--verde);
    color: var(--verde-fb);
  }
  .feedback.bad {
    background: color-mix(in srgb, var(--rosso) 12%, var(--surface));
    border: 1.5px solid var(--rosso);
    color: var(--rosso-d);
  }
  .feedback .h {
    display: block;
    margin-bottom: 3px;
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 900;
  }
  .xp {
    color: var(--primary-d);
  }
  .next-btn {
    margin-top: auto;
    border: 0;
    border-radius: 9px;
    background:
      linear-gradient(rgba(255, 255, 255, 0.03), rgba(0, 0, 0, 0.08)),
      var(--img-brush) center / 100% 100% no-repeat,
      var(--primary);
  }
</style>
