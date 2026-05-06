/**
 * Tunable parameters for the Surf App scoring engine and friends.
 *
 * EVERY number that the user might want to recalibrate against real surf
 * sessions lives in this file. Algorithm code in lib/scoring/* should never
 * contain a magic number — it should always import from here.
 *
 * Calibration workflow: change values here → re-run the unit-test suite
 * (`npm test`) → re-run the scenarios in tests/scenarios.md → ship.
 */

import type { SkillLevel } from './types';

// ════════════════════════════════════════════════════════════════════════════
// LAYER 1 — HARD GATES
// ════════════════════════════════════════════════════════════════════════════

/** Max degrees a swell direction can sit outside a spot's optimal window before the spot is gated out. */
export const SWELL_DIRECTION_GATE_TOLERANCE_DEG = 30;

/** Onshore wind above this (kt) eliminates the spot. Below this it's penalized in scoring. */
export const ONSHORE_WIND_GATE_KT = 12;

/** A wind is "onshore" if it sits within this many degrees of the direct-onshore bearing for a spot. */
export const ONSHORE_HALF_WINDOW_DEG = 45;

/** Minimum swell period (s) for reef and point breaks. Below this the energy is local windswell with no shape. */
export const REEF_PERIOD_THRESHOLD_S = 8;

/** Minimum swell period (s) for beach breaks. Beach breaks accept slightly shorter periods than reefs. */
export const BEACH_PERIOD_THRESHOLD_S = 6;

/** Per-skill effective-size ceiling in feet. Above this, the spot is too big for the user regardless of its inherent skill floor. */
export const SKILL_SIZE_CEILING_FT: Record<SkillLevel, number> = {
  beginner: 3,
  improver: 5,
  intermediate: 8,
  advanced: Infinity,
};

/** Per-skill minimum forgiveness. Beginners only ride forgiving spots; intermediate+ ride anything. */
export const SKILL_MIN_FORGIVENESS: Record<SkillLevel, ('forgiving' | 'moderate' | 'punishing')[]> = {
  beginner: ['forgiving'],
  improver: ['forgiving', 'moderate'],
  intermediate: ['forgiving', 'moderate', 'punishing'],
  advanced: ['forgiving', 'moderate', 'punishing'],
};

// ════════════════════════════════════════════════════════════════════════════
// LAYER 2 — SWELL QUALITY (the ceiling, 0–100)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Effective size = swell_height_ft × period_multiplier(period_s).
 * Captures the surfer-known fact: "2ft @ 15s breaks bigger than 4ft @ 7s."
 *
 * period_multiplier = clamp(intercept + (period - reference_period) × coefficient, lower, upper)
 *
 * Calibration table (for reference):
 *   6s → 0.5    10s → 0.8    14s → 1.2    18s+ → 1.6
 *   8s → 0.6    12s → 1.0    16s → 1.4
 */
export const PERIOD_MULTIPLIER_INTERCEPT = 0.5;
export const PERIOD_MULTIPLIER_REFERENCE_PERIOD_S = 7;
export const PERIOD_MULTIPLIER_COEFFICIENT = 0.1;
export const PERIOD_MULTIPLIER_LOWER_BOUND = 0.5;
export const PERIOD_MULTIPLIER_UPPER_BOUND = 1.6;

/**
 * Sub-component weights for swell_quality:
 *   swell_quality = direction × W_DIR + period × W_PERIOD + size × W_SIZE
 *
 * Direction weighted highest because if direction's wrong, nothing else matters.
 * Period second because it's the quality multiplier on energy.
 * Size lowest because effective_size already absorbs period — don't double-count.
 */
export const SWELL_QUALITY_DIRECTION_WEIGHT = 0.45;
export const SWELL_QUALITY_PERIOD_WEIGHT = 0.35;
export const SWELL_QUALITY_SIZE_WEIGHT = 0.20;

