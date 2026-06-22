/* ============================================================
   Sound effects (Web Audio) + haptic feedback (Vibration API).
   All guarded — silently no-op when unsupported or disabled.
   ============================================================ */

let actx: AudioContext | null = null;

type Tone = [freq: number, delay: number];

function tones(type: 'good' | 'bad' | 'tick' | 'win'): Tone[] {
  switch (type) {
    case 'good':
      return [
        [660, 0],
        [990, 0.1],
      ];
    case 'bad':
      return [
        [300, 0],
        [160, 0.13],
      ];
    case 'tick':
      return [[880, 0]];
    case 'win':
      return [
        [523, 0],
        [659, 0.12],
        [784, 0.24],
        [1047, 0.36],
      ];
  }
}

export function playSound(type: 'good' | 'bad' | 'tick' | 'win', enabled: boolean): void {
  if (!enabled) return;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    actx = actx || new AC();
    if (actx.state === 'suspended') void actx.resume();
    const ctx = actx;
    const dur = type === 'tick' ? 0.08 : 0.18;
    tones(type).forEach(([f, t]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      o.connect(g);
      g.connect(ctx.destination);
      const s = ctx.currentTime + t;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(type === 'tick' ? 0.12 : 0.22, s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
      o.start(s);
      o.stop(s + dur + 0.02);
    });
  } catch {
    /* AudioContext unavailable — ignore */
  }
}

export function vibrate(pattern: number | number[], enabled: boolean): void {
  if (!enabled) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* Vibration API unavailable — ignore */
  }
}
