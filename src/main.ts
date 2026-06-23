import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { themeStore } from './lib/stores/theme.svelte';
import { authStore } from './lib/stores/auth.svelte';

// Apply the persisted/system theme before first paint.
themeStore.apply();

// Best-effort: load/create the auth session (guest-first). Never blocks render.
void authStore.init();

const app = mount(App, { target: document.getElementById('app')! });

export default app;
