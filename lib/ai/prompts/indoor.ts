import type { PromptBundle, VerifiedFacts } from '../types';
import { factBlock, systemPrompt } from './shared';

export function buildIndoorPrompt(facts: VerifiedFacts): PromptBundle {
  return {
    system: systemPrompt(
      facts,
      'Focus: indoor air quality actions that respond to the AQI trend and the reported home conditions.',
    ),
    user: `${factBlock(facts)}
Give indoor-air guidance about ventilation timing, cooking and filtration. If a purifier is available, explain when to run it without inventing device performance numbers. If a gas stove is used, mention ventilation during and after cooking. Tailor to the reported conditions only.`,
  };
}
