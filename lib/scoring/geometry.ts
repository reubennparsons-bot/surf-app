/**
 * Compass-bearing geometry helpers used by gates and the wind/swell-quality
 * layers. All angles are in degrees [0, 360); functions normalise inputs
 * defensively so callers don't have to.
 */

import type { DirectionWindow } from '@/lib/types';

function normalise(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Smallest angular distance between two compass bearings, in [0, 180]. */
export function angularDistance(a: number, b: number): number {
  const diff = Math.abs(normalise(a) - normalise(b));
  return diff > 180 ? 360 - diff : diff;
}

/** True when `direction` lies inside `[window.min, window.max]`, with wraparound through 0°. */
export function isInWindow(direction: number, window: DirectionWindow): boolean {
  const d = normalise(direction);
  const lo = normalise(window.min);
  const hi = normalise(window.max);
  if (lo <= hi) return d >= lo && d <= hi;
  // Wraparound case (e.g. min=350, max=10): inside if either side of 0° matches.
  return d >= lo || d <= hi;
}

/**
 * 0 if `direction` is inside the window; otherwise the smaller angular
 * distance to either edge. Wraparound-safe.
 */
export function distanceFromWindow(direction: number, window: DirectionWindow): number {
  if (isInWindow(direction, window)) return 0;
  const dToMin = angularDistance(direction, window.min);
  const dToMax = angularDistance(direction, window.max);
  return Math.min(dToMin, dToMax);
}

/** Compass bearing of the window's centre, wraparound-safe. */
export function windowCenter(window: DirectionWindow): number {
  const lo = normalise(window.min);
  const hi = normalise(window.max);
  if (lo <= hi) return (lo + hi) / 2;
  // Wraparound: the geometric centre is across 0°.
  return ((lo + hi + 360) / 2) % 360;
}

/** Half-width of the window in degrees, wraparound-safe. */
export function windowHalfWidth(window: DirectionWindow): number {
  const lo = normalise(window.min);
  const hi = normalise(window.max);
  if (lo <= hi) return (hi - lo) / 2;
  return (hi + 360 - lo) / 2;
}
