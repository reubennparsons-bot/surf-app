/**
 * Type contracts for the Surf App.
 *
 * These shapes flow through every layer:
 *   data/spots.ts        → Spot[]                  (static DNA)
 *   lib/conditions/*     → LiveConditions          (per-spot fetched data)
 *   lib/scoring/*        → ScoredSpot,             (engine output)
 *                          RecommendationResult
 *   app/api/recommend    → RecommendRequest,       (API contract)
 *                          RecommendResponse
 *
 * Tunable thresholds and weights live in lib/config.ts, not here.
 */

// ────────────────────────────────────────────────────────────────────────────
// Skill model
// ────────────────────────────────────────────────────────────────────────────

export type SkillLevel = 'beginner' | 'improver' | 'intermediate' | 'advanced';

export const SKILL_ORDER: Record<SkillLevel, number> = {
  beginner: 0,
  improver: 1,
  intermediate: 2,
  advanced: 3,
};

// ────────────────────────────────────────────────────────────────────────────
// Spot DNA (static — authored in data/spots.ts)
// ────────────────────────────────────────────────────────────────────────────

export type Region =
  | 'Surf Coast'
  | 'Mornington Peninsula'
  | 'Phillip Island'
  | 'Bass Coast'
  | 'Otway Coast';

export type BreakType = 'beach' | 'reef' | 'point' | 'reef_point';

export type Visibility = 'all' | 'intermediate_advanced' | 'advanced';

export type Forgiveness = 'forgiving' | 'moderate' | 'punishing';

export type SizeSensitivity = 'linear' | 'steep';

export type BaselineDifficulty = 'low' | 'moderate' | 'high' | 'expert';

export type CrowdLevel = 'low' | 'medium' | 'high' | 'very_high';

export type Consistency = 'low' | 'medium' | 'high' | 'very_high';

export type Variability = 'low' | 'medium' | 'high';

export type TideSensitivity = 'low' | 'medium' | 'high';

/**
 * Identifies WHEN a spot's hazard is active. The actual predicate logic lives
 * in lib/scoring/hazards.ts; spots reference activation by key so the static
 * data stays declarative.
 */
export type HazardActivationKey =
  | 'always'
  | 'low_tide_small_swell_reef'
  | 'large_size_below_advanced'
  | 'any_size_below_advanced'
  | 'strong_rip_with_onshore'
  | 'crowd_for_lower_skill'
  | 'sea_breeze_summer_afternoon'
  | 'shore_break_above_threshold'
  | 'submerged_groyne'
  | 'shallow_reef_low_tide';

export type HazardSeverity = 'caution' | 'warning' | 'danger';

/**
 * A potential hazard at a spot. Whether it's surfaced to the user as an
 * "active hazard" is decided per-session by the scoring engine using the
 * `activation` key.
 */
export interface HazardRule {
  hazard: string;
  description: string;
  activation: HazardActivationKey;
  severity: HazardSeverity;
  /** If set, the hazard only applies when the user is at one of these skill levels. */
  appliesToSkill?: SkillLevel[];
}

/**
 * Inclusive degree window for a swell or wind direction, in compass degrees.
 * If min > max, the window wraps through 0° (e.g. {min: 350, max: 10}).
 */
export interface DirectionWindow {
  min: number;
  max: number;
}

export interface SizeRangeFt {
  min: number;
  max: number;
}

/**
 * Full static profile of a surf spot. Hand-authored in data/spots.ts.
 *
 * Field-mapping decisions (locked in v1 plan):
 * - `skillFloor` is the absolute minimum skill level the spot can ever accept,
 *   even on its smallest, cleanest day. Dynamic skill checks at scoring time
 *   handle "but only on small days."
 * - `sweetSpot` defaults to the middle 50% of the working size range when the
 *   source data doesn't call out an explicit sweet spot.
 * - `optimalSwellDirection` is a 60° window centered on the compass bearing
 *   when the source data only specifies a compass direction.
 * - `offshoreDirection` is the midpoint of the optimal-wind range.
 * - `notable` is `true` only for the eight famous spots that drive the
 *   "what to skip and why" list when eliminated.
 */
export interface Spot {
  id: string;
  name: string;
  region: Region;
  coordinates: { lat: number; lng: number };

  /** null for parent spots; set to parent id for sub-breaks. */
  parentId: string | null;
  visibility: Visibility;
  notable: boolean;

  breakType: BreakType;

  workingSize: SizeRangeFt;
  sweetSpot: SizeRangeFt;

  optimalSwellDirection: DirectionWindow;
  /** Minimum acceptable swell period (s). Below this the energy is windswell. */
  optimalSwellPeriod: number;

  /** Compass degrees of "best offshore" wind direction (midpoint of preferred range). */
  offshoreDirection: number;
  /** Half-width of the offshore window (degrees). Default 45. */
  offshoreBand: number;

  tide: {
    sensitivity: TideSensitivity;
    preference: string;
  };

  baselineDifficulty: BaselineDifficulty;
  forgiveness: Forgiveness;
  sizeSensitivity: SizeSensitivity;
  skillFloor: SkillLevel;
  hazards: HazardRule[];

