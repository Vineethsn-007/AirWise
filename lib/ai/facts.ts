import { formatKg, estimateSwap, TRAVEL_MODE_LABELS } from '@/lib/air-quality/emissions';
import { explainHealth, SENSITIVITY_LABELS } from '@/lib/air-quality/health';
import { ACTIVITY_LABELS } from '@/lib/profile';
import type { AirQualitySnapshot } from '@/lib/air-quality/types';
import type { HouseholdProfile } from '@/lib/profile';
import type { VerifiedFacts } from './types';

const TREND_LABELS: Record<AirQualitySnapshot['trend'], string> = {
  improving: 'improving over the next hours',
  worsening: 'worsening over the next hours',
  steady: 'roughly steady over the next hours',
};

function indoorLabels(profile: HouseholdProfile): string[] {
  const labels: string[] = [];
  if (profile.indoor.gasStove) labels.push('gas stove used at home');
  if (profile.indoor.noAc) labels.push('no air conditioning');
  if (profile.indoor.pets) labels.push('pets indoors');
  if (profile.indoor.purifier) labels.push('a portable air purifier available');
  return labels.length > 0 ? labels : ['no special indoor conditions reported'];
}

/** All numbers in facts are computed here; the model only receives this object. */
export function buildVerifiedFacts(
  snapshot: AirQualitySnapshot,
  profile: HouseholdProfile,
): VerifiedFacts {
  const health = explainHealth(snapshot.current.aqi, profile.sensitivities);
  const swap = estimateSwap({
    distanceKm: profile.commute.distanceKm,
    from: profile.commute.mode,
    to: profile.commute.mode === 'car' || profile.commute.mode === 'ev' ? 'cycle' : 'rail',
    occupants: profile.commute.occupants,
    tripsPerWeek: profile.commute.tripsPerWeek,
  });

  const concentrations = [
    ...(snapshot.current.concentrations.pm25 !== null
      ? [`PM2.5 ${snapshot.current.concentrations.pm25.toFixed(1)} micrograms per cubic metre`]
      : []),
    ...(snapshot.current.concentrations.pm10 !== null
      ? [`PM10 ${snapshot.current.concentrations.pm10.toFixed(1)} micrograms per cubic metre`]
      : []),
  ];

  const facts: VerifiedFacts = {
    locationName: [snapshot.location.name, snapshot.location.admin1, snapshot.location.country]
      .filter(Boolean)
      .join(', '),
    currentAqi: snapshot.current.aqi,
    categoryLabel: snapshot.current.category.label,
    generalGuidance: health.whatItMeans,
    sensitiveGuidance: snapshot.current.category.sensitiveGuidance,
    dominantPollutant: snapshot.current.dominantPollutant ?? 'not identified',
    trendLabel: TREND_LABELS[snapshot.trend],
    windows: snapshot.bestWindows.map(
      (window) => `${window.start.slice(11, 16)} to ${window.end.slice(11, 16)}: AQI about ${window.averageAqi}`,
    ),
    sensitivities: profile.sensitivities.map((id) => SENSITIVITY_LABELS[id]),
    activities: profile.activities.map((id) => ACTIVITY_LABELS[id]),
    indoor: indoorLabels(profile),
    swap: {
      from: TRAVEL_MODE_LABELS[swap.from],
      to: TRAVEL_MODE_LABELS[swap.to],
      distanceKm: swap.distanceKm,
      saved: formatKg(swap.savedKgCo2e),
      basis: swap.basis,
    },
    health: { whatItMeans: health.whatItMeans, forYourHousehold: health.forYourHousehold },
    concentrations,
    plainLanguage: profile.plainLanguage,
    allowedNumbers: [],
  };

  facts.allowedNumbers = extractNumbers(JSON.stringify(facts));
  return facts;
}

export function extractNumbers(text: string): string[] {
  const matches = text.match(/\d+(?:\.\d+)?/g) ?? [];
  return Array.from(new Set([...matches, '2', '2.5', '10', '24', '48']));
}
