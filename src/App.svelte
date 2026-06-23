<script lang="ts">
  import { fade } from 'svelte/transition';
  import { gameStore } from './lib/stores/game.svelte';
  import { themeStore } from './lib/stores/theme.svelte';
  import { startMusic, stopMusic } from './lib/music';
  import { motionMs } from './lib/motion';

  // Drive the background-music engine off the persisted setting. Toggling the
  // 🎵 button is a user gesture, so the AudioContext can resume and play.
  $effect(() => {
    if (themeStore.music) startMusic();
    else stopMusic();
  });
  import StartScreen from './lib/components/screens/StartScreen.svelte';
  import QuizScreen from './lib/components/screens/QuizScreen.svelte';
  import EndScreen from './lib/components/screens/EndScreen.svelte';
  import StudyScreen from './lib/components/screens/StudyScreen.svelte';
</script>

<div class="bg"></div>
<canvas id="confetti"></canvas>

<div class="app">
  <div class="controls">
    <button class="icon-btn" title="Tema chiaro/scuro" aria-label="Cambia tema" onclick={() => themeStore.toggleTheme()}>
      {themeStore.theme === 'dark' ? '🌙' : '☀️'}
    </button>
    <button class="icon-btn" title="Suono on/off" aria-label="Suono" onclick={() => themeStore.toggleSound()}>
      {themeStore.sound ? '🔊' : '🔇'}
    </button>
    <button
      class="icon-btn"
      class:off={!themeStore.music}
      title="Musica di sottofondo on/off"
      aria-label="Musica di sottofondo"
      aria-pressed={themeStore.music}
      onclick={() => themeStore.toggleMusic()}
    >
      🎵
    </button>
  </div>

  {#key gameStore.screen}
    <div in:fade={{ duration: motionMs(250) }}>
      {#if gameStore.screen === 'start'}
        <StartScreen />
      {:else if gameStore.screen === 'quiz'}
        <QuizScreen />
      {:else if gameStore.screen === 'end'}
        <EndScreen />
      {:else if gameStore.screen === 'study'}
        <StudyScreen />
      {/if}
    </div>
  {/key}

  <footer class="app-footer">© 2026 Daniel Rendina</footer>
</div>
