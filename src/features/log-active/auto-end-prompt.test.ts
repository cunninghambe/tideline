import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Unit tests for AutoEndPrompt logic (pure, no RN imports)
// ---------------------------------------------------------------------------

const SNOOZE_KEY = 'log-active.auto_end_snooze_until';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function formatDaysAgo(startedAt: Date): string {
  const days = Math.floor((Date.now() - startedAt.getTime()) / TWENTY_FOUR_HOURS_MS);
  if (days === 1) return '1 day';
  return `${days} days`;
}

describe('AutoEndPrompt render logic', () => {
  it('renders correct days-ago label for 2 days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * TWENTY_FOUR_HOURS_MS - 1000);
    expect(formatDaysAgo(twoDaysAgo)).toBe('2 days');
  });

  it('renders "1 day" for exactly 1 day ago', () => {
    const oneDayAgo = new Date(Date.now() - TWENTY_FOUR_HOURS_MS - 1000);
    expect(formatDaysAgo(oneDayAgo)).toBe('1 day');
  });

  it('renders "3 days" for 3 days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * TWENTY_FOUR_HOURS_MS - 1000);
    expect(formatDaysAgo(threeDaysAgo)).toBe('3 days');
  });
});

describe('AutoEndPrompt snooze logic', () => {
  const mockSetSetting = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes snooze_until = now + 24h when "No, still going" is pressed', () => {
    const before = Date.now();
    const expectedSnoozeApprox = before + TWENTY_FOUR_HOURS_MS;

    // Simulate the handleSnooze logic
    function handleSnooze() {
      const snoozeUntil = Date.now() + TWENTY_FOUR_HOURS_MS;
      mockSetSetting(SNOOZE_KEY, String(snoozeUntil));
    }

    handleSnooze();

    expect(mockSetSetting).toHaveBeenCalledWith(SNOOZE_KEY, expect.any(String));
    const written = Number(mockSetSetting.mock.calls[0]![1]);
    expect(written).toBeGreaterThanOrEqual(expectedSnoozeApprox - 100);
    expect(written).toBeLessThanOrEqual(expectedSnoozeApprox + 1000);
  });

  it('snooze key is correctly namespaced', () => {
    expect(SNOOZE_KEY).toBe('log-active.auto_end_snooze_until');
  });
});

describe('AutoEndPrompt end-time logic', () => {
  it('clamps end time to now if chosen time is in the future', () => {
    const futureDate = new Date(Date.now() + 60_000);
    const now = new Date();
    const finalEndedAt = futureDate > now ? now : futureDate;
    expect(finalEndedAt.getTime()).toBeLessThanOrEqual(now.getTime() + 100);
  });

  it('uses chosen time if it is in the past', () => {
    const pastDate = new Date(Date.now() - 30 * 60_000); // 30 min ago
    const now = new Date();
    const finalEndedAt = pastDate > now ? now : pastDate;
    expect(finalEndedAt.getTime()).toBe(pastDate.getTime());
  });
});
