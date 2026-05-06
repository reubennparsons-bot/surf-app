import { describe, it, expect } from 'vitest';
import {
  directionMatchScore,
  periodQualityScore,
  sizeSweetSpotScore,
  swellQuality,
} from '@/lib/scoring/swellQuality';
import { spotById } from '@/data/spots';
import type { Spot } from '@/lib/types';

function getSpot(id: string): Spot {
  const s = spotById.get(id);
  if (!s) throw new Error(`spot fixture missing: ${id}`);
  return s;
}

const BELLS = getSpot('bells-beach'); // window {196, 215}, sweet 4-8ft
const JAN_JUC = getSpot('jan-juc');   // window {195, 255} (60° SW), sweet 2-4ft

// ── Direction match score ──────────────────────────────────────────────────

describe('directionMatchScore', () => {
  // Bells window {196, 215}: centre 205.5, half-width 9.5°.
  it('100 at exact centre', () => {
    expect(directionMatchScore(205.5, BELLS.optimalSwellDirection)).toBeCloseTo(100, 5);
  });

  it('80 at the window edges (linear from centre)', () => {
    expect(directionMatchScore(196, BELLS.optimalSwellDirection)).toBeCloseTo(80, 5);
    expect(directionMatchScore(215, BELLS.optimalSwellDirection)).toBeCloseTo(80, 5);
  });

  it('linear inside window: 90 at 1/2 between centre and edge', () => {
    // Halfway between 205.5 and 215 = 210.25
    expect(directionMatchScore(210.25, BELLS.optimalSwellDirection)).toBeCloseTo(90, 5);
  });

  it('decays at 2 points/° outside the window', () => {
    // 1° outside (216): overshoot 1°, score 80 - 2 = 78.
    expect(directionMatchScore(216, BELLS.optimalSwellDirection)).toBeCloseTo(78, 5);
    // 10° outside: 80 - 20 = 60.
    expect(directionMatchScore(225, BELLS.optimalSwellDirection)).toBeCloseTo(60, 5);
    // 30° outside (gate boundary): 80 - 60 = 20 → floors at 20.
    expect(directionMatchScore(245, BELLS.optimalSwellDirection)).toBeCloseTo(20, 5);
  });

  it('floors at 20 far outside the window', () => {
    expect(directionMatchScore(45, BELLS.optimalSwellDirection)).toBe(20);
  });

  it('handles wraparound windows', () => {
    const wrap = { min: 350, max: 10 }; // centre 0°, half-width 10°
    expect(directionMatchScore(0, wrap)).toBeCloseTo(100, 5);
    expect(directionMatchScore(10, wrap)).toBeCloseTo(80, 5);
    expect(directionMatchScore(350, wrap)).toBeCloseTo(80, 5);
    expect(directionMatchScore(355, wrap)).toBeCloseTo(90, 5);
  });
});

// ── Period quality score ───────────────────────────────────────────────────

describe('periodQualityScore', () => {
  // Spec calibration: 6s→30  8s→60  12s→90  16s+→100, piecewise linear.
  it.each([
    [6, 30],
    [7, 45],
    [8, 60],
    [10, 75],
    [12, 90],
    [14, 95],
    [16, 100],
    [20, 100],
  ])('period %is → score %f', (period, expected) => {
    expect(periodQualityScore(period)).toBeCloseTo(expected, 5);
  });
});

// ── Size sweet-spot score ──────────────────────────────────────────────────

describe('sizeSweetSpotScore', () => {
  const sweet = { min: 4, max: 8 };

  it('100 inside the sweet spot', () => {
    expect(sizeSweetSpotScore(4, sweet)).toBe(100);
    expect(sizeSweetSpotScore(6, sweet)).toBe(100);
    expect(sizeSweetSpotScore(8, sweet)).toBe(100);
  });

  it('decays 15 pts/ft below sweet spot', () => {
    expect(sizeSweetSpotScore(3, sweet)).toBeCloseTo(85, 5);
    expect(sizeSweetSpotScore(2, sweet)).toBeCloseTo(70, 5);
  });

  it('decays 12 pts/ft above sweet spot (slower than below)', () => {
    expect(sizeSweetSpotScore(9, sweet)).toBeCloseTo(88, 5);
    expect(sizeSweetSpotScore(12, sweet)).toBeCloseTo(52, 5);
  });

  it('floors at 40', () => {
    // At 0ft against sweet {4,8}: 4ft below → 100 - 4*15 = 40 (exactly floor).
    expect(sizeSweetSpotScore(0, sweet)).toBe(40);
    // At 50ft: way past floor (raw value would be -404).
    expect(sizeSweetSpotScore(50, sweet)).toBe(40);
    // 0.1ft is just above the floor: 100 - 3.9*15 = 41.5 (does NOT floor).
    expect(sizeSweetSpotScore(0.1, sweet)).toBeCloseTo(41.5, 5);
  });
});