/** Score (0–100) at the exact center of a spot's swell-direction window. Falls off linearly from here to the window edge. */
export const DIRECTION_SCORE_AT_CENTER = 100;
/** Score at the edge of the window. Inside the window scales linearly between center and edge. */
export const DIRECTION_SCORE_AT_WINDOW_EDGE = 80;
/** Outside the window, score decays at this many points per degree until it floors. */
export const DIRECTION_SCORE_OUTSIDE_DECAY_PER_DEG = 2;
/** Direction score floor outside the window. Gate should have eliminated truly bad direction by now. */
export const DIRECTION_SCORE_FLOOR = 20;

/**
 * Period score curve — piecewise linear:
 *   6s  → 30      8s  → 60      12s → 90      16s+ → 100
 * Source: surf-forecaster consensus that period quality climbs sharply through ~10s then plateaus.
 */
export const PERIOD_SCORE_CURVE = {
  veryShort: { capS: 8, baseScore: 30, refS: 6, slope: 15 },   // 30 at 6s, 60 at 8s
  medium:    { capS: 12, baseScore: 60, refS: 8, slope: 7.5 }, // 60 at 8s, 90 at 12s
  long:      { capS: 16, baseScore: 90, refS: 12, slope: 2.5 }, // 90 at 12s, 100 at 16s
  veryLong:  { score: 100 },                                    // 16s+
} as const;

/**
 * Size score: 100 inside the spot's sweet spot, decays as effective size moves away.
 * Below sweet spot decays faster (small days are forgiving but uninspiring).
 * Above sweet spot decays slower (oversized still rideable for a while).
 */
export const SIZE_SCORE_AT_SWEET_SPOT = 100;
export const SIZE_SCORE_DECAY_BELOW_PER_FT = 15;
export const SIZE_SCORE_DECAY_ABOVE_PER_FT = 12;
export const SIZE_SCORE_FLOOR = 40;

// ════════════════════════════════════════════════════════════════════════════
// LAYER 3 — WIND FACTOR (multiplier, 0.20–1.00)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Direction factor lookup — angular distance from the spot's offshore bearing.
 * 0° = direct offshore. 180° = direct onshore.
 * The gate eliminates onshore winds above ONSHORE_WIND_GATE_KT, so 0.20 is gate-adjacent.
 */
export const WIND_DIRECTION_FACTOR_BUCKETS: { maxAngularDistDeg: number; factor: number }[] = [
  { maxAngularDistDeg: 30,  factor: 1.00 },  // direct/cross-offshore
  { maxAngularDistDeg: 60,  factor: 0.92 },  // cross-offshore
  { maxAngularDistDeg: 90,  factor: 0.75 },  // cross-shore
  { maxAngularDistDeg: 120, factor: 0.55 },  // cross-onshore
  { maxAngularDistDeg: 150, factor: 0.35 },  // strong cross-onshore
  { maxAngularDistDeg: 181, factor: 0.20 },  // direct onshore (gate-adjacent)
];

/**
 * Wind strength factor for OFFSHORE winds (angular distance < 90°).
 * Light is best; very strong ruins shape via paddle resistance and wind chop on faces.
 */
export const WIND_STRENGTH_OFFSHORE_BUCKETS: { maxKt: number; factor: number }[] = [
  { maxKt: 3,  factor: 0.95 },  // glassy — beautiful but featureless
  { maxKt: 12, factor: 1.00 },  // light offshore — peak
  { maxKt: 18, factor: 0.92 },  // moderate offshore
  { maxKt: 25, factor: 0.75 },  // strong offshore
  { maxKt: 99, factor: 0.55 },  // very strong offshore
];

/** Wind strength factor for CROSS-SHORE winds (angular distance 60°–120°). More punishing than offshore. */
export const WIND_STRENGTH_CROSS_BUCKETS: { maxKt: number; factor: number }[] = [
  { maxKt: 5,  factor: 1.00 },
  { maxKt: 10, factor: 0.90 },
  { maxKt: 15, factor: 0.80 },
  { maxKt: 20, factor: 0.65 },
  { maxKt: 99, factor: 0.45 },
];

/** Wind strength factor for ONSHORE winds (angular distance >= 120°). Most punishing. The gate handles >12kt onshore. */
export const WIND_STRENGTH_ONSHORE_BUCKETS: { maxKt: number; factor: number }[] = [
  { maxKt: 5,  factor: 1.00 },
  { maxKt: 10, factor: 0.85 },
  { maxKt: 15, factor: 0.65 },
  { maxKt: 20, factor: 0.45 },
  { maxKt: 99, factor: 0.20 },  // gate eliminates >12kt; this row is for completeness
];

