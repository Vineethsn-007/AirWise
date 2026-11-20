import { describe, expect, it } from 'vitest';
import { buildVerifiedFacts } from '@/lib/ai/facts';
import { buildPrompt } from '@/lib/ai/prompts';
import { INTENTS } from '@/lib/ai/intents';
import { makeProfile, makeSnapshot } from '../fixtures';

const facts = buildVerifiedFacts(makeSnapshot(), makeProfile());

describe('centralised prompt templates', () => {
  it.each(INTENTS)('builds a grounded prompt for %s', (intent) => {
    const prompt = buildPrompt(intent, facts);
    expect(prompt.system).toContain('HEADLINE:');
    expect(prompt.system).toContain('Do not invent values');
    expect(prompt.user).toContain('VERIFIED FACTS');
    expect(prompt.user).toContain('US AQI: 165');
    expect(prompt.user).toContain('Unhealthy');
    expect(prompt.user).toContain('Children, Asthma or respiratory condition');
    expect(prompt.user).toContain('1.66 kg');
  });

  it('includes the plain-language instruction only when requested', () => {
    expect(buildPrompt('routine', facts).system).toContain('very plain language');
    const formal = buildVerifiedFacts(makeSnapshot(), makeProfile({ plainLanguage: false }));
    expect(buildPrompt('routine', formal).system).toContain('explain any technical term');
  });

  it('exposes only computed numbers in the allowed set', () => {
    expect(facts.allowedNumbers).toContain('165');
    expect(facts.allowedNumbers).toContain('2.5');
  });
});
