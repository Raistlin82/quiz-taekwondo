/* ============================================================
   Background music engine. Fully procedural Web Audio: no files,
   no network, no licensing. The music changes with the app screen:
   calm home, focused quiz pulse, quiet study, result cadence.
   ============================================================ */

import { getAudioContext } from './audio';

export type MusicScene = 'home' | 'quiz' | 'review' | 'study' | 'result' | 'victory' | 'ranking';

interface Chord {
  bass: number;
  tones: number[];
}

interface SceneConfig {
  step: number;
  stepsPerBar: number;
  volume: number;
  filterHz: number;
  delay: number;
  feedback: number;
  chords: Chord[];
  pattern: 'ambient' | 'focus' | 'study' | 'result' | 'victory';
}

const AMBIENT_CHORDS: Chord[] = [
  { bass: 110.0, tones: [220.0, 261.63, 329.63, 440.0] }, // Am
  { bass: 87.31, tones: [174.61, 220.0, 261.63, 349.23] }, // F
  { bass: 130.81, tones: [261.63, 329.63, 392.0, 523.25] }, // C
  { bass: 98.0, tones: [196.0, 246.94, 293.66, 392.0] }, // G
];

const STUDY_CHORDS: Chord[] = [
  { bass: 98.0, tones: [196.0, 220.0, 293.66, 392.0] }, // G pentatonic colour
  { bass: 82.41, tones: [164.81, 196.0, 246.94, 329.63] }, // E minor
  { bass: 73.42, tones: [146.83, 196.0, 220.0, 293.66] }, // D sus
  { bass: 110.0, tones: [220.0, 261.63, 329.63, 392.0] }, // Am7
];

const RESULT_CHORDS: Chord[] = [
  { bass: 130.81, tones: [261.63, 329.63, 392.0, 523.25] }, // C
  { bass: 98.0, tones: [196.0, 246.94, 293.66, 392.0] }, // G
  { bass: 110.0, tones: [220.0, 261.63, 329.63, 440.0] }, // Am
  { bass: 87.31, tones: [174.61, 220.0, 261.63, 349.23] }, // F
];

const SCENES: Record<MusicScene, SceneConfig> = {
  home: {
    step: 0.7,
    stepsPerBar: 4,
    volume: 0.17,
    filterHz: 1280,
    delay: 0.34,
    feedback: 0.17,
    chords: AMBIENT_CHORDS,
    pattern: 'ambient',
  },
  quiz: {
    step: 0.46,
    stepsPerBar: 4,
    volume: 0.14,
    filterHz: 980,
    delay: 0.24,
    feedback: 0.11,
    chords: AMBIENT_CHORDS,
    pattern: 'focus',
  },
  review: {
    step: 0.54,
    stepsPerBar: 4,
    volume: 0.13,
    filterHz: 1120,
    delay: 0.3,
    feedback: 0.13,
    chords: STUDY_CHORDS,
    pattern: 'study',
  },
  study: {
    step: 0.86,
    stepsPerBar: 4,
    volume: 0.15,
    filterHz: 1420,
    delay: 0.42,
    feedback: 0.2,
    chords: STUDY_CHORDS,
    pattern: 'study',
  },
  ranking: {
    step: 0.72,
    stepsPerBar: 4,
    volume: 0.13,
    filterHz: 1220,
    delay: 0.34,
    feedback: 0.14,
    chords: RESULT_CHORDS,
    pattern: 'result',
  },
  result: {
    step: 0.68,
    stepsPerBar: 4,
    volume: 0.14,
    filterHz: 1180,
    delay: 0.38,
    feedback: 0.18,
    chords: RESULT_CHORDS,
    pattern: 'result',
  },
  victory: {
    step: 0.58,
    stepsPerBar: 4,
    volume: 0.16,
    filterHz: 1520,
    delay: 0.36,
    feedback: 0.17,
    chords: RESULT_CHORDS,
    pattern: 'victory',
  },
};

const LOOKAHEAD = 0.45;
const TICK_MS = 30;

let timer: ReturnType<typeof setInterval> | null = null;
let nextTime = 0;
let step = 0;
let currentScene: MusicScene = 'home';

let master: GainNode | null = null;
let lp: BiquadFilterNode | null = null;
let comp: DynamicsCompressorNode | null = null;
let delay: DelayNode | null = null;
let feedback: GainNode | null = null;
let duckTimer: ReturnType<typeof setTimeout> | null = null;

function env(g: GainNode, when: number, peak: number, attack: number, hold: number, release: number): void {
  g.gain.cancelScheduledValues(when);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(peak, when + attack);
  g.gain.setValueAtTime(peak, when + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, when + attack + hold + release);
}

function connectMusic(g: GainNode): void {
  if (!master || !delay) return;
  g.connect(master);
  g.connect(delay);
}

