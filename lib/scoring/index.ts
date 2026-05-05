/**
 * Public scoring entry point.
 *
 * scoreAll() takes the full candidate set + per-spot live conditions + user
 * context and returns the ranked RecommendationResult that the narration
 * layer renders into language.
 *
 * Pipeline:
 *   1. Filter by visibility (sub-breaks hidden from beginners/improvers).
 *   2. Run hard gates per spot. Failures populate eliminatedSpotsOfNote
 *      (when the spot is notable=true).
 *   3. Pre-crowd score for survivors → drives pristine flags.
 *   4. Full computeScore() with crowd factor.
 *   5. Drive minutes (haversine × avg road speed) and baseline.
 *   6. Drive penalty applied to ranking_score (NOT final_score).
 *   7. Sort by ranking_score desc, build globalAdvisory if applicable.
 */

import { spots as ALL_SPOTS } from '@/data/spots';
import {
  GLOBAL_ADVISORY_NOTHING_FIRING_THRESHOLD,
  GLOBAL_ADVISORY_WIND_FRACTION_THRESHOLD,
  PRISTINE_GLOBAL_MIN_SPOTS,
  PRISTINE_PER_SPOT_THRESHOLD,
} from '@/lib/config';
import {
  SKILL_ORDER,
  type EliminationDetail,
  type EliminationReason,
  type LiveConditions,
  type RecommendationResult,
  type RequestContext,
  type ScoredSpot,
  type SkillLevel,
  type Spot,
  type UserContext,
} from '@/lib/types';
import { computeScore, preCrowdScore } from './composite';
import { drivePenaltyPoints, estimatedDriveMinutes } from './driveTime';
import { runGates, type GateResult } from './gates';

export interface ScoreAllInputs {
  user: UserContext;
  context: RequestContext;
  /** Live conditions per spot.id. Spots without entries are treated as eliminated. */
  conditionsBySpotId: Map<string, LiveConditions | null>;
  /** Override the candidate pool (for tests). Defaults to all spots. */
  candidates?: Spot[];
}

function isVisibleToSkill(spot: Spot, skill: SkillLevel): boolean {
  if (spot.visibility === 'all') return true;
  if (spot.visibility === 'intermediate_advanced') {
    return SKILL_ORDER[skill] >= SKILL_ORDER.intermediate;
  }
  return skill === 'advanced';
}

function gateFailureToElimination(
  spot: Spot,
  fail: Extract<GateResult, { passed: false }>,
  user: { skill: SkillLevel },
): EliminationDetail {
  const skillAppropriate =
    fail.reason !== 'skill_below_floor' &&
    fail.reason !== 'skill_above_user_ceiling' &&
    fail.reason !== 'visibility_hidden';
  return {
    spotId: spot.id,
    spotName: spot.name,
    reason: fail.reason,
    note: fail.note,
    skillAppropriate,
  };
}

export function scoreAll(inputs: ScoreAllInputs): RecommendationResult {
  const { user, context, conditionsBySpotId } = inputs;
  const candidates = inputs.candidates ?? ALL_SPOTS;

  // ── Step 1: visibility filter ─────────────────────────────────
  const visible = candidates.filter((s) => isVisibleToSkill(s, user.skill));

  // ── Step 2: gates ─────────────────────────────────────────────
  interface Survivor {
    spot: Spot;
    conditions: LiveConditions;
  }
  const survivors: Survivor[] = [];
  const eliminations: EliminationDetail[] = [];

  for (const spot of visible) {
    const conditions = conditionsBySpotId.get(spot.id);
    if (!conditions) {
      // No data for this spot — treat as a soft elimination.
      eliminations.push({
        spotId: spot.id,
        spotName: spot.name,
        reason: 'visibility_hidden',
        note: `No live conditions available for ${spot.name}`,
        skillAppropriate: true,
      });
      continue;
    }
    const gate = runGates(spot, conditions, { skill: user.skill });
    if (!gate.passed) {
      eliminations.push(gateFailureToElimination(spot, gate, { skill: user.skill }));
      continue;
    }
    survivors.push({ spot, conditions });
  }

  // ── Step 3: pre-crowd scores → pristine flags ────────────────
  const preScores = new Map<string, number>();
  for (const s of survivors) {
    preScores.set(s.spot.id, preCrowdScore(s.spot, s.conditions));
  }
  const pristineSpotIds = new Set(
    [...preScores.entries()]
      .filter(([, p]) => p >= PRISTINE_PER_SPOT_THRESHOLD)
      .map(([id]) => id),
  );
  const isPristineGlobal = pristineSpotIds.size >= PRISTINE_GLOBAL_MIN_SPOTS;

  // ── Step 4 & 5: full score + drive minutes ────────────────────
  const scored: ScoredSpot[] = [];
  let baselineDriveMinutes = Infinity;

  for (const s of survivors) {
    const driveMinutes = estimatedDriveMinutes(
      user.location.lat,
      user.location.lng,
      s.spot.coordinates.lat,
      s.spot.coordinates.lng,
    );
    if (driveMinutes < baselineDriveMinutes) baselineDriveMinutes = driveMinutes;

    const core = computeScore({
      spot: s.spot,
      conditions: s.conditions,
      user: { skill: user.skill },
      crowdCtx: {
        isWeekend: context.isWeekend,
        isSchoolHolidays: context.isSchoolHolidays,
        isPristineGlobal,
        isPristineHere: pristineSpotIds.has(s.spot.id),
        hourLocal: new Date(context.generatedAt).getHours(),
      },
    });

    scored.push({
      ...core,
      driveMinutes,
      extraDriveMinutes: 0, // filled in below once baseline is known
      rankingScore: core.finalScore, // also corrected below
    });
  }

  if (!Number.isFinite(baselineDriveMinutes)) baselineDriveMinutes = 0;

  // ── Step 6: drive penalty for ranking ─────────────────────────
  for (const r of scored) {
    r.extraDriveMinutes = Math.max(0, r.driveMinutes - baselineDriveMinutes);
    r.rankingScore = r.finalScore - drivePenaltyPoints(r.driveMinutes, baselineDriveMinutes);
  }

  // ── Step 7: sort + advisories ─────────────────────────────────
  scored.sort((a, b) => b.rankingScore - a.rankingScore);

  const eliminatedSpotsOfNote: EliminationDetail[] = eliminations.filter((e) => {
    const spot = candidates.find((s) => s.id === e.spotId);
    return spot?.notable === true;
  });

  let globalAdvisory: string | null = null;
  if (scored.length === 0) {
    globalAdvisory = 'No spots are surfable right now within the candidate set.';
  } else {
    const topScore = scored[0].finalScore;
    if (topScore < GLOBAL_ADVISORY_NOTHING_FIRING_THRESHOLD) {
      globalAdvisory = "Honest take: nothing's really firing today. Best options are listed but expect a marginal session.";
    } else {
      const evaluated = visible.length;
      const windEliminations = eliminations.filter((e) => e.reason === 'wind_onshore').length;
      if (evaluated > 0 && windEliminations / evaluated >= GLOBAL_ADVISORY_WIND_FRACTION_THRESHOLD) {
        globalAdvisory = 'Strong onshore wind across most of the coast — get out early or wait it out.';
      }
    }
  }

  return {
    user,
    context: {
      ...context,
      baselineDriveMinutes,
    },
    rankedSpots: scored,
    eliminatedSpotsOfNote,
    globalAdvisory,
  };
}
