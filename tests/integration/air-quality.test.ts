import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/air-quality/route';
import { clearAirCache } from '@/lib/air-quality/service';
import { installFetchMock } from '../network-fixtures';

function request(url: string, identity: string) {
  return new Request(`http://localhost:3000${url}`, {
    headers: { 'x-forwarded-for': identity },
  });
}

describe('GET /api/air-quality', () => {
  beforeEach(() => {
    clearAirCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('geocodes a city and returns real live-shaped AQI data', async () => {
    const { mock, calls } = installFetchMock();
    vi.stubGlobal('fetch', mock);
    const response = await GET(request('/api/air-quality?city=Delhi', '10.0.0.1'));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.location.name).toBe('Delhi');
    expect(payload.current.aqi).toBe(165);
    expect(payload.current.category.label).toBe('Unhealthy');
    expect(payload.hourly).toHaveLength(48);
    expect(payload.cache).toBe('miss');
    expect(payload.source.attribution).toContain('Open-Meteo');
    expect(calls.some((url) => url.includes('geocoding-api'))).toBe(true);
    expect(calls.some((url) => url.includes('air-quality-api'))).toBe(true);
  });

  it('caches per location so repeated requests do not re-hit Open-Meteo', async () => {
    const { mock, calls } = installFetchMock();
    vi.stubGlobal('fetch', mock);
    const first = await GET(request('/api/air-quality?latitude=28.61&longitude=77.21', '10.0.0.2'));
    const second = await GET(request('/api/air-quality?latitude=28.61&longitude=77.21', '10.0.0.2'));
    expect((await first.json()).cache).toBe('miss');
    expect((await second.json()).cache).toBe('hit');
    expect(calls.filter((url) => url.includes('air-quality-api'))).toHaveLength(1);
  });

  it('rejects an invalid query before any upstream call', async () => {
    const { mock, calls } = installFetchMock();
    vi.stubGlobal('fetch', mock);
    const response = await GET(request('/api/air-quality?latitude=28.61', '10.0.0.3'));
    expect(response.status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it('returns a clear error when Open-Meteo fails', async () => {
    const { mock } = installFetchMock({ failAir: true });
    vi.stubGlobal('fetch', mock);
    const response = await GET(request('/api/air-quality?latitude=28.61&longitude=77.21', '10.0.0.4'));
    expect(response.status).toBe(502);
    expect((await response.json()).error).toContain('503');
  });

  it('enforces the per-client rate limit', async () => {
    const { mock } = installFetchMock();
    vi.stubGlobal('fetch', mock);
    for (let index = 0; index < 30; index += 1) {
      await GET(request('/api/air-quality?latitude=28.61&longitude=77.21', '10.0.0.99'));
    }
    const response = await GET(request('/api/air-quality?latitude=28.61&longitude=77.21', '10.0.0.99'));
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBeTruthy();
  });
});
