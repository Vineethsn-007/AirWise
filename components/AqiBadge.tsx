import { SEVERITY_TOKENS } from '@/lib/design/tokens';
import { categoryForAqi } from '@/lib/air-quality/breakpoints';

interface AqiBadgeProps {
  aqi: number;
  categoryLabel?: string;
  compact?: boolean;
}

export function AqiBadge({ aqi, categoryLabel, compact = false }: AqiBadgeProps) {
  const category = categoryForAqi(aqi);
  const token = SEVERITY_TOKENS[category.id];
  const label = categoryLabel ?? category.label;
  return (
    <span
      className={`${token.badge} ${compact ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'} inline-flex items-center gap-2 rounded-capsule font-semibold`}
      aria-label={`Air quality index ${Math.round(aqi)}, ${label}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${token.dot}`} aria-hidden="true" />
      <span aria-hidden="true">{Math.round(aqi)}</span>
      <span>{label}</span>
    </span>
  );
}
