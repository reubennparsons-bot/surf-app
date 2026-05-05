import { describe, it, expect } from 'vitest';
import { drivePenaltyPoints, estimatedDriveMinutes } from '@/lib/scoring/driveTime';

describe('estimatedDriveMinutes', () => {
  it('Melbourne CBD → Bells returns plausible minutes', () => {
    // Real drive ≈105 min; haversine ≈80km / 70km/h × 60 ≈ 69 min. v1 underestimate.
    const m = estimatedDriveMinutes(-37.814, 144.963, -38.3686, 144.2814);
    expect(m).toBeGreaterThan(50);
    expect(m).toBeLessThan(85);
  });
});

describe('drivePenaltyPoints', () => {
  // Spec worked examples (Melbourne CBD baseline 90 min):
  //   Torquay Front Beach 90 min → extra 0  → penalty 0
  //   Bells 105 min               → extra 15 → penalty 4
  //   Cape Woolamai 120 min       → extra 30 → penalty 5.7
  //   Johanna 210 min             → extra 120→ penalty 11.3
  //   Anything 3.5h+ extra        → penalty 15 (capped)

  it('zero extra → zero penalty', () => {
    expect(drivePenaltyPoints(90, 90)).toBe(0);
    expect(drivePenaltyPoints(60, 90)).toBe(0); // closer than baseline still 0
  });

  it('15 min extra → 4 points', () => {
    expect(drivePenaltyPoints(105, 90)).toBeCloseTo(4, 1);
  });

  it('30 min extra → ~5.7 points', () => {
    expect(drivePenaltyPoints(120, 90)).toBeCloseTo(5.66, 1);
  });

  it('120 min extra → ~11.3 points', () => {
    expect(drivePenaltyPoints(210, 90)).toBeCloseTo(11.31, 1);
  });

  it('caps at 15 for very long extra drives', () => {
    expect(drivePenaltyPoints(1000, 90)).toBe(15);
    expect(drivePenaltyPoints(500, 90)).toBe(15);
  });

  it('monotonically non-decreasing as extra grows', () => {
    let prev = -1;
    for (let extra = 0; extra <= 300; extra += 10) {
      const p = drivePenaltyPoints(90 + extra, 90);
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });
});
