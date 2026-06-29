<script lang="ts">
  import { fade } from 'svelte/transition';
  import { gameStore } from './lib/stores/game.svelte';
  import { themeStore } from './lib/stores/theme.svelte';
  import { startMusic, stopMusic, type MusicScene } from './lib/music';
  import { motionMs } from './lib/motion';

  function musicScene(): MusicScene {
    if (gameStore.screen === 'quiz') return gameStore.isReview ? 'review' : 'quiz';
    if (gameStore.screen === 'study') return 'study';
    if (gameStore.screen === 'ranking') return 'ranking';
    if (gameStore.screen === 'end') return !gameStore.isReview && gameStore.pct >= 0.87 ? 'victory' : 'result';
    return 'home';
  }

  // Drive the background-music engine off the persisted setting. The toggle is
  // a user gesture, so the AudioContext can resume and play.
  $effect(() => {
    const scene = musicScene();
    if (themeStore.music) startMusic(scene);
    else stopMusic();
  });
  import StartScreen from './lib/components/screens/StartScreen.svelte';
  import QuizScreen from './lib/components/screens/QuizScreen.svelte';
  import EndScreen from './lib/components/screens/EndScreen.svelte';
  import StudyScreen from './lib/components/screens/StudyScreen.svelte';
  import RankingScreen from './lib/components/screens/RankingScreen.svelte';
</script>

<div class="bg"></div>
<canvas id="confetti"></canvas>

<div class="app">
  <div class="controls">
    <button class="icon-btn" title="Tema chiaro/scuro" aria-label="Cambia tema" onclick={() => themeStore.toggleTheme()}>
      <img src={themeStore.theme === 'dark' ? 'ui/icons/theme-dark.png' : 'ui/icons/theme-light.png'} alt="" aria-hidden="true" />
    </button>
    <button class="icon-btn" title="Suono on/off" aria-label="Suono" onclick={() => themeStore.toggleSound()}>
      <img src={themeStore.sound ? 'ui/icons/sound-on.png' : 'ui/icons/sound-off.png'} alt="" aria-hidden="true" />
    </button>
    <button
      class="icon-btn"
      class:off={!themeStore.music}
      title="Musica di sottofondo on/off"
      aria-label="Musica di sottofondo"
      aria-pressed={themeStore.music}
      onclick={() => themeStore.toggleMusic()}
    >
      <img src={themeStore.music ? 'ui/icons/music-on.png' : 'ui/icons/music-off.png'} alt="" aria-hidden="true" />
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
      {:else if gameStore.screen === 'ranking'}
        <RankingScreen />
      {/if}
    </div>
  {/key}

  <footer class="app-footer">© 2026 Daniel Rendina</footer>
</div>
