import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { OpenMeteoResponse } from '@/types/schemas';

import { fetchOpenMeteo, mapToSnapshot } from './weather';

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------

const KNOWN_RESPONSE: OpenMeteoResponse = {
  latitude: -33.9249,
  longitude: 18.4241,
  timezone: 'Africa/Johannesburg',
  current: {
    time: '2026-05-11T12:00',
    temperature_2m: 18.5,
    relative_humidity_2m: 72,
    surface_pressure: 1018.3,
    wind_speed_10m: 18.7,       // Open-Meteo default unit is km/h
    uv_index: 3.2,
    weather_code: 1,
  },
  hourly: {
    time: ['2026-05-10T12:00', '2026-05-10T13:00'],
    surface_pressure: [1015.1, 1016.0], // first entry = pressure 24h ago
  },
};

const H3_CELL = '87be8d456ffffff'; // Cape Town resolution-7

// ---------------------------------------------------------------------------
// mapToSnapshot
// ---------------------------------------------------------------------------

describe('mapToSnapshot', () => {
  it('maps temperature, humidity, pressure correctly', () => {
    const snap = mapToSnapshot(KNOWN_RESPONSE, H3_CELL);

    expect(snap.temperatureC).toBe(18.5);
    expect(snap.humidityPct).toBe(72);
    expect(snap.pressureHpa).toBe(1018.3);
  });

  it('computes pressureChange24hHpa as current minus first hourly entry', () => {
    const snap = mapToSnapshot(KNOWN_RESPONSE, H3_CELL);
    // 1018.3 - 1015.1 = 3.2
    expect(snap.pressureChange24hHpa).toBeCloseTo(3.2, 5);
  });

  it('stores wind speed in km/h (Open-Meteo default unit)', () => {
    const snap = mapToSnapshot(KNOWN_RESPONSE, H3_CELL);
    expect(snap.windKph).toBeCloseTo(18.7, 5);
  });

  it('stores uv_index directly', () => {
    const snap = mapToSnapshot(KNOWN_RESPONSE, H3_CELL);
    expect(snap.uvIndex).toBe(3.2);
  });

  it('always sets pollenIndex to null (G9: air-quality endpoint deferred)', () => {
    const snap = mapToSnapshot(KNOWN_RESPONSE, H3_CELL);
    expect(snap.pollenIndex).toBeNull();
  });

  it('sets source to open-meteo', () => {
    const snap = mapToSnapshot(KNOWN_RESPONSE, H3_CELL);
    expect(snap.source).toBe('open-meteo');
  });

  it('stores h3Cell', () => {
    const snap = mapToSnapshot(KNOWN_RESPONSE, H3_CELL);
    expect(snap.h3Cell).toBe(H3_CELL);
  });

  it('sets capturedAt from current.time', () => {
    const snap = mapToSnapshot(KNOWN_RESPONSE, H3_CELL);
    expect(snap.capturedAt).toEqual(new Date('2026-05-11T12:00'));
  });

  it('handles null uv_index', () => {
    const response: OpenMeteoResponse = {
      ...KNOWN_RESPONSE,
      current: { ...KNOWN_RESPONSE.current, uv_index: null },
    };
    const snap = mapToSnapshot(response, H3_CELL);
    expect(snap.uvIndex).toBeNull();
  });

  it('generates a unique id for each call', () => {
    const a = mapToSnapshot(KNOWN_RESPONSE, H3_CELL);
    const b = mapToSnapshot(KNOWN_RESPONSE, H3_CELL);
    expect(a.id).not.toBe(b.id);
  });
});

// ---------------------------------------------------------------------------
// fetchOpenMeteo — mocked fetch
// ---------------------------------------------------------------------------

describe('fetchOpenMeteo', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockFetchOk(body: unknown): void {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(body), { status: 200 }),
    );
  }

  function mockFetchStatus(status: number): void {
    vi.mocked(fetch).mockResolvedValue(
      new Response('', { status }),
    );
  }

  it('happy path: returns parsed response on 200', async () => {
    mockFetchOk(KNOWN_RESPONSE);
    const result = await fetchOpenMeteo(-33.9249, 18.4241);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.latitude).toBe(-33.9249);
      expect(result.value.current.temperature_2m).toBe(18.5);
    }
  });

  it('includes correct query params in URL', async () => {
    mockFetchOk(KNOWN_RESPONSE);
    await fetchOpenMeteo(-33.9249, 18.4241);

    const url = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(url).toContain('latitude=-33.9249');
    expect(url).toContain('longitude=18.4241');
    expect(url).toContain('current=temperature_2m');
    expect(url).toContain('hourly=surface_pressure');
    expect(url).toContain('past_days=1');
    expect(url).toContain('forecast_days=1');
    expect(url).toContain('timezone=auto');
  });

  it('4xx: returns err with kind=network and does not retry', async () => {
    mockFetchStatus(404);
    const result = await fetchOpenMeteo(0, 0);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('network');
    }
    // Should only have called fetch once (no retry for 4xx)
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it('5xx: retries up to 3 times then returns err', async () => {
    mockFetchStatus(503);
    vi.useFakeTimers();

    const resultPromise = fetchOpenMeteo(0, 0);
    // Advance through all retry delays: 1000ms, 2000ms, 4000ms
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('network');
    }
    // Initial call + 3 retries = 4 total
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(4);

    vi.useRealTimers();
  });

  it('5xx: succeeds if server recovers on the 2nd attempt', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(KNOWN_RESPONSE), { status: 200 }));

    vi.useFakeTimers();
    const resultPromise = fetchOpenMeteo(0, 0);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.ok).toBe(true);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('malformed response: returns err with kind=validation', async () => {
    mockFetchOk({ latitude: 'not-a-number' });
    const result = await fetchOpenMeteo(0, 0);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('validation');
    }
  });

  it('network failure (fetch throws): returns err with kind=network', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network offline'));
    const result = await fetchOpenMeteo(0, 0);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('network');
    }
  });
});
