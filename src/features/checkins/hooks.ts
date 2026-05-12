import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import * as repo from '@/features/checkins/repo';
import type { DailyCheckinRow } from '@/types';

export const CHECKIN_QUERY_KEY = (date: string) => ['checkins', date] as const;

/** Fetches the check-in for a given date (YYYY-MM-DD), or null if none. */
export function useCheckinForDate(date: string): {
  data: DailyCheckinRow | null | undefined;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: CHECKIN_QUERY_KEY(date),
    queryFn: () => {
      const result = repo.getByDate(date);
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    },
    enabled: Boolean(date),
  });
  return { data, isLoading };
}

type UpsertData = Parameters<typeof repo.upsert>[1];

/** Upserts a daily check-in and invalidates the cache. */
export function useUpsertCheckin(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertData) => {
      const result = repo.upsert(date, data);
      if (!result.ok) throw new Error(result.error.message);
      return Promise.resolve(result.value);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CHECKIN_QUERY_KEY(date) });
    },
  });
}
