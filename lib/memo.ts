interface MemoEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, MemoEntry<unknown>>();

/** Short-lived per-process memo for identical recommendation requests. */
export function memoize<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const entry = store.get(key);
  if (entry && entry.expiresAt > Date.now()) return Promise.resolve(entry.value as T);
  return load().then((value) => {
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  });
}

export function clearMemo(): void {
  store.clear();
}

export function recommendationKey(
  intent: string,
  location: { latitude: number; longitude: number },
  profile: unknown,
  hourBucket: number,
): string {
  return `${intent}:${location.latitude.toFixed(2)}:${location.longitude.toFixed(2)}:${hourBucket}:${JSON.stringify(profile)}`;
}
