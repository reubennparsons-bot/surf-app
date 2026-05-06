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

function validateTiming(raw: unknown): Validation<TimingInput> {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, message: 'timing must be an object' };
  }
  const t = raw as Record<string, unknown>;
  if (t.kind === 'today' || t.kind === 'tomorrow') {
    return { ok: true, value: { kind: t.kind } };
  }
  if (t.kind === 'specific') {
    if (typeof t.iso !== 'string' || Number.isNaN(Date.parse(t.iso))) {
      return { ok: false, message: 'timing.iso must be a parseable ISO date-time string' };
    }
    return { ok: true, value: { kind: 'specific', iso: t.iso } };
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

const MELBOURNE_TZ = 'Australia/Melbourne';

function formatMelbourneIso(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MELBOURNE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  // Round minutes down to the hour — Open-Meteo hourly data is on the hour.
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:00`;
}

function melbourneDateOnly(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MELBOURNE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function resolveTargetIso(timing: TimingInput, now: Date = new Date()): string {
  if (timing.kind === 'specific') {
    // Caller-supplied ISO; assumed to be Melbourne local. Normalise to hour.
    const d = new Date(timing.iso);
    if (!Number.isNaN(d.getTime())) return formatMelbourneIso(d);
    return timing.iso;
  }
  if (timing.kind === 'today') {
    const target = new Date(now.getTime() + 60 * 60 * 1000);
    return formatMelbourneIso(target);
  }
  // tomorrow → 8am Melbourne local
  const tomorrowDate = melbourneDateOnly(new Date(now.getTime() + 24 * 60 * 60 * 1000));
  return `${tomorrowDate}T08:00`;
}

function describeTiming(timing: TimingInput, now: Date = new Date()): string {
  if (timing.kind === 'today') return 'today';
  if (timing.kind === 'tomorrow') return 'tomorrow morning';

  const target = new Date(timing.iso);
  if (Number.isNaN(target.getTime())) return 'the requested session';

  const todayDate = melbourneDateOnly(now);
  const targetDate = melbourneDateOnly(target);
  if (targetDate === todayDate) return 'today';

  const tomorrowDate = melbourneDateOnly(new Date(now.getTime() + 24 * 60 * 60 * 1000));
  const dayName = new Intl.DateTimeFormat('en-AU', {
    timeZone: MELBOURNE_TZ,
    weekday: 'long',
  }).format(target);
  const hour = parseInt(
    new Intl.DateTimeFormat('en-AU', {
      timeZone: MELBOURNE_TZ,
      hour: 'numeric',
      hour12: false,
    }).format(target),
    10,
  );
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  if (targetDate === tomorrowDate) return `tomorrow ${timeOfDay}`;
  return `${dayName} ${timeOfDay}`;
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
  const targetDate = new Date(targetIso);
  const horizonHours = Math.max(
    0,
    Math.round((targetDate.getTime() - generatedAt) / (60 * 60 * 1000)),
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