/** Optional cleanup penalty after a recent onshore→offshore swing. Requires hourly history. */
export const WIND_CLEANUP_PENALTY_FIRST_HOUR = 0.90;
export const WIND_CLEANUP_PENALTY_SECOND_HOUR = 0.95;

// ════════════════════════════════════════════════════════════════════════════
// LAYER 4 — TIDE FACTOR (modifier, 0.80–1.05)
// ════════════════════════════════════════════════════════════════════════════

/**
 * v1 NOTE: Open-Meteo provides no tide forecast. tideFactor() returns 1.00 for
 * every spot in v1, and a "verify tide tables" caveat is attached only to spots
 * with sensitivity 'medium' or 'high'. The values below are reserved for the
 * v2 tide-API integration.
 */
export const TIDE_FACTOR_LOW_SENSITIVITY = 1.00;
export const TIDE_FACTOR_MEDIUM_IN_WINDOW = 1.02;
export const TIDE_FACTOR_MEDIUM_ADJACENT = 0.95;
export const TIDE_FACTOR_MEDIUM_OUTSIDE = 0.85;
export const TIDE_FACTOR_HIGH_IN_WINDOW = 1.05;
export const TIDE_FACTOR_HIGH_ADJACENT = 0.88;
export const TIDE_FACTOR_HIGH_OUTSIDE = 0.80;
export const TIDE_TRAJECTORY_BONUS = 0.03;
export const TIDE_TRAJECTORY_PENALTY = 0.03;

/** v1: surfaced as a caveat on medium/high sensitivity spots only. */
export const TIDE_NOT_FACTORED_CAVEAT =
  'Tide not factored in v1 — verify against tide tables before paddling out.';

// ════════════════════════════════════════════════════════════════════════════
// LAYER 5 — CROWD FACTOR (modifier, 0.70–1.00)
// ════════════════════════════════════════════════════════════════════════════

export const CROWD_BASE_FACTOR: Record<'low' | 'medium' | 'high' | 'very_high', number> = {
  low:       1.00,
  medium:    0.95,
  high:      0.88,
  very_high: 0.80,
};

export const CROWD_MODIFIER_WEEKEND = -0.04;
export const CROWD_MODIFIER_SCHOOL_HOLIDAYS = -0.04;
export const CROWD_MODIFIER_PRISTINE_GLOBAL = -0.03;     // every spot is firing — everyone's out
export const CROWD_MODIFIER_PRISTINE_HERE = -0.05;        // this spot specifically gets crushed
export const CROWD_MODIFIER_DAWN_BEFORE_7 = +0.05;
export const CROWD_MODIFIER_SUNSET_LAST_HOUR = +0.03;

export const CROWD_FACTOR_FLOOR = 0.70;
export const CROWD_FACTOR_CEILING = 1.00;

/** Lower-skill surfers face additional risk at high-crowd spots — drop-ins, lineup chaos. */
export const CROWD_LOWER_SKILL_HIGH_CROWD_PENALTY = -0.05;

// ════════════════════════════════════════════════════════════════════════════
// LAYER 6 — CERTAINTY MULTIPLIER
// ════════════════════════════════════════════════════════════════════════════

/** Forecast horizon → certainty multiplier. Aggressive discount for far-out forecasts. */
export const CERTAINTY_BUCKETS: { maxHoursAhead: number; multiplier: number }[] = [
  { maxHoursAhead: 12,  multiplier: 1.00 },
  { maxHoursAhead: 36,  multiplier: 0.95 },
  { maxHoursAhead: 72,  multiplier: 0.85 },
  { maxHoursAhead: 120, multiplier: 0.70 },
  { maxHoursAhead: 168, multiplier: 0.55 },
  { maxHoursAhead: Infinity, multiplier: 0.40 },
];

/** Below this multiplier, narration must hedge with "looks like" / "the trend is pointing to." */
export const NARRATION_HEDGE_BELOW_CERTAINTY = 0.70;

