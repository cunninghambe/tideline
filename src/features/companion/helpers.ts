import type { HelperTag } from '@/db/schema/migraines';

export type HelperSummary = { tag: HelperTag; count: number };

type MigraineWithHelpers = {
  helpers: HelperTag[];
  endedAt: Date | null;
};

/**
 * Counts helper tag occurrences across completed migraines.
 * Skips the active (endedAt=null) migraine.
 * Returns top `limit` helpers sorted by frequency descending.
 */
export function deriveTopHelpers(
  migraines: MigraineWithHelpers[],
  limit: number,
): HelperSummary[] {
  const counts = new Map<HelperTag, number>();
  for (const row of migraines) {
    if (row.endedAt === null) continue;
    for (const tag of row.helpers) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Minutes elapsed from startedAt to now, floored to whole minutes. */
export function minutesSince(startedAt: Date): number {
  return Math.floor((Date.now() - startedAt.getTime()) / 60_000);
}
