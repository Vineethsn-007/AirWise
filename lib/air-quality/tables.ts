import type { PollutantKey } from './types';

export interface BreakpointBand {
  concentrationLow: number;
  concentrationHigh: number;
  aqiLow: number;
  aqiHigh: number;
}

type BandTuple = readonly [number, number, number, number];

function bands(tuples: readonly BandTuple[]): BreakpointBand[] {
  return tuples.map(([concentrationLow, concentrationHigh, aqiLow, aqiHigh]) => ({
    concentrationLow,
    concentrationHigh,
    aqiLow,
    aqiHigh,
  }));
}

/**
 * EPA PM breakpoints (2024 revision) + EPA gas breakpoints, as published in the
 * Open-Meteo Air Quality API documentation. Units match the API response.
 * Empty averaging columns are represented by an absent band, not a zero band.
 */
export const POLLUTANT_BREAKPOINTS: Record<
  PollutantKey,
  { unit: string; averaging: string; tables: readonly BreakpointBand[][] }
> = {
  pm25: {
    unit: 'ug/m3',
    averaging: '24h rolling',
    tables: [
      bands([
        [0, 9, 0, 50],
        [9, 35.5, 51, 100],
        [35.5, 55.5, 101, 150],
        [55.5, 125.5, 151, 200],
        [125.5, 225.5, 201, 300],
        [225.5, 325.5, 301, 500],
      ]),
    ],
  },
  pm10: {
    unit: 'ug/m3',
    averaging: '24h rolling',
    tables: [
      bands([
        [0, 55, 0, 50],
        [55, 155, 51, 100],
        [155, 255, 101, 150],
        [255, 355, 151, 200],
        [355, 425, 201, 300],
        [425, 605, 301, 500],
      ]),
    ],
  },
  o3: {
    unit: 'ppb',
    averaging: '8h and 1h, higher sub-index wins',
    tables: [
      bands([
        [0, 55, 0, 50],
        [55, 70, 51, 100],
        [70, 85, 101, 150],
        [85, 105, 151, 200],
        [105, 200, 201, 300],
      ]),
      bands([
        [125, 165, 101, 150],
        [165, 205, 151, 200],
        [205, 405, 201, 300],
        [405, 605, 301, 500],
      ]),
    ],
  },
  no2: {
    unit: 'ppb',
    averaging: '1h',
    tables: [
      bands([
        [0, 54, 0, 50],
        [54, 100, 51, 100],
        [100, 360, 101, 150],
        [360, 650, 151, 200],
        [650, 1250, 201, 300],
        [1250, 2050, 301, 500],
      ]),
    ],
  },
  so2: {
    unit: 'ppb',
    averaging: '1h and 24h, higher sub-index wins',
    tables: [
      bands([
        [0, 35, 0, 50],
        [35, 75, 51, 100],
        [75, 185, 101, 150],
        [185, 305, 151, 200],
      ]),
      bands([
        [305, 605, 201, 300],
        [605, 1005, 301, 500],
      ]),
    ],
  },
  co: {
    unit: 'ppm',
    averaging: '8h rolling',
    tables: [
      bands([
        [0, 4.5, 0, 50],
        [4.5, 9.5, 51, 100],
        [9.5, 12.5, 101, 150],
        [12.5, 15.5, 151, 200],
        [15.5, 30.5, 201, 300],
        [30.5, 50.5, 301, 500],
      ]),
    ],
  },
};
