'use client';

import { useState } from 'react';
import { AqiBadge } from '@/components/AqiBadge';
import { useAppState } from '@/components/AppState';
import type { AirQualitySnapshot } from '@/lib/air-quality/types';
import { SURFACE } from '@/lib/design/tokens';

export function NearbyCompare() {
  const { location } = useAppState();
  const [snapshot, setSnapshot] = useState<AirQualitySnapshot | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    try {
      const params = new URLSearchParams({
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        nearby: '1',
      });
      const response = await fetch(`/api/air-quality?${params}`);
      const payload = (await response.json()) as AirQualitySnapshot & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Comparison unavailable');
      setSnapshot(payload);
      setMessage('');
    } catch (caught: unknown) {
      setMessage(caught instanceof Error ? caught.message : 'Comparison unavailable');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${SURFACE.panel} p-6`} aria-labelledby="nearby-heading">
      <div className="flex items-center justify-between gap-4">
        <h2 id="nearby-heading" className="text-xl font-semibold">
          Spatial variation nearby
        </h2>
        <button
          type="button"
          onClick={() => void load()}
          disabled={busy}
          className={`${SURFACE.capsule} border border-sky-soft text-sky-deep disabled:opacity-60`}
        >
          {busy ? 'Comparing…' : 'Compare nearby points'}
        </button>
      </div>
      {message && <p className="mt-3 text-sm text-severity-unhealthy">{message}</p>}
      {snapshot && (
        <ul className="mt-4 space-y-2">
          {[
            {
              name: snapshot.location.name,
              aqi: snapshot.current.aqi,
              category: snapshot.current.category.label,
            },
            ...snapshot.nearby.map((point) => ({
              name: point.name,
              aqi: point.aqi,
              category: point.category.label,
            })),
          ].map((point) => (
            <li key={point.name} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-sky-mist px-4 py-3">
              <span className="font-medium">{point.name}</span>
              <AqiBadge aqi={point.aqi} categoryLabel={point.category} compact />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
