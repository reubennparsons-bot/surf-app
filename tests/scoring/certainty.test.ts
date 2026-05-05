import { describe, it, expect } from 'vitest';
import { certaintyMultiplier } from '@/lib/scoring/certainty';

describe('certaintyMultiplier', () => {
  it.each([
    [0, 1.0],
    [6, 1.0],
    [12, 1.0],
    [13, 0.95],
    [36, 0.95],
    [37, 0.85],
    [72, 0.85],
    [73, 0.70],
    [120, 0.70],
    [121, 0.55],
    [168, 0.55],
    [169, 0.40],
    [336, 0.40], // 14 days out
  ])('%i hours ahead → %f', (h, expected) => {
    expect(certaintyMultiplier(h)).toBe(expected);
  });
});
