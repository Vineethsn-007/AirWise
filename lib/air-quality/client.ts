import { z } from 'zod';

const nullableNumber = z
  .union([z.number(), z.null()])
  .optional()
  .transform((value) => (typeof value === 'number' ? value : null));

const currentSchema = z.object({
  time: z.string().min(1),
  us_aqi: nullableNumber,
  pm2_5: nullableNumber,
  pm10: nullableNumber,
  carbon_monoxide: nullableNumber,
  nitrogen_dioxide: nullableNumber,
  sulphur_dioxide: nullableNumber,
  ozone: nullableNumber,
  us_aqi_pm2_5: nullableNumber,
  us_aqi_pm10: nullableNumber,
  us_aqi_carbon_monoxide: nullableNumber,
  us_aqi_nitrogen_dioxide: nullableNumber,
  us_aqi_sulphur_dioxide: nullableNumber,
  us_aqi_ozone: nullableNumber,
});

const hourlySchema = z.object({
  time: z.array(z.string()),
  us_aqi: z.array(nullableNumber).default([]),
  pm2_5: z.array(nullableNumber).default([]),
  pm10: z.array(nullableNumber).default([]),
});

export const airResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string().default('auto'),
  current: currentSchema,
  hourly: hourlySchema,
  error: z.literal(true).optional(),
  reason: z.string().optional(),
});

export type AirResponse = z.infer<typeof airResponseSchema>;

const geocodingSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        country: z.string().optional(),
        admin1: z.string().optional(),
        timezone: z.string().optional(),
      }),
    )
    .default([]),
  error: z.literal(true).optional(),
  reason: z.string().optional(),
});

export type GeocodingResult = z.infer<typeof geocodingSchema>['results'][number];

const AIR_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';

const CURRENT_FIELDS = [
  'us_aqi',
  'us_aqi_pm2_5',
  'us_aqi_pm10',
  'us_aqi_carbon_monoxide',
  'us_aqi_nitrogen_dioxide',
  'us_aqi_sulphur_dioxide',
  'us_aqi_ozone',
  'pm2_5',
  'pm10',
  'carbon_monoxide',
  'nitrogen_dioxide',
  'sulphur_dioxide',
  'ozone',
];

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Open-Meteo responded ${response.status}`);
  return response.json();
}

export async function fetchAirQuality(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<AirResponse> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: CURRENT_FIELDS.join(','),
    hourly: 'us_aqi,pm2_5,pm10',
    forecast_hours: '48',
    timezone: 'auto',
  });
  const parsed = airResponseSchema.parse(await getJson(`${AIR_URL}?${params}`, signal));
  if (parsed.error) throw new Error(parsed.reason ?? 'Open-Meteo air quality error');
  return parsed;
}

export async function fetchGeocoding(name: string, signal?: AbortSignal): Promise<GeocodingResult[]> {
  const params = new URLSearchParams({ name, count: '5', language: 'en', format: 'json' });
  const parsed = geocodingSchema.parse(await getJson(`${GEO_URL}?${params}`, signal));
  if (parsed.error) throw new Error(parsed.reason ?? 'Open-Meteo geocoding error');
  return parsed.results;
}
