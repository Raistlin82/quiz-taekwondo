/* ============================================================
   Theme (light/dark) + sound/haptic settings, persisted.
   Uses Svelte 5 runes in a .svelte.ts module.
   ============================================================ */

import { THEME_KEY, SETTINGS_KEY } from '../config';

type ThemeName = 'light' | 'dark';

function initialTheme(): ThemeName {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* ignore */
  }
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

interface Settings {
  sound: boolean;
  haptics: boolean;
  music: boolean;
}
function initialSettings(): Settings {
  const defaults = { sound: true, haptics: true, music: false };
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '');
    if (!s || typeof s !== 'object' || Array.isArray(s)) return defaults;
    return {
      sound: typeof s.sound === 'boolean' ? s.sound : defaults.sound,
      haptics: typeof s.haptics === 'boolean' ? s.haptics : defaults.haptics,
      music: typeof s.music === 'boolean' ? s.music : defaults.music,
    };
  } catch {
    return defaults;
  }
}

class ThemeStore {
  theme = $state<ThemeName>(initialTheme());
  sound = $state(initialSettings().sound);
  haptics = $state(initialSettings().haptics);
  // Background music is opt-in (off by default; browsers block autoplay anyway).
  music = $state(initialSettings().music);

  apply(): void {
    document.documentElement.setAttribute('data-theme', this.theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', this.theme === 'dark' ? '#0b0f14' : '#f7f8fa');
  }

  toggleTheme(): void {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.apply();
    this.persist();
  }

  toggleSound(): void {
    this.sound = !this.sound;
    this.persistSettings();
  }

  toggleMusic(): void {
    this.music = !this.music;
    this.persistSettings();
  }

  private persist(): void {
    try {
      localStorage.setItem(THEME_KEY, this.theme);
    } catch {
      /* ignore */
    }
  }
  private persistSettings(): void {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ sound: this.sound, haptics: this.haptics, music: this.music }),
      );
    } catch {
      /* ignore */
    }
  }
}

export const themeStore = new ThemeStore();
