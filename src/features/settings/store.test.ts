import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSetting, setSetting } from './store';

// vi.hoisted and vi.mock are both hoisted to the top by vitest's transform,
// so placing SUT imports before them in source is fine at runtime.
// ESLint import/first is satisfied because imports appear first in source.

const { mockRun, mockInsert, mockInsertValues, mockOnConflict, mockGet } = vi.hoisted(
  () => {
    const runFn = vi.fn();
    const onConflictFn = vi.fn(() => ({ run: runFn }));
    const insertValuesFn = vi.fn(() => ({ onConflictDoUpdate: onConflictFn }));
    const insertFn = vi.fn(() => ({ values: insertValuesFn }));
    const getFn = vi.fn().mockReturnValue(null);
    return {
      mockRun: runFn,
      mockInsert: insertFn,
      mockInsertValues: insertValuesFn,
      mockOnConflict: onConflictFn,
      mockGet: getFn,
    };
  },
);

vi.mock('@/db/client', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({ get: mockGet }),
      }),
    }),
    insert: mockInsert,
    run: vi.fn(),
  },
  runMigrations: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/db/schema/settings', () => ({
  settings: { key: 'key' },
}));

describe('getSetting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when key is not in DB', () => {
    mockGet.mockReturnValueOnce(null);
    expect(getSetting('nonexistent.key')).toBeNull();
  });

  it('returns the stored string value', () => {
    mockGet.mockReturnValueOnce({ key: 'theme.palette', value: 'calm_sand' });
    expect(getSetting('theme.palette')).toBe('calm_sand');
  });
});

describe('setSetting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRun.mockReturnValue(undefined);
    mockOnConflict.mockReturnValue({ run: mockRun });
    mockInsertValues.mockReturnValue({ onConflictDoUpdate: mockOnConflict });
    mockInsert.mockReturnValue({ values: mockInsertValues });
  });

  it('calls db.insert with the correct key and value', () => {
    setSetting('theme.palette', 'quiet_night');
    expect(mockInsert).toHaveBeenCalled();
    const [arg] = mockInsertValues.mock.calls[0] as unknown as [
      { key: string; value: string },
    ];
    expect(arg.key).toBe('theme.palette');
    expect(arg.value).toBe('quiet_night');
  });

  it('calls onConflictDoUpdate to upsert', () => {
    setSetting('notifications.daily_checkin_enabled', 'true');
    expect(mockOnConflict).toHaveBeenCalled();
  });
});
