/**
 * Breaking wave height prediction via Komar & Gaughan (1972).
 *
 *   Hb = 0.39 · g^(1/5) · (T · Hs²)^(2/5)
 *
 * Source: Komar, P. D., & Gaughan, M. K. (1972). "Airy Wave Theory and
 * Breaker Height Prediction." Proc. 13th International Conference on
 * Coastal Engineering, ASCE.
 *
 * Dimensionally consistent — works in any consistent unit system. We use
 * imperial (g = 32.18 ft/s²) since the rest of the engine speaks feet.
 *
 * A practical cap of EFFECTIVE_SIZE_MAX_RATIO_TO_SWELL × swell height is
 * applied as a depth-limited proxy (McCowan 1894 wave-breaking limit at
 * typical 10–15ft beach-break depths). The cap rarely binds for realistic
 * Victorian conditions; it's a defensive ceiling against pathological inputs
 * such as a 1ft swell at 25s period.
 *
 * Both Gate 1.7 (skill-conditions mismatch) and Layer 2 (swell quality) lean
 * on this, so it lives in its own pure module.
 */

import { EFFECTIVE_SIZE_MAX_RATIO_TO_SWELL } from '@/lib/config';

const G_FT_PER_S2 = 32.18;
const KG_COEFFICIENT = 0.39;

export function breakerHeightFt(swellHeightFt: number, periodS: number): number {
  if (swellHeightFt <= 0 || periodS <= 0) return 0;
  const raw =
    KG_COEFFICIENT *
    Math.pow(G_FT_PER_S2, 1 / 5) *
    Math.pow(periodS * swellHeightFt * swellHeightFt, 2 / 5);
  const cap = EFFECTIVE_SIZE_MAX_RATIO_TO_SWELL * swellHeightFt;
  return Math.min(raw, cap);
}

/**
 * Back-compat alias. Existing callers (gates, swellQuality, hazards,
 * composite, narration) all import this name — preserved so swapping the
 * underlying formula is a single-file change.
 */
export const effectiveSize = breakerHeightFt;
