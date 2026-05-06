import { describe, it, expect } from 'vitest';
import {
  melbourneDateOnly,
  melbourneLocalToUtcMs,
  melbourneOffsetMs,
} from '@/lib/conditions/melbourneTime';

describe('melbourneOffsetMs', () => {
  it('returns +10h during AEST (winter)', () => {
    // 15 July 2026 — winter in Australia, no DST → AEST (+10).
    const winter = new Date('2026-07-15T00:00:00Z');
    expect(melbourneOffsetMs(winter)).toBe(10 * 60 * 60 * 1000);
  });

  it('returns +11h during AEDT (summer)', () => {
    // 15 January 2026 — summer in Australia → AEDT (+11).
    const summer = new Date('2026-01-15T00:00:00Z');
    expect(melbourneOffsetMs(summer)).toBe(11 * 60 * 60 * 1000);
  });
});

describe('melbourneLocalToUtcMs', () => {
  it('converts AEST winter local time to UTC', () => {
    // Melbourne 8am on 15 July 2026 (AEST, +10) = UTC 22:00 on 14 July 2026.
    const ms = melbourneLocalToUtcMs('2026-07-15T08:00');
    expect(new Date(ms).toISOString()).toBe('2026-07-14T22:00:00.000Z');
  });

  it('converts AEDT summer local time to UTC', () => {
    // Melbourne 8am on 15 January 2026 (AEDT, +11) = UTC 21:00 on 14 January 2026.
    const ms = melbourneLocalToUtcMs('2026-01-15T08:00');
    expect(new Date(ms).toISOString()).toBe('2026-01-14T21:00:00.000Z');
  });

});

describe('melbourneDateOnly', () => {
  it('returns the Melbourne calendar date for a UTC moment', () => {
    // 14 July 2026 23:00 UTC = 15 July 2026 09:00 Melbourne (AEST +10)
    const d = new Date('2026-07-14T23:00:00Z');
    expect(melbourneDateOnly(d)).toBe('2026-07-15');
  });

  it('handles AEDT summer offset for date rollover', () => {
    // 14 January 2026 14:00 UTC = 15 January 2026 01:00 Melbourne (AEDT +11)
    const d = new Date('2026-01-14T14:00:00Z');
    expect(melbourneDateOnly(d)).toBe('2026-01-15');
  });
});
