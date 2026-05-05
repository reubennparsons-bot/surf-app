/**
 * Layer 1 — Hard gates.
 *
 * Each gate is a pure function that returns either { passed: true } or
 * { passed: false, reason, note }. runGates() short-circuits on the first
 * failure; gates are ordered cheapest → most expensive so the bulk of
 * eliminations happen quickly.
 *
 * Safety-critical: Gate 1.1 (skill floor) and Gate 1.7 (dynamic skill
 * check) plus the gating hazards in Gate 1.6 are the only thing standing
 * between an unsuitable spot and an unsuitable user. They are non-negotiable.
 */

import {
  BEACH_PERIOD_THRESHOLD_S,
  ONSHORE_HALF_WINDOW_DEG,
  ONSHORE_WIND_GATE_KT,
  REEF_PERIOD_THRESHOLD_S,
  SKILL_MIN_FORGIVENESS,
  SKILL_SIZE_CEILING_FT,
  SWELL_DIRECTION_GATE_TOLERANCE_DEG,
} from '@/lib/config';
import {
  SKILL_ORDER,
  type EliminationReason,
  type LiveConditions,
  type SkillLevel,
  type Spot,
} from '@/lib/types';
import { effectiveSize } from './effectiveSize';
import { angularDistance, distanceFromWindow } from './geometry';
import { isGatingHazardActive } from './hazards';

interface UserCtx {
  skill: SkillLevel;
}

export type GateResult =
  | { passed: true }
  | { passed: false; reason: EliminationReason; note: string };

const PASS: GateResult = { passed: true };

// ── Gate 1.1: Skill floor ────────────────────────────────────────────────────
export function checkSkillFloorGate(spot: Spot, user: UserCtx): GateResult {
  if (SKILL_ORDER[user.skill] < SKILL_ORDER[spot.skillFloor]) {
    return {
      passed: false,
      reason: 'skill_below_floor',
      note: `${spot.name} requires ${spot.skillFloor} (you are ${user.skill})`,
    };
  }
  return PASS;
}

// ── Gate 1.2: Swell size ─────────────────────────────────────────────────────
export function checkSwellSizeGate(spot: Spot, c: LiveConditions): GateResult {
  const h = c.primarySwell.heightFt;
  if (h < spot.workingSize.min) {
    return {
      passed: false,
      reason: 'swell_too_small',
      note: `Too small for ${spot.name} (${h.toFixed(1)}ft < ${spot.workingSize.min}ft)`,
    };
  }
  if (h > spot.workingSize.max) {
    return {
      passed: false,
      reason: 'swell_too_big',
      note: `Too big for ${spot.name} (${h.toFixed(1)}ft > ${spot.workingSize.max}ft)`,
    };
  }
  return PASS;
}

// ── Gate 1.3: Swell direction ────────────────────────────────────────────────
export function checkSwellDirectionGate(spot: Spot, c: LiveConditions): GateResult {
  const dist = distanceFromWindow(c.primarySwell.directionDeg, spot.optimalSwellDirection);
  if (dist > SWELL_DIRECTION_GATE_TOLERANCE_DEG) {
    return {
      passed: false,
      reason: 'swell_direction_off',
      note: `Swell ${c.primarySwell.directionDeg.toFixed(0)}° is ${dist.toFixed(0)}° outside ${spot.name}'s window`,
    };
  }
  return PASS;
}

// ── Gate 1.4: Wind ───────────────────────────────────────────────────────────
export function checkWindGate(spot: Spot, c: LiveConditions): GateResult {
  const onshoreDir = (spot.offshoreDirection + 180) % 360;
  const dist = angularDistance(c.windDirectionDeg, onshoreDir);
  if (dist <= ONSHORE_HALF_WINDOW_DEG && c.windSpeedKt > ONSHORE_WIND_GATE_KT) {
    return {
      passed: false,
      reason: 'wind_onshore',
      note: `Onshore ${c.windSpeedKt.toFixed(0)}kt at ${spot.name}`,
    };
  }
  return PASS;
}

// ── Gate 1.5: Period ─────────────────────────────────────────────────────────
export function checkPeriodGate(spot: Spot, c: LiveConditions): GateResult {
  const threshold =
    spot.breakType === 'beach' ? BEACH_PERIOD_THRESHOLD_S : REEF_PERIOD_THRESHOLD_S;
  if (c.primarySwell.periodS < threshold) {
    return {
      passed: false,
      reason: 'period_too_short',
      note: `Period ${c.primarySwell.periodS.toFixed(1)}s below ${threshold}s threshold for ${spot.breakType} break`,
    };
  }
  return PASS;
}

// ── Gate 1.6: Conditional hazards ────────────────────────────────────────────
export function checkConditionalHazardGate(
  spot: Spot,
  c: LiveConditions,
  user: UserCtx,
): GateResult {
  for (const h of spot.hazards) {
    if (isGatingHazardActive(h, spot, c, user)) {
      return {
        passed: false,
        reason: 'hazard_active',
        note: `${h.hazard} at ${spot.name}: ${h.description}`,
      };
    }
  }
  return PASS;
}

// ── Gate 1.7: Skill-conditions mismatch (dynamic skill check) ────────────────
export function checkSkillConditionsGate(
  spot: Spot,
  c: LiveConditions,
  user: UserCtx,
): GateResult {
  const ceiling = SKILL_SIZE_CEILING_FT[user.skill];
  const eff = effectiveSize(c.primarySwell.heightFt, c.primarySwell.periodS);
  if (eff > ceiling) {
    return {
      passed: false,
      reason: 'skill_above_user_ceiling',
      note: `Effective size ${eff.toFixed(1)}ft exceeds ${user.skill} ceiling (${ceiling}ft)`,
    };
  }
  const allowed = SKILL_MIN_FORGIVENESS[user.skill];
  if (!allowed.includes(spot.forgiveness)) {
    return {
      passed: false,
      reason: 'skill_above_user_ceiling',
      note: `${spot.name} forgiveness '${spot.forgiveness}' is too low for ${user.skill}`,
    };
  }
  return PASS;
}

// ── Composer ─────────────────────────────────────────────────────────────────
export function runGates(spot: Spot, c: LiveConditions, user: UserCtx): GateResult {
  const checks: Array<() => GateResult> = [
    () => checkSkillFloorGate(spot, user),
    () => checkPeriodGate(spot, c),
    () => checkSwellSizeGate(spot, c),
    () => checkSwellDirectionGate(spot, c),
    () => checkWindGate(spot, c),
    () => checkConditionalHazardGate(spot, c, user),
    () => checkSkillConditionsGate(spot, c, user),
  ];
  for (const fn of checks) {
    const r = fn();
    if (!r.passed) return r;
  }
  return PASS;
}
