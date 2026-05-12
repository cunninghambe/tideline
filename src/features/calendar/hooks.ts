import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';

import { getByMonth } from '@/features/migraines/repo';
import { getByDate } from '@/features/checkins/repo';
import { phaseForDate } from '@/features/cycle/repo';
import type { CyclePhase } from '@/features/cycle/repo';
import { useActiveMigraineStore } from '@/stores/useActiveMigraineStore';
import { getMonthGrid, toDateString } from './utils';

import type { MigraineRow, DailyCheckinRow } from '@/types';

// ---------------------------------------------------------------------------
// Query key factories
// ---------------------------------------------------------------------------

const migraineMonthKey = (yearMonth: string) => ['migraines', 'month', yearMonth] as const;

// ---------------------------------------------------------------------------
// useMigraineEventsByMonth
// ---------------------------------------------------------------------------

/** Fetches all migraine events for a given month ("YYYY-MM"). */
export function useMigraineEventsByMonth(yearMonth: string) {
  return useQuery({
    queryKey: migraineMonthKey(yearMonth),
    queryFn: () => {
      const result = getByMonth(yearMonth);
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    },
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// useDayDetail
// ---------------------------------------------------------------------------

export type DayDetail = {
  migraine: MigraineRow | null;
  checkin: DailyCheckinRow | null;
  cyclePhase: CyclePhase | null;
};

/** Composed view: migraine + check-in + cycle phase for a single date. Refetches on focus. */
export function useDayDetail(date: string): { data: DayDetail | undefined; isLoading: boolean; error: Error | null } {
  const queryClient = useQueryClient();

  const result = useQuery({
    queryKey: ['day', date],
    queryFn: (): DayDetail => {
      const yearMonth = date.slice(0, 7);
      const monthCache = queryClient.getQueryData<MigraineRow[]>(migraineMonthKey(yearMonth));

      let migraine: MigraineRow | null = null;
      if (monthCache) {
        migraine = monthCache.find((m) => {
          const d = m.startedAt instanceof Date ? m.startedAt : new Date(m.startedAt);
          return toDateString(d) === date;
        }) ?? null;
      } else {
        const monthResult = getByMonth(yearMonth);
        if (monthResult.ok) {
          migraine = monthResult.value.find((m) => {
            const d = m.startedAt instanceof Date ? m.startedAt : new Date(m.startedAt);
            return toDateString(d) === date;
          }) ?? null;
        }
      }

      const checkinResult = getByDate(date);
      const checkin = checkinResult.ok ? checkinResult.value : null;

      const cycleResult = phaseForDate(date);
      const cyclePhase = cycleResult.ok ? cycleResult.value : null;

      return { migraine, checkin, cyclePhase };
    },
    staleTime: 0,
  });

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['day', date] });
    }, [queryClient, date]),
  );

  return {
    data: result.data,
    isLoading: result.isLoading,
    error: result.error,
  };
}

// ---------------------------------------------------------------------------
// useCycleMarkersForMonth
// ---------------------------------------------------------------------------

/** Returns a Record<dateString, CyclePhase | null> for every day in the month. */
export function useCycleMarkersForMonth(yearMonth: string): Record<string, CyclePhase | null> {
  const grid = useMemo(() => getMonthGrid(yearMonth), [yearMonth]);

  return useMemo(() => {
    const map: Record<string, CyclePhase | null> = {};
    for (const week of grid) {
      for (const day of week) {
        const ds = toDateString(day);
        const result = phaseForDate(ds);
        map[ds] = result.ok ? result.value : null;
      }
    }
    return map;
  }, [grid]);
}

// ---------------------------------------------------------------------------
// useActiveMigraineWatcher
// ---------------------------------------------------------------------------

/** Invalidates month data when the active migraine changes (start/end). */
export function useActiveMigraineWatcher(yearMonth: string): void {
  const queryClient = useQueryClient();
  const activeMigraineId = useActiveMigraineStore((s) => s.activeMigraineId);

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: migraineMonthKey(yearMonth) });
      // activeMigraineId is intentionally listed here: when the active migraine
      // starts or ends we want a fresh invalidation each time.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryClient, yearMonth, activeMigraineId]),
  );
}
