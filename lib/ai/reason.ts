import type { AirQualitySnapshot } from '@/lib/air-quality/types';
import type { HouseholdProfile } from '@/lib/profile';
import { memoize, recommendationKey } from '@/lib/memo';
import { deterministicRecommendation } from './fallback';
import { buildVerifiedFacts } from './facts';
import type { Intent } from './intents';
import { complete } from './openrouter';
import { assertNoInventedNumbers, parseCompletion } from './parse';
import { buildPrompt } from './prompts';
import type { Recommendation } from './types';

export interface ReasonContext {
  snapshot: AirQualitySnapshot;
  profile: HouseholdProfile;
  onToken?: (delta: string) => void;
  signal?: AbortSignal;
}

function strictPrompt(intent: Intent, facts: ReturnType<typeof buildVerifiedFacts>) {
  const base = buildPrompt(intent, facts);
  return {
    system: `${base.system} CRITICAL: your previous reply contained a numeral that was not in the supplied facts. Use no numerals at all unless they appear verbatim in VERIFIED FACTS.`,
    user: base.user,
  };
}

async function generate(intent: Intent, context: ReasonContext): Promise<Recommendation> {
  const facts = buildVerifiedFacts(context.snapshot, context.profile);
  const first = await complete({
    prompt: buildPrompt(intent, facts),
    onToken: context.onToken,
    signal: context.signal,
  });
  try {
    const parsed = parseCompletion(first.text);
    assertNoInventedNumbers(first.text, facts);
    if (parsed.actions.length === 0) throw new Error('LLM response contained no valid actions');
    return {
      intent,
      headline: parsed.headline,
      narrative: parsed.narrative,
      actions: parsed.actions,
      facts,
      generation: 'llm',
      model: first.model,
      source: 'Open-Meteo live data + EPA tables + LLM',
    };
  } catch {
    const second = await complete({ prompt: strictPrompt(intent, facts), signal: context.signal });
    const parsed = parseCompletion(second.text);
    assertNoInventedNumbers(second.text, facts);
    if (parsed.actions.length === 0) throw new Error('LLM response contained no valid actions');
    return {
      intent,
      headline: parsed.headline,
      narrative: parsed.narrative,
      actions: parsed.actions,
      facts,
      generation: 'llm',
      model: second.model,
      source: 'Open-Meteo live data + EPA tables + LLM',
    };
  }
}

/**
 * Single typed entry point. Every feature calls this function; no component
 * performs ad-hoc model or data fetches.
 */
export async function reason(intent: Intent, context: ReasonContext): Promise<Recommendation> {
  const key = recommendationKey(
    intent,
    context.snapshot.location,
    context.profile,
    Math.floor(Date.now() / 3_600_000),
  );
  try {
    return await memoize(key, 5 * 60 * 1000, () => generate(intent, context));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    if (message.startsWith('OPENROUTER_API_KEY') || message.includes('All OpenRouter models failed')) {
      throw error;
    }
    return deterministicRecommendation(
      intent,
      buildVerifiedFacts(context.snapshot, context.profile),
      context.profile,
    );
  }
}
