/**
 * End-to-end smoke test for /api/recommend.
 *
 * Prereq: a dev server running on localhost:3000 (`npm run dev`).
 * Run: `npx tsx scripts/smoke-api.ts`
 *
 * Hits the route with three representative payloads, validates the response
 * shape, prints the narration. Exits non-zero on any obvious problem.
 */

import fs from 'node:fs';
import path from 'node:path';

// Load .env.local so the test inherits ANTHROPIC_API_KEY (otherwise the route
// will use the deterministic fallback — fine, the smoke test still works).
function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}
const root = path.resolve(process.cwd());
loadEnvFile(path.join(root, '.env.local'));
loadEnvFile(path.join(root, '.env.local.example'));

const BASE = process.env.SMOKE_API_BASE ?? 'http://localhost:3000';

interface Scenario {
  name: string;
  body: unknown;
  expect: {
    ok: boolean;
    minRankedSpots?: number;
    forbiddenSpotIds?: string[];
  };
}

const scenarios: Scenario[] = [
  {
    name: 'Melbourne intermediate today',
    body: {
      location: { kind: 'text', query: 'Melbourne' },
      skill: 'intermediate',
      timing: { kind: 'today', timeOfDay: 'morning' },
    },
    expect: {
      ok: true,
      // Bells Bowl, Cyrils, Express Point, F Break, Bells Little Rincon are
      // advanced-only. Visibility filter must hide them from intermediates.
      forbiddenSpotIds: [
        'bells-bowl',
        'bells-little-rincon',
        'flinders-cyrils',
        'flinders-gunnery',
        'cape-paterson-f-break',
        'express-point',
        'winki-uppers',
        'winki-lowers',
      ],
    },
  },
  {
    name: 'Melbourne beginner today',
    body: {
      location: { kind: 'text', query: 'Melbourne' },
      skill: 'beginner',
      timing: { kind: 'today', timeOfDay: 'morning' },
    },
    expect: {
      ok: true,
      // Beginners must NEVER see Bells under any conditions.
      forbiddenSpotIds: ['bells-beach', 'bells-bowl', 'bells-rincon', 'johanna', 'gunnamatta'],
    },
  },
  {
    name: 'Geelong improver 4 days out',
    body: {
      location: { kind: 'text', query: 'Geelong' },
      skill: 'improver',
      timing: {
        kind: 'specific',
        date: (() => {
          const d = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
          const pad = (n: number) => n.toString().padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        })(),
        timeOfDay: 'morning',
      },
    },
    expect: {
      ok: true,
      forbiddenSpotIds: ['bells-bowl', 'flinders-cyrils', 'cape-paterson-f-break'],
    },
  },
];

interface ResultFrame {
  type: 'result';
  result: {
    rankedSpots: Array<{
      spotId: string;
      spotName: string;
      driveMinutes: number;
      finalScore: number;
      rankingScore: number;
      qualityCategory: string;
      isFiring: boolean;
      activeHazards: Array<{ hazard: string; severity: string }>;
      caveats: string[];
    }>;
    eliminatedSpotsOfNote: Array<{ spotName: string; reason: string }>;
    globalAdvisory: string | null;
    context: { forecastHorizonHours: number; baselineDriveMinutes: number };
  };
}
interface DeltaFrame { type: 'delta'; text: string }
interface DoneFrame { type: 'done'; fallback: boolean }
type Frame = ResultFrame | DeltaFrame | DoneFrame;

async function runOne(s: Scenario): Promise<boolean> {
  console.log(`\n=== ${s.name} ===`);
  const t0 = Date.now();

  let response: Response;
  try {
    response = await fetch(`${BASE}/api/recommend`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(s.body),
    });
  } catch (err) {
    console.error('  ❌ fetch failed:', err);
    console.error(`  Is the dev server running? Try: npm run dev`);
    return false;
  }

  if (response.status !== 200) {
    const body = await response.text();
    console.error(`  ❌ HTTP ${response.status}: ${body}`);
    return false;
  }
  if (!response.body) {
    console.error('  ❌ response has no body');
    return false;
  }

  // Parse NDJSON line-by-line.
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let resultFrame: ResultFrame | undefined;
  let firstDeltaMs: number | undefined;
  let doneFrame: DoneFrame | undefined;
  let narration = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      const frame = JSON.parse(line) as Frame;
      if (frame.type === 'result') {
        resultFrame = frame;
        const resultMs = Date.now() - t0;
        console.log(`  ✓ result frame in ${resultMs}ms`);
      } else if (frame.type === 'delta') {
        if (firstDeltaMs === undefined) firstDeltaMs = Date.now() - t0;
        narration += frame.text;
      } else if (frame.type === 'done') {
        doneFrame = frame;
      }
    }
  }
  const totalMs = Date.now() - t0;

  if (!resultFrame) {
    console.error('  ❌ no result frame');
    return false;
  }
  if (!doneFrame) {
    console.error('  ❌ stream ended without done frame');
    return false;
  }
  console.log(
    `  ✓ first delta in ${firstDeltaMs ?? '?'}ms, total ${totalMs}ms (fallback=${doneFrame.fallback})`,
  );

  const rs = resultFrame.result.rankedSpots;
  console.log(
    `  ${rs.length} ranked spots; baseline drive ${resultFrame.result.context.baselineDriveMinutes.toFixed(0)}min; horizon ${resultFrame.result.context.forecastHorizonHours}h`,
  );

  // Forbidden-spot check
  if (s.expect.forbiddenSpotIds) {
    const violations = rs.filter((r) => s.expect.forbiddenSpotIds!.includes(r.spotId));
    if (violations.length > 0) {
      console.error(`  ❌ forbidden spots present: ${violations.map((v) => v.spotId).join(', ')}`);
      return false;
    }
  }

  // Ordering check
  for (let i = 1; i < rs.length; i++) {
    if (rs[i - 1].rankingScore < rs[i].rankingScore - 0.001) {
      console.error('  ❌ rankedSpots not sorted by rankingScore desc');
      return false;
    }
  }

  // Print top 3
  for (let i = 0; i < Math.min(3, rs.length); i++) {
    const r = rs[i];
    console.log(
      `    ${i + 1}. ${r.spotName} — ${r.driveMinutes.toFixed(0)}min, score ${r.finalScore.toFixed(0)} (${r.qualityCategory}${r.isFiring ? ', firing' : ''})`,
    );
  }

  if (resultFrame.result.globalAdvisory) {
    console.log(`  Advisory: ${resultFrame.result.globalAdvisory}`);
  }

  if (narration) {
    const preview = narration.split('\n').slice(0, 3).join(' / ');
    console.log(`  Narration preview: ${preview.slice(0, 200)}${preview.length > 200 ? '...' : ''}`);
  }

  return true;
}

async function main() {
  console.log(`Smoke testing ${BASE}/api/recommend\n`);
  let passes = 0;
  for (const s of scenarios) {
    if (await runOne(s)) passes++;
  }
  console.log(`\n${passes}/${scenarios.length} scenarios passed.`);
  process.exit(passes === scenarios.length ? 0 : 1);
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
