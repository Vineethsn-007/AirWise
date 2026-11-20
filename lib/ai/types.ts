import type { Intent } from './intents';

export interface VerifiedFacts {
  locationName: string;
  currentAqi: number;
  categoryLabel: string;
  generalGuidance: string;
  sensitiveGuidance: string;
  dominantPollutant: string;
  trendLabel: string;
  windows: string[];
  sensitivities: string[];
  activities: string[];
  indoor: string[];
  swap: { from: string; to: string; distanceKm: number; saved: string; basis: string };
  health: { whatItMeans: string; forYourHousehold: string };
  concentrations: string[];
  plainLanguage: boolean;
  allowedNumbers: string[];
}

export interface RecommendationAction {
  title: string;
  detail: string;
  timing: string;
}

export interface Recommendation {
  intent: Intent;
  headline: string;
  narrative: string;
  actions: RecommendationAction[];
  facts: VerifiedFacts;
  generation: 'llm' | 'deterministic-fallback';
  model: string;
  source: 'Open-Meteo live data + EPA tables + LLM' | 'Open-Meteo live data + EPA tables';
}

export interface PromptBundle {
  system: string;
  user: string;
}
