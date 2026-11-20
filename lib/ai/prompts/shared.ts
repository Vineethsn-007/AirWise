import type { VerifiedFacts } from '../types';

export const OUTPUT_CONTRACT = `Reply with exactly this plain-text structure and nothing else:
HEADLINE: <one short sentence>
NARRATIVE: <two to four sentences of useful explanation>
ACTION: <short title> :: <one sentence of practical detail> :: <timing such as "morning" or "any time">
ACTION: <short title> :: <one sentence of practical detail> :: <timing>
ACTION: <short title> :: <one sentence of practical detail> :: <timing>

Rules:
- Use only the verified facts supplied. Do not invent values, thresholds, concentrations, emissions figures, medical claims, or local rules.
- Do not write any numeral that is not present in the verified facts. If a number is needed, use the supplied value verbatim.
- Never state a health category or emissions number from memory; repeat the supplied label or value.
- Be specific and kind. No medical diagnosis. Suggest official local guidance only as a general idea, never as a claim about this location.
- Do not use markdown, bullets, headings other than the three labels above, or HTML.`;

export function systemPrompt(facts: VerifiedFacts, focus: string): string {
  const tone = facts.plainLanguage
    ? 'Write for a general family audience in very plain language, short sentences, no jargon.'
    : 'Write clearly for a general audience; explain any technical term in a few words.';
  return `You are AirWise, a careful air-quality assistant for families. ${tone} ${OUTPUT_CONTRACT} ${focus}`;
}

export function factBlock(facts: VerifiedFacts, extra: string[] = []): string {
  const lines = [
    `Location: ${facts.locationName}`,
    `Current US AQI: ${facts.currentAqi}`,
    `EPA category: ${facts.categoryLabel}`,
    `EPA general guidance (use verbatim if quoted): ${facts.generalGuidance}`,
    `EPA sensitive-group guidance (use verbatim if quoted): ${facts.sensitiveGuidance}`,
    `Trend: ${facts.trendLabel}`,
    `Cleaner windows: ${facts.windows.join(' | ') || 'none available'}`,
    `Sensitivities in household: ${facts.sensitivities.join(', ') || 'none reported'}`,
    `Typical activities: ${facts.activities.join(', ') || 'none reported'}`,
    `Indoor conditions: ${facts.indoor.join(', ')}`,
    `Measured pollutants: ${facts.concentrations.join(' | ') || 'not available'}`,
    `Transport swap already calculated: ${facts.swap.distanceKm} km by ${facts.swap.from} replaced by ${facts.swap.to} avoids ${facts.swap.saved} CO2e. Basis: ${facts.swap.basis}`,
    `Household health note: ${facts.health.forYourHousehold}`,
    ...extra,
  ];
  return `VERIFIED FACTS (these are computed from live Open-Meteo data and published tables):\n${lines
    .map((line) => `- ${line}`)
    .join('\n')}`;
}