  crowd: CrowdLevel;
  /** Drive time from Melbourne CBD in minutes. Used as a sanity check vs. haversine. */
  driveFromMelbourneCBDMinutes: number;
  consistency: Consistency;
  variability: Variability;
  bestSeason: string;
  notes: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Live conditions (per spot, fetched at request time)
// ────────────────────────────────────────────────────────────────────────────

export interface SwellComponent {
  /** Swell height in feet. Open-Meteo returns metres; convert at the boundary. */
  heightFt: number;
  /** Period in seconds. */
  periodS: number;
  /** Direction the swell is moving FROM, in compass degrees. */
  directionDeg: number;
}

export interface LiveConditions {
  primarySwell: SwellComponent;
  secondarySwell: SwellComponent | null;
  /** Surface wind speed in knots. Open-Meteo returns m/s; convert at the boundary. */
  windSpeedKt: number;
  /** Wind direction FROM, in compass degrees. */
  windDirectionDeg: number;
  /** Hours from "now" to the forecast time used. Drives the certainty multiplier. */
  forecastHorizonHours: number;
  /** Epoch ms when this snapshot was fetched (drives cache + freshness display). */
  fetchedAt: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Scoring engine output
// ────────────────────────────────────────────────────────────────────────────

export type QualityCategory = 'poor' | 'fair' | 'good' | 'very_good' | 'firing';

export interface ActiveHazard {
  hazard: string;
  severity: HazardSeverity;
  reason: string;
}

export interface ConditionsSummary {
  swellHeightFt: number;
  swellPeriodS: number;
  swellDirectionDeg: number;
  windSpeedKt: number;
  windDirectionDeg: number;
  /** Tide is not factored in v1; this is a free-form text field for narration. */
  tideState: string;
  forecastHorizonHours: number;
}

/**
 * Why a spot was eliminated by the gate layer. Used both internally and for
 * surfacing notable eliminations to the user via `eliminatedSpotsOfNote`.
 */
export type EliminationReason =
  | 'skill_below_floor'
  | 'skill_above_user_ceiling'
  | 'swell_too_small'
  | 'swell_too_big'
  | 'swell_direction_off'
  | 'period_too_short'
  | 'wind_onshore'
  | 'hazard_active'
  | 'visibility_hidden';

export interface EliminationDetail {
  spotId: string;
  spotName: string;
  reason: EliminationReason;
  /** Human-readable explanation injected into narration. */
  note: string;
  /** True if the spot WAS within the user's skill — i.e. eliminated by conditions, not skill. */
  skillAppropriate: boolean;
}

export interface ScoredSpot {
  spotId: string;
  spotName: string;
  region: Region;
  driveMinutes: number;
  extraDriveMinutes: number;

  swellQuality: number;        // 0–100
  windFactor: number;          // 0.20–1.00
  tideFactor: number;          // 0.80–1.05 (v1: always 1.00)
  crowdFactor: number;         // 0.70–1.00
  certaintyMultiplier: number; // 0.40–1.00

  finalScore: number;          // 0–100, post all factors
  rankingScore: number;        // finalScore minus drive penalty

  qualityCategory: QualityCategory;
  isFiring: boolean;

  /** Effective wave size in feet, accounting for period multiplier. */
  effectiveSizeFt: number;

  activeHazards: ActiveHazard[];
  caveats: string[];

  conditionsSummary: ConditionsSummary;
}

export interface UserContext {
  skill: SkillLevel;
  location: { name: string; lat: number; lng: number };
  /** Free-form e.g. "Saturday morning", "today", "tomorrow 4pm". */
  sessionTiming: string;
}

export interface RequestContext {
  forecastHorizonHours: number;
  isWeekend: boolean;
  isSchoolHolidays: boolean;
  season: 'summer' | 'autumn' | 'winter' | 'spring';
  baselineDriveMinutes: number;
  /** Epoch ms — when the engine ran. */
  generatedAt: number;
}

export interface RecommendationResult {
  user: UserContext;
  context: RequestContext;
  rankedSpots: ScoredSpot[];
  eliminatedSpotsOfNote: EliminationDetail[];
  /** Surface "nothing's good today" or other regional warnings. null if not relevant. */
  globalAdvisory: string | null;
}

// ────────────────────────────────────────────────────────────────────────────
// API contract: /api/recommend
// ────────────────────────────────────────────────────────────────────────────

export type LocationInput =
  | { kind: 'coords'; lat: number; lng: number; name?: string }
  | { kind: 'text'; query: string };

export type TimeOfDay = 'morning' | 'midday' | 'evening';

export type TimingInput =
  | { kind: 'today'; timeOfDay: TimeOfDay }
  | { kind: 'tomorrow'; timeOfDay: TimeOfDay }
  /** date is "YYYY-MM-DD" in Melbourne local time. */
  | { kind: 'specific'; date: string; timeOfDay: TimeOfDay };

export interface RecommendRequest {
  location: LocationInput;
  skill: SkillLevel;
  timing: TimingInput;
}

export type RecommendResponse =
  | {
      ok: true;
      result: RecommendationResult;
      narration: string;
      /** True when the Anthropic call failed and the deterministic fallback was used. */
      narrationFallback: boolean;
    }
  | {
      ok: false;
      /** Stable string the UI can branch on. */
      error:
        | 'invalid_input'
        | 'geocoding_failed'
        | 'conditions_unavailable'
        | 'no_surfable_spots'
        | 'internal_error';
      message: string;
    };
