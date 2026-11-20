'use client';

import type { Intent } from '@/lib/ai/intents';
import { useRecommendation } from '@/components/hooks/useRecommendation';
import { PlainText } from '@/components/PlainText';
import { SURFACE } from '@/lib/design/tokens';

interface RecommendationCardProps {
  intent: Intent;
  title: string;
  kicker: string;
}

export function RecommendationCard({ intent, title, kicker }: RecommendationCardProps) {
  const { text, result, error, loading, regenerate } = useRecommendation(intent);

  return (
    <section className={`${SURFACE.panel} p-6`} aria-labelledby={`heading-${intent}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-mid">{kicker}</p>
      <div className="mt-1 flex items-start justify-between gap-3">
        <h2 id={`heading-${intent}`} className="text-2xl font-semibold tracking-tight">
          {title}
        </h2>
        <button
          type="button"
          onClick={() => void regenerate()}
          disabled={loading}
          className={`shrink-0 rounded-capsule border border-sky-soft px-3 py-1.5 text-xs font-semibold text-sky-deep hover:bg-sky-mist disabled:opacity-60 ${SURFACE.focusRing}`}
        >
          Refresh
        </button>
      </div>

      <div aria-live="polite" aria-busy={loading} className="mt-4 min-h-32">
        {loading && !text && <p className="text-sky-deep">Checking live air data and writing your plan…</p>}
        {loading && text && <PlainText text={text} />}
        {error && (
          <div role="alert" className="rounded-2xl bg-severity-unhealthyBg p-4 text-severity-unhealthy">
            <strong>Recommendation unavailable.</strong> {error}
          </div>
        )}
        {result && (
          <div className="animate-rise">
            <h3 className="font-display text-xl italic text-sky-mid">{result.headline}</h3>
            <div className="mt-3">
              <PlainText text={result.narrative} />
            </div>
            <ol className="mt-5 space-y-3">
              {result.actions.map((action) => (
                <li key={action.title} className="rounded-2xl bg-sky-mist p-4">
                  <h4 className="font-semibold text-sky-ink">{action.title}</h4>
                  <p className="mt-1 text-sm text-sky-deep">{action.detail}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-sky-mid">
                    When: {action.timing}
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-5 border-t border-sky-soft pt-3 text-xs text-sky-deep">
              {result.generation === 'llm'
                ? `Personalised language by ${result.model}; every number computed from live Open-Meteo data and published tables.`
                : 'Numeric-claim guard used published-table wording instead of model text. No unverified numbers shown.'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
