import type { WeatherSnapshotRow } from '@/types';

/**
 * Returned by captureWeatherNow when the API call fails but a cached snapshot exists.
 * `weather_unavailable` is a non-persisted flag — it is NOT stored in the DB.
 */
export type WeatherSnapshotWithFlag = WeatherSnapshotRow & {
  weather_unavailable?: true;
};