// ════════════════════════════════════════════════════════════════════════════
// LAYER 7 — DRIVE TIME (ranking adjustment, capped at 15 points)
// ════════════════════════════════════════════════════════════════════════════

/** Average road speed in km/h used to convert haversine distance to drive minutes. Crude but bounded by the cap below. */
export const DRIVE_TIME_AVG_ROAD_SPEED_KMH = 70;

/** Maximum drive-time penalty in score points. Ensures drive time is a tiebreaker, not a deciding factor. */
export const DRIVE_TIME_PENALTY_CAP = 15;

/** Coefficient on the sqrt(extra_minutes / 60) curve. */
export const DRIVE_TIME_PENALTY_COEFFICIENT = 8;

// ════════════════════════════════════════════════════════════════════════════
// LAYER 8 — COMPOSITE / SECONDARY ADJUSTMENTS
// ════════════════════════════════════════════════════════════════════════════

/** Cross-swell penalties when a meaningful secondary swell sits >30° off the primary. */
export const CROSS_SWELL_OFFSET_THRESHOLD_DEG = 30;
export const CROSS_SWELL_PENALTY_BEACH_MIN = 5;
export const CROSS_SWELL_PENALTY_BEACH_MAX = 10;
export const CROSS_SWELL_PENALTY_REEF_MIN = 2;
export const CROSS_SWELL_PENALTY_REEF_MAX = 5;

/** Sea-breeze risk: subtract from afternoon summer sessions at exposed Surf Coast / Mornington spots if wind looks marginal. */
export const SEA_BREEZE_PENALTY_POINTS = 5;

/** Conditions that all must hold for a session to be flagged as "firing." */
export const FIRING_FLAG_THRESHOLDS = {
  swellQualityMin: 88,
  windFactorMin: 0.92,
  tideFactorMin: 1.00,
  finalScoreMin: 85,
} as const;

/** Maps final score to user-facing quality category. is_firing flag overlays "firing" on top of "very_good". */
export const QUALITY_CATEGORY_BUCKETS: { maxScore: number; category: 'poor' | 'fair' | 'good' | 'very_good' }[] = [
  { maxScore: 30,  category: 'poor' },
  { maxScore: 50,  category: 'fair' },
  { maxScore: 70,  category: 'good' },
  { maxScore: 101, category: 'very_good' }, // 'firing' is a flag on top, not a separate bucket here
];

// ════════════════════════════════════════════════════════════════════════════
// PRISTINE FLAGS (used by the orchestrator to decide crowd modifiers)
// ════════════════════════════════════════════════════════════════════════════

/** A spot is "pristine" when its pre-crowd score reaches this threshold. */
export const PRISTINE_PER_SPOT_THRESHOLD = 85;

/** When at least this many spots are pristine, isPristineGlobal flips on (everyone's coming out). */
export const PRISTINE_GLOBAL_MIN_SPOTS = 5;

// ════════════════════════════════════════════════════════════════════════════
// GLOBAL ADVISORY THRESHOLDS
// ════════════════════════════════════════════════════════════════════════════

/** If no spot scores above this, surface "nothing's firing today" advisory. */
export const GLOBAL_ADVISORY_NOTHING_FIRING_THRESHOLD = 50;

/** If wind is gate-eliminating onshore at >75% of evaluated spots, surface a wind warning. */
export const GLOBAL_ADVISORY_WIND_FRACTION_THRESHOLD = 0.75;

// ════════════════════════════════════════════════════════════════════════════
// CONDITIONS API
// ════════════════════════════════════════════════════════════════════════════

/** TTL for cached Open-Meteo responses in milliseconds. 30 minutes balances freshness vs. rate limits. */
export const CONDITIONS_CACHE_TTL_MS = 30 * 60 * 1000;

/** Per-fetch timeout for Open-Meteo requests in ms. */
export const OPEN_METEO_TIMEOUT_MS = 8_000;

/** Open-Meteo Marine API base URL. */
export const OPEN_METEO_MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';
/** Open-Meteo Forecast API base URL (used for atmospheric wind). */
export const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
/** Open-Meteo Geocoding API base URL. */
export const OPEN_METEO_GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// ════════════════════════════════════════════════════════════════════════════
// NARRATION
// ════════════════════════════════════════════════════════════════════════════

