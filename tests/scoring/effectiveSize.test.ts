import { describe, it, expect } from 'vitest';
import { effectiveSize, periodMultiplier } from '@/lib/scoring/effectiveSize';

describe('periodMultiplier', () => {
  // Spec calibration table:
  //   6s → 0.5    10s → 0.8    14s → 1.2    18s+ → 1.6
  //   8s → 0.6    12s → 1.0    16s → 1.4
  it.each([
    [6, 0.5],
    [7, 0.5], // exact reference; raw = 0.5, clamped to lower bound
    [8, 0.6],
    [10, 0.8],
    [12, 1.0],
    [14, 1.2],
    [16, 1.4],
    [18, 1.6],
    [22, 1.6], // clamped to upper bound
  ])('period %is → multiplier %f', (period, expected) => {
    expect(periodMultiplier(period)).toBeCloseTo(expected, 5);
  });

  it('clamps short periods to 0.5', () => {
    expect(periodMultiplier(3)).toBe(0.5);
    expect(periodMultiplier(0)).toBe(0.5);
  });

  it('clamps long periods to 1.6', () => {
    expect(periodMultiplier(25)).toBe(1.6);
  });
});

describe('effectiveSize', () => {
  // Surfer-known: "2ft @ 15s breaks bigger than 4ft @ 7s"
  it('captures period dominance over raw height', () => {
    const longPeriodSmall = effectiveSize(2, 15);   // 2 × 1.3 = 2.6
    const shortPeriodBig = effectiveSize(4, 7);     // 4 × 0.5 = 2.0
    expect(longPeriodSmall).toBeGreaterThan(shortPeriodBig);
  });

  it('5ft @ 14s = 6ft effective (key Gate-1.7 trigger for improver ceiling)', () => {
    expect(effectiveSize(5, 14)).toBeCloseTo(6.0, 5);
  });

  it('3ft @ 12s = 3ft effective', () => {
    expect(effectiveSize(3, 12)).toBeCloseTo(3.0, 5);
  });
});