// ── Composite swell quality ─────────────────────────────────────────────────

describe('swellQuality (combined)', () => {
  it('perfect alignment scores ≥ 95', () => {
    // Bells: 4ft @ 13s @ 205° (near centre 205.5).
    // direction ~99, period high, K-G calibrated ≈ 5.6 (in 4-8 sweet) → size 100
    const r = swellQuality(BELLS, { heightFt: 4, periodS: 13, directionDeg: 205 });
    expect(r.total).toBeGreaterThan(95);
    expect(r.direction).toBeGreaterThan(95);
    expect(r.size).toBe(100);
    expect(r.effectiveSizeFt).toBeCloseTo(5.6, 1);
  });

  it('bad direction nukes the score even with great period+size', () => {
    // 5ft @ 14s but coming from 60° (NE — completely wrong for SSW Bells).
    // direction floors at 20, period 95, size 100 → 20*0.45 + 95*0.35 + 100*0.20 = 9 + 33.25 + 20 = 62.25
    const r = swellQuality(BELLS, { heightFt: 5, periodS: 14, directionDeg: 60 });
    expect(r.direction).toBe(20);
    expect(r.total).toBeLessThan(70);
  });

  it('short period drags total down', () => {
    // 4ft @ 7s direct centre. direction 100, period 45, eff=4*0.5=2, jan juc sweet 2-4 → size 100.
    // total = 100*0.45 + 45*0.35 + 100*0.20 = 45 + 15.75 + 20 = 80.75
    const r = swellQuality(JAN_JUC, { heightFt: 4, periodS: 7, directionDeg: 225 });
    expect(r.period).toBeCloseTo(45, 1);
    expect(r.total).toBeLessThan(85);
    expect(r.total).toBeGreaterThan(70);
  });

  it('oversized swell: size component drags lower', () => {
    // Bells 14ft @ 14s: effective 16.8ft, way above sweet 4-8.
    // distance above = 8.8ft → 100 - 8.8*12 = -5.6 → floor 40.
    const r = swellQuality(BELLS, { heightFt: 14, periodS: 14, directionDeg: 205 });
    expect(r.size).toBe(40);
    // Direction perfect, period 95, size 40 → 99*0.45 + 95*0.35 + 40*0.2 = 44.55 + 33.25 + 8 = 85.8
    expect(r.total).toBeGreaterThan(80);
    expect(r.total).toBeLessThan(90);
  });

  it('undersized swell: size floor and short-period penalty', () => {
    // Bells 1ft @ 8s: K-G calibrated ≈ 1.52ft. Below sweet 4-8 (centre ≈ 6).
    // distance below sweet (4) = 2.48 → 100 - 2.48*15 ≈ 63.
    const r = swellQuality(BELLS, { heightFt: 1, periodS: 8, directionDeg: 205 });
    expect(r.size).toBeCloseTo(63, 0);
    expect(r.period).toBeCloseTo(60, 1);
    // Reasonable middling score for "small but clean."
    expect(r.total).toBeGreaterThan(70);
    expect(r.total).toBeLessThan(85);
  });

  it('total stays inside [0, 100]', () => {
    const cases: { heightFt: number; periodS: number; directionDeg: number }[] = [
      { heightFt: 0.5, periodS: 6, directionDeg: 90 },
      { heightFt: 50, periodS: 25, directionDeg: 200 },
      { heightFt: 5, periodS: 13, directionDeg: 205 },
    ];
    for (const c of cases) {
      const r = swellQuality(BELLS, c);
      expect(r.total).toBeGreaterThanOrEqual(0);
      expect(r.total).toBeLessThanOrEqual(100);
    }
  });

  it('returns the breakdown for downstream use', () => {
    const r = swellQuality(BELLS, { heightFt: 5, periodS: 14, directionDeg: 205 });
    expect(r).toHaveProperty('direction');
    expect(r).toHaveProperty('period');
    expect(r).toHaveProperty('size');
    expect(r).toHaveProperty('effectiveSizeFt');
    expect(r).toHaveProperty('total');
  });
});
