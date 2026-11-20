import { formatKg, estimateSwap, TRAVEL_MODE_LABELS } from '@/lib/air-quality/emissions';
import type { HouseholdProfile } from '@/lib/profile';
import type { Intent } from './intents';
import type { Recommendation, VerifiedFacts } from './types';

/**
 * Used only when the model output fails the numeric-claim guard twice.
 * Content is assembled from the same deterministic facts; no fabricated text.
 */
export function deterministicRecommendation(
  intent: Intent,
  facts: VerifiedFacts,
  profile: HouseholdProfile,
): Recommendation {
  const swap = estimateSwap({
    distanceKm: profile.commute.distanceKm,
    from: profile.commute.mode,
    to: profile.commute.mode === 'car' || profile.commute.mode === 'ev' ? 'cycle' : 'rail',
    occupants: profile.commute.occupants,
    tripsPerWeek: profile.commute.tripsPerWeek,
  });

  const actions = [
    {
      title: 'Plan outdoor time around the cleaner window',
      detail: facts.windows[0]
        ? `The forecast shows a relatively cleaner period ${facts.windows[0]}. Keep strenuous activity short if you are sensitive.`
        : facts.generalGuidance,
      timing: facts.windows[0]?.slice(0, 5) ?? 'any time',
    },
    {
      title: 'Change one commute',
      detail: `Replacing a ${facts.swap.distanceKm} km ${facts.swap.from} trip with ${facts.swap.to} avoids about ${formatKg(swap.savedKgCo2e)} CO2e, using ${facts.swap.basis}.`,
      timing: 'next commute',
    },
    {
      title: 'Match ventilation to the trend',
      detail: `${facts.sensitiveGuidance} Indoor conditions noted: ${facts.indoor.join(', ')}.`,
      timing: facts.trendLabel.includes('worsening') ? 'keep windows closed' : 'when outdoor air is cleaner',
    },
  ];

  return {
    intent,
    headline: `Air quality is ${facts.categoryLabel.toLowerCase()} in ${facts.locationName}`,
    narrative: `${facts.health.whatItMeans} ${facts.health.forYourHousehold} ${facts.concentrations.join('. ')}.`,
    actions,
    facts,
    generation: 'deterministic-fallback',
    model: 'none (numeric-claim guard)',
    source: 'Open-Meteo live data + EPA tables',
  };
}

export function travelLabel(mode: HouseholdProfile['commute']['mode']): string {
  return TRAVEL_MODE_LABELS[mode];
}
