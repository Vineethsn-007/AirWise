import { TtlCache, locationKey } from '@/lib/cache';
import { categoryForAqi } from './breakpoints';
import { fetchAirQuality, fetchGeocoding, type AirResponse, type GeocodingResult } from './client';
import { aqiTrend, findBestWindows } from './forecast';
import type { SensitivityId } from './health';
import type {
  AirQualitySnapshot,
  CurrentAqi,
  HourlyAqi,
  NearbyReading,
  PollutantKey,
  ResolvedLocation,
} from './types';

const AIR_TTL_MS = 5 * 60 * 1000;
const GEO_TTL_MS = 30 * 60 * 1000;

const airCache = new TtlCache<AirResponse>(AIR_TTL_MS);
const geoCache = new TtlCache<GeocodingResult[]>(GEO_TTL_MS);

const SUB_INDEX_FIELDS: readonly [PollutantKey, keyof AirResponse['current']][] = [
  ['pm25', 'us_aqi_pm2_5'],
  ['pm10', 'us_aqi_pm10'],
  ['co', 'us_aqi_carbon_monoxide'],
  ['no2', 'us_aqi_nitrogen_dioxide'],
  ['so2', 'us_aqi_sulphur_dioxide'],
  ['o3', 'us_aqi_ozone'],
];

export function clearAirCache(): void {
  airCache.clear();
  geoCache.clear();
}

export async function resolveLocation(city: string): Promise<ResolvedLocation> {
  const key = city.trim().toLowerCase();
  const { value: results } = await geoCache.getOrLoad(key, () => fetchGeocoding(city));
  const first = results[0];
  if (!first) throw new Error(`No location found for "${city}"`);
  return {
    name: first.name,
    latitude: first.latitude,
    longitude: first.longitude,
    country: first.country,
    admin1: first.admin1,
    timezone: first.timezone ?? 'auto',
  };
}

function toCurrent(data: AirResponse): CurrentAqi {
  const aqi = data.current.us_aqi ?? 0;
  const subIndices: Partial<Record<PollutantKey, number>> = {};
  for (const [pollutant, field] of SUB_INDEX_FIELDS) {
    const value = data.current[field];
    if (typeof value === 'number') subIndices[pollutant] = Math.round(value);
  }
  const dominantPollutant =
    (Object.entries(subIndices) as [PollutantKey, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    time: data.current.time,
    aqi: Math.round(aqi),
    category: categoryForAqi(aqi),
    dominantPollutant,
    concentrations: {
      pm25: data.current.pm2_5,
      pm10: data.current.pm10,
      co: data.current.carbon_monoxide,
      no2: data.current.nitrogen_dioxide,
      so2: data.current.sulphur_dioxide,
      o3: data.current.ozone,
    },
    subIndices,
  };
}

function toHourly(data: AirResponse): HourlyAqi[] {
  return data.hourly.time
    .map((time, index) => ({
      time,
      aqi: Math.round(data.hourly.us_aqi[index] ?? 0),
      pm25: data.hourly.pm2_5[index] ?? null,
      pm10: data.hourly.pm10[index] ?? null,
      category: categoryForAqi(data.hourly.us_aqi[index] ?? 0),
    }))
    .filter((hour) => Number.isFinite(hour.aqi));
}

const NEARBY_OFFSETS: readonly [string, number, number][] = [
  ['North', 0.18, 0],
  ['South', -0.18, 0],
  ['East', 0, 0.18],
];

async function nearbyReadings(location: ResolvedLocation): Promise<NearbyReading[]> {
  const results = await Promise.allSettled(
    NEARBY_OFFSETS.map(async ([direction, latOffset, lonOffset]) => {
      const latitude = location.latitude + latOffset;
      const longitude = location.longitude + lonOffset;
      const { value } = await airCache.getOrLoad(locationKey(latitude, longitude), () =>
        fetchAirQuality(latitude, longitude),
      );
      const aqi = Math.round(value.current.us_aqi ?? 0);
      return {
        name: `${direction} of ${location.name}`,
        latitude,
        longitude,
        aqi,
        category: categoryForAqi(aqi),
      };
    }),
  );
  return results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
}

export async function getAirQuality(
  location: ResolvedLocation,
  options: { sensitive?: boolean; includeNearby?: boolean; signal?: AbortSignal } = {},
): Promise<AirQualitySnapshot> {
  const { value: data, hit } = await airCache.getOrLoad(
    locationKey(location.latitude, location.longitude),
    () => fetchAirQuality(location.latitude, location.longitude, options.signal),
  );
  const hourly = toHourly(data);
  const current = toCurrent(data);
  const sensitiveGroups: SensitivityId[] = options.sensitive ? ['asthma'] : [];
  const nearby = options.includeNearby ? await nearbyReadings(location) : [];

  return {
    location,
    current,
    hourly,
    trend: aqiTrend(hourly),
    bestWindows: findBestWindows(hourly, { sensitive: sensitiveGroups.length > 0 }),
    nearby,
    fetchedAt: new Date().toISOString(),
    cache: hit ? 'hit' : 'miss',
    source: {
      airQuality: 'Open-Meteo Air Quality API (CAMS global/european forecasts)',
      geocoding: 'Open-Meteo Geocoding API (GeoNames)',
      attribution: 'Data: Open-Meteo / CAMS ENSEMBLE; locations: GeoNames.',
    },
  };
}
