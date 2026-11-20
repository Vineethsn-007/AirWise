'use client';

import type { HouseholdProfile } from '@/lib/profile';
import { travelModeSchema } from '@/lib/validation/schemas';
import { SURFACE } from '@/lib/design/tokens';

interface Props {
  commute: HouseholdProfile['commute'];
  onChange: (commute: HouseholdProfile['commute']) => void;
}

const NUMBER_FIELDS = [
  ['distanceKm', 'One-way distance (km)', 0.5, 200, 0.5],
  ['occupants', 'People in the car', 1, 8, 1],
  ['tripsPerWeek', 'Trips per week', 1, 14, 1],
] as const;

export function CommuteFields({ commute, onChange }: Props) {
  return (
    <fieldset className={`${SURFACE.panel} p-6`}>
      <legend className="px-2 text-lg font-semibold">Commute</legend>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="mode" className="block text-sm font-medium">
            Main mode
          </label>
          <select
            id="mode"
            value={commute.mode}
            onChange={(event) => {
              const parsed = travelModeSchema.safeParse(event.target.value);
              if (parsed.success) onChange({ ...commute, mode: parsed.data });
            }}
            className={`mt-1 w-full rounded-2xl border border-sky-soft bg-white px-4 py-2 ${SURFACE.focusRing}`}
          >
            {['car', 'ev', 'bus', 'rail', 'cycle', 'walk'].map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>
        {NUMBER_FIELDS.map(([key, label, min, max, step]) => (
          <div key={key}>
            <label htmlFor={key} className="block text-sm font-medium">
              {label}
            </label>
            <input
              id={key}
              type="number"
              min={min}
              max={max}
              step={step}
              value={commute[key]}
              onChange={(event) => onChange({ ...commute, [key]: Number(event.target.value) })}
              className={`mt-1 w-full rounded-2xl border border-sky-soft bg-white px-4 py-2 ${SURFACE.focusRing}`}
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}
