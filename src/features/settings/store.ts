import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { settings } from '@/db/schema/settings';

// ---------------------------------------------------------------------------
// Raw DB helpers (not exported — screens go through hooks)
// ---------------------------------------------------------------------------

function dbGet(key: string): string | null {
  const row = db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .get();
  if (!row) return null;
  // value column is json mode — may come back as string or parsed
  const v = row.value;
  return typeof v === 'string' ? v : JSON.stringify(v);
}

function dbSet(key: string, value: string): void {
  db
    .insert(settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() },
    })
    .run();
}

// ---------------------------------------------------------------------------
// Public API — TanStack Query wrappers
// ---------------------------------------------------------------------------

/**
 * Returns the current value for a settings key, or `fallback` if not set.
 * Re-renders when the key is invalidated via `setSetting`.
 */
export function useSetting(key: string, fallback: string): string {
  const { data } = useQuery({
    queryKey: ['settings', key],
    queryFn: () => dbGet(key) ?? fallback,
    initialData: () => dbGet(key) ?? fallback,
  });
  return data;
}

/**
 * Returns a mutation function that writes a key-value pair and invalidates
 * the relevant query so all `useSetting(key)` consumers re-render.
 */
export function useSetSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => {
      dbSet(key, value);
      return Promise.resolve();
    },
    onSuccess: (_data, { key }) => {
      void queryClient.invalidateQueries({ queryKey: ['settings', key] });
    },
  });
}

/**
 * One-shot synchronous read — for use outside React (e.g. in exporter).
 */
export function getSetting(key: string): string | null {
  return dbGet(key);
}

/**
 * One-shot synchronous write — for use outside React (e.g. in deleter).
 */
export function setSetting(key: string, value: string): void {
  dbSet(key, value);
}
