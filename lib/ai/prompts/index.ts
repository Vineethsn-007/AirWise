import type { Intent } from '../intents';
import type { PromptBundle, VerifiedFacts } from '../types';
import { buildAlternativesPrompt } from './alternatives';
import { buildForecastPrompt } from './forecast';
import { buildHealthPrompt } from './health';
import { buildIndoorPrompt } from './indoor';
import { buildRoutinePrompt } from './routine';

const BUILDERS: Record<Intent, (facts: VerifiedFacts) => PromptBundle> = {
  routine: buildRoutinePrompt,
  indoor: buildIndoorPrompt,
  alternatives: buildAlternativesPrompt,
  health: buildHealthPrompt,
  forecast: buildForecastPrompt,
};

/** Every intent uses a named, centralised prompt-template function. */
export function buildPrompt(intent: Intent, facts: VerifiedFacts): PromptBundle {
  return BUILDERS[intent](facts);
}
