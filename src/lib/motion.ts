/* ============================================================
   Reduced-motion helpers. The CSS @media (prefers-reduced-motion)
   block in app.css cannot reach JS/canvas animations (confetti,
   count-ups) or Svelte transition durations — these gate those.
   ============================================================ */

export function prefersReducedMotion(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
    );
  } catch {
    return false;
  }
}

/** Returns `ms`, or 0 when the user prefers reduced motion. */
export function motionMs(ms: number): number {
  return prefersReducedMotion() ? 0 : ms;
}
