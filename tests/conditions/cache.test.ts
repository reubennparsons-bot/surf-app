import { describe, it, expect } from 'vitest';
import { TtlCache } from '@/lib/conditions/cache';

describe('TtlCache', () => {
  it('returns undefined for missing keys', () => {
    const c = new TtlCache<string>(1000);
    expect(c.get('nope')).toBeUndefined();
  });

  it('returns set values within TTL', () => {
    const c = new TtlCache<string>(1000);
    c.set('a', 'hello', undefined, 1000);
    expect(c.get('a', 1500)).toBe('hello'); // 500ms after set
  });

  it('expires values after TTL', () => {
    const c = new TtlCache<string>(1000);
    c.set('a', 'hello', undefined, 1000);
    expect(c.get('a', 2001)).toBeUndefined(); // 1001ms after set
  });

  it('respects per-call TTL override', () => {
    const c = new TtlCache<string>(60_000);
    c.set('a', 'hello', 500, 1000);
    expect(c.get('a', 1300)).toBe('hello');
    expect(c.get('a', 1600)).toBeUndefined();
  });

  it('has() reflects expiry', () => {
    const c = new TtlCache<string>(1000);
    c.set('a', 'hello', undefined, 1000);
    expect(c.has('a', 1500)).toBe(true);
    expect(c.has('a', 2500)).toBe(false);
  });

  it('delete removes the entry', () => {
    const c = new TtlCache<string>(1000);
    c.set('a', 'hello');
    c.delete('a');
    expect(c.get('a')).toBeUndefined();
  });

  it('clear empties the cache', () => {
    const c = new TtlCache<string>(1000);
    c.set('a', 'x');
    c.set('b', 'y');
    c.clear();
    expect(c.size()).toBe(0);
  });

  it('expired-on-read evicts the entry', () => {
    const c = new TtlCache<string>(1000);
    c.set('a', 'hello', undefined, 1000);
    c.get('a', 5000); // way past expiry — should evict
    expect(c.size()).toBe(0);
  });
});
