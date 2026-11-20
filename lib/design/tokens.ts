import type { AqiCategoryId } from '@/lib/air-quality/types';

export interface SeverityToken {
  id: AqiCategoryId;
  label: string;
  badge: string;
  dot: string;
  bar: string;
  textOnBadge: string;
}

/**
 * Severity is never signalled by colour alone: every badge carries its text
 * label, and each pair below was chosen for WCAG AA contrast (>= 4.5:1).
 */
export const SEVERITY_TOKENS: Record<AqiCategoryId, SeverityToken> = {
  good: {
    id: 'good',
    label: 'Good',
    badge: 'bg-severity-goodBg text-severity-good',
    dot: 'bg-severity-good',
    bar: 'bg-severity-good',
    textOnBadge: '#0E6B4F',
  },
  moderate: {
    id: 'moderate',
    label: 'Moderate',
    badge: 'bg-severity-moderateBg text-severity-moderate',
    dot: 'bg-severity-moderate',
    bar: 'bg-severity-moderate',
    textOnBadge: '#7A5706',
  },
  sensitive: {
    id: 'sensitive',
    label: 'Unhealthy for Sensitive Groups',
    badge: 'bg-severity-sensitiveBg text-severity-sensitive',
    dot: 'bg-severity-sensitive',
    bar: 'bg-severity-sensitive',
    textOnBadge: '#8A4508',
  },
  unhealthy: {
    id: 'unhealthy',
    label: 'Unhealthy',
    badge: 'bg-severity-unhealthyBg text-severity-unhealthy',
    dot: 'bg-severity-unhealthy',
    bar: 'bg-severity-unhealthy',
    textOnBadge: '#A12323',
  },
  very: {
    id: 'very',
    label: 'Very Unhealthy',
    badge: 'bg-severity-veryBg text-severity-very',
    dot: 'bg-severity-very',
    bar: 'bg-severity-very',
    textOnBadge: '#6B2E86',
  },
  hazardous: {
    id: 'hazardous',
    label: 'Hazardous',
    badge: 'bg-severity-hazardousBg text-severity-hazardous',
    dot: 'bg-severity-hazardous',
    bar: 'bg-severity-hazardous',
    textOnBadge: '#7A1830',
  },
};

export const SURFACE = {
  page: 'bg-paper text-sky-ink',
  panel: 'rounded-3xl border border-sky-soft bg-white shadow-card',
  capsule: 'inline-flex items-center gap-2 rounded-capsule px-4 py-2 text-sm font-semibold',
  primaryAction:
    'inline-flex items-center justify-center gap-2 rounded-capsule bg-sky-deep px-6 py-3 font-semibold text-white transition hover:bg-sky-mid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-deep',
  focusRing:
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-deep',
  displayAccent: 'font-display italic text-sky-mid',
} as const;
