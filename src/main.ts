import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { themeStore } from './lib/stores/theme.svelte';

// Apply the persisted/system theme before first paint.
themeStore.apply();

const app = mount(App, { target: document.getElementById('app')! });

export default app;
