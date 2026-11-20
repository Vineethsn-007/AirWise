/**
 * Fixed, published emissions factors. Values are kg CO2e per kilometre.
 * - car (petrol), car (battery electric), rail: UK Government 2026 GHG
 *   conversion factors, reproduced by CO2balance travel calculator.
 * - bus: UK Government/DESNZ average local bus, kg CO2e per passenger-km.
 * - walk/cycle: zero operational emissions.
 * These are static facts. The LLM never invents or scales them.
 */
export type TravelMode = 'car' | 'ev' | 'bus' | 'rail' | 'cycle' | 'walk';

export const EMISSIONS_FACTORS: Record<TravelMode, { kgPerKm: number; basis: string }> = {
  car: { kgPerKm: 0.20751, basis: 'Average petrol car, per vehicle-km, UK Gov 2026 factors' },
  ev: { kgPerKm: 0.04, basis: 'Average battery electric car, per vehicle-km, UK Gov 2026 factors' },
  bus: { kgPerKm: 0.0965, basis: 'Average local bus, per passenger-km, UK Gov factors' },
  rail: { kgPerKm: 0.03989, basis: 'UK national rail, per passenger-km, UK Gov 2026 factors' },
  cycle: { kgPerKm: 0, basis: 'No operational emissions' },
  walk: { kgPerKm: 0, basis: 'No operational emissions' },
};

export const TRAVEL_MODE_LABELS: Record<TravelMode, string> = {
  car: 'petrol car',
  ev: 'electric car',
  bus: 'local bus',
  rail: 'train',
  cycle: 'bicycle',
  walk: 'walking',
};

export interface SwapInput {
  distanceKm: number;
  from: TravelMode;
  to: TravelMode;
  /** Occupants in a car; used to convert vehicle-km to per-person emissions. */
  occupants?: number;
  tripsPerWeek?: number;
}

export interface SwapResult {
  from: TravelMode;
  to: TravelMode;
  distanceKm: number;
  fromKgCo2e: number;
  toKgCo2e: number;
  savedKgCo2e: number;
  savedKgCo2ePerWeek: number;
  fromFactor: number;
  toFactor: number;
  basis: string;
}

function perPersonFactor(mode: TravelMode, occupants: number): number {
  const factor = EMISSIONS_FACTORS[mode].kgPerKm;
  return (mode === 'car' || mode === 'ev') && occupants > 1 ? factor / occupants : factor;
}

/** Deterministic comparison. No rounding happens here; callers format for display. */
export function estimateSwap(input: SwapInput): SwapResult {
  const distanceKm = Math.max(0, Math.min(500, input.distanceKm));
  const occupants = Math.max(1, Math.min(8, Math.floor(input.occupants ?? 1)));
  const tripsPerWeek = Math.max(1, Math.min(14, Math.floor(input.tripsPerWeek ?? 5)));
  const fromFactor = perPersonFactor(input.from, occupants);
  const toFactor = perPersonFactor(input.to, occupants);
  const fromKgCo2e = distanceKm * fromFactor;
  const toKgCo2e = distanceKm * toFactor;
  const savedKgCo2e = Math.max(0, fromKgCo2e - toKgCo2e);

  return {
    from: input.from,
    to: input.to,
    distanceKm,
    fromKgCo2e,
    toKgCo2e,
    savedKgCo2e,
    savedKgCo2ePerWeek: savedKgCo2e * tripsPerWeek,
    fromFactor,
    toFactor,
    basis: `${EMISSIONS_FACTORS[input.from].basis}; ${EMISSIONS_FACTORS[input.to].basis}`,
  };
}

export function formatKg(kg: number): string {
  return kg < 1 ? `${Math.round(kg * 1000)} g` : `${kg.toFixed(2)} kg`;
}
