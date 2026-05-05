/**
 * Layer 4 — Tide factor.
 *
 * v1: Open-Meteo provides no tide forecast. tideFactor() returns 1.00 for
 * every spot. The "verify tide tables" caveat is appended only when the
 * spot has medium or high tide sensitivity — pinning it on tide-agnostic
 * spots like Smiths or Jan Juc would be noise.
 *
 * When v2 wires up a tide API, the body of tideFactor() expands to use
 * TIDE_FACTOR_* constants from config; the function signature stays.
 */

import { TIDE_NOT_FACTORED_CAVEAT } from '@/lib/config';
import type { Spot } from '@/lib/types';

export interface TideFactorResult {
  factor: number;
  caveat: string | null;
}

export function tideFactor(spot: Spot): TideFactorResult {
  const sensitivity = spot.tide.sensitivity;
  const caveat =
    sensitivity === 'medium' || sensitivity === 'high'
      ? TIDE_NOT_FACTORED_CAVEAT
      : null;
  return { factor: 1.0, caveat };
}
