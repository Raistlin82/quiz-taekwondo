import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { themeStore } from './lib/stores/theme.svelte';
import { authStore } from './lib/stores/auth.svelte';

// Expose base-aware URLs for the public background images used in CSS. CSS
// url() can't be made base-relative reliably under a GitHub Pages subpath, so
// we resolve them once here against Vite's BASE_URL and read them via var().
{
  // Resolve to ABSOLUTE URLs against the document — a relative url() inside a
  // CSS var() would otherwise resolve against the bundled stylesheet (/assets/),
  // not the page, and 404 under a subpath.
  const abs = (p: string) => new URL(import.meta.env.BASE_URL + p, document.baseURI).href;
  const s = document.documentElement.style;
  s.setProperty('--img-paper', `url("${abs('ui/hanji-paper.png')}")`);
  s.setProperty('--img-brush', `url("${abs('ui/red-brush-button.png')}")`);
  s.setProperty('--img-ink-mountains', `url("${abs('ui/ink-mountains.png')}")`);
}

// Apply the persisted/system theme before first paint.
themeStore.apply();

// Best-effort: load/create the auth session (guest-first). Never blocks render.
void authStore.init();

const app = mount(App, { target: document.getElementById('app')! });

export default app;
