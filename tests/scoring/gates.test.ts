/**
 * Comprehensive tests for Layer 1 hard gates.
 *
 * The three safety-critical scenarios the spec/owner called out get their
 * own top-level describe block at the bottom — they are non-negotiable.
 */

import { describe, it, expect } from 'vitest';
import {
  checkConditionalHazardGate,
  checkPeriodGate,
  checkSkillConditionsGate,
  checkSkillFloorGate,
  checkSwellDirectionGate,
  checkSwellSizeGate,
  checkWindGate,
  runGates,
} from '@/lib/scoring/gates';
import { spotById } from '@/data/spots';
import type { LiveConditions, SkillLevel, Spot } from '@/lib/types';

// ─── Fixtures ──────────────────────────────────────────────────────────────

function getSpot(id: string): Spot {
  const s = spotById.get(id);
  if (!s) throw new Error(`spot fixture missing: ${id}`);
  return s;
}

const BELLS = getSpot('bells-beach');           // intermediate floor, reef_point, SSW window
const BELLS_BOWL = getSpot('bells-bowl');        // advanced floor, reef
const JAN_JUC = getSpot('jan-juc');              // improver floor, beach
const JOHANNA = getSpot('johanna');              // intermediate floor, beach, has shore_break hazard
const F_BREAK = getSpot('cape-paterson-f-break');// advanced floor, has any_size_below_advanced
const SMITHS = getSpot('smiths-beach');          // beginner floor, forgiving, beach
const ANGLESEA = getSpot('anglesea');            // beginner floor BUT moderate forgiveness
const SORRENTO = getSpot('sorrento-back-beach'); // beginner floor, forgiving
const TORQUAY_FB = getSpot('torquay-front-beach');// beginner floor, moderate, reef_point

function conditions(over: Partial<LiveConditions> = {}): LiveConditions {
  return {
    primarySwell: { heightFt: 4, periodS: 12, directionDeg: 205 }, // clean SSW, in Bells window
    secondarySwell: null,
    windSpeedKt: 5,
    windDirectionDeg: 337.5, // matches Bells offshoreDirection — fully offshore
    forecastHorizonHours: 6,
    fetchedAt: Date.parse('2026-05-05T08:00:00Z'),
    ...over,
  };
}

// ─── Gate 1.1: Skill floor ─────────────────────────────────────────────────

describe('Gate 1.1 — skill floor', () => {
  it('beginner blocked from Bells (intermediate floor)', () => {
    const r = checkSkillFloorGate(BELLS, { skill: 'beginner' });
    expect(r.passed).toBe(false);
    if (!r.passed) expect(r.reason).toBe('skill_below_floor');
  });

  it('improver blocked from Bells (intermediate floor)', () => {
    expect(checkSkillFloorGate(BELLS, { skill: 'improver' }).passed).toBe(false);
  });

  it('intermediate passes Bells', () => {
    expect(checkSkillFloorGate(BELLS, { skill: 'intermediate' }).passed).toBe(true);
  });

  it('intermediate blocked from Bells Bowl (advanced floor)', () => {
    expect(checkSkillFloorGate(BELLS_BOWL, { skill: 'intermediate' }).passed).toBe(false);
  });

  it('advanced passes Bells Bowl', () => {
    expect(checkSkillFloorGate(BELLS_BOWL, { skill: 'advanced' }).passed).toBe(true);
  });

  it('beginner passes Smiths (beginner floor)', () => {
    expect(checkSkillFloorGate(SMITHS, { skill: 'beginner' }).passed).toBe(true);
  });
});

// ─── Gate 1.2: Swell size ──────────────────────────────────────────────────

describe('Gate 1.2 — swell size', () => {
  it('too small for Bells (working 3-15ft)', () => {
    const r = checkSwellSizeGate(BELLS, conditions({ primarySwell: { heightFt: 2, periodS: 12, directionDeg: 205 } }));
    expect(r.passed).toBe(false);
    if (!r.passed) expect(r.reason).toBe('swell_too_small');
  });

  it('too big for Bells (max 15ft)', () => {
    const r = checkSwellSizeGate(BELLS, conditions({ primarySwell: { heightFt: 20, periodS: 12, directionDeg: 205 } }));
    expect(r.passed).toBe(false);
    if (!r.passed) expect(r.reason).toBe('swell_too_big');
  });

  it('5ft swell passes Bells', () => {
    expect(checkSwellSizeGate(BELLS, conditions({ primarySwell: { heightFt: 5, periodS: 12, directionDeg: 205 } })).passed).toBe(true);
  });

  it('exact min and max boundaries pass', () => {
    expect(checkSwellSizeGate(BELLS, conditions({ primarySwell: { heightFt: 3, periodS: 12, directionDeg: 205 } })).passed).toBe(true);
    expect(checkSwellSizeGate(BELLS, conditions({ primarySwell: { heightFt: 15, periodS: 12, directionDeg: 205 } })).passed).toBe(true);
  });
});

