import { AQI_CATEGORIES } from '@/lib/air-quality/breakpoints';
import { estimateSwap, formatKg } from '@/lib/air-quality/emissions';
import { explainHealth } from '@/lib/air-quality/health';
import { SEVERITY_TOKENS } from '@/lib/design/tokens';
import type { AirQualitySnapshot } from '@/lib/air-quality/types';
import type { HouseholdProfile } from '@/lib/profile';

export function ImpactExplainer({
  snapshot,
  profile,
}: {
  snapshot: AirQualitySnapshot;
  profile: HouseholdProfile;
}) {
  const health = explainHealth(snapshot.current.aqi, profile.sensitivities);
  const swap = estimateSwap({
    distanceKm: profile.commute.distanceKm,
    from: profile.commute.mode,
    to: profile.commute.mode === 'car' || profile.commute.mode === 'ev' ? 'cycle' : 'rail',
    occupants: profile.commute.occupants,
    tripsPerWeek: profile.commute.tripsPerWeek,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-sky-soft p-6">
        <h3 className="font-display text-2xl italic text-sky-deep">{health.headline}</h3>
        <p className="mt-3 text-sky-deep">{health.whatItMeans}</p>
        <p className="mt-2 font-medium text-sky-ink">{health.forYourHousehold}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <caption className="sr-only">US EPA Air Quality Index categories and meanings</caption>
          <thead>
            <tr className="border-b border-sky-soft text-sky-deep">
              <th scope="col" className="py-2 pr-3">AQI range</th>
              <th scope="col" className="py-2 pr-3">Category</th>
              <th scope="col" className="py-2">What it means</th>
            </tr>
          </thead>
          <tbody>
            {AQI_CATEGORIES.map((category) => {
              const current = category.id === health.category.id;
              return (
                <tr
                  key={category.id}
                  className={`border-b border-sky-soft/70 ${current ? 'bg-white font-semibold' : ''}`}
                >
                  <td className="py-2 pr-3 tabular-nums">{category.min}–{category.max}</td>
                  <td className="py-2 pr-3">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${SEVERITY_TOKENS[category.id].dot}`}
                        aria-hidden="true"
                      />
                      {category.label}
                      {current && <span className="sr-only"> (current category)</span>}
                    </span>
                  </td>
                  <td className="py-2">{category.generalGuidance}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-3xl border border-sky-soft bg-white p-6">
        <h3 className="text-lg font-semibold">What one swap saves</h3>
        <p className="mt-2 text-sky-deep">
          A {swap.distanceKm} km trip by {profile.commute.mode} replaced with{' '}
          {profile.commute.mode === 'car' || profile.commute.mode === 'ev' ? 'a bicycle' : 'the train'} avoids{' '}
          <strong>{formatKg(swap.savedKgCo2e)} CO2e</strong> per trip, or{' '}
          <strong>{formatKg(swap.savedKgCo2ePerWeek)} CO2e</strong> across {profile.commute.tripsPerWeek} weekly trips.
        </p>
        <p className="mt-2 text-xs text-sky-deep">Factors: {swap.basis}.</p>
      </div>
    </div>
  );
}
