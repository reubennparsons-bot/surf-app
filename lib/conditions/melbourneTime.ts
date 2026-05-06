/**
 * Melbourne timezone helpers.
 *
 * Centralised so the route, the conditions fetch, and tests all agree on how
 * naive "Melbourne local" date strings convert to real UTC milliseconds. Both
 * AEST (UTC+10) and AEDT (UTC+11) are handled — the offset is read from the
 * runtime's IANA tz database via Intl.DateTimeFormat at the requested moment.
 */

export const MELBOURNE_TZ = 'Australia/Melbourne';

/**
 * Returns Melbourne's UTC offset in milliseconds at the given moment.
 * Positive value (e.g. +10h or +11h) — Melbourne is east of UTC.
 */
export function melbourneOffsetMs(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MELBOURNE_TZ,
    timeZoneName: 'longOffset',
  }).formatToParts(date);
  const tz = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+10:00';
  const m = tz.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!m) return 10 * 60 * 60 * 1000;
  const sign = m[1] === '+' ? 1 : -1;
  return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10)) * 60 * 1000;
}

/**
 * Convert a naive Melbourne-local datetime string into real UTC milliseconds.
 * Input format: "YYYY-MM-DDTHH:MM" (no timezone suffix). The string is
 * interpreted as Melbourne wall-clock time at that moment.
 *
 * Note: ambiguous times during the AEST↔AEDT transition (1 hour twice a year)
 * may be off by 1 hour. Acceptable for v1 — surf forecasts are not minute-precise.
 */
export function melbourneLocalToUtcMs(localIso: string): number {
  // Step 1: pretend the string is UTC to get a rough timestamp.
  const asIfUtc = Date.parse(`${localIso}:00Z`);
  if (Number.isNaN(asIfUtc)) return NaN;
  // Step 2: subtract Melbourne's offset at that moment to recover true UTC.
  return asIfUtc - melbourneOffsetMs(new Date(asIfUtc));
}

/**
 * Returns the Melbourne calendar date ("YYYY-MM-DD") for the given moment.
 */
export function melbourneDateOnly(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MELBOURNE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
