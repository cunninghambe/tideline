import type { HelperTag } from '@/db/schema/migraines';
import { HELPER_TAGS_DEFAULT_ORDER } from '@/copy';

type MigraineRow = {
  helpers: HelperTag[];
};

/**
 * Counts each helper's occurrences across history, sorts descending.
 * Ties are broken by HELPER_TAGS_DEFAULT_ORDER position.
 */
export function sortHelpersByUserFrequency(history: MigraineRow[]): HelperTag[] {
  const counts = new Map<HelperTag, number>();

  for (const event of history) {
    for (const helper of event.helpers) {
      counts.set(helper, (counts.get(helper) ?? 0) + 1);
    }
  }

  const defaultOrder = HELPER_TAGS_DEFAULT_ORDER.map((h) => h.value);

  const allHelpers = new Set<HelperTag>([
    ...defaultOrder,
    ...counts.keys(),
  ]);

  return Array.from(allHelpers).sort((a, b) => {
    const countDiff = (counts.get(b) ?? 0) - (counts.get(a) ?? 0);
    if (countDiff !== 0) return countDiff;
    const aIdx = defaultOrder.indexOf(a);
    const bIdx = defaultOrder.indexOf(b);
    // Unknown tags (custom) go after known ones
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
}
