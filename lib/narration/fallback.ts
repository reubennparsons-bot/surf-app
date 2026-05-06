/**
 * Deterministic fallback narration.
 *
 * Used when the Anthropic API is unreachable, times out, returns an error, or
 * when ANTHROPIC_API_KEY is unset. Produces terse, structured output derived
 * directly from the RecommendationResult — never hallucinates beyond the data.
 *
 * The output is intentionally less polished than Claude's prose so the user
 * can tell at a glance that they're seeing the fallback, and so they don't
 * mistake AI-generated phrasing for our own.
 */

import { toTraditionalFt } from '@/lib/scoring/heightScale';
import type { RecommendationResult, ScoredSpot } from '@/lib/types';

const SKILL_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  improver: 'Improver',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

function formatDriveMinutes(min: number): string {
  const m = Math.round(min);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h}h` : `${h}h ${r}min`;
}

function formatSpot(s: ScoredSpot, rank: number): string {
  const lines: string[] = [];
  lines.push(`${rank}. ${s.spotName} — ${formatDriveMinutes(s.driveMinutes)} drive`);
  lines.push(
    `   Score ${Math.round(s.finalScore)} (${s.qualityCategory}${s.isFiring ? ', FIRING' : ''})`,
  );
  const c = s.conditionsSummary;
  lines.push(
    `   Swell ${c.swellHeightFt.toFixed(1)}ft @ ${c.swellPeriodS.toFixed(0)}s from ${Math.round(c.swellDirectionDeg)}°, ` +
      `wind ${Math.round(c.windSpeedKt)}kt from ${Math.round(c.windDirectionDeg)}°`,
  );
  lines.push(`   Surf height: ${toTraditionalFt(s.effectiveSizeFt).toFixed(1)}ft (traditional)`);

  if (s.activeHazards.length > 0) {
    const hazardStr = s.activeHazards
      .map((h) => `${h.hazard} (${h.severity})`)
      .join(', ');
    lines.push(`   Hazards: ${hazardStr}`);
  }
  if (s.caveats.length > 0) {
    for (const cv of s.caveats) lines.push(`   Caveat: ${cv}`);
  }
  return lines.join('\n');
}

export function deterministicFallback(result: RecommendationResult): string {
  const out: string[] = [];

  out.push(
    `[Generated locally — Anthropic narration unavailable. Showing structured data only.]`,
  );
  out.push('');
  out.push(
    `${SKILL_LABEL[result.user.skill] ?? result.user.skill} session, ${result.user.sessionTiming}, near ${result.user.location.name}.`,
  );
  out.push('');

  if (result.globalAdvisory) {
    out.push(`Advisory: ${result.globalAdvisory}`);
    out.push('');
  }

  if (result.rankedSpots.length === 0) {
    out.push('No spots are surfable for your skill level under current conditions.');
  } else {
    out.push(
      `Top ${Math.min(4, result.rankedSpots.length)} option${result.rankedSpots.length === 1 ? '' : 's'}:`,
    );
    out.push('');
    const top = result.rankedSpots.slice(0, 4);
    for (let i = 0; i < top.length; i++) {
      out.push(formatSpot(top[i], i + 1));
      out.push('');
    }
  }

  if (result.eliminatedSpotsOfNote.length > 0) {
    out.push('Notable skips:');
    for (const e of result.eliminatedSpotsOfNote.slice(0, 3)) {
      out.push(`- ${e.spotName}: ${e.note}`);
    }
    out.push('');
  }

  out.push(
    `Forecast horizon: ${result.context.forecastHorizonHours}h. ` +
      `Baseline drive: ${formatDriveMinutes(result.context.baselineDriveMinutes)}.`,
  );

  return out.join('\n');
}
