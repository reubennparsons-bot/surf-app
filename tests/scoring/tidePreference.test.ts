import { describe, it, expect } from 'vitest';
import { ALL_PHASES, parseTidePreference } from '@/lib/scoring/tidePreference';
import type { TidePhase } from '@/lib/types';

function set(...phases: TidePhase[]): Set<TidePhase> {
  return new Set(phases);
}

function eq(a: ReadonlySet<TidePhase>, b: ReadonlySet<TidePhase>) {
  if (a.size !== b.size) return false;
  for (const p of a) if (!b.has(p)) return false;
  return true;
}

describe('parseTidePreference', () => {
  it('"Most tides" → all phases (unconstrained)', () => {
    expect(eq(parseTidePreference('Most tides'), ALL_PHASES)).toBe(true);
  });

  it('"All tides" → all phases', () => {
    expect(eq(parseTidePreference('All tides'), ALL_PHASES)).toBe(true);
  });

  it('"Sandbank dependent" → all phases (no tide constraint)', () => {
    expect(eq(parseTidePreference('Sandbank dependent'), ALL_PHASES)).toBe(true);
  });

  it('"Variable" / "Varying" → all phases', () => {
    expect(eq(parseTidePreference('Variable'), ALL_PHASES)).toBe(true);
    expect(eq(parseTidePreference('Varying by sub-break'), ALL_PHASES)).toBe(true);
  });

  it('"Mid to high" → mid + mid_high + high', () => {
    const p = parseTidePreference('Mid to high');
    expect(p.has('mid')).toBe(true);
    expect(p.has('mid_high')).toBe(true);
    expect(p.has('high')).toBe(true);
    expect(p.has('low')).toBe(false);
  });

  it('"Low to mid" → low + mid_low + mid', () => {
    const p = parseTidePreference('Low to mid (jacks up over shallow reef)');
    expect(p.has('low')).toBe(true);
    expect(p.has('mid_low')).toBe(true);
    expect(p.has('mid')).toBe(true);
    expect(p.has('high')).toBe(false);
  });

  it('"Mid-high" → mid + mid_high + high', () => {
    const p = parseTidePreference('Mid-high');
    expect(eq(p, set('mid', 'mid_high', 'high'))).toBe(true);
  });

  it('"High tide" → high only', () => {
    const p = parseTidePreference('High tide');
    expect(eq(p, set('high'))).toBe(true);
  });

  it('"Mid tide" → mid only', () => {
    const p = parseTidePreference('Mid tide');
    expect(eq(p, set('mid'))).toBe(true);
  });

  it('"Mid tide rising" → mid (trajectory ignored at parse-time)', () => {
    const p = parseTidePreference('Mid tide rising');
    expect(p.has('mid')).toBe(true);
  });

  it('"Specific window — local knowledge essential" → all phases', () => {
    expect(eq(parseTidePreference('Specific window — local knowledge essential'), ALL_PHASES)).toBe(true);
  });
});