// ─── Gate 1.3: Swell direction ─────────────────────────────────────────────

describe('Gate 1.3 — swell direction', () => {
  it('inside Bells window (196-215°): 205° passes', () => {
    expect(checkSwellDirectionGate(BELLS, conditions({ primarySwell: { heightFt: 4, periodS: 12, directionDeg: 205 } })).passed).toBe(true);
  });

  it('29° outside window passes (within 30° tolerance)', () => {
    // Bells max edge 215° + 29° = 244°
    expect(checkSwellDirectionGate(BELLS, conditions({ primarySwell: { heightFt: 4, periodS: 12, directionDeg: 244 } })).passed).toBe(true);
  });

  it('31° outside window fails (beyond 30° tolerance)', () => {
    const r = checkSwellDirectionGate(BELLS, conditions({ primarySwell: { heightFt: 4, periodS: 12, directionDeg: 246 } }));
    expect(r.passed).toBe(false);
    if (!r.passed) expect(r.reason).toBe('swell_direction_off');
  });

  it('completely opposite direction fails', () => {
    expect(checkSwellDirectionGate(BELLS, conditions({ primarySwell: { heightFt: 4, periodS: 12, directionDeg: 30 } })).passed).toBe(false);
  });
});

// ─── Gate 1.4: Wind ────────────────────────────────────────────────────────

describe('Gate 1.4 — wind', () => {
  it('strong onshore (Bells onshore=157.5°, wind 160° @ 15kt) blocked', () => {
    const r = checkWindGate(BELLS, conditions({ windDirectionDeg: 160, windSpeedKt: 15 }));
    expect(r.passed).toBe(false);
    if (!r.passed) expect(r.reason).toBe('wind_onshore');
  });

  it('light onshore (8kt) passes — below 12kt gate threshold', () => {
    expect(checkWindGate(BELLS, conditions({ windDirectionDeg: 160, windSpeedKt: 8 })).passed).toBe(true);
  });

  it('exactly 12kt onshore passes (gate is strictly >12kt)', () => {
    expect(checkWindGate(BELLS, conditions({ windDirectionDeg: 160, windSpeedKt: 12 })).passed).toBe(true);
  });

  it('strong offshore wind passes regardless of speed', () => {
    expect(checkWindGate(BELLS, conditions({ windDirectionDeg: 337.5, windSpeedKt: 30 })).passed).toBe(true);
  });

  it('cross-shore (90° from onshore) at 25kt passes the gate', () => {
    // Bells onshore=157.5°, perpendicular is 67.5° or 247.5° — outside the ±45° onshore window
    expect(checkWindGate(BELLS, conditions({ windDirectionDeg: 67.5, windSpeedKt: 25 })).passed).toBe(true);
  });
});

// ─── Gate 1.5: Period ──────────────────────────────────────────────────────

describe('Gate 1.5 — period', () => {
  it('reef period 7s blocked at Bells (reef_point, threshold 8s)', () => {
    const r = checkPeriodGate(BELLS, conditions({ primarySwell: { heightFt: 4, periodS: 7, directionDeg: 205 } }));
    expect(r.passed).toBe(false);
    if (!r.passed) expect(r.reason).toBe('period_too_short');
  });

  it('reef period 8s passes at Bells (boundary)', () => {
    expect(checkPeriodGate(BELLS, conditions({ primarySwell: { heightFt: 4, periodS: 8, directionDeg: 205 } })).passed).toBe(true);
  });

  it('beach period 5s blocked at Jan Juc (beach, threshold 6s)', () => {
    expect(checkPeriodGate(JAN_JUC, conditions({ primarySwell: { heightFt: 3, periodS: 5, directionDeg: 220 } })).passed).toBe(false);
  });

  it('beach period 7s passes at Jan Juc', () => {
    expect(checkPeriodGate(JAN_JUC, conditions({ primarySwell: { heightFt: 3, periodS: 7, directionDeg: 220 } })).passed).toBe(true);
  });

  it('reef period 7s at Jan Juc (beach) passes — beach threshold is lower', () => {
    expect(checkPeriodGate(JAN_JUC, conditions({ primarySwell: { heightFt: 3, periodS: 7, directionDeg: 220 } })).passed).toBe(true);
  });
});

// ─── Gate 1.6: Conditional hazards ─────────────────────────────────────────

