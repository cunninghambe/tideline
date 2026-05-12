import { describe, it, expect } from 'vitest';
import { latLngToCell } from 'h3-js';

import {
  deviceCellLocal,
  deviceCellPool,
  cellCentroid,
  H3_RESOLUTION_LOCAL,
  H3_RESOLUTION_POOL,
} from './h3';

// Cape Town, South Africa — a well-known test coordinate.
const CAPE_TOWN_LAT = -33.9249;
const CAPE_TOWN_LON = 18.4241;

// New York City — second well-known coordinate.
const NYC_LAT = 40.7128;
const NYC_LON = -74.006;

describe('deviceCellLocal', () => {
  it('returns a resolution-7 cell for Cape Town', () => {
    const cell = deviceCellLocal(CAPE_TOWN_LAT, CAPE_TOWN_LON);
    expect(cell).toBe(latLngToCell(CAPE_TOWN_LAT, CAPE_TOWN_LON, H3_RESOLUTION_LOCAL));
  });

  it('returns a resolution-7 cell for NYC', () => {
    const cell = deviceCellLocal(NYC_LAT, NYC_LON);
    expect(cell).toBe(latLngToCell(NYC_LAT, NYC_LON, H3_RESOLUTION_LOCAL));
  });

  it('returns different cells for distant coordinates', () => {
    const capeTown = deviceCellLocal(CAPE_TOWN_LAT, CAPE_TOWN_LON);
    const nyc = deviceCellLocal(NYC_LAT, NYC_LON);
    expect(capeTown).not.toBe(nyc);
  });
});

describe('deviceCellPool', () => {
  it('returns a resolution-5 cell for Cape Town', () => {
    const cell = deviceCellPool(CAPE_TOWN_LAT, CAPE_TOWN_LON);
    expect(cell).toBe(latLngToCell(CAPE_TOWN_LAT, CAPE_TOWN_LON, H3_RESOLUTION_POOL));
  });

  it('returns a resolution-5 cell for NYC', () => {
    const cell = deviceCellPool(NYC_LAT, NYC_LON);
    expect(cell).toBe(latLngToCell(NYC_LAT, NYC_LON, H3_RESOLUTION_POOL));
  });

  it('resolution-5 and resolution-7 produce different cells for the same point', () => {
    const local = deviceCellLocal(CAPE_TOWN_LAT, CAPE_TOWN_LON);
    const pool = deviceCellPool(CAPE_TOWN_LAT, CAPE_TOWN_LON);
    expect(local).not.toBe(pool);
  });
});

describe('cellCentroid', () => {
  it('returns [lat, lon] tuple close to the input for Cape Town resolution-7', () => {
    const cell = deviceCellLocal(CAPE_TOWN_LAT, CAPE_TOWN_LON);
    const [lat, lon] = cellCentroid(cell);
    // Centroid should be within ~5km of the input (~0.05 degrees at this latitude).
    expect(lat).toBeCloseTo(CAPE_TOWN_LAT, 0);
    expect(lon).toBeCloseTo(CAPE_TOWN_LON, 0);
  });

  it('returns a two-element array', () => {
    const cell = deviceCellPool(NYC_LAT, NYC_LON);
    const result = cellCentroid(cell);
    expect(result).toHaveLength(2);
    expect(typeof result[0]).toBe('number');
    expect(typeof result[1]).toBe('number');
  });
});
