/**
 * Display-side height-scale conversion.
 *
 * The scoring engine internally uses face height (the breaking-wave height
 * predicted by the calibrated Komar-Gaughan formula in
 * lib/scoring/effectiveSize.ts). All gate logic and skill ceilings reference
 * face height. The UI and narration display the Hawaiian / Traditional
 * convention — face height divided by 2, rounded to half-foot resolution.
 *
 * Convert ONLY at display boundaries. Never push the traditional value back
 * into the engine; ceilings, sweet spots, and hazards are all calibrated in
 * face-height units.
 */

/** Face-height feet → Traditional/Hawaiian feet (half-foot resolution). */
export function toTraditionalFt(faceFt: number): number {
  if (!Number.isFinite(faceFt) || faceFt <= 0) return 0;
  return Math.round(faceFt) / 2;
}
