/**
 * POST /api/recommend
 *
 * Orchestrator that ties every layer together:
 *   1. Validate the request body.
 *   2. Resolve the location (geocode text → lat/lng, restricted to Australia).
 *   3. Resolve the target session time as a local-Melbourne ISO string.
 *   4. Visibility-filter the spot pool by user skill (sub-breaks hidden from
 *      lower skills). Saves on conditions API calls vs. fetching for all 39.
 *   5. Fetch live conditions for visible spots in parallel, hitting the
 *      30-min Open-Meteo cache where warm.
 *   6. Run scoreAll() over the result.
 *   7. If no spots survive, return a static "no surfable spots" message
 *      without paying for an Anthropic call.
 *   8. Otherwise call generateNarration() and merge with the structured
 *      result.
 *
 * Uses the web-standard Request/Response interfaces rather than
 * NextRequest/NextResponse so the handler is portable across Next.js
 * versions — this matters under Next.js 16 where some Next-specific
 * helpers shifted.
 */

/**
 * Vercel serverless function timeout. Hobby tier defaults to 10s but allows
 * up to 60s; Pro defaults to 15s but allows up to 300s. The narration stream
 * routinely takes 12-15s, so we explicitly request 60s here. Without this
 * config, narration tokens get truncated mid-sentence on Hobby deploys.
 */
export const maxDuration = 60;

import { spots as ALL_SPOTS } from '@/data/spots';
import { VIC_SCHOOL_HOLIDAYS_2026 } from '@/lib/config';
import { geocode } from '@/lib/conditions/geocoding';
import {
  MELBOURNE_TZ,
  melbourneDateOnly,
  melbourneLocalToUtcMs,
} from '@/lib/conditions/melbourneTime';
import { fetchConditions } from '@/lib/conditions/openMeteo';
import { streamNarration } from '@/lib/narration/client';
import { deterministicFallback } from '@/lib/narration/fallback';
import { scoreAll } from '@/lib/scoring';
import {
  SKILL_ORDER,
  type LiveConditions,
  type LocationInput,
  type RecommendRequest,
  type RecommendResponse,
  type RequestContext,
  type SkillLevel,
  type Spot,
  type TimeOfDay,
  type TimingInput,
  type Visibility,
} from '@/lib/types';

const VALID_SKILLS: SkillLevel[] = ['beginner', 'improver', 'intermediate', 'advanced'];

// ─── Validation ────────────────────────────────────────────────────────────

type ValidationOk<T> = { ok: true; value: T };
type ValidationErr = { ok: false; message: string };
type Validation<T> = ValidationOk<T> | ValidationErr;

function validateRequest(raw: unknown): Validation<RecommendRequest> {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, message: 'request body must be a JSON object' };
  }
  const body = raw as Record<string, unknown>;

  // skill
  if (typeof body.skill !== 'string' || !VALID_SKILLS.includes(body.skill as SkillLevel)) {
    return {
      ok: false,
      message: `skill must be one of: ${VALID_SKILLS.join(', ')}`,
    };
  }
  const skill = body.skill as SkillLevel;

  // location
  const locationResult = validateLocation(body.location);
  if (!locationResult.ok) return locationResult;

  // timing
  const timingResult = validateTiming(body.timing);
  if (!timingResult.ok) return timingResult;

  return {
    ok: true,
    value: {
      skill,
      location: locationResult.value,
      timing: timingResult.value,
    },
  };
}

function validateLocation(raw: unknown): Validation<LocationInput> {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, message: 'location must be an object' };
  }
  const loc = raw as Record<string, unknown>;
  if (loc.kind === 'coords') {
    if (typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
      return { ok: false, message: 'location.lat and location.lng must be numbers' };
    }
    if (loc.lat < -90 || loc.lat > 90 || loc.lng < -180 || loc.lng > 180) {
      return { ok: false, message: 'location coordinates out of range' };
    }
    return {
      ok: true,
      value: {
        kind: 'coords',
        lat: loc.lat,
        lng: loc.lng,
        name: typeof loc.name === 'string' ? loc.name : undefined,
      },
    };
  }
  if (loc.kind === 'text') {
    if (typeof loc.query !== 'string' || loc.query.trim().length === 0) {
      return { ok: false, message: 'location.query must be a non-empty string' };
    }
    return { ok: true, value: { kind: 'text', query: loc.query } };
  }
  return { ok: false, message: 'location.kind must be "coords" or "text"' };
}

const TIME_OF_DAY_SET: ReadonlySet<TimeOfDay> = new Set(['morning', 'midday', 'evening']);

function isTimeOfDay(v: unknown): v is TimeOfDay {
  return typeof v === 'string' && TIME_OF_DAY_SET.has(v as TimeOfDay);
}

