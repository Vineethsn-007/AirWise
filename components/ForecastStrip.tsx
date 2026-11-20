import { SEVERITY_TOKENS } from '@/lib/design/tokens';
import type { HourlyAqi } from '@/lib/air-quality/types';

export function ForecastStrip({ hours, horizon = 24 }: { hours: HourlyAqi[]; horizon?: number }) {
  const visible = hours.slice(0, horizon);
  if (visible.length === 0) return <p>No forecast available.</p>;
  return (
    <div>
      <div
        className="flex gap-2 overflow-x-auto pb-3"
        role="list"
        aria-label="Hourly air quality forecast"
        tabIndex={0}
      >
        {visible.map((hour) => {
          const token = SEVERITY_TOKENS[hour.category.id];
          const height = Math.max(12, Math.min(72, Math.round((hour.aqi / 200) * 72)));
          return (
            <div key={hour.time} role="listitem" className="flex w-16 shrink-0 flex-col items-center gap-2">
              <span className="text-xs tabular-nums text-sky-deep">{hour.aqi}</span>
              <span
                className={`w-8 rounded-t-lg ${token.bar}`}
                style={{ height }}
                aria-hidden="true"
              />
              <span className="text-xs text-sky-deep">{hour.time.slice(11, 16)}</span>
              <span className="sr-only">{`${hour.time}: AQI ${hour.aqi}, ${hour.category.label}`}</span>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-sky-deep">
        Bars show forecast US AQI per hour. Each bar has a text value above it; colour is a secondary cue.
      </p>
    </div>
  );
}
