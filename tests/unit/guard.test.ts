import { describe, expect, it } from 'vitest';
import { buildVerifiedFacts } from '@/lib/ai/facts';
import { assertNoInventedNumbers, inventedNumbers, parseCompletion } from '@/lib/ai/parse';
import { makeProfile, makeSnapshot } from '../fixtures';

const facts = buildVerifiedFacts(makeSnapshot(), makeProfile());

const VALID = `HEADLINE: A cleaner afternoon is ahead
NARRATIVE: The current AQI is 165, which is Unhealthy. Keep strenuous activity short.
ACTION: Move play indoors :: Use the cleaner window after midday for a gentle walk :: afternoon
ACTION: Run the purifier :: Keep it on while the gas stove is used :: during cooking
ACTION: Cycle the school run :: Leave the car at home to save 1.66 kg CO2e :: next trip`;

describe('LLM response parsing', () => {
  it('parses the three-section contract into typed actions', () => {
    const parsed = parseCompletion(VALID);
    expect(parsed.headline).toBe('A cleaner afternoon is ahead');
    expect(parsed.narrative).toContain('165');
    expect(parsed.actions).toHaveLength(3);
    expect(parsed.actions[0]?.timing).toBe('afternoon');
  });

  it('rejects responses missing required sections', () => {
    expect(() => parseCompletion('HEADLINE: only a headline')).toThrow(/missing HEADLINE or NARRATIVE/);
  });

  it('discards malformed action lines', () => {
    const parsed = parseCompletion(`${VALID}\nACTION: too short`);
    expect(parsed.actions).toHaveLength(3);
  });
});

describe('numeric-claim guard', () => {
  it('accepts only numerals supplied in verified facts', () => {
    expect(inventedNumbers(VALID, facts)).toEqual([]);
    expect(() => assertNoInventedNumbers(VALID, facts)).not.toThrow();
  });

  it('rejects invented AQI, thresholds and emissions figures', () => {
    const text = VALID.replace('165', '42').replace('1.66', '9.99');
    expect(inventedNumbers(text, facts)).toContain('42');
    expect(inventedNumbers(text, facts)).toContain('9.99');
    expect(() => assertNoInventedNumbers(text, facts)).toThrow(/unverified numerals/);
  });
});
