import type { PromptBundle, VerifiedFacts } from '../types';
import { factBlock, systemPrompt } from './shared';

export function buildHealthPrompt(facts: VerifiedFacts): PromptBundle {
  return {
    system: systemPrompt(
      facts,
      'Focus: explaining what today\'s AQI category means for this household, using the supplied EPA wording.',
    ),
    user: `${factBlock(facts)}
Explain the category in ordinary words. Name the household sensitivities that matter and repeat the supplied guidance for them. Say what to watch for and when to reduce outdoor exertion. Do not introduce pollutants or thresholds from memory. Explain PM2.5 only with the supplied measured value.`,
  };
}
