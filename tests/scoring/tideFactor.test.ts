import { describe, it, expect } from 'vitest';
import { tideFactor } from '@/lib/scoring/tideFactor';
import { spotById } from '@/data/spots';
import type { Spot } from '@/lib/types';

const BELLS_BOWL = spotById.get('bells-bowl') as Spot;       // sensitivity high
const BELLS = spotById.get('bells-beach') as Spot;            // medium
const SMITHS = spotById.get('smiths-beach') as Spot;          // low
const JAN_JUC = spotById.get('jan-juc') as Spot;              // low

describe('tideFactor (v1 stub)', () => {
  it('factor is always 1.00 in v1', () => {
    expect(tideFactor(BELLS_BOWL).factor).toBe(1.0);
    expect(tideFactor(BELLS).factor).toBe(1.0);
    expect(tideFactor(SMITHS).factor).toBe(1.0);
    expect(tideFactor(JAN_JUC).factor).toBe(1.0);
  });

  it('high sensitivity: caveat present', () => {
    expect(tideFactor(BELLS_BOWL).caveat).toMatch(/tide not factored/i);
  });

  it('medium sensitivity: caveat present', () => {
    expect(tideFactor(BELLS).caveat).toMatch(/tide not factored/i);
  });

  it('low sensitivity: NO caveat (no noise on tide-agnostic spots)', () => {
    expect(tideFactor(SMITHS).caveat).toBeNull();
    expect(tideFactor(JAN_JUC).caveat).toBeNull();
  });
});
