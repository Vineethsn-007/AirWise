import { z } from 'zod';
import { extractNumbers } from './facts';
import type { RecommendationAction, VerifiedFacts } from './types';

const actionSchema = z.object({
  title: z.string().min(2).max(90),
  detail: z.string().min(10).max(400),
  timing: z.string().min(2).max(60),
});

interface Sections {
  headline: string;
  narrative: string;
  actions: RecommendationAction[];
}

function clean(value: string): string {
  return value.replace(/\*\*/g, '').replace(/[*_`#>]/g, '').trim();
}

export function parseCompletion(text: string): Sections {
  const sections: Record<string, string[]> = { HEADLINE: [], NARRATIVE: [], ACTION: [] };
  let current = '';
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = /^(HEADLINE|NARRATIVE|ACTION):\s*(.*)$/.exec(line);
    if (match) {
      current = match[1] ?? '';
      sections[current]?.push(match[2] ?? '');
    } else if (current) {
      sections[current]?.push(line);
    }
  }

  const headline = clean((sections.HEADLINE ?? []).join(' '));
  const narrative = clean((sections.NARRATIVE ?? []).join(' '));
  const actions = (sections.ACTION ?? []).flatMap((line) => {
    const [title = '', detail = '', timing = 'any time'] = line.split('::').map((part) => clean(part));
    const parsed = actionSchema.safeParse({ title, detail, timing });
    return parsed.success ? [parsed.data] : [];
  });

  if (!headline || !narrative) throw new Error('LLM response missing HEADLINE or NARRATIVE');
  return { headline, narrative, actions };
}

/** Rejects any numeral the model did not receive in the verified-facts block. */
export function inventedNumbers(text: string, facts: VerifiedFacts): string[] {
  const allowed = new Set(facts.allowedNumbers);
  return extractNumbers(text).filter((value) => !allowed.has(value));
}

export function assertNoInventedNumbers(text: string, facts: VerifiedFacts): void {
  const invented = inventedNumbers(text, facts);
  if (invented.length > 0) {
    throw new Error(`LLM introduced unverified numerals: ${Array.from(new Set(invented)).join(', ')}`);
  }
}
