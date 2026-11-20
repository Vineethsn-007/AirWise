interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/** Small in-process TTL cache with in-flight request coalescing. */
export class TtlCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  private readonly pending = new Map<string, Promise<T>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): T {
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    return value;
  }

  async getOrLoad(key: string, load: () => Promise<T>): Promise<{ value: T; hit: boolean }> {
    const cached = this.get(key);
    if (cached !== undefined) return { value: cached, hit: true };
    const existing = this.pending.get(key);
    if (existing) return { value: await existing, hit: true };

    const task = load()
      .then((value) => this.set(key, value))
      .finally(() => this.pending.delete(key));
    this.pending.set(key, task);
    return { value: await task, hit: false };
  }

  clear(): void {
    this.entries.clear();
  }
}

export function locationKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
}
