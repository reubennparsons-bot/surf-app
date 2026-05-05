/**
 * Effective size — captures the surfer-known fact that a 2ft 15s swell breaks
 * bigger than a 4ft 7s swell.
 *
 *   period_multiplier = clamp(intercept + (period - reference) × coeff, lower, upper)
 *   effective_size    = swell_height × period_multiplier
 *
 * Both Gate 1.7 (skill-conditions mismatch) and Layer 2 (swell quality) lean
 * on this, so it lives in its own pure module.
 */

import {
  PERIOD_MULTIPLIER_COEFFICIENT,
  PERIOD_MULTIPLIER_INTERCEPT,
  PERIOD_MULTIPLIER_LOWER_BOUND,
  PERIOD_MULTIPLIER_REFERENCE_PERIOD_S,
  PERIOD_MULTIPLIER_UPPER_BOUND,
} from '@/lib/config';

export function periodMultiplier(periodS: number): number {
  const raw =
    PERIOD_MULTIPLIER_INTERCEPT +
    (periodS - PERIOD_MULTIPLIER_REFERENCE_PERIOD_S) * PERIOD_MULTIPLIER_COEFFICIENT;
  return Math.max(
    PERIOD_MULTIPLIER_LOWER_BOUND,
    Math.min(PERIOD_MULTIPLIER_UPPER_BOUND, raw),
  );
}

export function effectiveSize(heightFt: number, periodS: number): number {
  return heightFt * periodMultiplier(periodS);
}
