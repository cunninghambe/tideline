import { monotonicFactory } from 'ulid';

import { OpenMeteoResponse } from '@/types/schemas';
import type { WeatherSnapshotInsert } from '@/types';
import { ok, err } from '@/lib/result';
import type { Result } from '@/lib/result';

const ulid = monotonicFactory();

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

function buildUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,uv_index,weather_code',
    hourly: 'surface_pressure',
    past_days: '1',
    forecast_days: '1',
    timezone: 'auto',
  });
  return `${OPEN_METEO_BASE}?${params.toString()}`;
}

async function fetchWithRetry(url: string, retriesLeft: number, delayMs: number): Promise<Response> {
  const response = await fetch(url);
  if (response.status >= 500 && retriesLeft > 0) {
    await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    return fetchWithRetry(url, retriesLeft - 1, delayMs * 2);
  }
  return response;
}

/** Fetches current weather from Open-Meteo for the given coordinates. */
export async function fetchOpenMeteo(
  lat: number,
  lon: number,
): Promise<Result<OpenMeteoResponse>> {
  const url = buildUrl(lat, lon);
  let response: Response;

  try {
    response = await fetchWithRetry(url, 3, 1000);
  } catch (cause) {
    return err({ kind: 'network', message: 'Network request failed', cause });
  }

  if (response.status >= 400 && response.status < 500) {
    const message = `Open-Meteo 4xx: ${response.status} ${response.statusText}`;
    console.error(message);
    return err({ kind: 'network', message });
  }

  if (!response.ok) {
    return err({ kind: 'network', message: `Open-Meteo error: ${response.status} ${response.statusText}` });
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (cause) {
    return err({ kind: 'network', message: 'Failed to parse response body', cause });
  }

  const parsed = OpenMeteoResponse.safeParse(json);
  if (!parsed.success) {
    return err({ kind: 'validation', message: 'Open-Meteo response did not match schema', cause: parsed.error });
  }

  return ok(parsed.data);
}

/**
 * Maps an Open-Meteo API response to a weather_snapshots insert row.
 * Pollen is always null in v1 (G9: air-quality endpoint deferred).
 */
export function mapToSnapshot(r: OpenMeteoResponse, h3Cell: string): WeatherSnapshotInsert {
  const pressureNow = r.current.surface_pressure;
  // Pressure 24h ago = first entry of hourly array (since past_days=1)
  const pressure24hAgo = r.hourly.surface_pressure[0];

  return {
    id: ulid(),
    capturedAt: new Date(r.current.time),
    h3Cell,
    temperatureC: r.current.temperature_2m,
    humidityPct: r.current.relative_humidity_2m,
    pressureHpa: pressureNow,
    pressureChange24hHpa: pressureNow - pressure24hAgo,
    windKph: r.current.wind_speed_10m * 3.6,
    uvIndex: r.current.uv_index,
    pollenIndex: null,
    source: 'open-meteo',
  };
}
