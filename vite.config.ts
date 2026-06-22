import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// Relative base so the build works under any GitHub Pages subpath
// (e.g. username.github.io/quiz-taekwondo/) as well as locally.
// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [svelte()],
})