function softVoice(
  ctx: AudioContext,
  freq: number,
  when: number,
  dur: number,
  peak: number,
  type: OscillatorType = 'sine',
): void {
  const g = ctx.createGain();
  env(g, when, peak, 0.08, dur * 0.46, dur * 0.46);
  for (const detune of [-4, 4]) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    o.detune.setValueAtTime(detune, when);
    o.connect(g);
    o.start(when);
    o.stop(when + dur + 0.08);
  }
  connectMusic(g);
}

function pluck(ctx: AudioContext, freq: number, when: number, dur: number, peak: number): void {
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(freq, when);
  f.type = 'lowpass';
  f.frequency.setValueAtTime(1700, when);
  f.frequency.exponentialRampToValueAtTime(720, when + dur);
  f.Q.setValueAtTime(0.6, when);
  o.connect(f);
  f.connect(g);
  env(g, when, peak, 0.01, dur * 0.18, dur * 0.72);
  o.start(when);
  o.stop(when + dur + 0.06);
  connectMusic(g);
}

function bell(ctx: AudioContext, freq: number, when: number, peak: number): void {
  softVoice(ctx, freq, when, 0.62, peak, 'sine');
  softVoice(ctx, freq * 2.01, when + 0.008, 0.36, peak * 0.18, 'sine');
}

function noise(ctx: AudioContext, when: number, dur: number, peak: number, freq: number): void {
  const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    const t = i / frames;
    data[i] = (Math.random() * 2 - 1) * (1 - t) * (1 - t);
  }
  const src = ctx.createBufferSource();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  src.buffer = buffer;
  f.type = 'bandpass';
  f.frequency.setValueAtTime(freq, when);
  f.Q.setValueAtTime(1.2, when);
  src.connect(f);
  f.connect(g);
  env(g, when, peak, 0.003, dur * 0.1, dur * 0.82);
  src.start(when);
  src.stop(when + dur + 0.04);
  connectMusic(g);
}

function drum(ctx: AudioContext, when: number, peak: number): void {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(128, when);
  o.frequency.exponentialRampToValueAtTime(72, when + 0.18);
  o.connect(g);
  env(g, when, peak, 0.004, 0.025, 0.16);
  o.start(when);
  o.stop(when + 0.23);
  connectMusic(g);
  noise(ctx, when + 0.004, 0.06, peak * 0.22, 360);
}

function applyScene(ctx: AudioContext, immediate = false): void {
  const cfg = SCENES[currentScene];
  const now = ctx.currentTime;
  const t = immediate ? 0.02 : 0.75;
  master?.gain.setTargetAtTime(cfg.volume, now, t);
  lp?.frequency.setTargetAtTime(cfg.filterHz, now, t);
  if (delay) delay.delayTime.setTargetAtTime(cfg.delay, now, t);
  feedback?.gain.setTargetAtTime(cfg.feedback, now, t);
}

function onSfx(e: Event): void {
  const type = (e as CustomEvent<string>).detail;
  if (type === 'tick' || type === 'next') return;
  const ctx = getAudioContext();
  if (!ctx || !timer || !master) return;
  const now = ctx.currentTime;
  const cfg = SCENES[currentScene];
  master.gain.cancelScheduledValues(now);
  master.gain.setTargetAtTime(Math.max(0.04, cfg.volume * 0.45), now, 0.025);
  if (duckTimer) clearTimeout(duckTimer);
  duckTimer = setTimeout(() => {
    const live = getAudioContext();
    if (live && timer) applyScene(live);
  }, 180);
}

function scheduleAmbient(ctx: AudioContext, cfg: SceneConfig, chord: Chord, beat: number, bar: number, when: number): void {
  if (beat === 0) softVoice(ctx, chord.bass, when, cfg.step * cfg.stepsPerBar * 0.95, 0.045, 'sine');
  const rest = beat === cfg.stepsPerBar - 1 && bar % 2 === 1;
  if (!rest) pluck(ctx, chord.tones[beat % chord.tones.length], when, cfg.step * 1.55, 0.05);
  if (beat === 2 && bar % 4 === 3) bell(ctx, chord.tones[1], when + 0.04, 0.018);
}

function scheduleFocus(ctx: AudioContext, cfg: SceneConfig, chord: Chord, beat: number, bar: number, when: number): void {
  if (beat === 0) drum(ctx, when, 0.042);
  if (beat === 2 && bar % 2 === 0) drum(ctx, when, 0.026);
  if (beat === 0) softVoice(ctx, chord.bass, when, cfg.step * 2.2, 0.032, 'sine');
  if (beat === 1 || beat === 3) pluck(ctx, chord.tones[(bar + beat) % chord.tones.length], when, cfg.step * 0.9, 0.034);
}