function validateTiming(raw: unknown): Validation<TimingInput> {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, message: 'timing must be an object' };
  }
  const t = raw as Record<string, unknown>;
  if (!isTimeOfDay(t.timeOfDay)) {
    return { ok: false, message: 'timing.timeOfDay must be "morning", "midday", or "evening"' };
  }
  if (t.kind === 'today' || t.kind === 'tomorrow') {
    return { ok: true, value: { kind: t.kind, timeOfDay: t.timeOfDay } };
  }
  if (t.kind === 'specific') {
    if (typeof t.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(t.date)) {
      return { ok: false, message: 'timing.date must be a "YYYY-MM-DD" string' };
    }
    return { ok: true, value: { kind: 'specific', date: t.date, timeOfDay: t.timeOfDay } };
  }
  return { ok: false, message: 'timing.kind must be "today", "tomorrow", or "specific"' };
}

// ─── Location resolution ───────────────────────────────────────────────────

async function resolveLocation(
  input: LocationInput,
): Promise<{ name: string; lat: number; lng: number } | null> {
  if (input.kind === 'coords') {
    return { name: input.name ?? 'your location', lat: input.lat, lng: input.lng };
  }
  const result = await geocode(input.query);
  if (!result) return null;
  return { name: result.name, lat: result.lat, lng: result.lng };
}

// ─── Time resolution ───────────────────────────────────────────────────────

const TIME_OF_DAY_HOURS: Record<TimeOfDay, number> = {
  morning: 7,
  midday: 12,
  evening: 17,
};

function dateForTiming(timing: TimingInput, now: Date): string {
  if (timing.kind === 'specific') return timing.date;
  if (timing.kind === 'today') return melbourneDateOnly(now);
  return melbourneDateOnly(new Date(now.getTime() + 24 * 60 * 60 * 1000));
}

/**
 * Returns the Melbourne-local target string ("YYYY-MM-DDTHH:00") used to look
 * up Open-Meteo's hourly arrays. Both Open-Meteo (timezone=auto) and this
 * string are naive Melbourne-local — so Date.parse mis-interprets both
 * identically and the relative match in nearestHourIndex still finds the right
 * hour. For absolute UTC math (e.g. forecast horizon hours), use
 * melbourneLocalToUtcMs instead.
 */
function resolveTargetIso(timing: TimingInput, now: Date = new Date()): string {
  const hh = String(TIME_OF_DAY_HOURS[timing.timeOfDay]).padStart(2, '0');
  return `${dateForTiming(timing, now)}T${hh}:00`;
}

function describeTiming(timing: TimingInput, now: Date = new Date()): string {
  const tod = timing.timeOfDay;
  if (timing.kind === 'today') return `this ${tod}`;
  if (timing.kind === 'tomorrow') return `tomorrow ${tod}`;

  const todayDate = melbourneDateOnly(now);
  const tomorrowDate = melbourneDateOnly(new Date(now.getTime() + 24 * 60 * 60 * 1000));
  if (timing.date === todayDate) return `this ${tod}`;
  if (timing.date === tomorrowDate) return `tomorrow ${tod}`;

  // Render the day name in Melbourne TZ. Pick noon Melbourne to avoid any
  // edge-of-day weekday-rollover ambiguity.
  const targetMs = melbourneLocalToUtcMs(`${timing.date}T12:00`);
  if (Number.isNaN(targetMs)) return `the requested ${tod}`;
  const dayName = new Intl.DateTimeFormat('en-AU', {
    timeZone: MELBOURNE_TZ,
    weekday: 'long',
  }).format(new Date(targetMs));
  return `${dayName} ${tod}`;
}

// ─── Visibility ────────────────────────────────────────────────────────────

function isVisibleToSkill(spot: Spot, skill: SkillLevel): boolean {
  const v: Visibility = spot.visibility;
  if (v === 'all') return true;
  if (v === 'intermediate_advanced') return SKILL_ORDER[skill] >= SKILL_ORDER.intermediate;
  return skill === 'advanced';
}

// ─── Context (request metadata) ────────────────────────────────────────────

function isWeekendInMelbourne(target: Date): boolean {
  const dayName = new Intl.DateTimeFormat('en-AU', {
    timeZone: MELBOURNE_TZ,
    weekday: 'short',
  }).format(target);
  return dayName === 'Sat' || dayName === 'Sun';
}

function isSchoolHolidaysInMelbourne(target: Date): boolean {
  const dateOnly = melbourneDateOnly(target);
  return VIC_SCHOOL_HOLIDAYS_2026.some(
    (range) => dateOnly >= range.start && dateOnly <= range.end,
  );
}

function seasonForMelbourneDate(target: Date): 'summer' | 'autumn' | 'winter' | 'spring' {
  const month = parseInt(
    new Intl.DateTimeFormat('en-CA', { timeZone: MELBOURNE_TZ, month: '2-digit' }).format(target),
    10,
  );
  // Southern hemisphere
  if (month === 12 || month === 1 || month === 2) return 'summer';
  if (month >= 3 && month <= 5) return 'autumn';
  if (month >= 6 && month <= 8) return 'winter';
  return 'spring';
}

