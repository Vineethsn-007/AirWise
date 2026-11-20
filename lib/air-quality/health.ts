import { categoryForAqi } from './breakpoints';
import type { AqiCategory, AqiCategoryId } from './types';

export const SENSITIVITY_LABELS = {
  children: 'Children',
  elderly: 'Older adults',
  asthma: 'Asthma or respiratory condition',
  outdoorWorker: 'Outdoor worker',
  pregnancy: 'Pregnancy',
  heart: 'Heart or cardiovascular condition',
} as const;

export type SensitivityId = keyof typeof SENSITIVITY_LABELS;

export const EPA_SENSITIVE_GROUPS: readonly SensitivityId[] = [
  'children',
  'elderly',
  'asthma',
  'outdoorWorker',
  'pregnancy',
  'heart',
];

/** True when at least one selected sensitivity is in the EPA-sensitive set for PM. */
export function hasSensitiveGroup(groups: readonly SensitivityId[]): boolean {
  return groups.some((group) => EPA_SENSITIVE_GROUPS.includes(group));
}

export interface HealthExplanation {
  aqi: number;
  category: AqiCategory;
  headline: string;
  whatItMeans: string;
  forYourHousehold: string;
  recommendedAction: string;
}

/**
 * Deterministic health explanation. All guidance strings come from the EPA
 * AirNow category table; the LLM may only rephrase them, never replace them.
 */
export function explainHealth(aqi: number, sensitivities: readonly SensitivityId[]): HealthExplanation {
  const category = categoryForAqi(aqi);
  const sensitive = hasSensitiveGroup(sensitivities);
  const names = sensitivities.map((id) => SENSITIVITY_LABELS[id]).join(', ');
  const forYourHousehold = sensitive
    ? `Your household flagged ${names || 'a sensitive group'}. ${category.sensitiveGuidance}`
    : `No sensitive groups were flagged. ${category.generalGuidance}`;

  return {
    aqi: Math.max(0, Math.round(aqi)),
    category,
    headline: `Air quality is ${category.label.toLowerCase()} today`,
    whatItMeans: category.generalGuidance,
    forYourHousehold,
    recommendedAction: sensitive ? category.sensitiveGuidance : category.generalGuidance,
  };
}

export function severityRank(id: AqiCategoryId): number {
  const order: AqiCategoryId[] = ['good', 'moderate', 'sensitive', 'unhealthy', 'very', 'hazardous'];
  return order.indexOf(id);
}
