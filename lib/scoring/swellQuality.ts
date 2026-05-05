/**
 * Layer 2 — Swell quality (0-100).
 *
 * The "ceiling" of the scoring model. Wind multiplies what swell delivers,
 * but if the swell isn't there, no amount of perfect wind makes a session.
 *
 *   swell_quality = direction × 0.45 + period × 0.35 + size × 0.20
 *
 * Sub-component weights reflect the surfer-known order of importance:
 *   - direction first (wrong direction = no wave),
 *   - period second (long-period swell breaks cleaner and bigger),
 *   - size last (effective_size already rolls in period, so size as a raw
 *     dimension contributes least).
 */

import {
  DIRECTION_SCORE_AT_CENTER,
  DIRECTION_SCORE_AT_WINDOW_EDGE,
  DIRECTION_SCORE_FLOOR,
  DIRECTION_SCORE_OUTSIDE_DECAY_PER_DEG,
  PERIOD_SCORE_CURVE,
  SIZE_SCORE_AT_SWEET_SPOT,
  SIZE_SCORE_DECAY_ABOVE_PER_FT,
  SIZE_SCORE_DECAY_BELOW_PER_FT,
  SIZE_SCORE_FLOOR,
  SWELL_QUALITY_DIRECTION_WEIGHT,
  SWELL_QUALITY_PERIOD_WEIGHT,
  SWELL_QUALITY_SIZE_WEIGHT,
} from '@/lib/config';
import type { DirectionWindow, SizeRangeFt, Spot, SwellComponent } from '@/lib/types';
import { effectiveSize } from './effectiveSize';
import { angularDistance, isInWindow, windowCenter, windowHalfWidth } from './geometry';

// ── Direction match score ───────────────────────────────────────────────────
export function directionMatchScore(directionDeg: number, window: DirectionWindow): number {
  const center = windowCenter(window);
  const halfWidth = windowHalfWidth(window);
  const distFromCenter = angularDistance(directionDeg, center);

  if (isInWindow(directionDeg, window)) {
    if (halfWidth === 0) return DIRECTION_SCORE_AT_CENTER;
    const t = distFromCenter / halfWidth;
    return DIRECTION_SCORE_AT_CENTER -
      t * (DIRECTION_SCORE_AT_CENTER - DIRECTION_SCORE_AT_WINDOW_EDGE);
  }
  const overshoot = distFromCenter - halfWidth;
  return Math.max(
    DIRECTION_SCORE_FLOOR,
    DIRECTION_SCORE_AT_WINDOW_EDGE - overshoot * DIRECTION_SCORE_OUTSIDE_DECAY_PER_DEG,
  );
}

// ── Period quality score ───────────────────────────────────────────────────
export function periodQualityScore(periodS: number): number {
  const c = PERIOD_SCORE_CURVE;
  if (periodS < c.veryShort.capS) {
    return c.veryShort.baseScore + (periodS - c.veryShort.refS) * c.veryShort.slope;
  }
  if (periodS < c.medium.capS) {
    return c.medium.baseScore + (periodS - c.medium.refS) * c.medium.slope;
  }
  if (periodS < c.long.capS) {
    return c.long.baseScore + (periodS - c.long.refS) * c.long.slope;
  }
  return c.veryLong.score;
}

// ── Size sweet-spot score ───────────────────────────────────────────────────
export function sizeSweetSpotScore(effectiveSizeFt: number, sweetSpot: SizeRangeFt): number {
  if (effectiveSizeFt >= sweetSpot.min && effectiveSizeFt <= sweetSpot.max) {
    return SIZE_SCORE_AT_SWEET_SPOT;
  }
  if (effectiveSizeFt < sweetSpot.min) {
    const distance = sweetSpot.min - effectiveSizeFt;
    return Math.max(
      SIZE_SCORE_FLOOR,
      SIZE_SCORE_AT_SWEET_SPOT - distance * SIZE_SCORE_DECAY_BELOW_PER_FT,
    );
  }
  const distance = effectiveSizeFt - sweetSpot.max;
  return Math.max(
    SIZE_SCORE_FLOOR,
    SIZE_SCORE_AT_SWEET_SPOT - distance * SIZE_SCORE_DECAY_ABOVE_PER_FT,
  );
}

// ── Composite swell quality ─────────────────────────────────────────────────
export interface SwellQualityBreakdown {
  direction: number;
  period: number;
  size: number;
  effectiveSizeFt: number;
  total: number;
}

export function swellQuality(spot: Spot, swell: SwellComponent): SwellQualityBreakdown {
  const direction = directionMatchScore(swell.directionDeg, spot.optimalSwellDirection);
  const period = periodQualityScore(swell.periodS);
  const eff = effectiveSize(swell.heightFt, swell.periodS);
  const size = sizeSweetSpotScore(eff, spot.sweetSpot);

  const total =
    direction * SWELL_QUALITY_DIRECTION_WEIGHT +
    period * SWELL_QUALITY_PERIOD_WEIGHT +
    size * SWELL_QUALITY_SIZE_WEIGHT;

  return { direction, period, size, effectiveSizeFt: eff, total };
}
