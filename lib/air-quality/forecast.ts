import { categoryForAqi } from './breakpoints';
import { severityRank } from './health';
import type { AqiTrend, HourlyAqi, OutdoorWindow } from './types';

/** Trend over the next six hours from the current hour. */
export function aqiTrend(hours: readonly HourlyAqi[]): AqiTrend {
  const sample = hours.slice(0, 6).map((hour) => hour.aqi);
  if (sample.length < 3) return 'steady';
  const first = sample[0] ?? 0;
  const last = sample[sample.length - 1] ?? 0;
  const delta = last - first;
  if (delta <= -8) return 'improving';
  if (delta >= 8) return 'worsening';
  return 'steady';
}

interface WindowCandidate {
  startIndex: number;
  averageAqi: number;
  score: number;
}

/**
 * Deterministic outdoor-window ranking: lower AQI wins, daylight hours get a
 * small preference, and sensitive households get a stronger penalty for
 * anything above the Moderate band.
 */
export function findBestWindows(
  hours: readonly HourlyAqi[],
  options: { sensitive?: boolean; count?: number; durationHours?: number; limitHours?: number },
): OutdoorWindow[] {
  const count = options.count ?? 3;
  const duration = options.durationHours ?? 2;
  const horizon = hours.slice(0, options.limitHours ?? 48);
  if (horizon.length < duration) return [];

  const candidates: WindowCandidate[] = [];
  for (let startIndex = 0; startIndex <= horizon.length - duration; startIndex += 1) {
    const slice = horizon.slice(startIndex, startIndex + duration);
    const averageAqi = slice.reduce((sum, hour) => sum + hour.aqi, 0) / duration;
    const hourOfDay = Number(slice[0]?.time.slice(11, 13) ?? '0');
    const daylight = hourOfDay >= 8 && hourOfDay <= 18 ? 0 : 6;
    const sensitivityPenalty = options.sensitive ? severityRank(categoryForAqi(averageAqi).id) * 9 : 0;
    candidates.push({
      startIndex,
      averageAqi,
      score: averageAqi + daylight + sensitivityPenalty,
    });
  }

  const picked: WindowCandidate[] = [];
  const used = new Set<number>();
  for (const candidate of candidates.sort((a, b) => a.score - b.score)) {
    if (picked.length >= count) break;
    const overlaps = Array.from({ length: duration }, (_, offset) => candidate.startIndex + offset).some(
      (index) => used.has(index),
    );
    if (overlaps) continue;
    picked.push(candidate);
    for (let offset = 0; offset < duration; offset += 1) used.add(candidate.startIndex + offset);
  }

  return picked
    .sort((a, b) => a.startIndex - b.startIndex)
    .map((candidate) => {
      const start = horizon[candidate.startIndex];
      const end = horizon[candidate.startIndex + duration - 1];
      if (!start || !end) throw new Error('Invalid forecast window');
      const category = categoryForAqi(candidate.averageAqi);
      return {
        start: start.time,
        end: end.time,
        averageAqi: Math.round(candidate.averageAqi),
        category,
        reason:
          candidate.averageAqi <= 50
            ? 'Lowest forecast pollution in this window; good for outdoor time.'
            : candidate.averageAqi <= 100
              ? 'Relatively cleaner window; keep strenuous sessions short if sensitive.'
              : 'Cleanest available window, but still limit exertion and watch symptoms.',
      };
    });
}
