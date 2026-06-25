/* ============================================================
   Background music — warm ambient dojo loop, fully procedural
   (Web Audio, no files). Kept deliberately low in the mix so it
   feels like room tone, not game music. Shares the SFX AudioContext.
   Guarded; loops until stopped.
   ============================================================ */

import { getAudioContext } from './audio';

// i – bVI – bIII – bVII in A minor: emotive yet fully consonant.
// Each chord = a low bass note + four arpeggio tones (chord tones only).
const CHORDS: { bass: number; arp: number[] }[] = [
  { bass: 110.0, arp: [220.0, 261.63, 329.63, 440.0] }, // Am  (A C E)
  { bass: 87.31, arp: [174.61, 220.0, 261.63, 349.23] }, // F   (F A C)
  { bass: 130.81, arp: [261.63, 329.63, 392.0, 523.25] }, // C   (C E G)
  { bass: 98.0, arp: [196.0, 246.94, 293.66, 392.0] }, // G   (G B D)
];

const STEP = 0.62; // seconds per arpeggio step (calm tempo)
const STEPS_PER_CHORD = 4;
const LOOKAHEAD = 0.4;
const TICK_MS = 30;

let timer: ReturnType<typeof setInterval> | null = null;
let nextTime = 0;
let step = 0;

let master: GainNode | null = null;
let lp: BiquadFilterNode | null = null;
let delay: DelayNode | null = null;
let feedback: GainNode | null = null;

/** One warm voice: two slightly-detuned sines through a soft AD envelope,
 *  routed dry to the master bus and as a send into the echo delay. */
function voice(ctx: AudioContext, freq: number, when: number, dur: number, peak: number): void {
  if (!master || !delay) return;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(peak, when + 0.09);
  g.gain.setValueAtTime(peak, when + dur * 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  for (const detune of [-5, 5]) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    o.detune.value = detune;
    o.connect(g);
    o.start(when);
    o.stop(when + dur + 0.05);
  }
  g.connect(master);
  g.connect(delay);
}

function scheduleStep(ctx: AudioContext, when: number): void {
  const chord = CHORDS[Math.floor(step / STEPS_PER_CHORD) % CHORDS.length];
  const beat = step % STEPS_PER_CHORD;

  // Sustained bass once per chord (one "bar").
  if (beat === 0) voice(ctx, chord.bass, when, STEP * STEPS_PER_CHORD * 0.95, 0.06);

  // Gentle arpeggio; rest on the last beat of every other bar so it breathes.
  const rest = beat === STEPS_PER_CHORD - 1 && Math.floor(step / STEPS_PER_CHORD) % 2 === 1;
  if (!rest) voice(ctx, chord.arp[beat], when, STEP * 1.7, 0.085);

  step++;
}

function tick(ctx: AudioContext): void {
  while (nextTime < ctx.currentTime + LOOKAHEAD) {
    scheduleStep(ctx, nextTime);
    nextTime += STEP;
  }
}

export function isMusicPlaying(): boolean {
  return timer !== null;
}

export function startMusic(): void {
  const ctx = getAudioContext();
  if (!ctx || timer) return;
  if (ctx.state === 'suspended') void ctx.resume();

  const now = ctx.currentTime;

  // Master bus → low-pass (warmth) → destination.
  master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.18, now + 3); // slow, quiet fade-in
  lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1350;
  lp.Q.value = 0.18;
  master.connect(lp);
  lp.connect(ctx.destination);

  // Echo/space: feedback delay whose wet return folds back into the master,
  // so fading the master on stop silences the tails too.
  delay = ctx.createDelay(1.0);
  delay.delayTime.value = 0.34;
  feedback = ctx.createGain();
  feedback.gain.value = 0.18;
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(master);

  step = 0;
  nextTime = now + 0.15;
  timer = setInterval(() => tick(ctx), TICK_MS);
}

export function stopMusic(): void {
  // Idle and never started → don't lazily spin up an AudioContext.
  if (!timer && !master) return;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  const ctx = getAudioContext();
  const now = ctx?.currentTime ?? 0;
  if (master && ctx) {
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.8); // fade-out
  }
  const dead = [master, lp, delay, feedback];
  master = null;
  lp = null;
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
  }, 1000);
}
