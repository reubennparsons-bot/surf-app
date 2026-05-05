import { describe, it, expect } from 'vitest';
import { haversineKm } from '@/lib/utils/haversine';

describe('haversineKm', () => {
  it('zero between identical points', () => {
    expect(haversineKm(-37.8, 144.96, -37.8, 144.96)).toBeCloseTo(0, 5);
  });

  it('~111km per degree of latitude', () => {
    expect(haversineKm(0, 0, 1, 0)).toBeCloseTo(111, 0);
  });

  it('Melbourne CBD → Bells: ~80km haversine', () => {
    // Melbourne CBD ≈ -37.814, 144.963.  Bells ≈ -38.3686, 144.2814.
    const km = haversineKm(-37.814, 144.963, -38.3686, 144.2814);
    expect(km).toBeGreaterThan(70);
    expect(km).toBeLessThan(95);
  });

  it('symmetric: a→b == b→a', () => {
    const a = haversineKm(-37.8, 144.9, -38.3, 144.2);
    const b = haversineKm(-38.3, 144.2, -37.8, 144.9);
    expect(a).toBeCloseTo(b, 5);
  });
});
