/**
 * Breaking wave height prediction via Komar & Gaughan (1972), calibrated
 * to realistic surf face heights.
 *
 *   Hb_raw      = 0.39 · g^(1/5) · (T · Hs²)^(2/5)        [theoretical max]
 *   Hb_calibrated = Hb_raw × EFFECTIVE_SIZE_CALIBRATION    [Stormsurf-aligned]
 *   Hb          = min(Hb_calibrated, 3 × Hs)               [depth-limit cap]
 *
 * Source: Komar, P. D., & Gaughan, M. K. (1972). "Airy Wave Theory and
 * Breaker Height Prediction." Proc. 13th International Conference on
 * Coastal Engineering, ASCE.
 *
 * The dimensional formula works in any consistent unit system; we use
 * imperial (g = 32.18 ft/s²) since the rest of the engine speaks feet.
 *
 * The calibration coefficient (default 0.85) accounts for the gap between
 * K-G's theoretical breaker height and what surfers actually face after
 * refraction, depth limiting, and bottom friction. Without it, K-G
 * over-predicts by 15-30% vs Stormsurf empirical observations and renders
 * skill ceilings (3/5/8 ft) too punitive.
 *
 * The cap (3× swell height) catches pathological inputs (e.g. 1ft @ 25s)
 * via the McCowan 1894 depth-limit; it rarely binds in real conditions.
 *
 * Both Gate 1.7 (skill-conditions mismatch) and Layer 2 (swell quality) lean
 * on this, so it lives in its own pure module.
 */

import {
  EFFECTIVE_SIZE_CALIBRATION,
  EFFECTIVE_SIZE_MAX_RATIO_TO_SWELL,
} from '@/lib/config';

const G_FT_PER_S2 = 32.18;
const KG_COEFFICIENT = 0.39;

export function breakerHeightFt(swellHeightFt: number, periodS: number): number {
  if (swellHeightFt <= 0 || periodS <= 0) return 0;
  const raw =
    KG_COEFFICIENT *
    Math.pow(G_FT_PER_S2, 1 / 5) *
    Math.pow(periodS * swellHeightFt * swellHeightFt, 2 / 5);
  const calibrated = raw * EFFECTIVE_SIZE_CALIBRATION;
  const cap = EFFECTIVE_SIZE_MAX_RATIO_TO_SWELL * swellHeightFt;
  return Math.min(calibrated, cap);
}

/**
 * Back-compat alias. Existing callers (gates, swellQuality, hazards,
 * composite, narration) all import this name — preserved so swapping the
 * underlying formula is a single-file change.
 */
export const effectiveSize = breakerHeightFt;
