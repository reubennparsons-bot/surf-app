/**
 * Layer 5 — Crowd factor (modifier on swell quality, range 0.70–1.00).
 *
 *   factor = base[spot.crowd] + sum(modifiers) + skill_relative_penalty
 *   clamp to [0.70, 1.00]
 *
 * Modifiers stack:
 *   weekend            -0.04
 *   school holidays    -0.04
 *   pristine globally  -0.03  (everywhere is firing — everyone's out)
 *   pristine here      -0.05  (this spot specifically gets crushed)
 *   dawn (< 7 am)      +0.05
 *   sunset hour        +0.03
 *
 * Skill-relative: beginners and improvers cop an extra −0.05 at high or
 * very-high crowd spots — drop-ins and lineup chaos are dangerous, not
 * just annoying, at lower skill levels. Advanced surfers don't get this
 * penalty: crowd is competition, not danger.
 */

import {
  CROWD_BASE_FACTOR,
  CROWD_FACTOR_CEILING,
  CROWD_FACTOR_FLOOR,
  CROWD_LOWER_SKILL_HIGH_CROWD_PENALTY,
  CROWD_MODIFIER_DAWN_BEFORE_7,
  CROWD_MODIFIER_PRISTINE_GLOBAL,
  CROWD_MODIFIER_PRISTINE_HERE,
  CROWD_MODIFIER_SCHOOL_HOLIDAYS,
  CROWD_MODIFIER_SUNSET_LAST_HOUR,
  CROWD_MODIFIER_WEEKEND,
} from '@/lib/config';
import type { SkillLevel, Spot } from '@/lib/types';

export interface CrowdContext {
  isWeekend: boolean;
  isSchoolHolidays: boolean;
  /** True when most spots in the candidate set are scoring high (everyone's out). */
  isPristineGlobal: boolean;
  /** True when this spot specifically is firing (orchestrator decides). */
  isPristineHere: boolean;
  /** Local-time hour 0–23 of the target session. Drives dawn/sunset modifiers. */
  hourLocal: number;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function crowdFactor(
  spot: Spot,
  ctx: CrowdContext,
  user: { skill: SkillLevel },
): number {
  let factor = CROWD_BASE_FACTOR[spot.crowd];

  if (ctx.isWeekend) factor += CROWD_MODIFIER_WEEKEND;
  if (ctx.isSchoolHolidays) factor += CROWD_MODIFIER_SCHOOL_HOLIDAYS;
  if (ctx.isPristineGlobal) factor += CROWD_MODIFIER_PRISTINE_GLOBAL;
  if (ctx.isPristineHere) factor += CROWD_MODIFIER_PRISTINE_HERE;

  if (ctx.hourLocal < 7) factor += CROWD_MODIFIER_DAWN_BEFORE_7;
  // Approximate "sunset hour" as 17:00–19:00 local. Victorian sunset varies
  // by season; a per-day astronomical calc is overkill for a small modifier.
  if (ctx.hourLocal >= 17 && ctx.hourLocal < 19) {
    factor += CROWD_MODIFIER_SUNSET_LAST_HOUR;
  }

  if (
    (user.skill === 'beginner' || user.skill === 'improver') &&
    (spot.crowd === 'high' || spot.crowd === 'very_high')
  ) {
    factor += CROWD_LOWER_SKILL_HIGH_CROWD_PENALTY;
  }

  return clamp(factor, CROWD_FACTOR_FLOOR, CROWD_FACTOR_CEILING);
}
