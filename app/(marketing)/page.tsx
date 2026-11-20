'use client';

import Link from 'next/link';
import { useAppState } from '@/components/AppState';
import { AqiBadge } from '@/components/AqiBadge';
import { LocationSearch } from '@/components/LocationSearch';
import { RecommendationCard } from '@/components/RecommendationCard';
import { ImpactExplainer } from '@/components/ImpactExplainer';
import { SURFACE } from '@/lib/design/tokens';

const FEATURES = [
  {
    href: '/plan',
    title: 'Today’s plan',
    body: 'A low-emission routine built from the live AQI, your day, and the forecast.',
  },
  {
    href: '/plan#indoor',
    title: 'Indoor hub',
    body: 'Ventilation and filtration guidance that follows the pollution trend at your home.',
  },
  {
    href: '/profile',
    title: 'Household profile',
    body: 'Tell us who is sensitive and what your home is like. Every answer adapts.',
  },
];

export default function HomePage() {
  const { snapshot, loading, error, location, profile } = useAppState();

  return (
    <div className="space-y-20">
      <section className="grid gap-10 pt-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-mid">
            PromptWars Virtual · Challenge 06
          </p>
          <h1 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Cleaner air, <span className={SURFACE.displayAccent}>clearer</span> choices.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-sky-deep">
            AirWise turns live air-quality data into a daily plan for families — what to do outside, when to open
            the windows, and which small swaps actually help.
          </p>
          <div className="mt-8">
            <LocationSearch />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/plan" className={SURFACE.primaryAction}>
              Open my daily plan
            </Link>
            <Link
              href="#impact"
              className={`${SURFACE.capsule} border border-sky-soft bg-white text-sky-deep hover:bg-sky-mist`}
            >
              What does my AQI mean?
            </Link>
          </div>
        </div>

        <aside className={`${SURFACE.panel} p-7`} aria-label="Current air quality">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-mid">
            Live now · {location.name}
          </p>
          {loading && <p className="mt-6 text-sky-deep">Reading the live air-quality feed…</p>}
          {error && (
            <p role="alert" className="mt-6 text-severity-unhealthy">
              {error}
            </p>
          )}
          {snapshot && (
            <div className="mt-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-6xl font-semibold tabular-nums tracking-tight">{snapshot.current.aqi}</span>
                <AqiBadge aqi={snapshot.current.aqi} categoryLabel={snapshot.current.category.label} />
              </div>
              <p className="mt-5 text-sky-deep">{snapshot.current.category.generalGuidance}</p>
              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-sky-soft pt-5 text-sm">
                <div>
                  <dt className="text-sky-mid">Trend</dt>
                  <dd className="font-medium capitalize">{snapshot.trend.replace('-', ' ')}</dd>
                </div>
                <div>
                  <dt className="text-sky-mid">Dominant pollutant</dt>
                  <dd className="font-medium uppercase">{snapshot.current.dominantPollutant ?? '—'}</dd>
                </div>
              </dl>
              <p className="mt-5 text-xs text-sky-deep">
                Fetched {new Date(snapshot.fetchedAt).toLocaleTimeString()} · {snapshot.source.attribution}
              </p>
            </div>
          )}
        </aside>
      </section>

      <section aria-labelledby="features-heading">
        <h2 id="features-heading" className="text-3xl font-semibold tracking-tight">
          Built for the <span className={SURFACE.displayAccent}>whole</span> household
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <Link key={feature.href} href={feature.href} className={`${SURFACE.panel} block p-6 hover:border-sky-mid`}>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-sky-deep">{feature.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Today's low-emission routine">
        <RecommendationCard intent="routine" kicker="Generated for you" title="Today’s plan" />
      </section>

      <section id="impact" aria-labelledby="impact-heading" className="scroll-mt-28">
        <h2 id="impact-heading" className="text-3xl font-semibold tracking-tight">
          What the number <span className={SURFACE.displayAccent}>means</span>
        </h2>
        <p className="mt-3 max-w-2xl text-sky-deep">
          Categories and guidance come straight from the US EPA AirNow table. Savings use fixed, published emissions
          factors. The assistant only puts those facts into plain language.
        </p>
        <div className={`${SURFACE.panel} mt-6 p-6`}>
          {snapshot ? (
            <ImpactExplainer snapshot={snapshot} profile={profile} />
          ) : (
            <p className="text-sky-deep">Live data will appear here once a location loads.</p>
          )}
        </div>
      </section>
    </div>
  );
}
