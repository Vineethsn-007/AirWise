'use client';

import { useEffect, useState } from 'react';
import { useAppState } from '@/components/AppState';
import { ACTIVITY_LABELS, type ActivityId, type HouseholdProfile } from '@/lib/profile';
import { SENSITIVITY_LABELS, type SensitivityId } from '@/lib/air-quality/health';
import { CommuteFields } from '@/components/CommuteFields';
import { SURFACE } from '@/lib/design/tokens';

const SENSITIVITY_IDS = Object.keys(SENSITIVITY_LABELS) as SensitivityId[];
const ACTIVITY_IDS = Object.keys(ACTIVITY_LABELS) as ActivityId[];

export default function ProfilePage() {
  const { profile, setProfile } = useAppState();
  const [form, setForm] = useState<HouseholdProfile>(profile);
  const [saved, setSaved] = useState(false);

  useEffect(() => setForm(profile), [profile]);

  function toggleSensitivity(id: SensitivityId) {
    setSaved(false);
    setForm((current) => ({
      ...current,
      sensitivities: current.sensitivities.includes(id)
        ? current.sensitivities.filter((item) => item !== id)
        : [...current.sensitivities, id],
    }));
  }

  function toggleActivity(id: ActivityId) {
    setSaved(false);
    setForm((current) => ({
      ...current,
      activities: current.activities.includes(id)
        ? current.activities.filter((item) => item !== id)
        : [...current.activities, id],
    }));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-mid">Personalisation</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Your <span className={SURFACE.displayAccent}>household</span>
        </h1>
        <p className="mt-3 text-sky-deep">
          Saved on this device only. These answers condition every recommendation, but they never change the
          observed AQI or the published health tables.
        </p>
      </header>

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          setProfile(form);
          setSaved(true);
        }}
      >
        <fieldset className={`${SURFACE.panel} p-6`}>
          <legend className="px-2 text-lg font-semibold">Sensitivities</legend>
          <p className="mb-4 text-sm text-sky-deep">Select anyone in the household who is more sensitive to pollution.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {SENSITIVITY_IDS.map((id) => (
              <label key={id} className="flex items-center gap-3 rounded-2xl bg-sky-mist px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.sensitivities.includes(id)}
                  onChange={() => toggleSensitivity(id)}
                  className="h-5 w-5 accent-sky-deep"
                />
                <span>{SENSITIVITY_LABELS[id]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={`${SURFACE.panel} p-6`}>
          <legend className="px-2 text-lg font-semibold">Daily activities</legend>
          <div className="mt-4 flex flex-wrap gap-3">
            {ACTIVITY_IDS.map((id) => (
              <label key={id} className={`${SURFACE.capsule} cursor-pointer border border-sky-soft bg-sky-mist`}>
                <input
                  type="checkbox"
                  checked={form.activities.includes(id)}
                  onChange={() => toggleActivity(id)}
                  className="h-4 w-4 accent-sky-deep"
                />
                {ACTIVITY_LABELS[id]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={`${SURFACE.panel} p-6`}>
          <legend className="px-2 text-lg font-semibold">Indoor conditions</legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                ['gasStove', 'Gas stove at home'],
                ['noAc', 'No air conditioning'],
                ['pets', 'Pets indoors'],
                ['purifier', 'Purifier available'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 rounded-2xl bg-sky-mist px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.indoor[key]}
                  onChange={(event) => {
                    setSaved(false);
                    setForm((current) => ({
                      ...current,
                      indoor: { ...current.indoor, [key]: event.target.checked },
                    }));
                  }}
                  className="h-5 w-5 accent-sky-deep"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <CommuteFields
          commute={form.commute}
          onChange={(commute) => {
            setSaved(false);
            setForm((current) => ({ ...current, commute }));
          }}
        />

        <label className={`${SURFACE.panel} flex cursor-pointer items-center gap-3 p-6`}>
          <input
            type="checkbox"
            checked={form.plainLanguage}
            onChange={(event) => {
              setSaved(false);
              setForm((current) => ({ ...current, plainLanguage: event.target.checked }));
            }}
            className="h-5 w-5 accent-sky-deep"
          />
          <span>
            <strong>Plain-language mode</strong>
            <span className="block text-sm text-sky-deep">Shorter sentences and fewer technical terms.</span>
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className={SURFACE.primaryAction}>Save household profile</button>
          <p role="status" aria-live="polite" className="text-sm text-sky-deep">
            {saved ? 'Saved. Your plans will update on the planner.' : ''}
          </p>
        </div>
      </form>
    </div>
  );
}
