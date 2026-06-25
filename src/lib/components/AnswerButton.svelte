<script lang="ts">
  interface Props {
    letter: string;
    text: string;
    state: 'idle' | 'correct' | 'wrong' | 'dim';
    locked: boolean;
    delay?: number;
    onpick: () => void;
  }
  let { letter, text, state, locked, delay = 0, onpick }: Props = $props();
  const mark = $derived(state === 'correct' ? '✓' : state === 'wrong' ? '×' : '');
  const outcome = $derived(
    state === 'correct' ? ' — risposta corretta' : state === 'wrong' ? ' — risposta sbagliata' : '',
  );
</script>

<button
  type="button"
  class="ans {state}"
  class:locked
  style="animation-delay:{delay}s"
  disabled={locked}
  aria-label={`${letter}. ${text}${outcome}`}
  onclick={onpick}
>
  <span class="tag" aria-hidden="true">{letter}</span>
  <span class="txt">{text}</span>
  <span class="mark" aria-hidden="true">{mark}</span>
</button>

<style>
  .ans {
    width: 100%;
    min-height: 62px;
    background: color-mix(in srgb, var(--surface) 92%, var(--surface-2));
    border: 1.4px solid var(--border);
    border-radius: 12px;
    padding: 11px 14px;
    text-align: left;
    font-family: var(--font-body);
    font-weight: 750;
    font-size: 1rem;
    color: var(--ink);
    display: flex;
    align-items: center;
    gap: 13px;
    box-shadow: 0 8px 18px -17px rgba(42, 28, 15, 0.55);
    transition:
      transform 0.12s,
      border-color 0.15s,
      background 0.15s,
      box-shadow 0.15s;
    animation: slideIn 0.35s both;
  }
  @media (hover: hover) and (pointer: fine) {
    .ans:not(.locked):hover {
      border-color: var(--primary);
      background: var(--primary-soft);
      transform: translateX(3px);
      box-shadow: 0 9px 20px -16px color-mix(in srgb, var(--primary) 45%, transparent);
    }
    .ans:not(.locked):hover .tag {
      border-color: var(--primary);
      color: var(--primary-d);
    }
  }
  .ans:not(.locked):active {
    transform: scale(0.985);
  }
  .ans:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--ink-soft) 26%, transparent);
    outline-offset: 2px;
  }
  .tag {
    flex: 0 0 34px;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--surface) 78%, var(--surface-2));
    border: 1.2px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-weight: 800;
    color: var(--ink-soft);
    transition: 0.15s;
  }
  .txt {
    flex: 1;
    min-width: 0;
    line-height: 1.25;
  }
  .mark {
    flex: 0 0 26px;
    color: currentColor;
    font-family: var(--font-display);
    font-size: 1.7rem;
    font-weight: 900;
    text-align: center;
  }
  .ans.locked {
    cursor: default;
  }
  .ans.correct {
    border-color: var(--success);
    background: color-mix(in srgb, var(--success-soft) 78%, var(--surface));
    color: var(--success-d);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--success) 22%, transparent);
    animation: correctPop 0.34s var(--ease-spring);
  }
  .ans.correct .tag {
    background: var(--success);
    border-color: var(--success);
    color: #fff;
  }
  .ans.wrong {
    border-color: var(--danger);
    background: color-mix(in srgb, var(--danger) 12%, var(--surface));
    color: var(--danger-d);
    animation: wrongShake 0.34s ease;
  }
  .ans.wrong .tag {
    background: var(--danger);
    border-color: var(--danger);
    color: #fff;
  }
  .ans.wrong .txt {
    text-decoration: line-through;
    text-decoration-color: color-mix(in srgb, var(--danger) 70%, transparent);
    text-decoration-thickness: 2px;
  }
  .ans.dim {
    opacity: 0.58;
  }
  .mark:not(:empty) {
    animation: markIn 0.25s var(--ease-spring) both;
  }
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes correctPop {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.025);
    }
    100% {
      transform: scale(1);
    }
  }
  @keyframes wrongShake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-5px);
    }
    50% {
      transform: translateX(4px);
    }
    75% {
      transform: translateX(-2px);
    }
  }
  @keyframes markIn {
    from {
      transform: scale(0.35);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
