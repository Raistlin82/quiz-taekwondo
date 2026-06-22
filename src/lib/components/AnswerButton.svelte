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
  const mark = $derived(state === 'correct' ? '✅' : state === 'wrong' ? '❌' : '');
</script>

<button
  type="button"
  class="ans {state}"
  class:locked
  style="animation-delay:{delay}s"
  disabled={locked}
  onclick={onpick}
>
  <span class="tag">{letter}</span>
  <span class="txt">{text}</span>
  <span class="mark">{mark}</span>
</button>

<style>
  .ans {
    width: 100%;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: 18px;
    padding: 13px 15px;
    text-align: left;
    font-family: 'Nunito';
    font-weight: 700;
    font-size: 1.02rem;
    color: var(--ink);
    display: flex;
    align-items: center;
    gap: 12px;
    transition:
      transform 0.12s,
      border-color 0.15s,
      background 0.15s,
      box-shadow 0.15s;
    animation: slideIn 0.35s both;
  }
  .ans:not(.locked):hover {
    border-color: var(--blu);
    background: color-mix(in srgb, var(--blu) 8%, var(--surface));
    transform: translateX(4px);
    box-shadow: 0 6px 16px -8px rgba(59, 130, 246, 0.6);
  }
  .tag {
    flex: 0 0 34px;
    width: 34px;
    height: 34px;
    border-radius: 11px;
    background: var(--surface-2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Baloo 2';
    font-weight: 800;
    color: var(--ink-soft);
    transition: 0.15s;
  }
  .txt {
    flex: 1;
  }
  .mark {
    font-size: 1.2rem;
  }
  .ans.locked {
    cursor: default;
  }
  .ans.correct {
    border-color: var(--verde);
    background: color-mix(in srgb, var(--verde) 14%, var(--surface));
  }
  .ans.correct .tag {
    background: var(--verde);
    color: #fff;
  }
  .ans.wrong {
    border-color: var(--rosso);
    background: color-mix(in srgb, var(--rosso) 12%, var(--surface));
  }
  .ans.wrong .tag {
    background: var(--rosso);
    color: #fff;
  }
  .ans.dim {
    opacity: 0.5;
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
</style>
