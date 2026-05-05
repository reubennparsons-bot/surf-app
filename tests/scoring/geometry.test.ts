import { describe, it, expect } from 'vitest';
import {
  angularDistance,
  distanceFromWindow,
  isInWindow,
  windowCenter,
  windowHalfWidth,
} from '@/lib/scoring/geometry';

describe('angularDistance', () => {
  it('zero for identical bearings', () => {
    expect(angularDistance(180, 180)).toBe(0);
  });
  it('handles small differences', () => {
    expect(angularDistance(10, 30)).toBe(20);
  });
  it('handles wraparound near 0°/360°', () => {
    expect(angularDistance(350, 10)).toBe(20);
    expect(angularDistance(10, 350)).toBe(20);
  });
  it('caps at 180', () => {
    expect(angularDistance(0, 180)).toBe(180);
    expect(angularDistance(0, 200)).toBe(160);
  });
  it('normalises out-of-range inputs', () => {
    expect(angularDistance(-10, 350)).toBe(0);
    expect(angularDistance(370, 10)).toBe(0);
  });
});

describe('isInWindow', () => {
  it('inside a normal window', () => {
    expect(isInWindow(200, { min: 196, max: 215 })).toBe(true);
  });
  it('at window edges', () => {
    expect(isInWindow(196, { min: 196, max: 215 })).toBe(true);
    expect(isInWindow(215, { min: 196, max: 215 })).toBe(true);
  });
  it('outside a normal window', () => {
    expect(isInWindow(195, { min: 196, max: 215 })).toBe(false);
    expect(isInWindow(216, { min: 196, max: 215 })).toBe(false);
  });
  it('wraparound window: inside on the lo side', () => {
    expect(isInWindow(355, { min: 350, max: 10 })).toBe(true);
  });
  it('wraparound window: inside on the hi side', () => {
    expect(isInWindow(5, { min: 350, max: 10 })).toBe(true);
  });
  it('wraparound window: outside', () => {
    expect(isInWindow(180, { min: 350, max: 10 })).toBe(false);
  });
});

describe('windowCenter', () => {
  it('normal window: midpoint of min/max', () => {
    expect(windowCenter({ min: 196, max: 215 })).toBe(205.5);
    expect(windowCenter({ min: 195, max: 255 })).toBe(225);
  });
  it('wraparound window: centre across 0°', () => {
    expect(windowCenter({ min: 350, max: 10 })).toBe(0);
    expect(windowCenter({ min: 340, max: 20 })).toBe(0);
  });
});

describe('windowHalfWidth', () => {
  it('normal window', () => {
    expect(windowHalfWidth({ min: 196, max: 215 })).toBe(9.5);
    expect(windowHalfWidth({ min: 195, max: 255 })).toBe(30);
  });
  it('wraparound window', () => {
    expect(windowHalfWidth({ min: 350, max: 10 })).toBe(10);
    expect(windowHalfWidth({ min: 340, max: 20 })).toBe(20);
  });
});

describe('distanceFromWindow', () => {
  it('zero inside the window', () => {
    expect(distanceFromWindow(200, { min: 196, max: 215 })).toBe(0);
    expect(distanceFromWindow(196, { min: 196, max: 215 })).toBe(0);
  });
  it('distance to nearest edge outside the window', () => {
    expect(distanceFromWindow(190, { min: 196, max: 215 })).toBe(6);
    expect(distanceFromWindow(225, { min: 196, max: 215 })).toBe(10);
  });
  it('handles wraparound window', () => {
    expect(distanceFromWindow(340, { min: 350, max: 10 })).toBe(10);
    expect(distanceFromWindow(20, { min: 350, max: 10 })).toBe(10);
    expect(distanceFromWindow(180, { min: 350, max: 10 })).toBe(170);
  });
});
