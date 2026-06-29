/* ============================================================
   Sound effects (Web Audio) + haptic feedback (Vibration API).
   Tuned for the Hanji/dojo visual language: woodblock, low drum,
   breath/noise and small bronze-bell harmonics instead of arcade
   bleeps. Fully procedural: no audio files or licensing concerns.
   ============================================================ */

let actx: AudioContext | null = null;
let sfxBus: GainNode | null = null;
let sfxComp: DynamicsCompressorNode | null = null;

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

export type SoundType =
  | 'good'
  | 'bad'
  | 'tick'
  | 'win'
  | 'levelup'
  | 'badge'
  | 'start'
  | 'next'
  | 'timeout'
  | 'streak'
  | 'review';

function sfxOutput(ctx: AudioContext): AudioNode {
  if (!sfxBus || !sfxComp) {
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.82;
    sfxComp = ctx.createDynamicsCompressor();
    sfxComp.threshold.value = -18;
    sfxComp.knee.value = 18;
    sfxComp.ratio.value = 4;
    sfxComp.attack.value = 0.004;
    sfxComp.release.value = 0.16;
    sfxBus.connect(sfxComp);
    sfxComp.connect(ctx.destination);
  }
  return sfxBus;
}

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
  g.connect(sfxOutput(ctx));
  env(g, when, peak, 0.008, dur * 0.2, dur * 0.78);
  o.start(when);
  o.stop(when + dur + 0.04);
}

function sweep(
  ctx: AudioContext,
  from: number,
  to: number,
  when: number,
  dur: number,
  peak: number,
  type: OscillatorType = 'triangle',
  filterFreq = 900,
): void {
  const o = ctx.createOscillator();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(from, when);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, to), when + dur);
  f.type = 'lowpass';
  f.frequency.setValueAtTime(filterFreq, when);
  f.Q.setValueAtTime(0.7, when);
  o.connect(f);
  f.connect(g);
  g.connect(sfxOutput(ctx));
  env(g, when, peak, 0.004, dur * 0.12, dur * 0.8);
  o.start(when);
  o.stop(when + dur + 0.04);
}

function bell(ctx: AudioContext, freq: number, when: number, peak = 0.07, dur = 0.42): void {
  tone(ctx, freq, when, dur, peak, 'sine', 3600);
  tone(ctx, freq * 2.01, when + 0.006, dur * 0.62, peak * 0.2, 'sine', 4200);
  tone(ctx, freq * 2.98, when + 0.012, dur * 0.36, peak * 0.1, 'sine', 4600);
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
  g.connect(sfxOutput(ctx));
  env(g, when, peak, 0.003, dur * 0.08, dur * 0.86);
  src.start(when);
  src.stop(when + dur + 0.03);
}

function woodTap(ctx: AudioContext, when: number, peak = 0.09): void {
  noiseBurst(ctx, when, 0.055, peak, 'bandpass', 1150, 1.8);
  tone(ctx, 180, when, 0.075, peak * 0.22, 'triangle', 520);
}

function lowDrum(ctx: AudioContext, when: number, peak = 0.1): void {
  sweep(ctx, 142, 72, when, 0.22, peak, 'triangle', 430);
  noiseBurst(ctx, when + 0.006, 0.09, peak * 0.32, 'lowpass', 520, 0.7);
}

function breath(ctx: AudioContext, when: number, peak = 0.028): void {
  noiseBurst(ctx, when, 0.18, peak, 'highpass', 1550, 0.55);
}

export function playSound(type: SoundType, enabled: boolean): void {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime + 0.01;
    window.dispatchEvent(new CustomEvent<SoundType>('quiz-sfx', { detail: type }));

    switch (type) {
      case 'tick':
        woodTap(ctx, now, 0.045);
        break;
      case 'next':
        woodTap(ctx, now, 0.038);
        breath(ctx, now + 0.015, 0.014);
        break;
      case 'start':
        lowDrum(ctx, now, 0.06);
        woodTap(ctx, now + 0.08, 0.052);
        bell(ctx, 392.0, now + 0.13, 0.035, 0.36);
        break;
      case 'good':
        woodTap(ctx, now, 0.055);
        bell(ctx, 587.33, now + 0.026, 0.048, 0.3);
        bell(ctx, 880.0, now + 0.09, 0.018, 0.24);
        break;
      case 'bad':
        lowDrum(ctx, now, 0.075);
        sweep(ctx, 196.0, 116.54, now + 0.03, 0.26, 0.042, 'triangle', 360);
        break;
      case 'timeout':
        woodTap(ctx, now, 0.04);
        woodTap(ctx, now + 0.09, 0.038);
        lowDrum(ctx, now + 0.16, 0.07);
        break;
      case 'streak':
        lowDrum(ctx, now, 0.06);
        woodTap(ctx, now + 0.06, 0.05);
        bell(ctx, 659.25, now + 0.1, 0.038, 0.34);
        bell(ctx, 987.77, now + 0.2, 0.032, 0.32);
        break;
      case 'win':
        lowDrum(ctx, now, 0.06);
        lowDrum(ctx, now + 0.23, 0.045);
        bell(ctx, 392.0, now + 0.08, 0.044, 0.5);
        bell(ctx, 587.33, now + 0.22, 0.048, 0.5);
        bell(ctx, 783.99, now + 0.38, 0.044, 0.58);
        break;
      case 'levelup':
        woodTap(ctx, now, 0.065);
        woodTap(ctx, now + 0.09, 0.052);
        bell(ctx, 659.25, now + 0.12, 0.045, 0.48);
        bell(ctx, 987.77, now + 0.26, 0.035, 0.42);
        break;
      case 'badge':
        bell(ctx, 880, now, 0.038, 0.34);
        bell(ctx, 1174.66, now + 0.075, 0.03, 0.28);
        break;
      case 'review':
        breath(ctx, now, 0.03);
        woodTap(ctx, now + 0.045, 0.042);
        bell(ctx, 523.25, now + 0.08, 0.025, 0.28);
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
