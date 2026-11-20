import { z } from 'zod';
import { ACTIVITY_LABELS, type ActivityId } from '@/lib/profile';

export const sensitivitySchema = z.enum([
  'children',
  'elderly',
  'asthma',
  'outdoorWorker',
  'pregnancy',
  'heart',
]);

export const travelModeSchema = z.enum(['car', 'ev', 'bus', 'rail', 'cycle', 'walk']);

const activityValues = Object.keys(ACTIVITY_LABELS) as [ActivityId, ...ActivityId[]];

export const profileSchema = z.object({
  sensitivities: z.array(sensitivitySchema).max(6).default([]),
  activities: z.array(z.enum(activityValues)).max(6).default([]),
  indoor: z.object({
    gasStove: z.boolean(),
    noAc: z.boolean(),
    pets: z.boolean(),
    purifier: z.boolean(),
  }),
  commute: z.object({
    mode: travelModeSchema,
    distanceKm: z.number().min(0).max(500),
    occupants: z.number().int().min(1).max(8),
    tripsPerWeek: z.number().int().min(1).max(14),
  }),
  plainLanguage: z.boolean(),
});

export const locationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  country: z.string().trim().max(80).optional(),
  admin1: z.string().trim().max(80).optional(),
  timezone: z.string().trim().max(80).default('auto'),
});

export const airQualityQuerySchema = z
  .object({
    city: z.string().trim().min(2).max(120).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
  })
  .superRefine((value, ctx) => {
    const hasCity = Boolean(value.city);
    const hasPair = value.latitude !== undefined && value.longitude !== undefined;
    if (hasCity === hasPair) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide either city or both latitude and longitude.',
      });
    }
  });

export const intentSchema = z.enum(['routine', 'indoor', 'alternatives', 'health', 'forecast']);

export const reasonRequestSchema = z.object({
  intent: intentSchema,
  location: locationSchema,
  profile: profileSchema,
});

export type ReasonRequest = z.infer<typeof reasonRequestSchema>;
export type AirQualityQuery = z.infer<typeof airQualityQuerySchema>;
