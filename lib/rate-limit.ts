interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Fixed-window in-memory limiter. Suitable for a single Vercel-style instance;
 * swap for a shared store (Upstash) when scaling to multiple regions.
 */
export function checkRateLimit(
  identity: string,
  options: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(identity) ?? { timestamps: [] };
  const active = bucket.timestamps.filter((time) => now - time < options.windowMs);
  const allowed = active.length < options.limit;
  if (allowed) active.push(now);
  buckets.set(identity, { timestamps: active });

  return {
    allowed,
    remaining: Math.max(0, options.limit - active.length),
    retryAfterSeconds: allowed
      ? 0
      : Math.max(1, Math.ceil((options.windowMs - (now - (active[0] ?? now))) / 1000)),
  };
}

export function clientIdentity(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local';
}