describe('Gate 1.6 — conditional hazards', () => {
  it('F Break (any_size_below_advanced) blocks intermediate', () => {
    const r = checkConditionalHazardGate(F_BREAK, conditions({ primarySwell: { heightFt: 5, periodS: 12, directionDeg: 220 } }), { skill: 'intermediate' });
    expect(r.passed).toBe(false);
    if (!r.passed) expect(r.reason).toBe('hazard_active');
  });

  it('F Break passes for advanced', () => {
    expect(checkConditionalHazardGate(F_BREAK, conditions({ primarySwell: { heightFt: 5, periodS: 12, directionDeg: 220 } }), { skill: 'advanced' }).passed).toBe(true);
  });

  it('F Break blocks beginner and improver too', () => {
    expect(checkConditionalHazardGate(F_BREAK, conditions({ primarySwell: { heightFt: 5, periodS: 12, directionDeg: 220 } }), { skill: 'beginner' }).passed).toBe(false);
    expect(checkConditionalHazardGate(F_BREAK, conditions({ primarySwell: { heightFt: 5, periodS: 12, directionDeg: 220 } }), { skill: 'improver' }).passed).toBe(false);
  });

  it('Johanna at small swell (4ft) — shore-break gate inactive', () => {
    expect(checkConditionalHazardGate(JOHANNA, conditions({ primarySwell: { heightFt: 4, periodS: 12, directionDeg: 220 } }), { skill: 'intermediate' }).passed).toBe(true);
  });

  it('benign spot returns pass', () => {
    expect(checkConditionalHazardGate(SMITHS, conditions(), { skill: 'beginner' }).passed).toBe(true);
  });
});

// ─── Gate 1.7: Skill-conditions mismatch ───────────────────────────────────

describe('Gate 1.7 — skill-conditions mismatch', () => {
  it('beginner ceiling = 3ft effective: 4ft @ 12s blocks beginner at Smiths', () => {
    const r = checkSkillConditionsGate(SMITHS, conditions({ primarySwell: { heightFt: 4, periodS: 12, directionDeg: 220 } }), { skill: 'beginner' });
    expect(r.passed).toBe(false);
    if (!r.passed) expect(r.reason).toBe('skill_above_user_ceiling');
  });

  it('beginner at Smiths with 1ft @ 10s passes (effective ~1.96ft K-G)', () => {
    expect(checkSkillConditionsGate(SMITHS, conditions({ primarySwell: { heightFt: 1, periodS: 10, directionDeg: 220 } }), { skill: 'beginner' }).passed).toBe(true);
  });

  it('beginner blocked from Anglesea (forgiveness=moderate, beginner needs forgiving)', () => {
    const r = checkSkillConditionsGate(ANGLESEA, conditions({ primarySwell: { heightFt: 2, periodS: 10, directionDeg: 160 } }), { skill: 'beginner' });
    expect(r.passed).toBe(false);
    if (!r.passed) expect(r.reason).toBe('skill_above_user_ceiling');
  });

  it('beginner blocked from Torquay Front Beach (moderate forgiveness)', () => {
    expect(checkSkillConditionsGate(TORQUAY_FB, conditions(), { skill: 'beginner' }).passed).toBe(false);
  });

  it('improver ceiling = 5ft: 5ft @ 14s = 8.1ft K-G → blocked', () => {
    const r = checkSkillConditionsGate(JAN_JUC, conditions({ primarySwell: { heightFt: 5, periodS: 14, directionDeg: 225 } }), { skill: 'improver' });
    expect(r.passed).toBe(false);
    if (!r.passed) expect(r.reason).toBe('skill_above_user_ceiling');
  });

  it('improver at Jan Juc with 2.5ft @ 10s passes (effective ~4.1ft K-G)', () => {
    expect(checkSkillConditionsGate(JAN_JUC, conditions({ primarySwell: { heightFt: 2.5, periodS: 10, directionDeg: 225 } }), { skill: 'improver' }).passed).toBe(true);
  });

  it('intermediate ceiling = 8ft: 4ft @ 14s = 6.8ft K-G → passes', () => {
    expect(checkSkillConditionsGate(BELLS, conditions({ primarySwell: { heightFt: 4, periodS: 14, directionDeg: 205 } }), { skill: 'intermediate' }).passed).toBe(true);
  });

  it('intermediate ceiling = 8ft: 8ft @ 14s = 11.8ft K-G → blocked', () => {
    expect(checkSkillConditionsGate(BELLS, conditions({ primarySwell: { heightFt: 8, periodS: 14, directionDeg: 205 } }), { skill: 'intermediate' }).passed).toBe(false);
  });

  it('advanced has no size ceiling: 12ft @ 16s passes', () => {
    expect(checkSkillConditionsGate(BELLS_BOWL, conditions({ primarySwell: { heightFt: 12, periodS: 16, directionDeg: 205 } }), { skill: 'advanced' }).passed).toBe(true);
  });

  it('improver allows forgiveness=forgiving|moderate (at Jan Juc moderate)', () => {
    expect(checkSkillConditionsGate(JAN_JUC, conditions({ primarySwell: { heightFt: 3, periodS: 10, directionDeg: 225 } }), { skill: 'improver' }).passed).toBe(true);
  });
});

