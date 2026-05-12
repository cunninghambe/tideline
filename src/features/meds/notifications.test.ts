import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Notifications from 'expo-notifications';
import { isExpoGo } from '@/lib/runtime';
import { list } from '@/features/meds/repo';
import {
  scheduleRefillCheck,
  _resetScheduledSet,
  _getScheduledSet,
} from './notifications';

// vi.mock calls are hoisted by vitest — they run before imports at runtime
vi.mock('expo-notifications', () => ({
  scheduleNotificationAsync: vi.fn().mockResolvedValue('notif-id'),
  cancelScheduledNotificationAsync: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/runtime', () => ({
  isExpoGo: vi.fn().mockReturnValue(false),
}));

vi.mock('@/config/feature-flags', () => ({
  FEATURE_FLAGS: { notificationsLocal: true },
}));

vi.mock('@/features/meds/repo', () => ({
  list: vi.fn(),
}));

const mockList = list as ReturnType<typeof vi.fn>;
const mockIsExpoGo = isExpoGo as ReturnType<typeof vi.fn>;
const mockSchedule = Notifications.scheduleNotificationAsync as ReturnType<typeof vi.fn>;

function makeMed(overrides: Partial<{
  id: string;
  brandName: string;
  pillsRemaining: number | null;
  refillThreshold: number;
  active: boolean;
}> = {}) {
  return {
    id: 'med-1',
    brandName: 'Sumatriptan 50mg',
    pillsRemaining: 5,
    refillThreshold: 7,
    active: true,
    medicationClass: 'triptan',
    defaultDose: '50mg',
    type: 'rescue',
    createdAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  _resetScheduledSet();
  vi.clearAllMocks();
  mockIsExpoGo.mockReturnValue(false);
  mockSchedule.mockResolvedValue('notif-id');
  (Notifications.cancelScheduledNotificationAsync as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
});

describe('scheduleRefillCheck', () => {
  it('returns empty array when no meds', async () => {
    mockList.mockReturnValue({ ok: true, value: [] });
    const result = await scheduleRefillCheck();
    expect(result).toEqual([]);
  });

  it('returns empty when all meds are above threshold', async () => {
    mockList.mockReturnValue({
      ok: true,
      value: [makeMed({ pillsRemaining: 20, refillThreshold: 7 })],
    });
    const result = await scheduleRefillCheck();
    expect(result).toEqual([]);
  });

  it('returns med names below threshold', async () => {
    mockList.mockReturnValue({
      ok: true,
      value: [makeMed({ pillsRemaining: 5, refillThreshold: 7, brandName: 'Sumatriptan 50mg' })],
    });
    const result = await scheduleRefillCheck();
    expect(result).toContain('Sumatriptan 50mg');
  });

  it('schedules a notification when not in Expo Go and feature flag is on', async () => {
    mockIsExpoGo.mockReturnValue(false);
    mockList.mockReturnValue({
      ok: true,
      value: [makeMed({ id: 'med-1', pillsRemaining: 3, refillThreshold: 7 })],
    });
    await scheduleRefillCheck();
    expect(mockSchedule).toHaveBeenCalledOnce();
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: 'refill-med-1' }),
    );
  });

  it('does not schedule when in Expo Go', async () => {
    mockIsExpoGo.mockReturnValue(true);
    mockList.mockReturnValue({
      ok: true,
      value: [makeMed({ pillsRemaining: 3, refillThreshold: 7 })],
    });
    await scheduleRefillCheck();
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('does not double-schedule within the same session (dedup)', async () => {
    mockList.mockReturnValue({
      ok: true,
      value: [makeMed({ id: 'med-1', pillsRemaining: 3, refillThreshold: 7 })],
    });
    await scheduleRefillCheck();
    await scheduleRefillCheck(); // second call in same session
    // Only 1 notification should be scheduled despite 2 calls
    expect(mockSchedule).toHaveBeenCalledOnce();
  });

  it('adds med id to the scheduled set after scheduling', async () => {
    mockList.mockReturnValue({
      ok: true,
      value: [makeMed({ id: 'med-abc', pillsRemaining: 3, refillThreshold: 7 })],
    });
    await scheduleRefillCheck();
    expect(_getScheduledSet().has('med-abc')).toBe(true);
  });

  it('returns empty when repo returns error', async () => {
    mockList.mockReturnValue({ ok: false, error: { kind: 'database', message: 'err' } });
    const result = await scheduleRefillCheck();
    expect(result).toEqual([]);
  });

  it('skips inactive meds', async () => {
    mockList.mockReturnValue({
      ok: true,
      value: [
        makeMed({ id: 'med-active', pillsRemaining: 3, refillThreshold: 7, active: true }),
        makeMed({ id: 'med-inactive', pillsRemaining: 2, refillThreshold: 7, active: false }),
      ],
    });
    const result = await scheduleRefillCheck();
    // Only 1 below-threshold med (active one)
    expect(result).toHaveLength(1);
  });

  it('handles med with null pillsRemaining gracefully', async () => {
    mockList.mockReturnValue({
      ok: true,
      value: [makeMed({ pillsRemaining: null })],
    });
    const result = await scheduleRefillCheck();
    expect(result).toEqual([]);
    expect(mockSchedule).not.toHaveBeenCalled();
  });
});
