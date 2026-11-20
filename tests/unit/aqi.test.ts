import { describe, expect, it } from 'vitest';
import { categoryForAqi, computeSubIndex } from '@/lib/air-quality/breakpoints';
import { estimateSwap, formatKg } from '@/lib/air-quality/emissions';
import { aqiTrend, findBestWindows } from '@/lib/air-quality/forecast';
import { explainHealth, hasSensitiveGroup } from '@/lib/air-quality/health';
import type { HourlyAqi } from '@/lib/air-quality/types';

function hour(index: number, aqi: number): HourlyAqi {
  const time = `2026-11-20T${String(index).padStart(2, '0')}:00`;
  return { time, aqi, pm25: null, pm10: null, category: categoryForAqi(aqi) };
}

describe('EPA AQI category lookup', () => {
  it.each([
    [0, 'good'],
    [50, 'good'],
    [51, 'moderate'],
    [100, 'moderate'],
    [101, 'sensitive'],
    [150, 'sensitive'],
    [151, 'unhealthy'],
    [200, 'unhealthy'],
    [201, 'very'],
    [300, 'very'],
    [301, 'hazardous'],
    [500, 'hazardous'],
  ])('maps AQI %i to %s', (aqi, id) => {
    expect(categoryForAqi(aqi).id).toBe(id);
  });

  it('never returns an uncategorised value for extreme or invalid input', () => {
    expect(categoryForAqi(900).id).toBe('hazardous');
    expect(categoryForAqi(Number.NaN).id).toBe('good');
  });
});

describe('published pollutant breakpoints', () => {
  it('interpolates PM2.5 at exact published boundaries', () => {
    expect(computeSubIndex('pm25', 0)).toBe(0);
    expect(computeSubIndex('pm25', 9)).toBe(50);
    expect(computeSubIndex('pm25', 35.5)).toBe(100);
    expect(computeSubIndex('pm25', 55.5)).toBe(150);
  });

  it('interpolates PM10 and CO using their own units', () => {
    expect(computeSubIndex('pm10', 55)).toBe(50);
    expect(computeSubIndex('pm10', 155)).toBe(100);
    expect(computeSubIndex('co', 4.5)).toBe(50);
  });

  it('takes the higher of the O3 and SO2 averaging windows', () => {
    expect(computeSubIndex('o3', 125)).toBeGreaterThan(200);
    expect(computeSubIndex('so2', 305)).toBeGreaterThanOrEqual(200);
    expect(computeSubIndex('so2', 1000)).toBeGreaterThan(300);
  });

  it('clamps above the top breakpoint and rejects negative input', () => {
    expect(computeSubIndex('pm25', 1000)).toBe(500);
    expect(computeSubIndex('pm25', -4)).toBe(0);
  });
});

describe('deterministic health guidance', () => {
  it('uses EPA category wording without an LLM', () => {
    const explanation = explainHealth(160, []);
    expect(explanation.category.label).toBe('Unhealthy');
    expect(explanation.whatItMeans).toContain('general public may feel effects');
  });

  it('adds sensitive-group guidance when flagged', () => {
    const explanation = explainHealth(160, ['asthma', 'children']);
    expect(hasSensitiveGroup(['asthma'])).toBe(true);
    expect(explanation.forYourHousehold).toContain('Asthma');
    expect(explanation.forYourHousehold).toContain('avoid outdoor exertion');
  });
});

describe('emissions factors', () => {
  it('computes a real per-person saving', () => {
    const result = estimateSwap({ distanceKm: 8, from: 'car', to: 'cycle', occupants: 1 });
    expect(result.savedKgCo2e).toBeCloseTo(8 * 0.20751, 5);
    expect(formatKg(result.savedKgCo2e)).toBe('1.66 kg');
  });

  it('shares a car factor between occupants', () => {
    const result = estimateSwap({ distanceKm: 10, from: 'car', to: 'bus', occupants: 2 });
    expect(result.fromFactor).toBeCloseTo(0.20751 / 2, 5);
    expect(result.savedKgCo2e).toBeCloseTo(10 * (0.20751 / 2 - 0.0965), 5);
  });

  it('never claims a negative or unbounded saving', () => {
    const result = estimateSwap({ distanceKm: 20, from: 'rail', to: 'car', tripsPerWeek: 5 });
    expect(result.savedKgCo2e).toBe(0);
    expect(estimateSwap({ distanceKm: 9999, from: 'car', to: 'walk' }).distanceKm).toBe(500);
  });
});

describe('forecast reasoning', () => {
  const hours = [10, 14, 18, 22, 30, 55, 60, 58, 40, 32].map((aqi, index) => hour(index + 6, aqi));

  it('detects an improving or worsening trend', () => {
    expect(aqiTrend(hours)).toBe('worsening');
    expect(aqiTrend([60, 55, 50, 40, 30, 20].map((aqi, index) => hour(index, aqi)))).toBe('improving');
    expect(aqiTrend([hour(6, 10), hour(7, 12), hour(8, 11)])).toBe('steady');
  });

  it('ranks non-overlapping cleaner windows deterministically', () => {
    const windows = findBestWindows(hours, { count: 2, durationHours: 2 });
    expect(windows).toHaveLength(2);
    expect(windows[0]?.averageAqi).toBeLessThanOrEqual(windows[1]?.averageAqi ?? 0);
    expect(windows[0]?.reason).toContain('forecast');
  });

  it('penalises moderate pollution more for sensitive households', () => {
    const normal = findBestWindows(hours, { count: 1 })[0];
    const sensitive = findBestWindows(hours, { count: 1, sensitive: true })[0];
    expect(normal?.averageAqi).toBeLessThanOrEqual(sensitive?.averageAqi ?? 500);
  });
});
