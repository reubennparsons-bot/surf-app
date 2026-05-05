import { describe, it, expect } from 'vitest';
import {
  HAZARD_PREDICATES,
  isGatingActivation,
  isGatingHazardActive,
  isHazardActive,
} from '@/lib/scoring/hazards';
import type { HazardRule, LiveConditions, Spot } from '@/lib/types';

function mkConditions(over: Partial<LiveConditions> = {}): LiveConditions {
  return {
    primarySwell: { heightFt: 4, periodS: 12, directionDeg: 200 },
    secondarySwell: null,
    windSpeedKt: 5,
    windDirectionDeg: 0,
    forecastHorizonHours: 6,
    fetchedAt: Date.parse('2026-05-05T08:00:00Z'),
    ...over,
  };
}

const stubSpot = {
  id: 'stub',
  offshoreDirection: 337.5,
  crowd: 'medium',
} as unknown as Spot;

describe('hazard predicates', () => {
  it('always always fires', () => {
    expect(HAZARD_PREDICATES.always(stubSpot, mkConditions(), { skill: 'advanced' })).toBe(true);
  });

  it('large_size_below_advanced fires only for non-advanced AND effective size > 5', () => {
    // 5ft @ 14s = 6ft effective → > 5
    const big = mkConditions({ primarySwell: { heightFt: 5, periodS: 14, directionDeg: 200 } });
    expect(HAZARD_PREDICATES.large_size_below_advanced(stubSpot, big, { skill: 'intermediate' })).toBe(true);
    expect(HAZARD_PREDICATES.large_size_below_advanced(stubSpot, big, { skill: 'advanced' })).toBe(false);
    // 3ft @ 12s = 3ft effective → not big enough
    const small = mkConditions({ primarySwell: { heightFt: 3, periodS: 12, directionDeg: 200 } });
    expect(HAZARD_PREDICATES.large_size_below_advanced(stubSpot, small, { skill: 'intermediate' })).toBe(false);
  });

  it('shore_break_above_threshold fires when raw height > 5ft for non-advanced', () => {
    const big = mkConditions({ primarySwell: { heightFt: 6, periodS: 12, directionDeg: 200 } });
    expect(HAZARD_PREDICATES.shore_break_above_threshold(stubSpot, big, { skill: 'intermediate' })).toBe(true);
    expect(HAZARD_PREDICATES.shore_break_above_threshold(stubSpot, big, { skill: 'advanced' })).toBe(false);
    const exactly5 = mkConditions({ primarySwell: { heightFt: 5, periodS: 12, directionDeg: 200 } });
    expect(HAZARD_PREDICATES.shore_break_above_threshold(stubSpot, exactly5, { skill: 'intermediate' })).toBe(false);
  });

  it('any_size_below_advanced fires for non-advanced regardless of conditions', () => {
    expect(HAZARD_PREDICATES.any_size_below_advanced(stubSpot, mkConditions(), { skill: 'beginner' })).toBe(true);
    expect(HAZARD_PREDICATES.any_size_below_advanced(stubSpot, mkConditions(), { skill: 'improver' })).toBe(true);
    expect(HAZARD_PREDICATES.any_size_below_advanced(stubSpot, mkConditions(), { skill: 'intermediate' })).toBe(true);
    expect(HAZARD_PREDICATES.any_size_below_advanced(stubSpot, mkConditions(), { skill: 'advanced' })).toBe(false);
  });

  it('tide-dependent activations are stubbed false in v1', () => {
    expect(HAZARD_PREDICATES.shallow_reef_low_tide(stubSpot, mkConditions(), { skill: 'advanced' })).toBe(false);
    expect(HAZARD_PREDICATES.low_tide_small_swell_reef(stubSpot, mkConditions(), { skill: 'advanced' })).toBe(false);
  });

  it('crowd_for_lower_skill fires for beginner/improver at high crowd spots', () => {
    const highCrowd = { ...stubSpot, crowd: 'high' } as Spot;
    expect(HAZARD_PREDICATES.crowd_for_lower_skill(highCrowd, mkConditions(), { skill: 'beginner' })).toBe(true);
    expect(HAZARD_PREDICATES.crowd_for_lower_skill(highCrowd, mkConditions(), { skill: 'intermediate' })).toBe(false);
  });
});

describe('isGatingActivation', () => {
  it('marks the three skill-deadly activations as gating', () => {
    expect(isGatingActivation('large_size_below_advanced')).toBe(true);
    expect(isGatingActivation('any_size_below_advanced')).toBe(true);
    expect(isGatingActivation('shore_break_above_threshold')).toBe(true);
  });
  it('rejects everything else', () => {
    expect(isGatingActivation('always')).toBe(false);
    expect(isGatingActivation('strong_rip_with_onshore')).toBe(false);
    expect(isGatingActivation('crowd_for_lower_skill')).toBe(false);
    expect(isGatingActivation('sea_breeze_summer_afternoon')).toBe(false);
    expect(isGatingActivation('submerged_groyne')).toBe(false);
    expect(isGatingActivation('shallow_reef_low_tide')).toBe(false);
  });
});

describe('isHazardActive vs isGatingHazardActive', () => {
  const rule: HazardRule = {
    hazard: 'rips',
    description: 'always rippy',
    activation: 'always',
    severity: 'warning',
  };
  it('isHazardActive returns true for non-gating active hazards', () => {
    expect(isHazardActive(rule, stubSpot, mkConditions(), { skill: 'intermediate' })).toBe(true);
  });
  it('isGatingHazardActive returns false for non-gating activation, even if active', () => {
    expect(isGatingHazardActive(rule, stubSpot, mkConditions(), { skill: 'intermediate' })).toBe(false);
  });

  it('appliesToSkill restricts activation', () => {
    const r: HazardRule = {
      hazard: 'crowd',
      description: 'lower-skill specific',
      activation: 'always',
      severity: 'caution',
      appliesToSkill: ['beginner', 'improver'],
    };
    expect(isHazardActive(r, stubSpot, mkConditions(), { skill: 'beginner' })).toBe(true);
    expect(isHazardActive(r, stubSpot, mkConditions(), { skill: 'intermediate' })).toBe(false);
  });
});
