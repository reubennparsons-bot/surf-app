/**
 * Open-Meteo Geocoding wrapper, biased to Australia.
 *
 * The raw API returns global results — searching "Torquay" returns the
 * UK Torquay first with the Victorian one further down. Since this is a
 * Victorian surf app, we prefer Australian results. If none of the
 * top-N are Australian we surface null so the caller can show a clear
 * "we couldn't find that place in Australia" error.
 */

import { CONDITIONS_CACHE_TTL_MS, OPEN_METEO_GEOCODING_URL, OPEN_METEO_TIMEOUT_MS } from '@/lib/config';
import { TtlCache } from './cache';

interface GeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
}

interface GeoResponse {
  results?: GeoResult[];
}

export interface GeocodedLocation {
  name: string;
  lat: number;
  lng: number;
  /** State/region label e.g. "Victoria". May be empty when the upstream omits it. */
  admin1: string;
}

const geoCache = new TtlCache<GeocodedLocation | null>(CONDITIONS_CACHE_TTL_MS);

export async function geocode(query: string): Promise<GeocodedLocation | null> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return null;

  const key = `geo:${trimmed.toLowerCase()}`;
  const cached = geoCache.get(key);
  if (cached !== undefined) return cached;

  const url =
    `${OPEN_METEO_GEOCODING_URL}` +
    `?name=${encodeURIComponent(trimmed)}` +
    `&count=10&language=en&format=json`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), OPEN_METEO_TIMEOUT_MS);

  let json: GeoResponse | null = null;
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) {
      console.warn(`[geocoding] HTTP ${res.status} for query "${trimmed}"`);
      geoCache.set(key, null);
      return null;
    }
    json = (await res.json()) as GeoResponse;
  } catch (err) {
    console.warn(`[geocoding] fetch failed for query "${trimmed}":`, err);
    return null; // don't cache transient failures
  } finally {
    clearTimeout(timer);
  }

  const results = json?.results ?? [];
  const australian = results.find((r) => r.country_code === 'AU');
  const winner = australian ?? null; // strict: Australia-only for v1

  if (!winner) {
    geoCache.set(key, null);
    return null;
  }

  const location: GeocodedLocation = {
    name: winner.name,
    lat: winner.latitude,
    lng: winner.longitude,
    admin1: winner.admin1 ?? '',
  };
  geoCache.set(key, location);
  return location;
}

/** Test/diagnostic helper. */
export function _clearGeocodingCacheForTests(): void {
  geoCache.clear();
}
