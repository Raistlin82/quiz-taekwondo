/* ============================================================
   Sound effects (Web Audio) + haptic feedback (Vibration API).
   All guarded — silently no-op when unsupported or disabled.
   Procedural synthesis (no audio files), so the app stays tiny
   and offline-friendly.
   ============================================================ */

let actx: AudioContext | null = null;

/** Shared AudioContext (lazily created). Returns null when Web Audio is
 *  unavailable. Reused by both the SFX here and the background music engine. */
export function getAudioContext(): AudioContext | null {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    actx = actx || new AC();
    return actx;
  } catch {
    return null;
  }
}

export type SoundType = 'good' | 'bad' | 'tick' | 'win' | 'levelup' | 'badge';

interface Note {
  f: number; // frequency (Hz)
  t: number; // start offset (s)
  d?: number; // duration (s)
  type?: OscillatorType;
  gain?: number; // peak gain
}

/** Note sequences per sound. Pleasant major intervals for positive cues. */
function notes(type: SoundType): Note[] {
  switch (type) {
    case 'good': // bright two-note lift (E5 → B5)
      return [
        { f: 659, t: 0 },
        { f: 988, t: 0.09 },
      ];
    case 'bad': // soft descending buzz
      return [
        { f: 320, t: 0, type: 'triangle' },
        { f: 196, t: 0.12, type: 'triangle' },
      ];
    case 'tick': // short, soft wood-block-ish blip
      return [{ f: 1100, t: 0, d: 0.05, gain: 0.1 }];
    case 'win': // C-major arpeggio fanfare, warm triangle, ends high
      return [
        { f: 523, t: 0, type: 'triangle' },
        { f: 659, t: 0.1, type: 'triangle' },
        { f: 784, t: 0.2, type: 'triangle' },
        { f: 1047, t: 0.32, type: 'triangle' },
        { f: 1319, t: 0.46, d: 0.4, type: 'triangle' },
      ];
    case 'levelup': // rising triumphant sweep (E-G-B-E)
      return [
        { f: 659, t: 0, type: 'triangle' },
        { f: 784, t: 0.08, type: 'triangle' },
        { f: 988, t: 0.16, type: 'triangle' },
        { f: 1319, t: 0.26, d: 0.35, type: 'triangle' },
      ];
    case 'badge': // quick high sparkle (C6-E6-G6)
      return [
        { f: 1047, t: 0 },
        { f: 1319, t: 0.06 },
        { f: 1568, t: 0.12, d: 0.22 },
      ];
  }
}

export function playSound(type: SoundType, enabled: boolean): void {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    for (const n of notes(type)) {
      const dur = n.d ?? 0.18;
      const peak = n.gain ?? 0.2;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = n.type ?? 'sine';
      o.frequency.value = n.f;
      o.connect(g);
      g.connect(ctx.destination);
      const s = ctx.currentTime + n.t;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(peak, s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
      o.start(s);
      o.stop(s + dur + 0.03);
    }
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
