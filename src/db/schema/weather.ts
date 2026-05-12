import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const weatherSnapshots = sqliteTable('weather_snapshots', {
  id: text('id').primaryKey(),
  capturedAt: integer('captured_at', { mode: 'timestamp' }).notNull(),
  // location stored as h3 cell + rough bucket; raw lat/lng held in a separate
  // local-only table (device_locations) so we can re-pull weather later.
  h3Cell: text('h3_cell').notNull(), // resolution 7 (~5km), aggregated to 5 (~25km) for pool
  temperatureC: real('temperature_c'),
  humidityPct: real('humidity_pct'),
  pressureHpa: real('pressure_hpa'),
  pressureChange24hHpa: real('pressure_change_24h_hpa'),
  windKph: real('wind_kph'),
  uvIndex: real('uv_index'),
  /** Pollen index is always null in v1 (Open-Meteo air-quality endpoint deferred) */
  pollenIndex: text('pollen_index').$type<
    'low' | 'moderate' | 'high' | 'very_high' | null
  >(),
  source: text('source').notNull().default('open-meteo'),
});

/**
 * LOCAL ONLY. Never syncs anywhere.
 * Holds raw lat/lng so we can re-query weather APIs if needed.
 */
export const deviceLocations = sqliteTable('device_locations', {
  id: text('id').primaryKey(),
  weatherSnapshotId: text('weather_snapshot_id')
    .notNull()
    .references(() => weatherSnapshots.id),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
});
