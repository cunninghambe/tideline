import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eq, desc } from 'drizzle-orm';
import { ulid } from 'ulid';

import { db } from '@/db/client';
import { foodTags } from '@/db/schema';
import type { FoodTagRow } from '@/types';

export const FOOD_TAGS_QUERY_KEY = ['foodTags'] as const;

/** Lowercase + trim. Pure function. */
export function normalizeFoodTagName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Returns all food tags sorted by usage count descending,
 * plus a case-insensitive search helper.
 */
export function useFoodTags(): {
  tags: FoodTagRow[];
  search: (q: string) => FoodTagRow[];
} {
  const { data: tags = [] } = useQuery({
    queryKey: FOOD_TAGS_QUERY_KEY,
    queryFn: () =>
      db.select().from(foodTags).orderBy(desc(foodTags.usageCount)).all(),
  });

  const search = (q: string): FoodTagRow[] => {
    const normalized = normalizeFoodTagName(q);
    if (!normalized) return tags;
    return tags.filter((t) => t.name.includes(normalized));
  };

  return { tags, search };
}

/**
 * Mutation: given a display name, normalizes it, looks up an existing tag,
 * increments usageCount if found, inserts a new row if not.
 * Returns the canonical FoodTagRow.
 */
export function useUpsertFoodTag(): (displayName: string) => Promise<FoodTagRow> {
  const queryClient = useQueryClient();

  const mutation = useMutation<FoodTagRow, Error, string>({
    mutationFn: (displayName: string): Promise<FoodTagRow> => {
      const normalized = normalizeFoodTagName(displayName);
      const existing = db
        .select()
        .from(foodTags)
        .where(eq(foodTags.name, normalized))
        .get();

      if (existing) {
        const updated = { ...existing, usageCount: existing.usageCount + 1 };
        db.update(foodTags)
          .set({ usageCount: updated.usageCount })
          .where(eq(foodTags.id, existing.id))
          .run();
        return Promise.resolve(updated);
      }

      const id = ulid();
      const now = new Date();
      const newTag = {
        id,
        name: normalized,
        displayName: displayName.trim(),
        usageCount: 1,
        createdAt: now,
      } satisfies typeof foodTags.$inferInsert;
      db.insert(foodTags).values(newTag).run();
      return Promise.resolve(newTag as FoodTagRow);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FOOD_TAGS_QUERY_KEY });
    },
  });

  return (displayName: string) => mutation.mutateAsync(displayName);
}
