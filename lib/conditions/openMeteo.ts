/**
 * Open-Meteo client for marine swell + atmospheric wind.
 *
 * Two upstream endpoints:
 *   marine-api.open-meteo.com  → swell_wave_*  (primary swell, NOT significant
 *                                wave height — they're different fields).
 *   api.open-meteo.com         → wind_speed_10m / wind_direction_10m, requested
 *                                with wind_speed_unit=kn so we don't convert.
 *
 * Confirmed live at Bass Strait (Bells coords) on 2026-05-05: all required
 * fields present and non-null across 48 hourly slots in both endpoints.
 *
 * fetchConditions() returns null when a fetch fails or when the requested
 * hour has any null in the underlying data — never throws into the caller.
 */

import {
  CONDITIONS_CACHE_TTL_MS,
  M_TO_FT,
  OPEN_METEO_FORECAST_URL,
  OPEN_METEO_MARINE_URL,
  OPEN_METEO_TIMEOUT_MS,
} from '@/lib/config';
import type { LiveConditions } from '@/lib/types';
import { TtlCache } from './cache';

interface MarineHourly {
  time: string[];
  swell_wave_height: (number | null)[];
  swell_wave_period: (number | null)[];
  swell_wave_direction: (number | null)[];
}

interface ForecastHourly {
  time: string[];
  wind_speed_10m: (number | null)[];
  wind_direction_10m: (number | null)[];
}

const marineCache = new TtlCache<MarineHourly>(CONDITIONS_CACHE_TTL_MS);
const forecastCache = new TtlCache<ForecastHourly>(CONDITIONS_CACHE_TTL_MS);

function cacheKey(lat: number, lng: number): string {
  // Round to 4 decimals (~11m precision). Spots are well-separated, so this
  // doesn't merge distinct coordinates but does normalise minor float drift.
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), OPEN_METEO_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) {
      console.warn(`[openMeteo] HTTP ${res.status} for ${url}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[openMeteo] fetch failed for ${url}:`, err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchMarineHourly(lat: number, lng: number): Promise<MarineHourly | null> {
  const key = cacheKey(lat, lng);
  const cached = marineCache.get(key);
  if (cached) return cached;

  const url =
    `${OPEN_METEO_MARINE_URL}` +
    `?latitude=${lat}&longitude=${lng}` +
    `&hourly=swell_wave_height,swell_wave_period,swell_wave_direction` +
    `&timezone=auto&forecast_days=7`;

  const json = await fetchJson<{ hourly: MarineHourly }>(url);
  if (!json?.hourly) return null;

  marineCache.set(key, json.hourly);
  return json.hourly;
}

async function fetchForecastHourly(lat: number, lng: number): Promise<ForecastHourly | null> {
  const key = cacheKey(lat, lng);
  const cached = forecastCache.get(key);
  if (cached) return cached;

  const url =
    `${OPEN_METEO_FORECAST_URL}` +
    `?latitude=${lat}&longitude=${lng}` +
    `&hourly=wind_speed_10m,wind_direction_10m` +
    `&wind_speed_unit=kn&timezone=auto&forecast_days=7`;

  const json = await fetchJson<{ hourly: ForecastHourly }>(url);
  if (!json?.hourly) return null;

  forecastCache.set(key, json.hourly);
  return json.hourly;
}

/**
 * Find the hourly array index whose timestamp is closest to `targetIso`
 * (must be in local Victoria time, format "YYYY-MM-DDTHH:MM"). Returns -1
 * if the target sits outside the forecast window.
 */
function nearestHourIndex(times: string[], targetIso: string): number {
  if (times.length === 0) return -1;
  const target = Date.parse(targetIso);
  if (Number.isNaN(target)) return -1;

  let bestIdx = -1;
  let bestDelta = Infinity;
  for (let i = 0; i < times.length; i++) {
    const t = Date.parse(times[i]);
    const delta = Math.abs(t - target);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestIdx = i;
    }
  }
  // Reject if the closest entry is more than 90 minutes away — target is outside the window.
  if (bestDelta > 90 * 60 * 1000) return -1;
  return bestIdx;
}

/**
 * Fetch live conditions for a spot at a target time.
 *
 * @param lat        spot latitude
 * @param lng        spot longitude
 * @param targetIso  desired session time in local Victoria time, "YYYY-MM-DDTHH:MM"
 * @returns          LiveConditions, or null if fetch failed / data was null at that hour
 */
export async function fetchConditions(
  lat: number,
  lng: number,
  targetIso: string,
): Promise<LiveConditions | null> {
  const [marine, wind] = await Promise.all([
    fetchMarineHourly(lat, lng),
    fetchForecastHourly(lat, lng),
  ]);
  if (!marine || !wind) return null;

  const mIdx = nearestHourIndex(marine.time, targetIso);
  const wIdx = nearestHourIndex(wind.time, targetIso);
  if (mIdx < 0 || wIdx < 0) return null;

  const heightM = marine.swell_wave_height[mIdx];
  const periodS = marine.swell_wave_period[mIdx];
  const swellDirDeg = marine.swell_wave_direction[mIdx];
  const windKt = wind.wind_speed_10m[wIdx];
  const windDirDeg = wind.wind_direction_10m[wIdx];

  if (
    heightM === null || heightM === undefined ||
    periodS === null || periodS === undefined ||
    swellDirDeg === null || swellDirDeg === undefined ||
    windKt === null || windKt === undefined ||
    windDirDeg === null || windDirDeg === undefined
  ) {
    return null;
  }

  const fetchedAt = Date.now();
  const targetMs = Date.parse(targetIso);
  const horizonHours = Number.isNaN(targetMs)
    ? 0
    : Math.max(0, Math.round((targetMs - fetchedAt) / (60 * 60 * 1000)));

  return {
    primarySwell: {
      heightFt: heightM * M_TO_FT,
      periodS,
      directionDeg: swellDirDeg,
    },
    secondarySwell: null, // Open-Meteo Marine v1 does not expose secondary swell components.
    windSpeedKt: windKt,
    windDirectionDeg: windDirDeg,
    forecastHorizonHours: horizonHours,
    fetchedAt,
  };
}

/** Test/diagnostic helper. Not used in normal app flow. */
export function _clearConditionsCacheForTests(): void {
  marineCache.clear();
  forecastCache.clear();
}
