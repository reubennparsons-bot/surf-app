/**
 * Tiny in-memory TTL cache. Used by the Open-Meteo and geocoding clients to
 * stay polite with the public API and to make repeat requests near-instant.
 *
 * Survives only the lifetime of the Node process — Vercel may spin up new
 * processes, so cache hit rate is best-effort. That's fine for v1.
 */

export class TtlCache<V> {
  private readonly entries = new Map<string, { value: V; expiresAt: number }>();

  constructor(private readonly defaultTtlMs: number) {}

  get(key: string, now: number = Date.now()): V | undefined {
    const entry = this.entries.get(key);
    if (entry === undefined) return undefined;
    if (entry.expiresAt <= now) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: V, ttlMs: number = this.defaultTtlMs, now: number = Date.now()): void {
    this.entries.set(key, { value, expiresAt: now + ttlMs });
  }

  has(key: string, now: number = Date.now()): boolean {
    return this.get(key, now) !== undefined;
  }

  delete(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }

  /** For tests / diagnostics only. */
  size(): number {
    return this.entries.size;
  }
}
