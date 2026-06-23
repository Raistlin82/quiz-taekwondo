import { defineConfig, type Plugin } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { POOL } from './src/lib/data/questions'
import { BELTS, DIFFICULTIES } from './src/lib/data/belts'
import { validateQuestions } from './src/lib/data/validate'

// Validate the question bank at build time and on dev-server start.
// Warnings are printed; any error fails the build.
function validateQuestionBank(): Plugin {
  return {
    name: 'validate-question-bank',
    buildStart() {
      const { errors, warnings } = validateQuestions(POOL, BELTS, DIFFICULTIES)
      for (const w of warnings) this.warn(w)
      if (errors.length) {
        this.error(
          `Banco domande non valido — ${errors.length} error${errors.length === 1 ? 'e' : 'i'}:\n- ` +
            errors.join('\n- '),
        )
      }
    },
  }
}

// Relative base so the build works under any GitHub Pages subpath
// (e.g. username.github.io/quiz-taekwondo/) as well as locally.
// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [svelte(), validateQuestionBank()],
})
