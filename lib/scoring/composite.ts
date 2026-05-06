/**
 * Layer 8 — Composite scoring.
 *
 *   final_score   = swell_quality × wind × tide × crowd × certainty
 *   final_score   = clamp(final_score - secondary_adjustments, 0, 100)
 *   firing flag   = swell ≥ 88 AND wind ≥ 0.92 AND tide ≥ 1.00 AND final ≥ 85
 *   category      = bucket lookup on final_score (or 'firing' override)
 *
 * Secondary adjustments:
 *   - Cross-swell penalty when a meaningful secondary swell sits >30° off
 *     the primary. Beach breaks suffer more than reefs/points (rougher
 *     peaks vs. dominant-direction filtering).
 *
 * Drive-time fields are added by the orchestrator (lib/scoring/index.ts),
 * not here — they require knowledge of all candidate spots to determine
 * the baseline.
 */

import {
  CROSS_SWELL_OFFSET_THRESHOLD_DEG,
  CROSS_SWELL_PENALTY_BEACH_MIN,
  CROSS_SWELL_PENALTY_REEF_MIN,
  FIRING_FLAG_THRESHOLDS,
  QUALITY_CATEGORY_BUCKETS,
} from '@/lib/config';
import type {
  ActiveHazard,
  ConditionsSummary,
  LiveConditions,
  QualityCategory,
  SkillLevel,
  Spot,
} from '@/lib/types';
import { certaintyMultiplier } from './certainty';
import { crowdFactor, type CrowdContext } from './crowdFactor';
import { angularDistance } from './geometry';
import { isGatingActivation, isHazardActive } from './hazards';
import { swellQuality } from './swellQuality';
import { tideFactor } from './tideFactor';
import { windFactor } from './windFactor';

export interface ScoreInputs {
  spot: Spot;
  conditions: LiveConditions;
  user: { skill: SkillLevel };
  crowdCtx: CrowdContext;
}

/**
 * Output before drive-time fields are added. The orchestrator wraps this
 * into a full ScoredSpot.
 */
export interface ScoredSpotCore {
  spotId: string;
  spotName: string;
  region: Spot['region'];

  swellQuality: number;
  windFactor: number;
  tideFactor: number;
  crowdFactor: number;
  certaintyMultiplier: number;

  finalScore: number;
  qualityCategory: QualityCategory;
  isFiring: boolean;

  effectiveSizeFt: number;
  activeHazards: ActiveHazard[];
  caveats: string[];
  conditionsSummary: ConditionsSummary;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function bucketCategory(finalScore: number): QualityCategory {
  for (const b of QUALITY_CATEGORY_BUCKETS) {
    if (finalScore < b.maxScore) return b.category;
  }
  return 'very_good';
}

function buildActiveHazards(
  spot: Spot,
  c: LiveConditions,
  user: { skill: SkillLevel },
): ActiveHazard[] {
  const out: ActiveHazard[] = [];
  for (const h of spot.hazards) {
    // Gating hazards are surfaced via gate-elimination flow, not here.
    if (isGatingActivation(h.activation)) continue;
    if (!isHazardActive(h, spot, c, user)) continue;
    out.push({
      hazard: h.hazard,
      severity: h.severity,
      reason: h.description,
    });
  }
  return out;
}

function buildConditionsSummary(c: LiveConditions): ConditionsSummary {
  return {
    swellHeightFt: c.primarySwell.heightFt,
    swellPeriodS: c.primarySwell.periodS,
    swellDirectionDeg: c.primarySwell.directionDeg,
    windSpeedKt: c.windSpeedKt,
    windDirectionDeg: c.windDirectionDeg,
    tide: c.tide,
    forecastHorizonHours: c.forecastHorizonHours,
  };
}

export function computeScore(inputs: ScoreInputs): ScoredSpotCore {
  const { spot, conditions, user, crowdCtx } = inputs;

  const swellQ = swellQuality(spot, conditions.primarySwell);
  const wind = windFactor(spot, conditions);
  const tide = tideFactor(spot, conditions.tide);
  const crowd = crowdFactor(spot, crowdCtx, user);
  const cert = certaintyMultiplier(conditions.forecastHorizonHours);

  let final =
    swellQ.total * wind.total * tide.factor * crowd * cert;

  // ── Secondary: cross-swell penalty ───────────────────────────────
  if (conditions.secondarySwell) {
    const offset = angularDistance(
      conditions.primarySwell.directionDeg,
      conditions.secondarySwell.directionDeg,
    );
    if (offset > CROSS_SWELL_OFFSET_THRESHOLD_DEG) {
      const penalty =
        spot.breakType === 'beach'
          ? CROSS_SWELL_PENALTY_BEACH_MIN
          : CROSS_SWELL_PENALTY_REEF_MIN;
      final -= penalty;
    }
  }

  final = clamp(final, 0, 100);

  const t = FIRING_FLAG_THRESHOLDS;
  const isFiring =
    swellQ.total >= t.swellQualityMin &&
    wind.total >= t.windFactorMin &&
    tide.factor >= t.tideFactorMin &&
    final >= t.finalScoreMin;

  const qualityCategory: QualityCategory = isFiring ? 'firing' : bucketCategory(final);

  // ── Caveats ────────────────────────────────────────────────────
  const caveats: string[] = [];
  if (tide.caveat) caveats.push(tide.caveat);
  if (spot.variability === 'high') {
    caveats.push(
      `${spot.name} is sandbank-dependent — actual peaks today may differ from the average.`,
    );
  }

  return {
    spotId: spot.id,
    spotName: spot.name,
    region: spot.region,
    swellQuality: swellQ.total,
    windFactor: wind.total,
    tideFactor: tide.factor,
    crowdFactor: crowd,
    certaintyMultiplier: cert,
    finalScore: final,
    qualityCategory,
    isFiring,
    effectiveSizeFt: swellQ.effectiveSizeFt,
    activeHazards: buildActiveHazards(spot, conditions, user),
    caveats,
    conditionsSummary: buildConditionsSummary(conditions),
  };
}

/**
 * Compute the "pre-crowd" portion of the final score: swell × wind × tide ×
 * certainty. The orchestrator uses this to decide pristine flags before the
 * second-pass full computeScore() call.
 */
export function preCrowdScore(spot: Spot, conditions: LiveConditions): number {
  const swellQ = swellQuality(spot, conditions.primarySwell);
  const wind = windFactor(spot, conditions);
  const tide = tideFactor(spot, conditions.tide);
  const cert = certaintyMultiplier(conditions.forecastHorizonHours);
  return swellQ.total * wind.total * tide.factor * cert;
}
