import type { PromptBundle, VerifiedFacts } from '../types';
import { factBlock, systemPrompt } from './shared';

export function buildAlternativesPrompt(facts: VerifiedFacts): PromptBundle {
  return {
    system: systemPrompt(
      facts,
      'Focus: a sustainable swap with the already-computed CO2e saving, explained in plain language.',
    ),
    user: `${factBlock(facts, [`Emissions basis: ${facts.swap.basis}`])}
Explain the calculated saving as a daily habit. Use the exact saved value supplied. Do not calculate, scale, annualise, or multiply it. Do not claim a health benefit from CO2e reduction. Add two other low-emission alternatives that need no new numbers.`,
  };
}
