/* ============================================================
   Sound effects (Web Audio) + haptic feedback (Vibration API).
   Guarded and tiny, but tuned to the Hanji/dojo visual language:
   muted wood, soft bell, low drum. No arcade arpeggios.
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

function env(g: GainNode, when: number, peak: number, attack: number, hold: number, release: number): void {
  g.gain.cancelScheduledValues(when);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(peak, when + attack);
  g.gain.setValueAtTime(peak, when + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, when + attack + hold + release);
}

function tone(
  ctx: AudioContext,
  freq: number,
  when: number,
  dur: number,
  peak: number,
  type: OscillatorType = 'sine',
  filterFreq = 2400,
): void {
  const o = ctx.createOscillator();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, when);
  f.type = 'lowpass';
  f.frequency.setValueAtTime(filterFreq, when);
  f.Q.setValueAtTime(0.5, when);
  o.connect(f);
  f.connect(g);
  g.connect(ctx.destination);
  env(g, when, peak, 0.008, dur * 0.2, dur * 0.78);
  o.start(when);
  o.stop(when + dur + 0.04);
}

function bell(ctx: AudioContext, freq: number, when: number, peak = 0.07, dur = 0.42): void {
  tone(ctx, freq, when, dur, peak, 'sine', 3600);
  tone(ctx, freq * 2.01, when + 0.006, dur * 0.62, peak * 0.22, 'sine', 4200);
  tone(ctx, freq * 3.02, when + 0.01, dur * 0.4, peak * 0.12, 'sine', 4600);
}

function noiseBurst(
  ctx: AudioContext,
  when: number,
  dur: number,
  peak: number,
  filterType: BiquadFilterType,
  filterFreq: number,
  q = 0.8,
): void {
  const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    const decay = 1 - i / frames;
    data[i] = (Math.random() * 2 - 1) * decay * decay;
  }
  const src = ctx.createBufferSource();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  src.buffer = buffer;
  f.type = filterType;
  f.frequency.setValueAtTime(filterFreq, when);
  f.Q.setValueAtTime(q, when);
  src.connect(f);
  f.connect(g);
  g.connect(ctx.destination);
  env(g, when, peak, 0.003, dur * 0.08, dur * 0.86);
  src.start(when);
  src.stop(when + dur + 0.03);
}

function woodTap(ctx: AudioContext, when: number, peak = 0.09): void {
  noiseBurst(ctx, when, 0.055, peak, 'bandpass', 1150, 1.8);
  tone(ctx, 180, when, 0.075, peak * 0.22, 'triangle', 520);
}

function lowDrum(ctx: AudioContext, when: number, peak = 0.1): void {
  tone(ctx, 118, when, 0.2, peak, 'triangle', 420);
  noiseBurst(ctx, when + 0.006, 0.09, peak * 0.32, 'lowpass', 520, 0.7);
}

export function playSound(type: SoundType, enabled: boolean): void {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime + 0.01;

    switch (type) {
      case 'tick':
        woodTap(ctx, now, 0.045);
        break;
      case 'good':
        woodTap(ctx, now, 0.055);
        bell(ctx, 587.33, now + 0.025, 0.052, 0.28);
        break;
      case 'bad':
        lowDrum(ctx, now, 0.075);
        tone(ctx, 164.81, now + 0.035, 0.22, 0.04, 'triangle', 360);
        break;
      case 'win':
        lowDrum(ctx, now, 0.055);
        bell(ctx, 392.0, now + 0.08, 0.045, 0.48);
        bell(ctx, 587.33, now + 0.21, 0.05, 0.5);
        bell(ctx, 783.99, now + 0.36, 0.045, 0.55);
        break;
      case 'levelup':
        woodTap(ctx, now, 0.065);
        woodTap(ctx, now + 0.09, 0.052);
        bell(ctx, 659.25, now + 0.12, 0.045, 0.48);
        break;
      case 'badge':
        bell(ctx, 880, now, 0.038, 0.34);
        bell(ctx, 1174.66, now + 0.075, 0.03, 0.28);
        break;
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
