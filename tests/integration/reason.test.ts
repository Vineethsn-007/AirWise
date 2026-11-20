import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/reason/route';
import { clearAirCache } from '@/lib/air-quality/service';
import { clearMemo } from '@/lib/memo';
import { DEFAULT_PROFILE } from '@/lib/profile';
import { airPayload, geocodingPayload, installFetchMock, openRouterStream } from '../network-fixtures';

interface StreamEvent {
  type: string;
  text?: string;
  message?: string;
  recommendation?: {
    actions: unknown[];
    model: string;
    generation: string;
    facts: { currentAqi: number };
  };
}

function request(body: unknown, identity: string) {
  return new Request('http://localhost:3000/api/reason', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': identity },
    body: JSON.stringify(body),
  });
}

const validBody = {
  intent: 'routine',
  location: {
    name: 'Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    timezone: 'Asia/Kolkata',
  },
  profile: DEFAULT_PROFILE,
};

async function events(response: Response): Promise<StreamEvent[]> {
  const raw = await response.text();
  return raw
    .split(/\r?\n\r?\n/)
    .filter((chunk) => chunk.trim().startsWith('data:'))
    .map((chunk) => JSON.parse(chunk.replace(/^data:\s*/, '').trim()) as StreamEvent);
}

describe('POST /api/reason', () => {
  beforeAll(() => {
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  beforeEach(() => {
    clearAirCache();
    clearMemo();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns an explicit error when no API key is configured', async () => {
    delete process.env.OPENROUTER_API_KEY;
    const response = await POST(request(validBody, '20.0.0.1'));
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain('OPENROUTER_API_KEY');
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  it('validates input before calling any upstream service', async () => {
    const { mock, calls } = installFetchMock();
    vi.stubGlobal('fetch', mock);
    const response = await POST(request({ intent: 'unknown', location: {}, profile: {} }, '20.0.0.2'));
    expect(response.status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it('streams tokens then a grounded recommendation', async () => {
    const { mock, calls } = installFetchMock();
    vi.stubGlobal('fetch', mock);
    const response = await POST(request(validBody, '20.0.0.3'));
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/event-stream');
    const parsed = await events(response);
    expect(parsed.some((event) => event.type === 'meta')).toBe(true);
    expect(parsed.filter((event) => event.type === 'token').length).toBeGreaterThan(10);
    const result = parsed.find((event) => event.type === 'result');
    expect(result?.recommendation?.actions).toHaveLength(3);
    expect(result?.recommendation?.facts.currentAqi).toBe(165);
    expect(result?.recommendation?.generation).toBe('llm');
    expect(calls.some((url) => url.includes('openrouter.ai'))).toBe(true);
  });

  it('falls back to the free-model router when the primary model is rate limited', async () => {
    let openRouterCalls = 0;
    const fetchMock = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('geocoding-api')) return Response.json(geocodingPayload());
      if (url.includes('air-quality-api')) return Response.json(airPayload());
      if (url.includes('openrouter.ai')) {
        openRouterCalls += 1;
        if (openRouterCalls === 1) return new Response('rate limited', { status: 429 });
        return openRouterStream();
      }
      throw new Error(`Unexpected fetch ${url}`);
    };
    vi.stubGlobal('fetch', fetchMock);
    const response = await POST(request(validBody, '20.0.0.4'));
    const parsed = await events(response);
    const result = parsed.find((event) => event.type === 'result');
    expect(openRouterCalls).toBe(2);
    expect(result?.recommendation?.model).toBe('openrouter/free');
  });

  it('reports an upstream error without fabricating a recommendation', async () => {
    const fetchMock = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('air-quality-api')) return new Response('down', { status: 503 });
      throw new Error(`Unexpected fetch ${url}`);
    };
    vi.stubGlobal('fetch', fetchMock);
    const response = await POST(request(validBody, '20.0.0.5'));
    const parsed = await events(response);
    expect(parsed.some((event) => event.type === 'error')).toBe(true);
    expect(parsed.some((event) => event.type === 'result')).toBe(false);
  });
});