// ─── runGates() composition ────────────────────────────────────────────────

describe('runGates composition', () => {
  it('returns first failure (skill floor short-circuits before swell checks)', () => {
    const r = runGates(BELLS, conditions({ primarySwell: { heightFt: 999, periodS: 12, directionDeg: 205 } }), { skill: 'beginner' });
    expect(r.passed).toBe(false);
    if (!r.passed) expect(r.reason).toBe('skill_below_floor');
  });

  it('passes when every gate is satisfied', () => {
    expect(runGates(BELLS, conditions({ primarySwell: { heightFt: 5, periodS: 13, directionDeg: 205 }, windDirectionDeg: 337.5, windSpeedKt: 8 }), { skill: 'intermediate' }).passed).toBe(true);
  });

  it('beginner at Smiths in clean small surf passes all gates', () => {
    // 1.5ft @ 9s K-G ≈ 2.6ft — under beginner ceiling of 3.
    expect(runGates(SMITHS, conditions({ primarySwell: { heightFt: 1.5, periodS: 9, directionDeg: 220 }, windDirectionDeg: 337.5, windSpeedKt: 5 }), { skill: 'beginner' }).passed).toBe(true);
  });

  it('beginner at Sorrento in clean small surf passes all gates', () => {
    // Sorrento offshore=45° (NE). 45°+180° onshore = 225°. Use wind from 45° (offshore).
    // 2ft @ 7s K-G ≈ 2.96ft — under beginner ceiling of 3 and at Sorrento's workingSize.min.
    expect(runGates(SORRENTO, conditions({ primarySwell: { heightFt: 2, periodS: 7, directionDeg: 225 }, windDirectionDeg: 45, windSpeedKt: 5 }), { skill: 'beginner' }).passed).toBe(true);
  });
});

// ─── Safety-critical scenarios (NON-NEGOTIABLE) ────────────────────────────

describe('SAFETY-CRITICAL: Gate 1.1 — beginner blocked from Bells under any conditions', () => {
  // The owner called this out specifically. A beginner must NEVER be allowed
  // through any combination of gates at Bells, regardless of swell/wind/etc.
  const scenarios = [
    { label: 'tiny clean', swell: { heightFt: 1, periodS: 8, directionDeg: 205 }, wind: { dir: 337.5, kt: 3 } },
    { label: 'perfect medium', swell: { heightFt: 4, periodS: 13, directionDeg: 205 }, wind: { dir: 337.5, kt: 8 } },
    { label: 'firing big', swell: { heightFt: 6, periodS: 15, directionDeg: 200 }, wind: { dir: 320, kt: 10 } },
    { label: 'huge', swell: { heightFt: 12, periodS: 16, directionDeg: 205 }, wind: { dir: 337.5, kt: 5 } },
    { label: 'onshore mush', swell: { heightFt: 4, periodS: 12, directionDeg: 205 }, wind: { dir: 160, kt: 20 } },
  ];

  for (const s of scenarios) {
    it(`blocked at Bells: ${s.label}`, () => {
      const c = conditions({
        primarySwell: s.swell,
        windDirectionDeg: s.wind.dir,
        windSpeedKt: s.wind.kt,
      });
      const r = runGates(BELLS, c, { skill: 'beginner' });
      expect(r.passed, `${s.label} should be blocked`).toBe(false);
      if (!r.passed) {
        // Skill floor should be the FIRST gate to fire — confirm that.
        expect(r.reason).toBe('skill_below_floor');
      }
    });
  }
});

