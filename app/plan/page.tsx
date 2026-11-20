'use client';

import { useAppState } from '@/components/AppState';
import { AqiBadge } from '@/components/AqiBadge';
import { ForecastStrip } from '@/components/ForecastStrip';
import { RecommendationCard } from '@/components/RecommendationCard';
import { NearbyCompare } from '@/components/NearbyCompare';
import { SEVERITY_TOKENS, SURFACE } from '@/lib/design/tokens';

export default function PlanPage() {
  const { snapshot, loading, error, profile } = useAppState();

  return (
    <div className="space-y-12">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-mid">Daily planner</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          A day shaped by <span className={SURFACE.displayAccent}>real</span> air.
        </h1>
        <p className="mt-3 max-w-2xl text-sky-deep">
          Each card below calls one AI orchestration module with live Open-Meteo observations and computed EPA
          guidance. Household sensitivities change every answer.
        </p>
        {snapshot && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <AqiBadge aqi={snapshot.current.aqi} categoryLabel={snapshot.current.category.label} />
            <span className="text-sm text-sky-deep">
              {snapshot.location.name} · trend {snapshot.trend.replace('-', ' ')} ·{' '}
              {profile.sensitivities.length} sensitivity flags
            </span>
          </div>
        )}
        {loading && <p className="mt-4 text-sky-deep">Loading live air quality…</p>}
        {error && <p role="alert" className="mt-4 text-severity-unhealthy">{error}</p>}
      </header>

      {snapshot && snapshot.bestWindows.length > 0 && (
        <section aria-labelledby="windows-heading" className={`${SURFACE.panel} p-6`}>
          <h2 id="windows-heading" className="text-xl font-semibold">
            Best windows for outdoor activity
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {snapshot.bestWindows.map((window) => {
              const token = SEVERITY_TOKENS[window.category.id];
              return (
                <li key={window.start} className={`rounded-2xl ${token.badge} p-4`}>
                  <p className="font-semibold tabular-nums">
                    {window.start.slice(11, 16)}–{window.end.slice(11, 16)}
                  </p>
                  <p className="mt-1 text-sm">About AQI {window.averageAqi}</p>
                  <p className="mt-2 text-xs">{window.reason}</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <RecommendationCard intent="routine" kicker="Module 01" title="Low-emission daily routine" />

      <section id="indoor" className="scroll-mt-28">
        <RecommendationCard intent="indoor" kicker="Module 02" title="Indoor air quality hub" />
      </section>

      <RecommendationCard intent="alternatives" kicker="Module 03" title="Sustainable alternatives" />
      <RecommendationCard intent="forecast" kicker="Module 04" title="Forecast planning" />

      {snapshot && (
        <section aria-labelledby="forecast-heading" className={`${SURFACE.panel} p-6`}>
          <h2 id="forecast-heading" className="text-xl font-semibold">
            Next 24 hours
          </h2>
          <div className="mt-5">
            <ForecastStrip hours={snapshot.hourly} />
          </div>
        </section>
      )}

      <NearbyCompare />
    </div>
  );
}
