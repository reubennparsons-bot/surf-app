import { describe, it, expect } from 'vitest';
import { deterministicFallback } from '@/lib/narration/fallback';
import { serialiseForNarration } from '@/lib/narration/client';
import type { RecommendationResult } from '@/lib/types';

const T0 = Date.parse('2026-05-05T08:00:00Z');

function buildResult(over: Partial<RecommendationResult> = {}): RecommendationResult {
  return {
    user: {
      skill: 'intermediate',
      location: { name: 'Melbourne CBD', lat: -37.814, lng: 144.963 },
      sessionTiming: 'Saturday morning',
    },
    context: {
      forecastHorizonHours: 18,
      isWeekend: true,
      isSchoolHolidays: false,
      season: 'autumn',
      baselineDriveMinutes: 90,
      generatedAt: T0,
    },
    rankedSpots: [
      {
        spotId: 'bells-rincon',
        spotName: 'Bells — Rincon',
        region: 'Surf Coast',
        driveMinutes: 105,
        extraDriveMinutes: 15,
        swellQuality: 88,
        windFactor: 0.95,
        tideFactor: 1.0,
        crowdFactor: 0.85,
        certaintyMultiplier: 0.95,
        finalScore: 67.5,
        rankingScore: 63.5,
        qualityCategory: 'good',
        isFiring: false,
        effectiveSizeFt: 5.2,
        activeHazards: [
          { hazard: 'rocks', severity: 'caution', reason: 'Rocky reef bottom' },
          { hazard: 'crowd', severity: 'warning', reason: 'High crowd expected on weekend' },
        ],
        caveats: [],
        conditionsSummary: {
          swellHeightFt: 4.1,
          swellPeriodS: 13,
          swellDirectionDeg: 205,
          windSpeedKt: 8,
          windDirectionDeg: 320,
          tide: { phase: 'mid_high', direction: 'rising', heightM: 1.4 },
          forecastHorizonHours: 18,
        },
      },
    ],
    eliminatedSpotsOfNote: [
      {
        spotId: 'bells-bowl',
        spotName: 'Bells — The Bowl',
        reason: 'skill_below_floor',
        note: 'Bowl exceeds intermediate level today',
        skillAppropriate: false,
      },
    ],
    globalAdvisory: null,
    ...over,
  };
}

describe('deterministicFallback', () => {
  it('produces non-empty text', () => {
    const text = deterministicFallback(buildResult());
    expect(text.length).toBeGreaterThan(0);
  });

  it('makes the AI-unavailable nature clear at the top', () => {
    const text = deterministicFallback(buildResult());
    expect(text).toMatch(/Generated locally/i);
    expect(text).toMatch(/Anthropic narration unavailable/i);
  });

  it('surfaces the user context (skill + location + timing)', () => {
    const text = deterministicFallback(buildResult());
    expect(text).toMatch(/Intermediate session/);
    expect(text).toMatch(/Melbourne CBD/);
    expect(text).toMatch(/Saturday morning/);
  });

  it('surfaces hazards prominently', () => {
    const text = deterministicFallback(buildResult());
    expect(text).toMatch(/rocks/i);
    expect(text).toMatch(/crowd/i);
  });

  it('surfaces caveats verbatim', () => {
    const result = buildResult({
      rankedSpots: [
        {
          ...buildResult().rankedSpots[0],
          caveats: ['Sample caveat for verbatim surfacing.'],
        },
      ],
    });
    const text = deterministicFallback(result);
    expect(text).toMatch(/Sample caveat for verbatim surfacing\./);
  });

  it('surfaces eliminatedSpotsOfNote when present', () => {
    const text = deterministicFallback(buildResult());
    expect(text).toMatch(/Notable skips/i);
    expect(text).toMatch(/Bells — The Bowl/);
  });

  it('surfaces globalAdvisory when present', () => {
    const text = deterministicFallback(
      buildResult({ globalAdvisory: 'Strong wind warning all afternoon — get out early.' }),
    );
    expect(text).toMatch(/Strong wind warning/);
  });

  it('handles empty rankedSpots gracefully', () => {
    const text = deterministicFallback(
      buildResult({ rankedSpots: [], globalAdvisory: 'Nothing surfable.' }),
    );
    expect(text).toMatch(/No spots are surfable/i);
    expect(text).toMatch(/Nothing surfable/);
  });

  it('does not invent fields not present in input', () => {
    const result = buildResult();
    const text = deterministicFallback(result);
    // Drive time should be one of the actual values, not invented.
    expect(text).toMatch(/1h 45min|105min/);
  });

  it('includes the firing flag in score line when set', () => {
    const result = buildResult();
    result.rankedSpots[0].isFiring = true;
    result.rankedSpots[0].qualityCategory = 'firing';
    const text = deterministicFallback(result);
    expect(text).toMatch(/FIRING/);
  });
});

describe('serialiseForNarration', () => {
  it('produces snake_case keys matching the spec example', () => {
    const payload = serialiseForNarration(buildResult());
    expect(payload).toHaveProperty('user.skill_level');
    expect(payload).toHaveProperty('user.session_timing');
    expect(payload).toHaveProperty('context.forecast_horizon_hours');
    expect(payload).toHaveProperty('context.is_weekend');
    expect(payload).toHaveProperty('context.is_school_holidays');
    expect(payload).toHaveProperty('context.baseline_drive_minutes');
    expect(payload).toHaveProperty('eliminated_spots_of_note');
    expect(payload).toHaveProperty('global_advisory');
    expect(payload).toHaveProperty('ranked_spots');
  });

  it('per-spot keys are snake_case', () => {
    const payload = serialiseForNarration(buildResult());
    const first = payload.ranked_spots[0];
    expect(first).toHaveProperty('spot_name');
    expect(first).toHaveProperty('drive_minutes');
    expect(first).toHaveProperty('extra_drive_minutes');
    expect(first).toHaveProperty('final_score');
    expect(first).toHaveProperty('ranking_score');
    expect(first).toHaveProperty('quality_category');
    expect(first).toHaveProperty('is_firing');
    expect(first).toHaveProperty('surf_height_ft_traditional');
    expect(first).toHaveProperty('active_hazards');
    expect(first).toHaveProperty('conditions_summary.swell_height_ft');
    expect(first).toHaveProperty('conditions_summary.swell_period_s');
    expect(first).toHaveProperty('conditions_summary.swell_direction_deg');
    expect(first).toHaveProperty('conditions_summary.wind_speed_kt');
    expect(first).toHaveProperty('conditions_summary.wind_direction_deg');
    expect(first).toHaveProperty('conditions_summary.tide.phase');
    expect(first).toHaveProperty('conditions_summary.tide.direction');
  });

  it('rounds drive minutes to integers', () => {
    const result = buildResult();
    result.rankedSpots[0].driveMinutes = 105.7;
    result.rankedSpots[0].extraDriveMinutes = 15.4;
    const payload = serialiseForNarration(result);
    expect(payload.ranked_spots[0].drive_minutes).toBe(106);
    expect(payload.ranked_spots[0].extra_drive_minutes).toBe(15);
  });

  it('preserves null globalAdvisory as null (not undefined)', () => {
    const payload = serialiseForNarration(buildResult({ globalAdvisory: null }));
    expect(payload.global_advisory).toBeNull();
  });
});
