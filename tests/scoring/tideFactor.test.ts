import { describe, it, expect } from 'vitest';
import { tideFactor } from '@/lib/scoring/tideFactor';
import { spotById } from '@/data/spots';
import type { Spot, TideState } from '@/lib/types';

const BELLS_BOWL = spotById.get('bells-bowl') as Spot;          // sensitivity high, "Low to mid"
const BELLS = spotById.get('bells-beach') as Spot;              // medium, unconstrained
const SMITHS = spotById.get('smiths-beach') as Spot;            // low
const JAN_JUC = spotById.get('jan-juc') as Spot;                // low

function tide(phase: TideState['phase'], direction: TideState['direction'] = null): TideState {
  return { phase, direction, heightM: 1.0 };
}

describe('tideFactor — low sensitivity', () => {
  it('returns 1.0 with no caveat regardless of phase', () => {
    expect(tideFactor(SMITHS, tide('low')).factor).toBe(1.0);
    expect(tideFactor(SMITHS, tide('high')).factor).toBe(1.0);
    expect(tideFactor(JAN_JUC, tide('mid')).factor).toBe(1.0);
    expect(tideFactor(SMITHS, tide('low')).caveat).toBeNull();
  });

  it('returns 1.0 with no caveat even when tide data is missing', () => {
    const r = tideFactor(SMITHS, tide(null, null));
    expect(r.factor).toBe(1.0);
    expect(r.caveat).toBeNull();
  });
});

describe('tideFactor — missing tide data falls back to neutral with caveat', () => {
  it('medium-sensitivity spot with null phase → 1.0 + caveat', () => {
    const r = tideFactor(BELLS, tide(null, null));
    expect(r.factor).toBe(1.0);
    expect(r.caveat).toMatch(/tide.*unavailable/i);
  });

  it('high-sensitivity spot with null phase → 1.0 + caveat', () => {
    const r = tideFactor(BELLS_BOWL, tide(null, null));
    expect(r.factor).toBe(1.0);
    expect(r.caveat).toMatch(/tide.*unavailable/i);
  });
});

describe('tideFactor — medium sensitivity (Bells Beach, "Different sub-breaks favor different tides" = unconstrained)', () => {
  it('any phase counts as in-window for unconstrained preference → 1.02 base', () => {
    const r = tideFactor(BELLS, tide('low', null));
    // unconstrained → all phases preferred → distance 0 → 1.02
    expect(r.factor).toBeCloseTo(1.02, 2);
  });
});

describe('tideFactor — high sensitivity Bells Bowl ("Low to mid")', () => {
  it('low phase is in window → 1.05', () => {
    const r = tideFactor(BELLS_BOWL, tide('low', null));
    expect(r.factor).toBeCloseTo(1.05, 2);
  });

  it('mid phase is in window → 1.05', () => {
    const r = tideFactor(BELLS_BOWL, tide('mid', null));
    expect(r.factor).toBeCloseTo(1.05, 2);
  });

  it('mid_high is adjacent → 0.88', () => {
    const r = tideFactor(BELLS_BOWL, tide('mid_high', null));
    expect(r.factor).toBeCloseTo(0.88, 2);
  });

  it('high is far → 0.80', () => {
    const r = tideFactor(BELLS_BOWL, tide('high', null));
    expect(r.factor).toBeCloseTo(0.80, 2);
  });

  it('rising from mid_high adds +0.03 trajectory bonus when stepping toward already-preferred mid', () => {
    // mid_high → adjacent (0.88). Direction "rising" steps to high which is FURTHER from {low,mid_low,mid}.
    // So this is moving AWAY → -0.03 → 0.85
    const r = tideFactor(BELLS_BOWL, tide('mid_high', 'rising'));
    expect(r.factor).toBeCloseTo(0.85, 2);
  });

  it('falling from mid_high → moving toward window → 0.88 + 0.03 = 0.91', () => {
    const r = tideFactor(BELLS_BOWL, tide('mid_high', 'falling'));
    expect(r.factor).toBeCloseTo(0.91, 2);
  });
});
