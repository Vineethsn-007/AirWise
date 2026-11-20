import type { TravelMode } from './air-quality/emissions';
import type { SensitivityId } from './air-quality/health';

export type ActivityId =
  | 'schoolRun'
  | 'deskWork'
  | 'outdoorExercise'
  | 'commute'
  | 'eveningWalk'
  | 'cooking';

export const ACTIVITY_LABELS: Record<ActivityId, string> = {
  schoolRun: 'School run',
  deskWork: 'Desk work or study',
  outdoorExercise: 'Outdoor exercise',
  commute: 'Daily commute',
  eveningWalk: 'Evening walk',
  cooking: 'Home cooking',
};

export interface IndoorConditions {
  gasStove: boolean;
  noAc: boolean;
  pets: boolean;
  purifier: boolean;
}

export interface CommuteDetails {
  mode: TravelMode;
  distanceKm: number;
  occupants: number;
  tripsPerWeek: number;
}

export interface HouseholdProfile {
  sensitivities: SensitivityId[];
  activities: ActivityId[];
  indoor: IndoorConditions;
  commute: CommuteDetails;
  plainLanguage: boolean;
}

export const DEFAULT_PROFILE: HouseholdProfile = {
  sensitivities: [],
  activities: ['commute', 'eveningWalk'],
  indoor: { gasStove: false, noAc: false, pets: false, purifier: false },
  commute: { mode: 'car', distanceKm: 8, occupants: 1, tripsPerWeek: 5 },
  plainLanguage: false,
};

export function hasSensitivities(profile: HouseholdProfile): boolean {
  return profile.sensitivities.length > 0;
}
