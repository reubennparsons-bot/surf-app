import { describe, it, expect } from 'vitest';
import { crowdFactor, type CrowdContext } from '@/lib/scoring/crowdFactor';
import { spotById } from '@/data/spots';
import type { Spot } from '@/lib/types';

const BELLS = spotById.get('bells-beach') as Spot;          // crowd: very_high
const FAIRHAVEN = spotById.get('fairhaven') as Spot;          // crowd: low
const SMITHS = spotById.get('smiths-beach') as Spot;          // crowd: high

const baseCtx: CrowdContext = {
  isWeekend: false,
  isSchoolHolidays: false,
  isPristineGlobal: false,
  isPristineHere: false,
  hourLocal: 10, // mid-morning, no dawn/sunset bonus
};

describe('crowdFactor', () => {
  it('base factors per crowd level', () => {
    expect(crowdFactor(BELLS, baseCtx, { skill: 'advanced' })).toBe(0.80); // very_high
    expect(crowdFactor(FAIRHAVEN, baseCtx, { skill: 'advanced' })).toBe(1.00); // low
    expect(crowdFactor(SMITHS, baseCtx, { skill: 'advanced' })).toBe(0.88); // high
  });

  it('weekend stacks -0.04', () => {
    const f = crowdFactor(FAIRHAVEN, { ...baseCtx, isWeekend: true }, { skill: 'advanced' });
    expect(f).toBeCloseTo(0.96, 5);
  });

  it('school holidays stacks -0.04', () => {
    const f = crowdFactor(FAIRHAVEN, { ...baseCtx, isSchoolHolidays: true }, { skill: 'advanced' });
    expect(f).toBeCloseTo(0.96, 5);
  });

  it('weekend + holidays stack', () => {
    const f = crowdFactor(FAIRHAVEN, { ...baseCtx, isWeekend: true, isSchoolHolidays: true }, { skill: 'advanced' });
    expect(f).toBeCloseTo(0.92, 5);
  });

  it('dawn (< 7am) +0.05', () => {
    // Bells very_high (0.80) + dawn (+0.05) = 0.85
    const f = crowdFactor(BELLS, { ...baseCtx, hourLocal: 6 }, { skill: 'advanced' });
    expect(f).toBeCloseTo(0.85, 5);
  });

  it('sunset hour (17-19) +0.03', () => {
    const f = crowdFactor(BELLS, { ...baseCtx, hourLocal: 18 }, { skill: 'advanced' });
    expect(f).toBeCloseTo(0.83, 5);
  });

  it('pristine here -0.05 (this spot specifically firing)', () => {
    // Fairhaven low (1.00) + pristine here (-0.05) = 0.95
    const f = crowdFactor(FAIRHAVEN, { ...baseCtx, isPristineHere: true }, { skill: 'advanced' });
    expect(f).toBeCloseTo(0.95, 5);
  });

  it('skill-relative: beginner at high-crowd spot copping extra -0.05', () => {
    // SMITHS high (0.88) + skill (-0.05) = 0.83
    const f = crowdFactor(SMITHS, baseCtx, { skill: 'beginner' });
    expect(f).toBeCloseTo(0.83, 5);
  });

  it('skill-relative: advanced at high-crowd spot — NO extra penalty', () => {
    expect(crowdFactor(SMITHS, baseCtx, { skill: 'advanced' })).toBe(0.88);
    expect(crowdFactor(SMITHS, baseCtx, { skill: 'intermediate' })).toBe(0.88);
  });

  it('skill-relative: improver penalty at very-high crowd (Bells)', () => {
    // 0.80 + (-0.05) = 0.75
    const f = crowdFactor(BELLS, baseCtx, { skill: 'improver' });
    expect(f).toBeCloseTo(0.75, 5);
  });

  it('caps at ceiling 1.00 even with all positive modifiers', () => {
    // Fairhaven low 1.00 + dawn 0.05 = 1.05 → clamp to 1.00
    const f = crowdFactor(FAIRHAVEN, { ...baseCtx, hourLocal: 6 }, { skill: 'advanced' });
    expect(f).toBe(1.00);
  });

  it('floors at 0.70 even with everything piled on', () => {
    // very_high 0.80 + weekend -0.04 + holidays -0.04 + pristine global -0.03 + pristine here -0.05 + skill (beginner) -0.05
    // = 0.80 - 0.21 = 0.59 → floor at 0.70
    const f = crowdFactor(
      BELLS,
      {
        isWeekend: true,
        isSchoolHolidays: true,
        isPristineGlobal: true,
        isPristineHere: true,
        hourLocal: 12,
      },
      { skill: 'beginner' },
    );
    expect(f).toBe(0.70);
  });

  it('returns within [0.70, 1.00] always', () => {
    const ctxs: CrowdContext[] = [
      baseCtx,
      { ...baseCtx, isWeekend: true, isSchoolHolidays: true, isPristineHere: true },
      { ...baseCtx, hourLocal: 4 },
      { ...baseCtx, hourLocal: 18 },
    ];
    for (const c of ctxs) {
      for (const sp of [BELLS, FAIRHAVEN, SMITHS]) {
        for (const skill of ['beginner', 'improver', 'intermediate', 'advanced'] as const) {
          const f = crowdFactor(sp, c, { skill });
          expect(f).toBeGreaterThanOrEqual(0.70);
          expect(f).toBeLessThanOrEqual(1.00);
        }
      }
    }
  });
});