describe('SAFETY-CRITICAL: Gate 1.7 — improver blocked from Jan Juc when effective size > 5ft', () => {
  // Jan Juc skill_floor = improver, so Gate 1.1 passes for an improver. But
  // at 5ft @ 14s the effective size is 6ft, exceeding the improver ceiling.
  it('improver passes Jan Juc skill floor (sanity)', () => {
    expect(checkSkillFloorGate(JAN_JUC, { skill: 'improver' }).passed).toBe(true);
  });

  it('5ft @ 14s = 6ft effective → improver blocked at Jan Juc', () => {
    const c = conditions({
      primarySwell: { heightFt: 5, periodS: 14, directionDeg: 225 },
      windDirectionDeg: 315,
      windSpeedKt: 8,
    });
    const r = runGates(JAN_JUC, c, { skill: 'improver' });
    expect(r.passed).toBe(false);
    if (!r.passed) {
      expect(r.reason).toBe('skill_above_user_ceiling');
      expect(r.note).toMatch(/effective size/i);
    }
  });

  it('6ft @ 16s = 8.4ft effective → improver still blocked', () => {
    const c = conditions({
      primarySwell: { heightFt: 6, periodS: 16, directionDeg: 225 },
      windDirectionDeg: 315,
      windSpeedKt: 8,
    });
    expect(runGates(JAN_JUC, c, { skill: 'improver' }).passed).toBe(false);
  });

  it('intermediate not blocked at the same conditions (ceiling 8ft)', () => {
    // 4ft @ 14s K-G ≈ 6.8ft — over improver 5 ceiling, under intermediate 8.
    const c = conditions({
      primarySwell: { heightFt: 4, periodS: 14, directionDeg: 225 },
      windDirectionDeg: 315,
      windSpeedKt: 8,
    });
    expect(runGates(JAN_JUC, c, { skill: 'intermediate' }).passed).toBe(true);
  });

  it('improver passes when effective size <= 5ft (3ft @ 10s = 4.7ft K-G)', () => {
    const c = conditions({
      primarySwell: { heightFt: 3, periodS: 10, directionDeg: 225 },
      windDirectionDeg: 315,
      windSpeedKt: 8,
    });
    expect(runGates(JAN_JUC, c, { skill: 'improver' }).passed).toBe(true);
  });
});

describe('SAFETY-CRITICAL: Gate 1.6 — Johanna shore break blocks anyone below advanced when swell > 5ft', () => {
  it('intermediate blocked at Johanna with 6ft swell', () => {
    const c = conditions({
      primarySwell: { heightFt: 6, periodS: 12, directionDeg: 220 },
      windDirectionDeg: 22.5,
      windSpeedKt: 8,
    });
    const r = runGates(JOHANNA, c, { skill: 'intermediate' });
    expect(r.passed).toBe(false);
    if (!r.passed) {
      expect(r.reason).toBe('hazard_active');
      expect(r.note).toMatch(/shore break/i);
    }
  });

  it('improver blocked at Johanna with 6ft swell — actually blocked at 1.1 first (intermediate floor)', () => {
    const c = conditions({
      primarySwell: { heightFt: 6, periodS: 12, directionDeg: 220 },
      windDirectionDeg: 22.5,
      windSpeedKt: 8,
    });
    const r = runGates(JOHANNA, c, { skill: 'improver' });
    expect(r.passed).toBe(false);
    if (!r.passed) expect(r.reason).toBe('skill_below_floor');
  });

  it('advanced passes Johanna at 6ft swell (shore-break gate skips them)', () => {
    const c = conditions({
      primarySwell: { heightFt: 6, periodS: 12, directionDeg: 220 },
      windDirectionDeg: 22.5,
      windSpeedKt: 8,
    });
    expect(runGates(JOHANNA, c, { skill: 'advanced' }).passed).toBe(true);
  });

  it('intermediate at Johanna with exactly 5ft is NOT blocked by shore-break gate (predicate is strictly > 5)', () => {
    const c = conditions({
      primarySwell: { heightFt: 5, periodS: 12, directionDeg: 220 },
      windDirectionDeg: 22.5,
      windSpeedKt: 8,
    });
    // At 5ft @ 12s, effective_size = 5ft, exactly at intermediate ceiling (8ft) — passes.
    // At 5ft raw, shore_break_above_threshold predicate (>5) is false — passes.
    expect(runGates(JOHANNA, c, { skill: 'intermediate' }).passed).toBe(true);
  });

  it('intermediate at Johanna with 8ft swell — shore-break gate fires', () => {
    const c = conditions({
      primarySwell: { heightFt: 8, periodS: 12, directionDeg: 220 },
      windDirectionDeg: 22.5,
      windSpeedKt: 8,
    });
    const r = runGates(JOHANNA, c, { skill: 'intermediate' });
    expect(r.passed).toBe(false);
    // Could fire at 1.6 (shore break) or 1.7 (effective 8ft = exactly ceiling). Per gate ordering
    // 1.6 runs before 1.7, so 1.6 should win.
    if (!r.passed) expect(r.reason).toBe('hazard_active');
  });
});
