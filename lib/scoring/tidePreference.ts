/**
 * Parse a free-form spot.tide.preference string into the set of preferred
 * tide phases.
 *
 * The spot data uses prose like "Mid to high" / "Low to mid (jacks up over
 * shallow reef)" / "Most tides" / "Sandbank dependent". We classify each
 * string into a Set<TidePhase> so tideFactor can do membership/adjacency
 * checks. When the string is unconstrained ("all tides", "varies", "sandbank
 * dependent" etc.) we return the full 5-phase set — meaning every phase is
 * "in window" and the factor stays at the medium-sensitivity 1.02 baseline.
 */

import type { TidePhase } from '@/lib/types';

export const ALL_PHASES: ReadonlySet<TidePhase> = new Set([
  'low',
  'mid_low',
  'mid',
  'mid_high',
  'high',
]);

/** Phrases that imply "no specific tide window — works most/all tides". */
const UNCONSTRAINED_HINTS = [
  'all tides',
  'most tides',
  'any tide',
  'varying',
  'variable',
  'sandbank dependent',
  'different sub-breaks',
  'specific window',
  'local knowledge',
  'varies by',
  'different tides',
  'works varying',
];

export function parseTidePreference(preference: string): ReadonlySet<TidePhase> {
  const s = preference.toLowerCase();

  // If the string is essentially unconstrained, every phase is fine.
  for (const hint of UNCONSTRAINED_HINTS) {
    if (s.includes(hint)) return ALL_PHASES;
  }

  const out = new Set<TidePhase>();

  // Range patterns first ("X to Y", "X-Y").
  // Match before single-keyword scans so we expand the range correctly.
  const range = s.match(/(low|mid|high)\s*(?:to|-|–|—)\s*(low|mid|high)/);
  if (range) {
    const a = range[1] as 'low' | 'mid' | 'high';
    const b = range[2] as 'low' | 'mid' | 'high';
    addPhasesInRange(out, a, b);
  }

  // "mid-high" / "mid high" → mid_high bucket plus its neighbours mid + high
  if (/\bmid[\s-]?high\b/.test(s)) {
    out.add('mid');
    out.add('mid_high');
    out.add('high');
  }
  if (/\bmid[\s-]?low\b/.test(s)) {
    out.add('low');
    out.add('mid_low');
    out.add('mid');
  }

  // Single keywords. "Mid tide" / "High tide" / "Low tide".
  // These add the matching bucket only — narrower than ranges.
  if (out.size === 0) {
    if (/\bhigh\b/.test(s)) out.add('high');
    if (/\bmid\b/.test(s)) out.add('mid');
    if (/\blow\b/.test(s)) out.add('low');
  }

  return out.size === 0 ? ALL_PHASES : out;
}

/** Inclusive range expansion across the 5-step phase ladder. */
function addPhasesInRange(
  set: Set<TidePhase>,
  a: 'low' | 'mid' | 'high',
  b: 'low' | 'mid' | 'high',
) {
  const startIdx = a === 'low' ? 0 : a === 'mid' ? 2 : 4;
  const endIdx = b === 'low' ? 0 : b === 'mid' ? 2 : 4;
  const ladder: TidePhase[] = ['low', 'mid_low', 'mid', 'mid_high', 'high'];
  const lo = Math.min(startIdx, endIdx);
  const hi = Math.max(startIdx, endIdx);
  for (let i = lo; i <= hi; i++) set.add(ladder[i]);
}
