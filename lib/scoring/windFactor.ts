/**
 * Layer 3 — Wind factor (multiplier on swell quality, range 0.20–1.00).
 *
 *   wind_factor = direction_factor × strength_factor
 *
 * Direction factor classifies the wind by angular distance from the spot's
 * offshore bearing. Strength factor uses different curves depending on
 * whether the wind is offshore, cross-shore, or onshore — the further from
 * offshore, the more punishing a strong wind becomes.
 *
 * Note: the gate (Layer 1.4) already eliminates onshore winds > 12kt; this
 * layer is what scores the wind for spots that survived the gate.
 */

import {
  WIND_DIRECTION_FACTOR_BUCKETS,
  WIND_STRENGTH_CROSS_BUCKETS,
  WIND_STRENGTH_OFFSHORE_BUCKETS,
  WIND_STRENGTH_ONSHORE_BUCKETS,
} from '@/lib/config';
import type { LiveConditions, Spot } from '@/lib/types';
import { angularDistance } from './geometry';

export type WindClassification = 'offshore' | 'cross_shore' | 'onshore';

export interface WindFactorBreakdown {
  directionFactor: number;
  strengthFactor: number;
  total: number;
  classification: WindClassification;
  angularDistFromOffshoreDeg: number;
}

function findDirectionFactor(angDist: number): number {
  for (const b of WIND_DIRECTION_FACTOR_BUCKETS) {
    if (angDist <= b.maxAngularDistDeg) return b.factor;
  }
  return WIND_DIRECTION_FACTOR_BUCKETS[WIND_DIRECTION_FACTOR_BUCKETS.length - 1].factor;
}

function findStrengthFactor(
  speedKt: number,
  buckets: ReadonlyArray<{ maxKt: number; factor: number }>,
): number {
  for (const b of buckets) {
    if (speedKt <= b.maxKt) return b.factor;
  }
  return buckets[buckets.length - 1].factor;
}

export function windFactor(spot: Spot, c: LiveConditions): WindFactorBreakdown {
  const angDist = angularDistance(c.windDirectionDeg, spot.offshoreDirection);

  const directionFactor = findDirectionFactor(angDist);

  // Strength curve depends on classification: offshore < 60° from offshore,
  // cross-shore 60°-90°, onshore 90°+. Mirrors the spec's direction-class
  // labels so cross-shore and onshore winds get the punishing curve.
  let classification: WindClassification;
  let strengthFactor: number;
  if (angDist < 60) {
    classification = 'offshore';
    strengthFactor = findStrengthFactor(c.windSpeedKt, WIND_STRENGTH_OFFSHORE_BUCKETS);
  } else if (angDist < 90) {
    classification = 'cross_shore';
    strengthFactor = findStrengthFactor(c.windSpeedKt, WIND_STRENGTH_CROSS_BUCKETS);
  } else {
    classification = 'onshore';
    strengthFactor = findStrengthFactor(c.windSpeedKt, WIND_STRENGTH_ONSHORE_BUCKETS);
  }

  return {
    directionFactor,
    strengthFactor,
    total: directionFactor * strengthFactor,
    classification,
    angularDistFromOffshoreDeg: angDist,
  };
}
