/**
 * Layer 6 — Certainty multiplier.
 *
 * Forecast accuracy degrades with horizon. The multiplier discounts the
 * final score so that a "firing" 5-day-out forecast doesn't outrank a
 * "good" forecast for tomorrow.
 *
 * Curve from spec:
 *    0–12h   → 1.00
 *   12–36h   → 0.95
 *   36–72h   → 0.85
 *   72–120h  → 0.70
 *  120–168h  → 0.55
 *  168h+     → 0.40
 */

import { CERTAINTY_BUCKETS } from '@/lib/config';

export function certaintyMultiplier(forecastHorizonHours: number): number {
  for (const b of CERTAINTY_BUCKETS) {
    if (forecastHorizonHours <= b.maxHoursAhead) return b.multiplier;
  }
  return CERTAINTY_BUCKETS[CERTAINTY_BUCKETS.length - 1].multiplier;
}
