/**
 * Hazard activation predicates.
 *
 * Each HazardActivationKey on a spot record maps to a predicate here.
 * The predicate decides whether the hazard is "active" given today's
 * conditions and the user.
 *
 * Two flavours:
 *   - Gating activations (in GATING_KEYS): when active they ELIMINATE the
 *     spot via Gate 1.6. Reserved for spot/condition combinations that are
 *     genuinely unsafe at the user's skill level — e.g. F Break for non-
 *     advanced surfers, Johanna's shore break above 5ft.
 *   - Non-gating activations: surface as ActiveHazard / caveat entries in
 *     scoring output but never eliminate the spot.
 */

import type { HazardActivationKey, HazardRule, LiveConditions, SkillLevel, Spot } from '@/lib/types';
import { effectiveSize } from './effectiveSize';
import { angularDistance } from './geometry';

interface UserCtx {
  skill: SkillLevel;
}

type HazardPredicate = (spot: Spot, c: LiveConditions, user: UserCtx) => boolean;

export const HAZARD_PREDICATES: Record<HazardActivationKey, HazardPredicate> = {
  always: () => true,

  // Tide is not factored in v1 — the predicate returns false until v2.
  shallow_reef_low_tide: () => false,
  low_tide_small_swell_reef: () => false,

  large_size_below_advanced: (_, c, user) =>
    user.skill !== 'advanced' &&
    effectiveSize(c.primarySwell.heightFt, c.primarySwell.periodS) > 5,

  any_size_below_advanced: (_, __, user) => user.skill !== 'advanced',

  shore_break_above_threshold: (_, c, user) =>
    user.skill !== 'advanced' && c.primarySwell.heightFt > 5,

  strong_rip_with_onshore: (spot, c) => {
    // Wind has a meaningful onshore component AND non-trivial speed.
    // Used as a warning, not a gate.
    const onshore = (spot.offshoreDirection + 180) % 360;
    const dist = angularDistance(c.windDirectionDeg, onshore);
    return dist <= 60 && c.windSpeedKt > 8;
  },

  crowd_for_lower_skill: (spot, _, user) =>
    (user.skill === 'beginner' || user.skill === 'improver') &&
    (spot.crowd === 'high' || spot.crowd === 'very_high'),

  sea_breeze_summer_afternoon: (_, c) => {
    const d = new Date(c.fetchedAt);
    const month = d.getMonth(); // 0 = Jan
    const isSummer = month === 11 || month === 0 || month === 1;
    const hour = d.getHours();
    return isSummer && hour >= 12 && hour < 18;
  },

  submerged_groyne: () => true,
};

/** Activations that, when fired, ELIMINATE the spot via Gate 1.6. */
const GATING_KEYS: ReadonlySet<HazardActivationKey> = new Set([
  'large_size_below_advanced',
  'any_size_below_advanced',
  'shore_break_above_threshold',
]);

export function isGatingActivation(key: HazardActivationKey): boolean {
  return GATING_KEYS.has(key);
}

export function isHazardActive(
  rule: HazardRule,
  spot: Spot,
  c: LiveConditions,
  user: UserCtx,
): boolean {
  if (rule.appliesToSkill && !rule.appliesToSkill.includes(user.skill)) return false;
  return HAZARD_PREDICATES[rule.activation](spot, c, user);
}

export function isGatingHazardActive(
  rule: HazardRule,
  spot: Spot,
  c: LiveConditions,
  user: UserCtx,
): boolean {
  if (!GATING_KEYS.has(rule.activation)) return false;
  return isHazardActive(rule, spot, c, user);
}
