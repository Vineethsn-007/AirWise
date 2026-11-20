export type AqiCategoryId =
  | 'good'
  | 'moderate'
  | 'sensitive'
  | 'unhealthy'
  | 'very'
  | 'hazardous';

export type PollutantKey = 'pm25' | 'pm10' | 'o3' | 'no2' | 'so2' | 'co';

export interface AqiCategory {
  id: AqiCategoryId;
  label: string;
  min: number;
  max: number;
  colorName: string;
  generalGuidance: string;
  sensitiveGuidance: string;
}

export interface PollutantConcentrations {
  pm25: number | null;
  pm10: number | null;
  o3: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
}

export interface ResolvedLocation {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone: string;
}

export interface CurrentAqi {
  time: string;
  aqi: number;
  category: AqiCategory;
  dominantPollutant: PollutantKey | null;
  concentrations: PollutantConcentrations;
  subIndices: Partial<Record<PollutantKey, number>>;
}

export interface HourlyAqi {
  time: string;
  aqi: number;
  category: AqiCategory;
  pm25: number | null;
  pm10: number | null;
}

export interface OutdoorWindow {
  start: string;
  end: string;
  averageAqi: number;
  category: AqiCategory;
  reason: string;
}

export type AqiTrend = 'improving' | 'worsening' | 'steady';

export interface NearbyReading {
  name: string;
  latitude: number;
  longitude: number;
  aqi: number;
  category: AqiCategory;
}

export interface AirQualitySnapshot {
  location: ResolvedLocation;
  current: CurrentAqi;
  hourly: HourlyAqi[];
  trend: AqiTrend;
  bestWindows: OutdoorWindow[];
  nearby: NearbyReading[];
  fetchedAt: string;
  cache: 'hit' | 'miss';
  source: {
    airQuality: string;
    geocoding: string;
    attribution: string;
  };
}
