import type { PromptBundle, VerifiedFacts } from '../types';
import { factBlock, systemPrompt } from './shared';

export function buildForecastPrompt(facts: VerifiedFacts): PromptBundle {
  return {
    system: systemPrompt(
      facts,
      'Focus: choosing the best outdoor windows from the supplied forecast reasoning.',
    ),
    user: `${factBlock(facts)}
Recommend when this household should go outside today or tomorrow. Use only the supplied cleaner windows and trend. Explain why the chosen window is better, in plain language. Do not promise that air quality will change by a specific amount.`,
  };
}
