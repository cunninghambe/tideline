import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteAll } from './deleter';
import { runMigrations } from '@/db/client';

// vi.hoisted and vi.mock are both hoisted to the top by vitest's transform,
// so placing SUT imports before them in source is fine at runtime.
// ESLint import/first is satisfied because imports appear first in source.

const { mockRun, mockInsert, mockInsertValues, mockOnConflictForDeleter } = vi.hoisted(() => {
  const mockRunInner = vi.fn();
  const mockInsertValuesInner = vi.fn(() => ({
    onConflictDoUpdate: vi.fn().mockReturnValue({ run: mockRunInner }),
  }));
  const mockInsertInner = vi.fn(() => ({ values: mockInsertValuesInner }));
  return {
    mockRun: mockRunInner,
    mockInsert: mockInsertInner,
    mockInsertValues: mockInsertValuesInner,
    mockOnConflictForDeleter: vi.fn().mockReturnValue({ run: mockRunInner }),
  };
});

vi.mock('@/db/client', () => ({
  db: {
    run: mockRun,
    insert: mockInsert,
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ get: vi.fn().mockReturnValue(null) })),
      })),
    })),
  },
  runMigrations: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/db/schema/settings', () => ({
  settings: { key: 'key' },
}));

describe('deleteAll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRun.mockReturnValue(undefined);
    mockOnConflictForDeleter.mockReturnValue({ run: mockRun });
    mockInsertValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictForDeleter });
    mockInsert.mockReturnValue({ values: mockInsertValues });
  });

  it('returns ok on success', async () => {
    const result = await deleteAll();
    expect(result.ok).toBe(true);
  });

  it('deletes all tables — db.run called at least once per table', async () => {
    await deleteAll();
    // 10 tables get a DELETE statement
    expect(mockRun.mock.calls.length).toBeGreaterThanOrEqual(10);
  });

  it('calls runMigrations after deletion', async () => {
    await deleteAll();
    expect(runMigrations).toHaveBeenCalledTimes(1);
  });

  it('writes onboarding.completed = false after wipe', async () => {
    await deleteAll();
    expect(mockInsert).toHaveBeenCalled();
    const callArgs = mockInsertValues.mock.calls[0] as unknown as [
      { key: string; value: string },
    ];
    expect(callArgs[0].key).toBe('onboarding.completed');
    expect(callArgs[0].value).toBe('false');
  });

  it('returns err when db.run throws', async () => {
    mockRun.mockImplementationOnce(() => {
      throw new Error('db error');
    });

    const result = await deleteAll();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('database');
    }
  });
});
