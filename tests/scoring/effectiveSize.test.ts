import { describe, it, expect } from 'vitest';
import { breakerHeightFt, effectiveSize } from '@/lib/scoring/effectiveSize';

/**
 * Komar-Gaughan reference values, computed from
 *   Hb_raw       = 0.39 × g^(1/5) × (T × Hs²)^(2/5)
 *   Hb_calibrated = Hb_raw × 0.85
 * with g = 32.18 ft/s².
 *
 *   3ft @ 14s   raw 5.40 → calibrated 4.59
 *   5ft @ 14s   raw 8.13 → calibrated 6.91
 *   8ft @ 12s   raw 11.13 → calibrated 9.46
 *   2ft @ 15s   raw 4.02 → calibrated 3.41
 *   4ft @ 7s    raw 5.15 → calibrated 4.38
 */
describe('breakerHeightFt (Komar-Gaughan, calibrated)', () => {
  it('3ft @ 14s ≈ 4.59 ft', () => {
    expect(breakerHeightFt(3, 14)).toBeCloseTo(4.59, 1);
  });

  it('5ft @ 14s ≈ 6.91 ft', () => {
    expect(breakerHeightFt(5, 14)).toBeCloseTo(6.91, 1);
  });

  it('8ft @ 12s ≈ 9.46 ft', () => {
    expect(breakerHeightFt(8, 12)).toBeCloseTo(9.46, 1);
  });

  it('2ft @ 15s ≈ 3.41 ft', () => {
    expect(breakerHeightFt(2, 15)).toBeCloseTo(3.41, 1);
  });

  it('4ft @ 7s ≈ 4.38 ft', () => {
    expect(breakerHeightFt(4, 7)).toBeCloseTo(4.38, 1);
  });

  it('returns 0 for zero or negative swell height (defensive)', () => {
    expect(breakerHeightFt(0, 14)).toBe(0);
    expect(breakerHeightFt(-1, 14)).toBe(0);
  });

  it('returns 0 for zero or negative period (defensive)', () => {
    expect(breakerHeightFt(3, 0)).toBe(0);
    expect(breakerHeightFt(3, -5)).toBe(0);
  });

  it('caps at 3× swell height for pathological inputs', () => {
    // 1ft @ 100s: K-G raw ≈ 0.78 × 100^0.4 × 1^0.8 ≈ 4.92 → calibrated 4.18 → cap binds at 3.
    expect(breakerHeightFt(1, 100)).toBe(3);
  });

  it('is monotone-increasing in swell height (T fixed)', () => {
    const T = 12;
    const heights = [1, 2, 3, 4, 5, 8, 10];
    for (let i = 1; i < heights.length; i++) {
      expect(breakerHeightFt(heights[i], T)).toBeGreaterThan(breakerHeightFt(heights[i - 1], T));
    }
  });

  it('is monotone-increasing in period (Hs fixed)', () => {
    const Hs = 4;
    const periods = [6, 8, 10, 12, 14, 16, 18];
    for (let i = 1; i < periods.length; i++) {
      expect(breakerHeightFt(Hs, periods[i])).toBeGreaterThan(breakerHeightFt(Hs, periods[i - 1]));
    }
  });

  it('exposes effectiveSize as a back-compat alias', () => {
    expect(effectiveSize(5, 14)).toBe(breakerHeightFt(5, 14));
  });
});
