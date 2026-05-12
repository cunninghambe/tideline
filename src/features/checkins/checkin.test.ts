import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Checkin screen behaviour — tested via the repo + hooks logic
// (React Native components cannot mount in vitest's node environment;
// we test the data layer that the screen delegates to.)
// ---------------------------------------------------------------------------

// Mock the DB client — must precede any import that uses @/db/client
const mockGetResult: { row: Record<string, unknown> | null } = { row: null };
const mockUpsertRun = vi.fn();
const mockInsertRun = vi.fn();
const mockSelectAll = vi.fn(() => []);
const mockUpdateRun = vi.fn();

vi.mock('@/db/client', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({ get: () => mockGetResult.row }),
        all: mockSelectAll,
      }),
    }),
    insert: () => ({
      values: () => ({ run: mockInsertRun }),
      onConflictDoUpdate: () => ({ run: vi.fn() }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({ run: mockUpdateRun }),
      }),
    }),
  },
}));

vi.mock('@/db/schema', () => ({
  dailyCheckins: { date: 'date', id: 'id' },
  foodTags: { name: 'name', id: 'id', usageCount: 'usageCount' },
  outbox: { id: 'id' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ col, val, type: 'eq' }),
  desc: (col: unknown) => ({ col, type: 'desc' }),
}));

vi.mock('ulid', () => ({
  ulid: vi.fn(() => 'test-id-' + Math.random().toString(36).slice(2, 8)),
}));

// ---------------------------------------------------------------------------
// Repo tests (getByDate, upsert)
// ---------------------------------------------------------------------------

describe('checkins/repo', () => {
  beforeEach(() => {
    mockGetResult.row = null;
    mockUpsertRun.mockReset();
    mockInsertRun.mockReset();
    mockUpdateRun.mockReset();
  });

  it('getByDate returns null when no row exists', async () => {
    mockGetResult.row = null;
    const { getByDate } = await import('@/features/checkins/repo');
    const result = getByDate('2026-05-10');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeNull();
  });

  it('getByDate returns the row when one exists', async () => {
    const row = {
      id: 'row-1',
      date: '2026-05-10',
      sleepHours: 7.5,
      sleepQuality: 3,
      stressLevel: 2,
      waterCups: 8,
      caffeineCups: 1,
      foodTagIds: ['tag-1'],
      notes: 'good day',
      createdAt: new Date(),
      updatedAt: new Date(),
      syncedAt: null,
      pooledAt: null,
    };
    mockGetResult.row = row;
    const { getByDate } = await import('@/features/checkins/repo');
    const result = getByDate('2026-05-10');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(row);
  });

  it('upsert inserts a new row when none exists', async () => {
    mockGetResult.row = null;
    const { upsert } = await import('@/features/checkins/repo');
    const result = upsert('2026-05-10', {
      sleepHours: 7,
      sleepQuality: 3,
      stressLevel: 2,
      waterCups: 6,
      caffeineCups: 1,
      foodTagIds: [],
      notes: null,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.date).toBe('2026-05-10');
      expect(result.value.sleepHours).toBe(7);
    }
    // Two insert calls: one for the checkin row, one for the outbox entry
    expect(mockInsertRun).toHaveBeenCalledTimes(2);
    expect(mockUpdateRun).not.toHaveBeenCalled();
  });

  it('upsert updates existing row when one exists', async () => {
    const existing = {
      id: 'existing-id',
      date: '2026-05-10',
      sleepHours: 6,
      sleepQuality: 2,
      stressLevel: 4,
      waterCups: 4,
      caffeineCups: 2,
      foodTagIds: [] as string[],
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncedAt: null,
      pooledAt: null,
    };
    mockGetResult.row = existing;
    const { upsert } = await import('@/features/checkins/repo');
    const result = upsert('2026-05-10', {
      sleepHours: 8,
      sleepQuality: 4,
      stressLevel: 1,
      waterCups: 10,
      caffeineCups: 0,
      foodTagIds: ['tag-a'],
      notes: 'updated',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.sleepHours).toBe(8);
      expect(result.value.waterCups).toBe(10);
    }
    // Update run for checkin, insert run for outbox entry
    expect(mockUpdateRun).toHaveBeenCalledOnce();
    // writeOutbox fires an insert for the outbox entry
    expect(mockInsertRun).toHaveBeenCalledOnce();
  });

  it('upsert with empty / null optional fields succeeds', async () => {
    mockGetResult.row = null;
    const { upsert } = await import('@/features/checkins/repo');
    const result = upsert('2026-05-11', {
      sleepHours: null,
      sleepQuality: null,
      stressLevel: null,
      waterCups: null,
      caffeineCups: null,
      foodTagIds: [],
      notes: null,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.sleepHours).toBeNull();
      expect(result.value.notes).toBeNull();
      expect(result.value.foodTagIds).toEqual([]);
    }
  });
});

// ---------------------------------------------------------------------------
// Checkin screen copy — verify verbatim strings match spec §7
// ---------------------------------------------------------------------------

describe('checkinCopy verbatim strings', () => {
  it('has the correct title', async () => {
    const { checkinCopy } = await import('@/copy');
    expect(checkinCopy.title).toBe('Yesterday — quick check-in');
  });

  it('has the correct save CTA', async () => {
    const { checkinCopy } = await import('@/copy');
    expect(checkinCopy.saveCta).toBe('Save');
  });

  it('has the correct food addCta', async () => {
    const { checkinCopy } = await import('@/copy');
    expect(checkinCopy.food.addCta).toBe('+ Add');
  });

  it('has the correct notes placeholder', async () => {
    const { checkinCopy } = await import('@/copy');
    expect(checkinCopy.notes.placeholder).toBe('Optional notes');
  });

  it('has 4 sleep quality options', async () => {
    const { checkinCopy } = await import('@/copy');
    expect(checkinCopy.sleep.qualityOptions).toHaveLength(4);
    const labels = checkinCopy.sleep.qualityOptions.map((o) => o.label);
    expect(labels).toEqual(['😣', '😐', '🙂', '😊']);
  });

  it('has 3 cycle options matching spec', async () => {
    const { checkinCopy } = await import('@/copy');
    expect(checkinCopy.cycle.options).toHaveLength(3);
    const values = checkinCopy.cycle.options.map((o) => o.value);
    expect(values).toContain('period_start');
    expect(values).toContain('period_end');
    expect(values).toContain('no_change');
  });

  it('has correct labels for cycle options', async () => {
    const { checkinCopy } = await import('@/copy');
    const periodStart = checkinCopy.cycle.options.find((o) => o.value === 'period_start');
    expect(periodStart?.label).toBe('Period started today');
    const periodEnd = checkinCopy.cycle.options.find((o) => o.value === 'period_end');
    expect(periodEnd?.label).toBe('Period ended today');
    const noChange = checkinCopy.cycle.options.find((o) => o.value === 'no_change');
    expect(noChange?.label).toBe('No change');
  });
});
