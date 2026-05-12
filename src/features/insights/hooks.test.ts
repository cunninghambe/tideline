import { describe, it, expect } from 'vitest';

/**
 * useTopHelpers ranking logic test.
 * The hook itself requires React context, so we test the ranking computation
 * logic in isolation using the same algorithm the hook uses.
 */

import type { HelperTag } from '@/db/schema/migraines';

// Replicate the ranking logic from hooks.ts for isolated testing
type TopHelper = {
  helper: HelperTag;
  helpedCount: number;
  totalCount: number;
};

type MigHelper = { helpers: HelperTag[] };
type DoseRecord = { effectivenessRating: string | null | undefined };

function rankHelpers(
  migraines: MigHelper[],
  doses: DoseRecord[],
  limit: number,
): TopHelper[] {
  const helpedCounts = new Map<HelperTag, number>();
  const totalCounts = new Map<HelperTag, number>();

  const inc = (tag: HelperTag, helped: boolean) => {
    totalCounts.set(tag, (totalCounts.get(tag) ?? 0) + 1);
    if (helped) helpedCounts.set(tag, (helpedCounts.get(tag) ?? 0) + 1);
  };

  for (const m of migraines) {
    for (const tag of m.helpers) {
      inc(tag, true);
    }
  }

  for (const dose of doses) {
    inc('medication', dose.effectivenessRating === 'helped' || dose.effectivenessRating === 'kind_of');
  }

  const all: TopHelper[] = [];
  for (const [helper, totalCount] of totalCounts) {
    all.push({ helper, helpedCount: helpedCounts.get(helper) ?? 0, totalCount });
  }

  all.sort((a, b) => {
    const aRate = a.helpedCount / a.totalCount;
    const bRate = b.helpedCount / b.totalCount;
    if (bRate !== aRate) return bRate - aRate;
    return b.helpedCount - a.helpedCount;
  });

  return all.slice(0, limit);
}

describe('useTopHelpers ranking logic', () => {
  it('returns empty array when no history', () => {
    expect(rankHelpers([], [], 5)).toEqual([]);
  });

  it('ranks by helped ratio descending', () => {
    const migraines: MigHelper[] = [
      { helpers: ['sleep', 'hydration', 'hydration'] },
      { helpers: ['sleep', 'cold_compress'] },
      { helpers: ['sleep'] },
    ];

    const result = rankHelpers(migraines, [], 5);

    // sleep: 3 total, 3 helped = 100%
    // hydration: 2 total, 2 helped = 100% — but fewer absolute
    // cold_compress: 1 total, 1 helped = 100% — fewest absolute
    const helpers = result.map((h) => h.helper);
    expect(helpers).toContain('sleep');
    // sleep should be first (highest helpedCount among 100% rate items)
    expect(result[0]!.helper).toBe('sleep');
    expect(result[0]!.helpedCount).toBe(3);
    expect(result[0]!.totalCount).toBe(3);
  });

  it('includes medication doses with helped/kind_of rating', () => {
    const doses: DoseRecord[] = [
      { effectivenessRating: 'helped' },
      { effectivenessRating: 'helped' },
      { effectivenessRating: 'kind_of' },
      { effectivenessRating: 'didnt_help' },
    ];

    const result = rankHelpers([], doses, 5);
    const med = result.find((h) => h.helper === 'medication');
    expect(med).toBeDefined();
    expect(med!.totalCount).toBe(4);
    expect(med!.helpedCount).toBe(3); // helped + kind_of
  });

  it('respects limit parameter', () => {
    const migraines: MigHelper[] = [
      { helpers: ['sleep', 'dark_room', 'hydration', 'cold_compress', 'hot_shower', 'eating'] },
    ];

    const result = rankHelpers(migraines, [], 3);
    expect(result).toHaveLength(3);
  });

  it('returns top-N correctly for mixed history', () => {
    const migraines: MigHelper[] = [
      { helpers: ['sleep', 'hydration'] },
      { helpers: ['sleep', 'cold_compress'] },
      { helpers: ['sleep', 'hydration'] },
      { helpers: ['dark_room'] },
      { helpers: ['dark_room'] },
    ];

    const result = rankHelpers(migraines, [], 2);
    expect(result).toHaveLength(2);
    // sleep: 3/3 = 100%
    expect(result[0]!.helper).toBe('sleep');
    expect(result[0]!.helpedCount).toBe(3);
  });

  it('handles helpers with 0% effectiveness ranked last', () => {
    // Test that we can have mixed effectiveness when medication has low rate
    const migraines: MigHelper[] = [
      { helpers: ['sleep'] },
      { helpers: ['sleep'] },
      { helpers: ['sleep'] },
      { helpers: ['sleep'] },
      { helpers: ['sleep'] },
    ];
    const doses: DoseRecord[] = [
      { effectivenessRating: 'didnt_help' },
      { effectivenessRating: 'didnt_help' },
      { effectivenessRating: 'didnt_help' },
    ];

    const result = rankHelpers(migraines, doses, 5);
    // sleep (100%) should come before medication (0%)
    expect(result[0]!.helper).toBe('sleep');
    const medIdx = result.findIndex((h) => h.helper === 'medication');
    const sleepIdx = result.findIndex((h) => h.helper === 'sleep');
    expect(sleepIdx).toBeLessThan(medIdx);
  });
});
