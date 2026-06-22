<script lang="ts">
  import { fade } from 'svelte/transition';
  import { gameStore } from './lib/stores/game.svelte';
  import { themeStore } from './lib/stores/theme.svelte';
  import StartScreen from './lib/components/screens/StartScreen.svelte';
  import QuizScreen from './lib/components/screens/QuizScreen.svelte';
  import EndScreen from './lib/components/screens/EndScreen.svelte';
  import StudyScreen from './lib/components/screens/StudyScreen.svelte';
</script>

<div class="bg"></div>
<div class="blob b1"></div>
<div class="blob b2"></div>
<div class="blob b3"></div>
<canvas id="confetti"></canvas>

<div class="app">
  <div class="controls">
    <button class="icon-btn" title="Tema chiaro/scuro" aria-label="Cambia tema" onclick={() => themeStore.toggleTheme()}>
      {themeStore.theme === 'dark' ? '🌙' : '☀️'}
    </button>
    <button class="icon-btn" title="Suono on/off" aria-label="Suono" onclick={() => themeStore.toggleSound()}>
      {themeStore.sound ? '🔊' : '🔇'}
    </button>
  </div>

  {#key gameStore.screen}
    <div in:fade={{ duration: 250 }}>
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
</div>