function buildContext(targetIso: string, generatedAt: number): RequestContext {
  // targetIso is naive Melbourne local — convert to true UTC ms for horizon math.
  const targetMs = melbourneLocalToUtcMs(targetIso);
  const targetDate = new Date(targetMs);
  const horizonHours = Math.max(
    0,
    Math.round((targetMs - generatedAt) / (60 * 60 * 1000)),
  );
  return {
    forecastHorizonHours: horizonHours,
    isWeekend: isWeekendInMelbourne(targetDate),
    isSchoolHolidays: isSchoolHolidaysInMelbourne(targetDate),
    season: seasonForMelbourneDate(targetDate),
    baselineDriveMinutes: 0, // filled in by scoreAll
    generatedAt,
  };
}

// ─── Handler ───────────────────────────────────────────────────────────────

function jsonResponse<T>(payload: T, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/**
 * NDJSON stream frame contract — a wire-level protocol consumed by the UI.
 *
 *   { type: 'result', result: RecommendationResult }       ← always first
 *   { type: 'delta',  text: string }                        ← repeated, narration tokens
 *   { type: 'done',   fallback: boolean }                   ← always last
 *
 * Validation errors do NOT use this stream — they return a plain JSON
 * error response with a 4xx status before any streaming starts.
 */
type StreamFrame =
  | { type: 'result'; result: ReturnType<typeof scoreAll> }
  | { type: 'delta'; text: string }
  | { type: 'done'; fallback: boolean };

function ndjsonStream(
  produce: (push: (frame: StreamFrame) => void) => Promise<void>,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const push = (frame: StreamFrame) => {
        if (closed) return;
        controller.enqueue(encoder.encode(JSON.stringify(frame) + '\n'));
      };
      try {
        await produce(push);
      } catch (err) {
        // Defensive: if produce() throws unexpectedly, close cleanly.
        console.error('[recommend stream] producer threw:', err);
      } finally {
        closed = true;
        controller.close();
      }
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'x-accel-buffering': 'no', // disable nginx buffering when behind a proxy
    },
  });
}

export async function POST(req: Request): Promise<Response> {
  // 1. Parse body.
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonResponse<RecommendResponse>(
      { ok: false, error: 'invalid_input', message: 'request body must be valid JSON' },
      400,
    );
  }

  // 2. Validate.
  const validation = validateRequest(raw);
  if (!validation.ok) {
    return jsonResponse<RecommendResponse>(
      { ok: false, error: 'invalid_input', message: validation.message },
      400,
    );
  }
  const request = validation.value;

  // 3. Resolve location.
  const location = await resolveLocation(request.location);
  if (!location) {
    return jsonResponse<RecommendResponse>(
      {
        ok: false,
        error: 'geocoding_failed',
        message: `Could not find "${request.location.kind === 'text' ? request.location.query : 'that location'}" in Australia.`,
      },
      400,
    );
  }

  // 4. Resolve target time.
  const targetIso = resolveTargetIso(request.timing);

  // 5. Visibility filter.
  const visibleSpots = ALL_SPOTS.filter((s) => isVisibleToSkill(s, request.skill));

  // 6. Fetch conditions in parallel.
  const conditionsPairs = await Promise.all(
    visibleSpots.map(async (s) => {
      const c = await fetchConditions(s.coordinates.lat, s.coordinates.lng, targetIso);
      return [s.id, c] as const;
    }),
  );
  const conditionsBySpotId = new Map<string, LiveConditions | null>(conditionsPairs);

  // Sanity: if EVERY spot returned null, the conditions API is unavailable.
  const anyConditions = conditionsPairs.some(([, c]) => c !== null);
  if (!anyConditions) {
    return jsonResponse<RecommendResponse>(
      {
        ok: false,
        error: 'conditions_unavailable',
        message:
          'Live ocean conditions are unavailable right now. Try again in a few minutes.',
      },
      503,
    );
  }

  // 7. Score.
  const generatedAt = Date.now();
  const ctx = buildContext(targetIso, generatedAt);
  const result = scoreAll({
    user: {
      skill: request.skill,
      location,
      sessionTiming: describeTiming(request.timing),
    },
    context: ctx,
    conditionsBySpotId,
    candidates: visibleSpots,
  });

  // 8. Stream the response: structured result first (immediate), then
  //    narration deltas as Claude generates them. NDJSON over a
  //    ReadableStream — the UI parses line-by-line for perceived-instant
  //    response.
  return ndjsonStream(async (push) => {
    push({ type: 'result', result });

    // Empty rankedSpots → static message, skip Claude.
    if (result.rankedSpots.length === 0) {
      const fallbackText =
        result.globalAdvisory ??
        `No surfable spots in range for ${request.skill} surfers under current conditions. Conditions may be marginal everywhere — try a different timing or check back later.`;
      push({ type: 'delta', text: fallbackText });
      push({ type: 'done', fallback: true });
      return;
    }

    // Otherwise stream narration; on any failure, emit deterministic fallback
    // as a single delta and mark the response as fallback.
    try {
      for await (const delta of streamNarration(result)) {
        push({ type: 'delta', text: delta });
      }
      push({ type: 'done', fallback: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[recommend] narration streaming failed: ${message}`);
      push({ type: 'delta', text: deterministicFallback(result) });
      push({ type: 'done', fallback: true });
    }
  });
}
