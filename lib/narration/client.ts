/**
 * Anthropic API wrapper for the narration layer.
 *
 * Wraps client.messages.create() with:
 *   - the static system prompt + cache_control (every request reuses the same
 *     prompt, so prompt caching cuts both cost and latency materially)
 *   - 8s per-request timeout
 *   - typed-exception error handling
 *   - deterministic fallback on any failure path
 *
 * The structured RecommendationResult is serialised to a snake_case JSON
 * payload before being sent — matching the field names the system prompt
 * references (eliminated_spots_of_note, global_advisory, etc.).
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  NARRATION_MAX_TOKENS,
  NARRATION_MODEL,
  NARRATION_TIMEOUT_MS,
} from '@/lib/config';
import type { RecommendationResult, ScoredSpot } from '@/lib/types';
import { deterministicFallback } from './fallback';
import { NARRATION_SYSTEM_PROMPT } from './prompt';

export interface NarrationResult {
  text: string;
  fallback: boolean;
}

function snakeSpot(s: ScoredSpot) {
  return {
    spot_id: s.spotId,
    spot_name: s.spotName,
    region: s.region,
    drive_minutes: Math.round(s.driveMinutes),
    extra_drive_minutes: Math.round(s.extraDriveMinutes),
    final_score: Number(s.finalScore.toFixed(1)),
    ranking_score: Number(s.rankingScore.toFixed(1)),
    quality_category: s.qualityCategory,
    is_firing: s.isFiring,
    swell_quality: Number(s.swellQuality.toFixed(1)),
    wind_factor: Number(s.windFactor.toFixed(2)),
    tide_factor: Number(s.tideFactor.toFixed(2)),
    crowd_factor: Number(s.crowdFactor.toFixed(2)),
    certainty_multiplier: Number(s.certaintyMultiplier.toFixed(2)),
    effective_size_ft: Number(s.effectiveSizeFt.toFixed(1)),
    active_hazards: s.activeHazards,
    caveats: s.caveats,
    conditions_summary: {
      swell_height_ft: Number(s.conditionsSummary.swellHeightFt.toFixed(1)),
      swell_period_s: Number(s.conditionsSummary.swellPeriodS.toFixed(1)),
      swell_direction_deg: Math.round(s.conditionsSummary.swellDirectionDeg),
      wind_speed_kt: Math.round(s.conditionsSummary.windSpeedKt),
      wind_direction_deg: Math.round(s.conditionsSummary.windDirectionDeg),
      tide_state: s.conditionsSummary.tideState,
      forecast_horizon_hours: s.conditionsSummary.forecastHorizonHours,
    },
  };
}

export function serialiseForNarration(result: RecommendationResult) {
  return {
    user: {
      skill_level: result.user.skill,
      location: result.user.location,
      session_timing: result.user.sessionTiming,
    },
    context: {
      forecast_horizon_hours: result.context.forecastHorizonHours,
      is_weekend: result.context.isWeekend,
      is_school_holidays: result.context.isSchoolHolidays,
      season: result.context.season,
      baseline_drive_minutes: Math.round(result.context.baselineDriveMinutes),
    },
    ranked_spots: result.rankedSpots.map(snakeSpot),
    eliminated_spots_of_note: result.eliminatedSpotsOfNote,
    global_advisory: result.globalAdvisory,
  };
}

/**
 * Build the request body shared by streaming and non-streaming paths.
 */
function buildRequestParams(payload: ReturnType<typeof serialiseForNarration>) {
  return {
    model: NARRATION_MODEL,
    max_tokens: NARRATION_MAX_TOKENS,
    system: [
      {
        type: 'text' as const,
        text: NARRATION_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' as const },
      },
    ],
    messages: [
      {
        role: 'user' as const,
        content: `Engine output for this session:\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
  };
}

/**
 * Streaming narration — yields text deltas as Claude generates them.
 *
 * Throws on transport/auth/timeout failure so the API route can fall back to
 * deterministic narration in one place. Caller MUST be prepared to handle
 * exceptions; downstream of the throw the route emits the deterministic
 * fallback as a single delta.
 *
 * Returns null if ANTHROPIC_API_KEY is unset — caller treats as "skip
 * Anthropic, use fallback."
 */
export async function* streamNarration(
  result: RecommendationResult,
): AsyncGenerator<string, void, void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }
  const client = new Anthropic({ apiKey, maxRetries: 0 });
  const payload = serialiseForNarration(result);

  const stream = client.messages.stream(buildRequestParams(payload), {
    timeout: NARRATION_TIMEOUT_MS,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}

/**
 * Generate narration for the given recommendation result (non-streaming).
 *
 * Returns the deterministic fallback if ANTHROPIC_API_KEY is unset, the
 * Anthropic call fails, or it times out. Never throws — always resolves to
 * something the UI can render. Used by tests and any non-UI consumer; the
 * streaming variant is what the API route actually sends to the browser.
 */
export async function generateNarration(
  result: RecommendationResult,
): Promise<NarrationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return { text: deterministicFallback(result), fallback: true };
  }

  // maxRetries: 0 — for a user-facing call we'd rather fall back fast than
  // burn the full timeout budget on SDK auto-retries. The user is waiting.
  const client = new Anthropic({ apiKey, maxRetries: 0 });
  const payload = serialiseForNarration(result);

  try {
    const response = await client.messages.create(buildRequestParams(payload), {
      timeout: NARRATION_TIMEOUT_MS,
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    if (text.length === 0) {
      console.warn('[narration] empty response from API; using fallback');
      return { text: deterministicFallback(result), fallback: true };
    }

    return { text, fallback: false };
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.warn(`[narration] API error ${err.status}: ${err.message}`);
    } else if (err instanceof Error) {
      console.warn(`[narration] error: ${err.message}`);
    } else {
      console.warn('[narration] unknown error', err);
    }
    return { text: deterministicFallback(result), fallback: true };
  }
}
