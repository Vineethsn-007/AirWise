import type { PromptBundle, VerifiedFacts } from '../types';
import { factBlock, systemPrompt } from './shared';

export function buildRoutinePrompt(facts: VerifiedFacts): PromptBundle {
  return {
    system: systemPrompt(
      facts,
      'Focus: a realistic low-emission daily routine for this household, adapted to the AQI and their listed activities.',
    ),
    user: `${factBlock(facts)}
Build a morning, midday and evening routine. Mention when to keep strenuous activity indoors or move it to a cleaner window. Keep the three actions concrete and doable. Do not add any number that is not in the verified facts.`,
  };
}
