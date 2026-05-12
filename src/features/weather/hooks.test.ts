import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { latLngToCell } from 'h3-js';
import * as Location from 'expo-location';
import { captureWeatherNow } from './hooks';

// vi.mock() is hoisted by vitest — placement relative to imports does not matter at runtime.
vi.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(),
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied' },
  Accuracy: { Balanced: 3 },
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({ data: undefined, isLoading: false })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));

// In-memory stores used by the db mock below.
const snapshotStore: Record<string, unknown>[] = [];
const locationStore: Record<string, unknown>[] = [];

vi.mock('@/db/client', () => ({
  db: {
    select: () => ({
      from: () => ({
        orderBy: () => ({
          limit: () => Promise.resolve([...snapshotStore].reverse()),
        }),
        where: () => ({
          orderBy: () => ({
            limit: () => Promise.resolve([...snapshotStore].reverse()),
          }),
          limit: () => Promise.resolve([...snapshotStore]),
        }),
      }),
    }),
    insert: () => ({
      values: (row: Record<string, unknown>) => {
        if ('weatherSnapshotId' in row) {
          locationStore.push(row);
        } else {
          snapshotStore.push(row);
        }
        return Promise.resolve();
      },
    }),
  },
}));

const CAPE_TOWN_LAT = -33.9249;
const CAPE_TOWN_LON = 18.4241;

const MOCK_RESPONSE = {
  latitude: CAPE_TOWN_LAT,
  longitude: CAPE_TOWN_LON,
  timezone: 'Africa/Johannesburg',
  current: {
    time: '2026-05-11T12:00',
    temperature_2m: 18.5,
    relative_humidity_2m: 72,
    surface_pressure: 1018.3,
    wind_speed_10m: 5.2,
    uv_index: 3.2,
    weather_code: 1,
  },
  hourly: {
    time: ['2026-05-10T12:00'],
    surface_pressure: [1015.1],
  },
};

describe('captureWeatherNow integration', () => {
  beforeEach(() => {
    snapshotStore.length = 0;
    locationStore.length = 0;

    vi.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({
      status: Location.PermissionStatus.GRANTED,
      granted: true,
      canAskAgain: true,
      expires: 'never',
    });

    vi.mocked(Location.getCurrentPositionAsync).mockResolvedValue({
      coords: {
        latitude: CAPE_TOWN_LAT,
        longitude: CAPE_TOWN_LON,
        altitude: null,
        accuracy: 10,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
      mocked: false,
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify(MOCK_RESPONSE), { status: 200 }),
    ));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('inserts a row into weatherSnapshots with the correct h3Cell', async () => {
    const result = await captureWeatherNow();

    expect(result.ok).toBe(true);
    expect(snapshotStore).toHaveLength(1);

    const snap = snapshotStore[0] as Record<string, unknown>;
    const expectedCell = latLngToCell(CAPE_TOWN_LAT, CAPE_TOWN_LON, 7);
    expect(snap.h3Cell).toBe(expectedCell);
  });

  it('inserts a row into deviceLocations with raw lat/lng', async () => {
    await captureWeatherNow();

    expect(locationStore).toHaveLength(1);
    const loc = locationStore[0] as Record<string, unknown>;
    expect(loc.latitude).toBe(CAPE_TOWN_LAT);
    expect(loc.longitude).toBe(CAPE_TOWN_LON);
  });

  it('weatherSnapshots row does NOT contain raw lat/lng (privacy boundary)', async () => {
    await captureWeatherNow();

    const snap = snapshotStore[0] as Record<string, unknown>;
    expect(snap).not.toHaveProperty('latitude');
    expect(snap).not.toHaveProperty('longitude');
  });

  it('deviceLocations.weatherSnapshotId matches the snapshot id', async () => {
    await captureWeatherNow();

    const snap = snapshotStore[0] as Record<string, unknown>;
    const loc = locationStore[0] as Record<string, unknown>;
    expect(loc.weatherSnapshotId).toBe(snap.id);
  });

  it('returns err with kind=permission when location is denied', async () => {
    vi.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({
      status: Location.PermissionStatus.DENIED,
      granted: false,
      canAskAgain: false,
      expires: 'never',
    });

    const result = await captureWeatherNow();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('permission');
    }
  });

  it('returns cached snapshot with weather_unavailable=true when fetch fails', async () => {
    // Pre-seed a cached snapshot in the store
    const cachedRow = {
      id: '01HXXXCACHED',
      capturedAt: new Date('2026-05-11T10:00'),
      h3Cell: latLngToCell(CAPE_TOWN_LAT, CAPE_TOWN_LON, 7),
      temperatureC: 17,
      humidityPct: 65,
      pressureHpa: 1017,
      pressureChange24hHpa: -1.5,
      windKph: 10,
      uvIndex: 2,
      pollenIndex: null,
      source: 'open-meteo',
    };
    snapshotStore.push(cachedRow);

    vi.mocked(fetch).mockRejectedValue(new Error('Network offline'));

    const result = await captureWeatherNow();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.weather_unavailable).toBe(true);
      expect(result.value.id).toBe('01HXXXCACHED');
    }
  });
});