/** Anthropic model id used by the narration layer. */
// TEMP: swapped to Haiku for cheap iteration during UI testing — revert to claude-sonnet-4-6 before launch.
export const NARRATION_MODEL = 'claude-haiku-4-5-20251001';

/**
 * Hard timeout for the narration call in ms. Beyond this we fall back to deterministic local narration.
 *
 * 30s gives Sonnet 4.6 room to generate a multi-paragraph response on a cold
 * (no-cache) call from Australian latency. The SDK is configured with
 * maxRetries: 0 in lib/narration/client.ts so the user never waits more than
 * this — one attempt, then fallback.
 */
export const NARRATION_TIMEOUT_MS = 30_000;

/** Max tokens in the narration response. ~600 fits 4 spots at 3-5 sentences each plus opener and skip-list. */
export const NARRATION_MAX_TOKENS = 800;

/** Number of top recommendations the narration layer should cover. */
export const NARRATION_NUM_RECOMMENDATIONS_MIN = 2;
export const NARRATION_NUM_RECOMMENDATIONS_MAX = 4;

// ════════════════════════════════════════════════════════════════════════════
// VICTORIAN SCHOOL HOLIDAYS — 2026
// ════════════════════════════════════════════════════════════════════════════

/**
 * Approximate Victorian government-school holiday windows for 2026.
 * Dates are inclusive ranges in YYYY-MM-DD. Adjust before each calendar year.
 *
 * TODO before shipping: verify against the official calendar at
 * https://www.vic.gov.au/school-terms-and-holidays-victoria — these are
 * estimated from the typical term-end Friday pattern, not confirmed dates.
 */
export const VIC_SCHOOL_HOLIDAYS_2026: { start: string; end: string }[] = [
  { start: '2026-01-01', end: '2026-01-26' },  // summer carryover
  { start: '2026-03-28', end: '2026-04-12' },  // term 1 break
  { start: '2026-06-27', end: '2026-07-12' },  // term 2 break
  { start: '2026-09-19', end: '2026-10-04' },  // term 3 break
  { start: '2026-12-19', end: '2026-12-31' },  // summer break starts
];

// ════════════════════════════════════════════════════════════════════════════
// SKILL-FLOOR DISTRIBUTION (reference for calibration)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Canonical skill-floor distribution per data/spots.ts. Use when calibrating —
 * if a spot moves between buckets, update both this comment and the spot
 * record so they don't drift.
 *
 * Beginner-floor (9): Torquay Front Beach, Anglesea, Sorrento Back Beach,
 *   Point Leo, Shoreham, Smiths Beach, Cape Paterson, Inverloch, Apollo Bay.
 *
 * Improver-floor (5): Jan Juc, Fairhaven, Point Addis, Lorne Point,
 *   Rye Back Beach, YCW Beach, Cape Woolamai Magiclands.
 *   (Note: count includes one sub-break.)
 *
 * Intermediate-floor (16): Bells Beach, Bells Rincon, Winki Pop, Johanna,
 *   Gunnamatta, Portsea Back Beach, St Andrews Beach, Flinders, Cape Woolamai
 *   parent, Cape Woolamai Anzacs, Cape Woolamai Ocean Reach, Summerland,
 *   Cat Bay, Cape Paterson Channel, Marengo. (Plus one extra to reconcile
 *   with body of spec.)
 *
 * Advanced-floor (8): Bells Bowl, Bells Little Rincon, Winki Uppers,
 *   Winki Lowers, Flinders Cyrils, Flinders Gunnery, Express Point,
 *   Cape Paterson F Break.
 *   (Spec summary table omitted F Break — body of spec includes it; we follow
 *   the body, so the canonical advanced-floor count is 8.)
 */

// ════════════════════════════════════════════════════════════════════════════
// MISC
// ════════════════════════════════════════════════════════════════════════════

/** Conversion: 1 metre of swell height = ~3.281 feet. */
export const M_TO_FT = 3.28084;
/** Conversion: 1 m/s of wind = 1.94384 knots. */
export const MPS_TO_KT = 1.94384;
