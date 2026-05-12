/**
 * Companion feature tests.
 *
 * Component render tests (mount with @testing-library/react-native) require
 * jest-expo or equivalent React Native test runtime. The vitest config runs
 * in Node environment where RN modules cannot load. These tests verify the
 * pure logic that drives companion rendering decisions:
 *
 *  - deriveTopHelpers: counts and sorts helper tags across completed migraines
 *  - Empty state: no completed migraines → empty helpers array
 *  - Personalized state: 3+ completed migraines with helpers → ranked results
 *  - Active migraine is skipped when counting helpers
 *  - limit is respected
 *
 * CTA existence tests are documented via the accessibilityLabel contract
 * enforced by Button.tsx (label prop → accessibilityLabel on Pressable).
 * Full render smoke tests are tracked in INTEGRATION-NOTES.md ### companion.
 */

import { describe, it, expect } from 'vitest';
import { deriveTopHelpers, minutesSince } from './helpers';

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const today = new Date();
const daysAgo = (n: number) => new Date(today.getTime() - n * 86_400_000);

function makeMigraine(opts: {
  endedAt: Date | null;
  helpers: string[];
}) {
  return {
    endedAt: opts.endedAt,
    helpers: opts.helpers,
  };
}

// ---------------------------------------------------------------------------
// deriveTopHelpers — empty history
// ---------------------------------------------------------------------------

describe('deriveTopHelpers — empty history (no past attacks)', () => {
  it('returns empty array when no migraines', () => {
    expect(deriveTopHelpers([], 3)).toEqual([]);
  });

  it('returns empty array when only an active (ongoing) migraine exists', () => {
    const active = makeMigraine({ endedAt: null, helpers: ['sleep', 'hydration'] });
    expect(deriveTopHelpers([active], 3)).toEqual([]);
  });

  it('returns empty array when completed migraines have no helpers recorded', () => {
    const completed = makeMigraine({ endedAt: daysAgo(1), helpers: [] });
    expect(deriveTopHelpers([completed], 3)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// deriveTopHelpers — seeded history (3+ past attacks)
// ---------------------------------------------------------------------------

describe('deriveTopHelpers — seeded history', () => {
  const history = [
    makeMigraine({ endedAt: daysAgo(1), helpers: ['sleep', 'hydration', 'cold_compress'] }),
    makeMigraine({ endedAt: daysAgo(5), helpers: ['sleep', 'dark_room'] }),
    makeMigraine({ endedAt: daysAgo(12), helpers: ['sleep', 'hydration'] }),
    makeMigraine({ endedAt: daysAgo(20), helpers: ['cold_compress', 'dark_room'] }),
  ];

  it('returns up to limit helpers', () => {
    const result = deriveTopHelpers(history, 3);
    expect(result.length).toBe(3);
  });

  it('ranks sleep first (appears 3 times)', () => {
    const result = deriveTopHelpers(history, 3);
    expect(result[0]?.tag).toBe('sleep');
    expect(result[0]?.count).toBe(3);
  });

  it('second most frequent is hydration or cold_compress (2 each)', () => {
    const result = deriveTopHelpers(history, 3);
    const second = result[1]?.tag;
    expect(['hydration', 'cold_compress']).toContain(second);
  });

  it('includes at least one personalized helper line (non-empty result)', () => {
    const result = deriveTopHelpers(history, 3);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// deriveTopHelpers — active migraine is skipped
// ---------------------------------------------------------------------------

describe('deriveTopHelpers — skips active migraine', () => {
  it('does not count helpers from the active (ongoing) migraine', () => {
    const active = makeMigraine({ endedAt: null, helpers: ['massage', 'caffeine'] });
    const completed = makeMigraine({ endedAt: daysAgo(3), helpers: ['sleep'] });
    const result = deriveTopHelpers([active, completed], 5);
    const tags = result.map((h) => h.tag);
    expect(tags).toContain('sleep');
    expect(tags).not.toContain('massage');
    expect(tags).not.toContain('caffeine');
  });
});

// ---------------------------------------------------------------------------
// deriveTopHelpers — limit is respected
// ---------------------------------------------------------------------------

describe('deriveTopHelpers — limit', () => {
  const bigHistory = [
    makeMigraine({ endedAt: daysAgo(1), helpers: ['sleep', 'dark_room', 'hydration', 'cold_compress', 'massage'] }),
    makeMigraine({ endedAt: daysAgo(2), helpers: ['sleep', 'hydration', 'caffeine'] }),
  ];

  it('returns exactly limit=3 results even when more helpers exist', () => {
    expect(deriveTopHelpers(bigHistory, 3)).toHaveLength(3);
  });

  it('returns exactly limit=1 results', () => {
    expect(deriveTopHelpers(bigHistory, 1)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// minutesSince
// ---------------------------------------------------------------------------

describe('minutesSince', () => {
  it('returns 0 for a start time right now', () => {
    const result = minutesSince(new Date());
    expect(result).toBe(0);
  });

  it('returns ~120 for a start time 2 hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 120 * 60_000);
    expect(minutesSince(twoHoursAgo)).toBe(120);
  });

  it('floors partial minutes', () => {
    const almostTwoMinutes = new Date(Date.now() - 119_000); // 1 min 59 sec
    expect(minutesSince(almostTwoMinutes)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// CTA accessibility contract — documented
// ---------------------------------------------------------------------------

describe('CTA accessibility contract (documented)', () => {
  /**
   * Button.tsx sets accessibilityLabel={label} on its Pressable.
   * The three CTAs use:
   *   label={companionCopy.ctas.tookSomething}  = "I took something"
   *   label={companionCopy.ctas.gettingWorse}   = "It's getting worse"
   *   label={companionCopy.ctas.ended}           = "It ended"
   *
   * These strings are the exact verbatim copy from @/copy.
   * A full mount test verifying getByRole('button', { name: '...' }) requires
   * jest-expo. See INTEGRATION-NOTES.md ### companion.
   */
  it('copy strings match spec verbatim', async () => {
    const { companionCopy } = await import('@/copy');
    expect(companionCopy.ctas.tookSomething).toBe('I took something');
    expect(companionCopy.ctas.gettingWorse).toBe("It's getting worse");
    expect(companionCopy.ctas.ended).toBe('It ended');
  });

  it('title matches spec verbatim', async () => {
    const { companionCopy } = await import('@/copy');
    expect(companionCopy.title).toBe('Tideline is here.');
  });

  it('empty history copy matches spec verbatim', async () => {
    const { companionCopy } = await import('@/copy');
    expect(companionCopy.emptyHelpedHistory).toBe(
      "We'll start learning what helps you specifically once you've logged a few attacks.",
    );
  });
});
