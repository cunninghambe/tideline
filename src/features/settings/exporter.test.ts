import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateExport } from './exporter';

// vi.mock is hoisted by vitest above all imports at runtime.

const { mockWriteAsStringAsync } = vi.hoisted(() => ({
  mockWriteAsStringAsync: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('expo-file-system/build/legacy/FileSystem', () => ({
  cacheDirectory: '/tmp/test-cache/',
  writeAsStringAsync: mockWriteAsStringAsync,
}));

vi.mock('expo-file-system/build/legacy/FileSystem.types', () => ({
  EncodingType: { UTF8: 'utf8', Base64: 'base64' },
}));

vi.mock('@/db/client', () => ({
  db: {
    select: () => ({
      from: (table: string) => ({
        all: () => {
          const data: Record<string, unknown[]> = {
            migraine_events: [{ id: 'mig1', peakSeverity: 8 }],
            medications: [{ id: 'med1', brandName: 'Sumatriptan 50mg' }],
            medication_doses: [],
            daily_checkins: [{ id: 'ci1', date: '2026-05-01' }],
            food_tags: [],
            cycle_events: [],
            weather_snapshots: [],
            settings: [{ key: 'theme.palette', value: 'calm_sand' }],
          };
          return data[table as keyof typeof data] ?? [];
        },
      }),
    }),
    run: vi.fn(),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ run: vi.fn() })) })),
  },
  runMigrations: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/db/schema', () => ({
  migraineEvents: 'migraine_events',
  medications: 'medications',
  medicationDoses: 'medication_doses',
  dailyCheckins: 'daily_checkins',
  foodTags: 'food_tags',
  cycleEvents: 'cycle_events',
  weatherSnapshots: 'weather_snapshots',
  settings: 'settings',
}));

describe('generateExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteAsStringAsync.mockResolvedValue(undefined);
  });

  it('returns ok with a filePath on success', async () => {
    const result = await generateExport();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.filePath).toContain('tideline-export-');
      expect(result.value.filePath).toContain('.json');
    }
  });

  it('writes a file to the cache directory', async () => {
    await generateExport();
    expect(mockWriteAsStringAsync).toHaveBeenCalledTimes(1);
    const [path] = mockWriteAsStringAsync.mock.calls[0] as [string];
    expect(path).toContain('/tmp/test-cache/');
  });

  it('produces valid JSON with the correct top-level shape', async () => {
    let writtenJson = '';
    mockWriteAsStringAsync.mockImplementation((_path: string, content: string) => {
      writtenJson = content;
      return Promise.resolve();
    });

    await generateExport();

    const parsed = JSON.parse(writtenJson) as Record<string, unknown>;
    expect(parsed['tideline_export_version']).toBe('1');
    expect(typeof parsed['exported_at']).toBe('string');
    expect(Array.isArray(parsed['migraine_events'])).toBe(true);
    expect(Array.isArray(parsed['medications'])).toBe(true);
    expect(Array.isArray(parsed['medication_doses'])).toBe(true);
    expect(Array.isArray(parsed['daily_checkins'])).toBe(true);
    expect(Array.isArray(parsed['food_tags'])).toBe(true);
    expect(Array.isArray(parsed['cycle_events'])).toBe(true);
    expect(Array.isArray(parsed['weather_snapshots'])).toBe(true);
    expect(typeof parsed['settings']).toBe('object');
  });

  it('includes seeded migraine and medication data', async () => {
    let writtenJson = '';
    mockWriteAsStringAsync.mockImplementation((_path: string, content: string) => {
      writtenJson = content;
      return Promise.resolve();
    });

    await generateExport();

    const parsed = JSON.parse(writtenJson) as Record<string, unknown>;
    expect((parsed['migraine_events'] as unknown[]).length).toBe(1);
    expect((parsed['medications'] as unknown[]).length).toBe(1);
    expect((parsed['daily_checkins'] as unknown[]).length).toBe(1);
  });

  it('flattens settings rows into a key-value map', async () => {
    let writtenJson = '';
    mockWriteAsStringAsync.mockImplementation((_path: string, content: string) => {
      writtenJson = content;
      return Promise.resolve();
    });

    await generateExport();

    const parsed = JSON.parse(writtenJson) as Record<string, unknown>;
    const settingsMap = parsed['settings'] as Record<string, unknown>;
    expect(settingsMap['theme.palette']).toBe('calm_sand');
  });

  it('returns err on FileSystem failure', async () => {
    mockWriteAsStringAsync.mockRejectedValueOnce(new Error('disk full'));

    const result = await generateExport();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('unknown');
    }
  });
});
