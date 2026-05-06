/**
 * Layer 4 — Tide factor.
 *
 * Implements spec §4 (`specs/scoring_algorithm_spec_v2.md`). Returns a
 * multiplier in [0.77, 1.08] plus an optional caveat for the UI.
 *
 *   low sensitivity  → 1.00 always
 *   medium           → 1.02 in window  / 0.95 adjacent / 0.85 far  ± 0.03 trajectory
 *   high             → 1.05 in window  / 0.88 adjacent / 0.80 far  ± 0.03 trajectory
 *
 * Tide data comes from Open-Meteo's `sea_level_height_msl` field (interpolated
 * from coarse global ocean models, not a harmonic station). Accuracy is good
 * enough for this 0.80–1.05 modifier; if a fetch fails or a spot lies outside
 * the model's coverage, `tideState.phase` is null and we fall back to factor
 * 1.0 with a caveat.
 */

import type { Spot, TideState, TidePhase } from '@/lib/types';
import { parseTidePreference } from './tidePreference';

export interface TideFactorResult {
  factor: number;
  caveat: string | null;
}

const PHASE_LADDER: readonly TidePhase[] = ['low', 'mid_low', 'mid', 'mid_high', 'high'];

function phaseIndex(p: TidePhase): number {
  return PHASE_LADDER.indexOf(p);
}

/** Minimum step distance from `current` to any phase in `preferred`. */
function distanceToPreferred(current: TidePhase, preferred: ReadonlySet<TidePhase>): number {
  const cur = phaseIndex(current);
  let best = Infinity;
  for (const p of preferred) {
    const d = Math.abs(phaseIndex(p) - cur);
    if (d < best) best = d;
  }
  return best;
}

/**
 * Returns true if the trajectory is moving toward (closer to) any phase in
 * `preferred` at the next time step. Used for the ±0.03 trajectory bonus.
 */
function isMovingTowardPreferred(
  current: TidePhase,
  direction: 'rising' | 'falling',
  preferred: ReadonlySet<TidePhase>,
): boolean | null {
  const cur = phaseIndex(current);
  // Approximate "next phase" by stepping ±1 along the ladder.
  const nextIdx = direction === 'rising' ? cur + 1 : cur - 1;
  if (nextIdx < 0 || nextIdx >= PHASE_LADDER.length) return null;
  const nextDistance = distanceToPreferred(PHASE_LADDER[nextIdx], preferred);
  const curDistance = distanceToPreferred(current, preferred);
  if (nextDistance === curDistance) return null; // sideways — no bonus or penalty
  return nextDistance < curDistance;
}

export function tideFactor(spot: Spot, tide: TideState): TideFactorResult {
  const sensitivity = spot.tide.sensitivity;

  // Low-sensitivity spots: no tide modifier regardless of state.
  if (sensitivity === 'low') {
    return { factor: 1.0, caveat: null };
  }

  // No tide data — fall back to neutral with a caveat.
  if (tide.phase === null) {
    return {
      factor: 1.0,
      caveat: 'Tide data unavailable — recommendation does not factor tide phase.',
    };
  }

  const preferred = parseTidePreference(spot.tide.preference);
  const distance = distanceToPreferred(tide.phase, preferred);

  let factor: number;
  if (sensitivity === 'medium') {
    if (distance === 0) factor = 1.02;
    else if (distance === 1) factor = 0.95;
    else factor = 0.85;
  } else {
    // high
    if (distance === 0) factor = 1.05;
    else if (distance === 1) factor = 0.88;
    else factor = 0.8;
  }

  // Trajectory bonus: ±0.03 if moving toward / away from preferred window.
  if (tide.direction !== null) {
    const towards = isMovingTowardPreferred(tide.phase, tide.direction, preferred);
    if (towards === true) factor += 0.03;
    else if (towards === false) factor -= 0.03;
  }

  return { factor, caveat: null };
}
