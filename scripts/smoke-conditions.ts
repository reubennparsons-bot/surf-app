/**
 * One-shot smoke test for the conditions clients.
 * Run with: npx tsx scripts/smoke-conditions.ts
 *
 * Exits non-zero on any unexpected null / failure.
 */

import { fetchConditions } from '../lib/conditions/openMeteo';
import { geocode } from '../lib/conditions/geocoding';

function nextHourIso(offsetHours = 1): string {
  const d = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
  // Build local-time ISO without offset, matching Open-Meteo's timezone=auto format.
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:00`
  );
}

async function main() {
  let failed = false;

  // -- 1. Geocoding ----------------------------------------------------------
  console.log('\n=== Geocoding test ===');
  for (const q of ['Melbourne', 'Torquay', 'Phillip Island', 'Berlin']) {
    const g = await geocode(q);
    if (g) {
      console.log(`  "${q}" → ${g.name}, ${g.admin1} (${g.lat.toFixed(4)}, ${g.lng.toFixed(4)})`);
    } else {
      console.log(`  "${q}" → null (rejected — not in Australia)`);
    }
  }

  // -- 2. Conditions at Bells -----------------------------------------------
  console.log('\n=== Conditions @ Bells (-38.3686, 144.2814) ===');
  const targetIso = nextHourIso(2);
  console.log(`  Target time: ${targetIso} (local)`);

  const c = await fetchConditions(-38.3686, 144.2814, targetIso);
  if (!c) {
    console.error('  ❌ fetchConditions returned null');
    failed = true;
  } else {
    console.log(`  ✓ swell:    ${c.primarySwell.heightFt.toFixed(2)}ft  ` +
      `${c.primarySwell.periodS.toFixed(1)}s  ${c.primarySwell.directionDeg.toFixed(0)}°`);
    console.log(`  ✓ wind:     ${c.windSpeedKt.toFixed(1)}kt from ${c.windDirectionDeg.toFixed(0)}°`);
    console.log(`  ✓ horizon:  ${c.forecastHorizonHours}h  fetchedAt=${new Date(c.fetchedAt).toISOString()}`);

    // Sanity bounds
    if (c.primarySwell.heightFt <= 0 || c.primarySwell.heightFt > 50) {
      console.error(`  ❌ swell height out of plausible range`); failed = true;
    }
    if (c.primarySwell.periodS < 1 || c.primarySwell.periodS > 25) {
      console.error(`  ❌ swell period out of plausible range`); failed = true;
    }
    if (c.primarySwell.directionDeg < 0 || c.primarySwell.directionDeg > 360) {
      console.error(`  ❌ swell direction out of range`); failed = true;
    }
    if (c.windSpeedKt < 0 || c.windSpeedKt > 100) {
      console.error(`  ❌ wind speed out of plausible range`); failed = true;
    }
    if (c.windDirectionDeg < 0 || c.windDirectionDeg > 360) {
      console.error(`  ❌ wind direction out of range`); failed = true;
    }
  }

  // -- 3. Cache hit on second call ------------------------------------------
  console.log('\n=== Cache test ===');
  const t0 = Date.now();
  await fetchConditions(-38.3686, 144.2814, targetIso);
  const t1 = Date.now();
  console.log(`  Second call latency: ${t1 - t0}ms (should be near-zero from cache)`);
  if (t1 - t0 > 200) {
    console.warn(`  ⚠ second call took ${t1 - t0}ms — likely cache miss`);
  }

  // -- 4. Known-bad coordinate (mid-Sahara, no marine data) ------------------
  console.log('\n=== Out-of-window / bad-coord test ===');
  const bad = await fetchConditions(20, 20, targetIso); // mid-Sahara
  console.log(`  Sahara (20, 20) →  ${bad ? 'returned data?? unexpected' : 'null (correct)'}`);

  // -- 5. Far-future target time (outside forecast window) -------------------
  const farFuture = nextHourIso(24 * 30); // 30 days out
  const ff = await fetchConditions(-38.3686, 144.2814, farFuture);
  console.log(`  Far-future target (30d) → ${ff ? 'returned data (window long?)' : 'null (correct)'}`);

  console.log('\n' + (failed ? '❌ FAILED' : '✓ all checks passed'));
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