function scheduleStudy(ctx: AudioContext, cfg: SceneConfig, chord: Chord, beat: number, bar: number, when: number): void {
  if (beat === 0) softVoice(ctx, chord.bass, when, cfg.step * cfg.stepsPerBar * 1.05, 0.034, 'sine');
  if ((beat === 0 && bar % 2 === 0) || beat === 2) {
    const tone = chord.tones[(beat + bar) % chord.tones.length];
    bell(ctx, tone, when + 0.03, 0.022);
  }
  if (beat === 3 && bar % 3 === 0) noise(ctx, when, 0.18, 0.012, 2100);
}

function scheduleResult(ctx: AudioContext, cfg: SceneConfig, chord: Chord, beat: number, bar: number, when: number): void {
  if (beat === 0) softVoice(ctx, chord.bass, when, cfg.step * cfg.stepsPerBar, 0.038, 'sine');
  if (beat === 1 || beat === 3) pluck(ctx, chord.tones[beat % chord.tones.length], when, cfg.step * 1.2, 0.035);
  if (beat === 2 && bar % 2 === 0) bell(ctx, chord.tones[2], when, 0.022);
}

function scheduleVictory(ctx: AudioContext, cfg: SceneConfig, chord: Chord, beat: number, bar: number, when: number): void {
  if (beat === 0) drum(ctx, when, 0.034);
  if (beat === 0) softVoice(ctx, chord.bass, when, cfg.step * cfg.stepsPerBar * 0.9, 0.038, 'sine');
  const tone = chord.tones[(beat + 1) % chord.tones.length];
  if (beat !== 3 || bar % 2 === 0) bell(ctx, tone, when, 0.026);
}

function scheduleStep(ctx: AudioContext, when: number): void {
  const cfg = SCENES[currentScene];
  const bar = Math.floor(step / cfg.stepsPerBar);
  const beat = step % cfg.stepsPerBar;
  const chord = cfg.chords[bar % cfg.chords.length];

  switch (cfg.pattern) {
    case 'focus':
      scheduleFocus(ctx, cfg, chord, beat, bar, when);
      break;
    case 'study':
      scheduleStudy(ctx, cfg, chord, beat, bar, when);
      break;
    case 'result':
      scheduleResult(ctx, cfg, chord, beat, bar, when);
      break;
    case 'victory':
      scheduleVictory(ctx, cfg, chord, beat, bar, when);
      break;
    case 'ambient':
      scheduleAmbient(ctx, cfg, chord, beat, bar, when);
      break;
  }

  step++;
}

function tick(ctx: AudioContext): void {
  while (nextTime < ctx.currentTime + LOOKAHEAD) {
    const cfg = SCENES[currentScene];
    scheduleStep(ctx, nextTime);
    nextTime += cfg.step;
  }
}

export function isMusicPlaying(): boolean {
  return timer !== null;
}

export function setMusicScene(scene: MusicScene): void {
  currentScene = scene;
  const ctx = getAudioContext();
  if (ctx && timer) applyScene(ctx);
}

export function startMusic(scene: MusicScene = currentScene): void {
  currentScene = scene;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  if (timer) {
    applyScene(ctx);
    return;
  }

  const now = ctx.currentTime;

  master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);

  lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = SCENES[currentScene].filterHz;
  lp.Q.value = 0.22;

  comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.knee.value = 18;
  comp.ratio.value = 2.5;
  comp.attack.value = 0.018;
  comp.release.value = 0.28;

  master.connect(lp);
  lp.connect(comp);
  comp.connect(ctx.destination);

  delay = ctx.createDelay(1.2);
  delay.delayTime.value = SCENES[currentScene].delay;
  feedback = ctx.createGain();
  feedback.gain.value = SCENES[currentScene].feedback;
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(master);

  step = 0;
  nextTime = now + 0.12;
  timer = setInterval(() => tick(ctx), TICK_MS);
  if (typeof window !== 'undefined') window.addEventListener('quiz-sfx', onSfx);
  applyScene(ctx);
}

export function stopMusic(): void {
  if (!timer && !master) return;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (typeof window !== 'undefined') window.removeEventListener('quiz-sfx', onSfx);
  if (duckTimer) {
    clearTimeout(duckTimer);
    duckTimer = null;
  }
  const ctx = getAudioContext();
  const now = ctx?.currentTime ?? 0;
  if (master && ctx) {
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
  }
  const dead = [master, lp, comp, delay, feedback];
  master = null;
  lp = null;
  comp = null;
  delay = null;
  feedback = null;
  setTimeout(() => {
    for (const n of dead) {
      try {
        n?.disconnect();
      } catch {
        /* ignore */
      }
    }
  }, 900);
}
