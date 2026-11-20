'use client';

import { useState } from 'react';
import type { AirQualitySnapshot } from '@/lib/air-quality/types';
import { useAppState } from '@/components/AppState';
import { SURFACE } from '@/lib/design/tokens';

export function LocationSearch() {
  const { setLocation, setSnapshot, refresh } = useAppState();
  const [city, setCity] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function apply(params: URLSearchParams, label: string) {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/air-quality?${params}`);
      const payload = (await response.json()) as AirQualitySnapshot & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Location lookup failed');
      setSnapshot(payload);
      setLocation(payload.location);
      setMessage(`Showing live data for ${label}.`);
    } catch (caught: unknown) {
      setMessage(caught instanceof Error ? caught.message : 'Location lookup failed');
    } finally {
      setBusy(false);
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = city.trim();
    if (name.length < 2) return;
    void apply(new URLSearchParams({ city: name }), name);
  }

  function locate() {
    if (!navigator.geolocation) {
      setMessage('Geolocation unavailable. Search by city instead.');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const params = new URLSearchParams({
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        });
        void apply(params, 'your location').finally(refresh);
      },
      () => {
        setBusy(false);
        setMessage('Location permission denied. Search by city instead.');
      },
      { timeout: 8000 },
    );
  }

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={submit} className="flex w-full flex-col gap-2 sm:flex-row">
        <label htmlFor="city-input" className="sr-only">
          City name
        </label>
        <input
          id="city-input"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="Enter a city, e.g. Delhi or London"
          autoComplete="address-level2"
          className={`min-w-0 flex-1 rounded-capsule border border-sky-soft bg-white px-5 py-3 text-base text-sky-ink placeholder:text-sky-mid/70 ${SURFACE.focusRing}`}
        />
        <button type="submit" disabled={busy} className={`${SURFACE.primaryAction} disabled:opacity-60`}>
          Check air
        </button>
        <button
          type="button"
          onClick={locate}
          disabled={busy}
          aria-label="Use my current location"
          className={`${SURFACE.capsule} border border-sky-mid/40 bg-white text-sky-deep hover:bg-sky-mist disabled:opacity-60 ${SURFACE.focusRing}`}
        >
          <span aria-hidden="true">⌖</span> Use my location
        </button>
      </form>
      <p role="status" aria-live="polite" className="mt-2 min-h-6 text-sm text-sky-deep">
        {message}
      </p>
    </div>
  );
}
