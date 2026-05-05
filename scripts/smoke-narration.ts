/**
 * One-shot smoke test for the narration layer.
 * Run with: npx tsx scripts/smoke-narration.ts
 *
 * Builds a sample RecommendationResult and calls generateNarration().
 * Prints the resulting prose. Falls back to deterministic output when
 * ANTHROPIC_API_KEY is unset or the API call fails.
 */

import fs from 'node:fs';
import path from 'node:path';

// tsx doesn't auto-load .env.local (that's a Next.js convenience). Load it
// (and .env.local.example as a fallback) here so the script works regardless
// of where the user pasted their key. Tolerant of whitespace and surrounding
// quotes around the value.
function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx < 0) continue;
    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}
const projectRoot = path.resolve(process.cwd());
loadEnvFile(path.join(projectRoot, '.env.local'));
loadEnvFile(path.join(projectRoot, '.env.local.example'));

import { generateNarration } from '../lib/narration/client';
import type { RecommendationResult } from '../lib/types';

const T0 = Date.parse('2026-05-05T22:00:00Z');

const sampleResult: RecommendationResult = {
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
    baselineDriveMinutes: 95,
    generatedAt: T0,
  },
  rankedSpots: [
    {
      spotId: 'bells-rincon',
      spotName: 'Bells — Rincon',
      region: 'Surf Coast',
      driveMinutes: 105,
      extraDriveMinutes: 10,
      swellQuality: 88,
      windFactor: 0.95,
      tideFactor: 1.0,
      crowdFactor: 0.85,
      certaintyMultiplier: 0.95,
      finalScore: 67.5,
      rankingScore: 64.2,
      qualityCategory: 'good',
      isFiring: false,
      effectiveSizeFt: 5.2,
      activeHazards: [
        { hazard: 'rocks', severity: 'caution', reason: 'Rocky reef bottom' },
        { hazard: 'crowd', severity: 'warning', reason: 'High weekend crowd expected' },
      ],
      caveats: [
        'Tide not factored in v1 — verify against tide tables before paddling out.',
      ],
      conditionsSummary: {
        swellHeightFt: 4.1,
        swellPeriodS: 13,
        swellDirectionDeg: 205,
        windSpeedKt: 8,
        windDirectionDeg: 320,
        tideState: 'not factored in v1',
        forecastHorizonHours: 18,
      },
    },
    {
      spotId: 'winki-pop',
      spotName: 'Winki Pop',
      region: 'Surf Coast',
      driveMinutes: 105,
      extraDriveMinutes: 10,
      swellQuality: 84,
      windFactor: 0.95,
      tideFactor: 1.0,
      crowdFactor: 0.80,
      certaintyMultiplier: 0.95,
      finalScore: 60.6,
      rankingScore: 57.3,
      qualityCategory: 'good',
      isFiring: false,
      effectiveSizeFt: 5.2,
      activeHazards: [
        { hazard: 'urchins', severity: 'caution', reason: 'Sea urchins on the reef' },
        { hazard: 'crowd', severity: 'warning', reason: 'Very crowded on weekends' },
      ],
      caveats: [],
      conditionsSummary: {
        swellHeightFt: 4.1,
        swellPeriodS: 13,
        swellDirectionDeg: 205,
        windSpeedKt: 8,
        windDirectionDeg: 320,
        tideState: 'not factored in v1',
        forecastHorizonHours: 18,
      },
    },
  ],
  eliminatedSpotsOfNote: [
    {
      spotId: 'bells-bowl',
      spotName: 'Bells — The Bowl',
      reason: 'skill_below_floor',
      note: 'Bowl exceeds intermediate level today — advanced-only at this size',
      skillAppropriate: false,
    },
  ],
  globalAdvisory: null,
};

async function main() {
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  console.log('=== Narration smoke test ===');
  console.log(
    hasKey
      ? 'ANTHROPIC_API_KEY is set — calling Claude Sonnet 4.6.'
      : 'ANTHROPIC_API_KEY is unset — printing deterministic fallback.',
  );
  console.log('');

  const t0 = Date.now();
  const { text, fallback } = await generateNarration(sampleResult);
  const ms = Date.now() - t0;

  console.log(`--- Output (${fallback ? 'FALLBACK' : 'API'}, ${ms}ms) ---`);
  console.log(text);
  console.log('---');

  if (!hasKey) {
    console.log(
      '\nTo test the live API, set ANTHROPIC_API_KEY and re-run this script.',
    );
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
