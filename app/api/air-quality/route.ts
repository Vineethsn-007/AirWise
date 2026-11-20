import { NextResponse } from 'next/server';
import { getAirQuality, resolveLocation } from '@/lib/air-quality/service';
import { clientIdentity, checkRateLimit } from '@/lib/rate-limit';
import { airQualityQuerySchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const limit = checkRateLimit(`air-quality:${clientIdentity(request)}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many air-quality requests. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  const url = new URL(request.url);
  const parsed = airQualityQuerySchema.safeParse({
    city: url.searchParams.get('city') ?? undefined,
    latitude: url.searchParams.get('latitude') ?? undefined,
    longitude: url.searchParams.get('longitude') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid location query.', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const location = parsed.data.city
      ? await resolveLocation(parsed.data.city)
      : {
          name: 'Selected coordinates',
          latitude: parsed.data.latitude as number,
          longitude: parsed.data.longitude as number,
          timezone: 'auto',
        };
    const snapshot = await getAirQuality(location, {
      includeNearby: url.searchParams.get('nearby') === '1',
      signal: request.signal,
    });
    return NextResponse.json(snapshot, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load air quality';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
