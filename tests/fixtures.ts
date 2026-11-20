import { categoryForAqi } from '@/lib/air-quality/breakpoints';
import type { AirQualitySnapshot, HourlyAqi } from '@/lib/air-quality/types';
import { DEFAULT_PROFILE, type HouseholdProfile } from '@/lib/profile';

export function makeHours(values: number[]): HourlyAqi[] {
  return values.map((aqi, index) => ({
    time: `2026-11-20T${String(index).padStart(2, '0')}:00`,
    aqi,
    pm25: aqi / 2,
    pm10: aqi,
    category: categoryForAqi(aqi),
  }));
}

export function makeSnapshot(overrides: Partial<AirQualitySnapshot> = {}): AirQualitySnapshot {
  const hours = makeHours([120, 110, 95, 80, 70, 65, 90, 130, 160, 155]);
  return {
    location: {
      name: 'Delhi',
      latitude: 28.6139,
      longitude: 77.209,
      country: 'India',
      admin1: 'Delhi',
      timezone: 'Asia/Kolkata',
    },
    current: {
      time: '2026-11-20T08:00',
      aqi: 165,
      category: categoryForAqi(165),
      dominantPollutant: 'pm25',
      concentrations: { pm25: 62.4, pm10: 140, co: 800, no2: 45, so2: 12, o3: 30 },
      subIndices: { pm25: 165, pm10: 140 },
    },
    hourly: hours,
    trend: 'improving',
    bestWindows: [
      {
        start: '2026-11-20T12:00',
        end: '2026-11-20T14:00',
        averageAqi: 75,
        category: categoryForAqi(75),
        reason: 'Lowest forecast pollution in this window; good for outdoor time.',
      },
    ],
    nearby: [],
    fetchedAt: '2026-11-20T08:00:00.000Z',
    cache: 'miss',
    source: {
      airQuality: 'Open-Meteo',
      geocoding: 'Open-Meteo',
      attribution: 'Data: Open-Meteo / CAMS ENSEMBLE; locations: GeoNames.',
    },
    ...overrides,
  };
}

export function makeProfile(overrides: Partial<HouseholdProfile> = {}): HouseholdProfile {
  return {
    ...DEFAULT_PROFILE,
    sensitivities: ['children', 'asthma'],
    activities: ['schoolRun', 'commute'],
    indoor: { gasStove: true, noAc: true, pets: false, purifier: true },
    commute: { mode: 'car', distanceKm: 8, occupants: 1, tripsPerWeek: 5 },
    plainLanguage: true,
    ...overrides,
  };
}
