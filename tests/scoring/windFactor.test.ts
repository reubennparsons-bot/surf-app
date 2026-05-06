import { describe, it, expect } from 'vitest';
import { windFactor } from '@/lib/scoring/windFactor';
import { spotById } from '@/data/spots';
import type { LiveConditions, Spot } from '@/lib/types';

const BELLS = spotById.get('bells-beach') as Spot; // offshore = 337.5°

function conditions(windDirectionDeg: number, windSpeedKt: number): LiveConditions {
  return {
    primarySwell: { heightFt: 4, periodS: 12, directionDeg: 205 },
    secondarySwell: null,
    windDirectionDeg,
    windSpeedKt,
    tide: { phase: null, direction: null, heightM: null },
    forecastHorizonHours: 6,
    fetchedAt: Date.parse('2026-05-05T08:00:00Z'),
  };
}

describe('windFactor — direction component', () => {
  it('direct offshore (0° from offshore): factor 1.00', () => {
    const r = windFactor(BELLS, conditions(337.5, 8));
    expect(r.directionFactor).toBe(1.0);
    expect(r.classification).toBe('offshore');
  });

  it('cross-offshore at 45° from offshore: factor 0.92', () => {
    // 337.5 + 45 = 22.5 → wind from 22.5°. angDist from 337.5 = 45.
    const r = windFactor(BELLS, conditions(22.5, 8));
    expect(r.directionFactor).toBe(0.92);
    expect(r.classification).toBe('offshore');
  });

  it('cross-shore (75° from offshore): direction 0.75, classification cross_shore', () => {
    // 337.5 + 75 = 52.5
    const r = windFactor(BELLS, conditions(52.5, 8));
    expect(r.directionFactor).toBe(0.75);
    expect(r.classification).toBe('cross_shore');
  });

  it('cross-onshore (105° from offshore): direction 0.55, classification onshore', () => {
    const r = windFactor(BELLS, conditions(82.5, 8)); // 337.5 + 105 = 82.5
    expect(r.directionFactor).toBe(0.55);
    expect(r.classification).toBe('onshore');
  });

  it('direct onshore (180° from offshore): direction 0.20', () => {
    // 337.5 + 180 = 157.5
    const r = windFactor(BELLS, conditions(157.5, 8));
    expect(r.directionFactor).toBe(0.20);
    expect(r.classification).toBe('onshore');
  });
});

describe('windFactor — strength component (offshore)', () => {
  it('glassy (1kt) offshore: 0.95', () => {
    const r = windFactor(BELLS, conditions(337.5, 1));
    expect(r.strengthFactor).toBe(0.95);
  });

  it('light offshore (8kt): 1.00', () => {
    const r = windFactor(BELLS, conditions(337.5, 8));
    expect(r.strengthFactor).toBe(1.0);
  });

  it('moderate offshore (15kt): 0.92', () => {
    const r = windFactor(BELLS, conditions(337.5, 15));
    expect(r.strengthFactor).toBe(0.92);
  });

  it('strong offshore (22kt): 0.75', () => {
    const r = windFactor(BELLS, conditions(337.5, 22));
    expect(r.strengthFactor).toBe(0.75);
  });

  it('very strong offshore (30kt): 0.55', () => {
    const r = windFactor(BELLS, conditions(337.5, 30));
    expect(r.strengthFactor).toBe(0.55);
  });
});

describe('windFactor — strength component (cross-shore)', () => {
  // Cross-shore = 60-90° from offshore = wind from 37.5° (or 247.5°)
  it('light cross-shore (3kt): 1.00', () => {
    const r = windFactor(BELLS, conditions(37.5, 3));
    expect(r.strengthFactor).toBe(1.0);
    expect(r.classification).toBe('cross_shore');
  });

  it('moderate cross-shore (12kt): 0.80', () => {
    const r = windFactor(BELLS, conditions(37.5, 12));
    expect(r.strengthFactor).toBe(0.80);
  });

  it('strong cross-shore (25kt): 0.45', () => {
    const r = windFactor(BELLS, conditions(37.5, 25));
    expect(r.strengthFactor).toBe(0.45);
  });
});

describe('windFactor — strength component (onshore)', () => {
  it('light onshore (3kt): 1.00', () => {
    const r = windFactor(BELLS, conditions(157.5, 3));
    expect(r.strengthFactor).toBe(1.0);
    expect(r.classification).toBe('onshore');
  });

  it('moderate onshore (10kt): 0.85', () => {
    const r = windFactor(BELLS, conditions(157.5, 10));
    expect(r.strengthFactor).toBe(0.85);
  });

  it('strong onshore (12kt - just at gate threshold): 0.65', () => {
    const r = windFactor(BELLS, conditions(157.5, 12));
    expect(r.strengthFactor).toBe(0.65);
  });
});

describe('windFactor — combined total', () => {
  it('perfect offshore light: total ~1.00', () => {
    const r = windFactor(BELLS, conditions(337.5, 8));
    expect(r.total).toBe(1.0);
  });

  it('strong onshore (gate-adjacent) brutally low: 0.20 × 0.65 = 0.13', () => {
    const r = windFactor(BELLS, conditions(157.5, 12));
    expect(r.total).toBeCloseTo(0.13, 5);
  });

  it('cross-shore with light wind: 0.75 × 1.00 = 0.75', () => {
    const r = windFactor(BELLS, conditions(52.5, 3));
    expect(r.total).toBeCloseTo(0.75, 5);
  });

  it('total stays in (0, 1.00] across plausible inputs', () => {
    // Worst case is 0.20 (direction floor) × 0.20 (gate-adjacent onshore strength) = 0.04.
    // Realistic gate-passing wind is bounded much higher; the gate eliminates >12kt onshore.
    for (const dir of [0, 45, 90, 135, 180, 225, 270, 315]) {
      for (const kt of [0, 5, 10, 20, 30]) {
        const r = windFactor(BELLS, conditions(dir, kt));
        expect(r.total).toBeGreaterThan(0);
        expect(r.total).toBeLessThanOrEqual(1.0);
      }
    }
  });
});
