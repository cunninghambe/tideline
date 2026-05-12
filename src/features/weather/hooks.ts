import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { desc, gte } from 'drizzle-orm';
import { monotonicFactory } from 'ulid';

import { db } from '@/db/client';
import { weatherSnapshots, deviceLocations } from '@/db/schema/weather';
import { ok, err } from '@/lib/result';
import type { Result } from '@/lib/result';
import type { WeatherSnapshotRow } from '@/types';

import { deviceCellLocal } from '@/services/h3';
import { fetchOpenMeteo, mapToSnapshot } from '@/services/weather';
import type { WeatherSnapshotWithFlag } from './types';

const ulid = monotonicFactory();

const WEATHER_QUERY_KEY = ['weather', 'current'] as const;
const ONE_HOUR_MS = 60 * 60 * 1000;

/** Fetches the most recently captured weather snapshot from local db. */
async function getMostRecentSnapshot(): Promise<WeatherSnapshotRow | null> {
  const rows = await db
    .select()
    .from(weatherSnapshots)
    .orderBy(desc(weatherSnapshots.capturedAt))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Fetches current location, calls Open-Meteo, inserts a new weather_snapshot
 * row and a device_locations row, then invalidates the current weather query.
 *
 * Privacy boundary: raw lat/lng goes ONLY into device_locations.
 * The weather_snapshot row stores ONLY the H3 cell.
 */
export async function captureWeatherNow(): Promise<Result<WeatherSnapshotWithFlag>> {
  // 1. Request location permission and get coordinates.
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) {
    return err({ kind: 'permission', message: 'Location permission denied' });
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const { latitude, longitude } = position.coords;

  // 2. Bucket to H3 resolution 7 for the snapshot row.
  const h3Cell = deviceCellLocal(latitude, longitude);

  // 3. Fetch weather. On failure, fall back to the most recent cached snapshot.
  const weatherResult = await fetchOpenMeteo(latitude, longitude);

  if (!weatherResult.ok) {
    const cached = await getMostRecentSnapshot();
    if (cached) {
      const fallback: WeatherSnapshotWithFlag = { ...cached, weather_unavailable: true };
      return ok(fallback);
    }
    return weatherResult;
  }

  // 4. Map to insert shape and write to db.
  const insertRow = mapToSnapshot(weatherResult.value, h3Cell);

  await db.insert(weatherSnapshots).values(insertRow);

  // 5. Write raw lat/lng to device_locations only (privacy boundary).
  await db.insert(deviceLocations).values({
    id: ulid(),
    weatherSnapshotId: insertRow.id,
    latitude,
    longitude,
  });

  // 6. Read back the persisted row to get the canonical WeatherSnapshotRow shape.
  const [saved] = await db
    .select()
    .from(weatherSnapshots)
    .where(gte(weatherSnapshots.id, insertRow.id))
    .limit(1);

  return ok(saved);
}

/**
 * Returns the latest cached weather snapshot for the current device location.
 * TanStack Query with 1h staleTime. Triggers captureWeatherNow() if cache is
 * empty or the most recent snapshot is older than 1 hour.
 */
export function useCurrentWeather(): {
  snapshot: WeatherSnapshotRow | null;
  isStale: boolean;
  isLoading: boolean;
  captureNow: () => Promise<void>;
} {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: WEATHER_QUERY_KEY,
    queryFn: getMostRecentSnapshot,
    staleTime: ONE_HOUR_MS,
  });

  const snapshot = data ?? null;
  const isStale =
    snapshot === null ||
    Date.now() - snapshot.capturedAt.getTime() > ONE_HOUR_MS;

  const captureNow = async (): Promise<void> => {
    await captureWeatherNow();
    await queryClient.invalidateQueries({ queryKey: WEATHER_QUERY_KEY });
  };

  // Trigger capture on mount if cache is empty or stale.
  useQuery({
    queryKey: [...WEATHER_QUERY_KEY, 'auto'],
    queryFn: async () => {
      if (isStale) {
        await captureWeatherNow();
        await queryClient.invalidateQueries({ queryKey: WEATHER_QUERY_KEY });
      }
      return null;
    },
    staleTime: ONE_HOUR_MS,
  });

  return { snapshot, isStale, isLoading, captureNow };
}

/**
 * Returns the weather snapshot whose capturedAt falls within the given date
 * (YYYY-MM-DD, device local time). Returns null if no snapshot exists for that date.
 */
export function useWeatherForDate(date: string): WeatherSnapshotRow | null {
  const start = new Date(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const { data } = useQuery({
    queryKey: ['weather', 'date', date],
    queryFn: async () => {
      const rows = await db
        .select()
        .from(weatherSnapshots)
        .where(
          gte(weatherSnapshots.capturedAt, start),
        )
        .orderBy(desc(weatherSnapshots.capturedAt))
        .limit(1);

      const row = rows[0];
      if (!row || row.capturedAt >= end) return null;
      return row;
    },
    staleTime: ONE_HOUR_MS,
  });

  return data ?? null;
}
