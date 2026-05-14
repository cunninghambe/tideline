import './textEncodingPolyfill';
import { latLngToCell, cellToLatLng } from 'h3-js';

export const H3_RESOLUTION_LOCAL = 7; // ~5km, used for personal weather caching
export const H3_RESOLUTION_POOL = 5;  // ~25km, used for community pool

/** Returns the H3 resolution-7 cell containing the given coordinates. */
export function deviceCellLocal(lat: number, lon: number): string {
  return latLngToCell(lat, lon, H3_RESOLUTION_LOCAL);
}

/** Returns the H3 resolution-5 cell containing the given coordinates. */
export function deviceCellPool(lat: number, lon: number): string {
  return latLngToCell(lat, lon, H3_RESOLUTION_POOL);
}

/** Returns the [lat, lon] centroid of an H3 cell. */
export function cellCentroid(cell: string): [number, number] {
  return cellToLatLng(cell);
}
