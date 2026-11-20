import { getAirQuality } from '@/lib/air-quality/service';
import { reason } from '@/lib/ai/reason';
import { clientIdentity, checkRateLimit } from '@/lib/rate-limit';
import { reasonRequestSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json(
      { error: 'OPENROUTER_API_KEY is not configured. Add it to .env.local to enable AI recommendations.' },
      { status: 503 },
    );
  }
  const limit = checkRateLimit(`reason:${clientIdentity(request)}`, {
    limit: 12,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return Response.json(
      { error: 'Too many recommendations. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be JSON.' }, { status: 400 });
  }
  const parsed = reasonRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request.', details: parsed.error.flatten() }, { status: 400 });
  }

  const { intent, location, profile } = parsed.data;
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      try {
        const snapshot = await getAirQuality(location, {
          sensitive: profile.sensitivities.length > 0,
          signal: request.signal,
        });
        send({
          type: 'meta',
          aqi: snapshot.current.aqi,
          category: snapshot.current.category.label,
          cache: snapshot.cache,
        });
        const recommendation = await reason(intent, {
          snapshot,
          profile,
          signal: request.signal,
          onToken: (text) => send({ type: 'token', text }),
        });
        send({ type: 'result', recommendation });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Recommendation failed';
        send({ type: 'error', message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
