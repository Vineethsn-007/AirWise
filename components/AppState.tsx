'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AirQualitySnapshot, ResolvedLocation } from '@/lib/air-quality/types';
import { DEFAULT_PROFILE, type HouseholdProfile } from '@/lib/profile';

const DEFAULT_LOCATION: ResolvedLocation = {
  name: 'Delhi',
  latitude: 28.6139,
  longitude: 77.209,
  country: 'India',
  admin1: 'Delhi',
  timezone: 'Asia/Kolkata',
};

interface AppStateValue {
  location: ResolvedLocation;
  profile: HouseholdProfile;
  snapshot: AirQualitySnapshot | null;
  loading: boolean;
  error: string | null;
  setLocation: (location: ResolvedLocation) => void;
  setProfile: (profile: HouseholdProfile) => void;
  refresh: () => void;
  setSnapshot: (snapshot: AirQualitySnapshot) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<ResolvedLocation>(DEFAULT_LOCATION);
  const [profile, setProfileState] = useState<HouseholdProfile>(DEFAULT_PROFILE);
  const [snapshot, setSnapshot] = useState<AirQualitySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    setLocationState(readStored('airwise.location', DEFAULT_LOCATION));
    setProfileState(readStored('airwise.profile', DEFAULT_PROFILE));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
    });
    fetch(`/api/air-quality?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as AirQualitySnapshot & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? 'Air quality unavailable');
        setSnapshot(payload);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return;
        setError(caught instanceof Error ? caught.message : 'Air quality unavailable');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [location.latitude, location.longitude, version]);

  const setLocation = useCallback((next: ResolvedLocation) => {
    setLocationState(next);
    window.localStorage.setItem('airwise.location', JSON.stringify(next));
  }, []);

  const setProfile = useCallback((next: HouseholdProfile) => {
    setProfileState(next);
    window.localStorage.setItem('airwise.profile', JSON.stringify(next));
  }, []);

  const value = useMemo<AppStateValue>(
    () => ({
      location,
      profile,
      snapshot,
      loading,
      error,
      setLocation,
      setProfile,
      refresh: () => setVersion((current) => current + 1),
      setSnapshot,
    }),
    [location, profile, snapshot, loading, error, setLocation, setProfile],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const state = useContext(AppStateContext);
  if (!state) throw new Error('useAppState must be used inside AppStateProvider');
  return state;
}
