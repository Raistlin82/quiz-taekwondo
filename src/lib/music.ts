/* ============================================================
   Background music — procedural "Dojang" pentatonic ambient loop.
   Web Audio only (no files): a slow, hypnotic pentatonic melody
   over a low root drone, gentle and low-volume. Loops until
   stopped. Shares the SFX AudioContext. Guarded — no-ops when
   Web Audio is unavailable.
   ============================================================ */

import { getAudioContext } from './audio';

// A-minor pentatonic (A C D E G) across a warm mid range, in Hz.
const SCALE = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
const ROOT = 110.0; // A2 drone

const STEP_DUR = 0.55; // seconds between melodic steps (meditative tempo)
const LOOKAHEAD = 0.3; // schedule notes this far ahead (s)
const TICK_MS = 25; // scheduler resolution

let master: GainNode | null = null;
let drone: { osc: OscillatorNode; gain: GainNode } | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let nextTime = 0;
let step = 0;

function scheduleStep(ctx: AudioContext, when: number): void {
  // Breathe: rest on every 8th step so the loop never feels mechanical.
  if (step % 8 === 7) {
    step++;
    return;
  }
  const f = SCALE[Math.floor(Math.random() * SCALE.length)];

  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.value = f;
  o.connect(g);
  g.connect(master!);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(0.12, when + 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 1.6);
  o.start(when);
  o.stop(when + 1.7);

  // Soft harmonic fifth on the downbeats for a fuller, calmer texture.
  if (step % 4 === 0) {
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = 'sine';
    o2.frequency.value = f * 1.5;
    o2.connect(g2);
    g2.connect(master!);
    g2.gain.setValueAtTime(0.0001, when);
    g2.gain.exponentialRampToValueAtTime(0.05, when + 0.3);
    g2.gain.exponentialRampToValueAtTime(0.0001, when + 1.4);
    o2.start(when);
    o2.stop(when + 1.5);
  }
  step++;
}

function tick(ctx: AudioContext): void {
  while (nextTime < ctx.currentTime + LOOKAHEAD) {
    scheduleStep(ctx, nextTime);
    nextTime += STEP_DUR;
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
  master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.6, now + 2.5); // gentle fade-in
  master.connect(ctx.destination);

  // Low root drone for grounding.
  const osc = ctx.createOscillator();
  const dg = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = ROOT;
  dg.gain.value = 0.06;
  osc.connect(dg);
  dg.connect(master);
  osc.start(now);
  drone = { osc, gain: dg };

  step = 0;
  nextTime = now + 0.1;
  timer = setInterval(() => tick(ctx), TICK_MS);
}

export function stopMusic(): void {
  // Nothing playing and never started → don't lazily spin up an AudioContext
  // (the start/stop effect calls this on mount when music is off).
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
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.6); // fade-out
  }
  if (drone) {
    try {
      drone.osc.stop(now + 0.7);
    } catch {
      /* already stopped */
    }
    drone = null;
  }
  const m = master;
  master = null;
  if (m) {
    setTimeout(() => {
      try {
        m.disconnect();
      } catch {
        /* ignore */
      }
    }, 800);
  }
}
