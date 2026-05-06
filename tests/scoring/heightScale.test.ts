import { describe, it, expect } from 'vitest';
import { toTraditionalFt } from '@/lib/scoring/heightScale';

describe('toTraditionalFt', () => {
  it('halves face height for whole-foot inputs', () => {
    expect(toTraditionalFt(6)).toBe(3);
    expect(toTraditionalFt(4)).toBe(2);
    expect(toTraditionalFt(10)).toBe(5);
  });

  it('rounds to half-foot resolution', () => {
    expect(toTraditionalFt(5)).toBe(2.5);
    expect(toTraditionalFt(7)).toBe(3.5);
    expect(toTraditionalFt(9)).toBe(4.5);
  });

  it('rounds 0.4ft face fractions down', () => {
    expect(toTraditionalFt(4.4)).toBe(2);   // round(4.4)=4 → 2.0
    expect(toTraditionalFt(5.4)).toBe(2.5); // round(5.4)=5 → 2.5
  });

  it('rounds 0.6ft face fractions up', () => {
    expect(toTraditionalFt(4.6)).toBe(2.5); // round(4.6)=5 → 2.5
    expect(toTraditionalFt(5.6)).toBe(3);   // round(5.6)=6 → 3.0
  });

  it('returns 0 for zero or negative', () => {
    expect(toTraditionalFt(0)).toBe(0);
    expect(toTraditionalFt(-3)).toBe(0);
  });

  it('returns 0 for non-finite inputs (defensive)', () => {
    expect(toTraditionalFt(NaN)).toBe(0);
    expect(toTraditionalFt(Infinity)).toBe(0);
  });
});
