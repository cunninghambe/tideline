import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getById, update } from '@/features/migraines/repo';
import { list, recordDose } from '@/features/meds/repo';
import { useAllMigraineEvents } from '@/features/migraines/hooks';
import { useActiveMigraineStore } from '@/stores/useActiveMigraineStore';
import { deriveTopHelpers } from './helpers';
import type { HelperSummary } from './helpers';

type RecordDoseInput = {
  medicationId: string;
  migraineEventId: string;
  takenAt: Date;
  doseAmount: string;
};

// ---------------------------------------------------------------------------
// Active migraine data
// ---------------------------------------------------------------------------

/** Loads the active migraine row from the DB, keyed on the store id. */
export function useActiveMigraine() {
  const activeMigraineId = useActiveMigraineStore((s) => s.activeMigraineId);

  return useQuery({
    queryKey: ['migraines', 'active', activeMigraineId],
    queryFn: () => {
      if (!activeMigraineId) return null;
      const result = getById(activeMigraineId);
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    },
    enabled: activeMigraineId !== null,
    staleTime: 10_000,
  });
}

// ---------------------------------------------------------------------------
// Severity update
// ---------------------------------------------------------------------------

export function useUpdateSeverity(migraineId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (peakSeverity: number) => {
      const result = update(migraineId, { peakSeverity });
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['migraines'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Medications list for "I took something" sheet
// ---------------------------------------------------------------------------

export function useMedsList() {
  return useQuery({
    queryKey: ['meds', 'list'],
    queryFn: () => {
      const result = list();
      if (!result.ok) throw new Error(result.error.message);
      return result.value.filter((m) => m.active);
    },
    staleTime: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Record a dose
// ---------------------------------------------------------------------------

export function useRecordDose() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: RecordDoseInput) => {
      const result = recordDose(data);
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['meds'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Top helpers — fallback when @/features/insights/hooks is unavailable
//
// Derives the top helpers locally by counting occurrences of each HelperTag
// across all completed migraines. The integration step will swap this out for
// useTopHelpers from @/features/insights/hooks once that agent's branch merges.
// ---------------------------------------------------------------------------

/**
 * Returns top helpers from insights if available, or falls back to local
 * derivation from the migraine history.
 */
export function useTopHelpersFallback(limit: number): {
  helpers: HelperSummary[];
  completedCount: number;
  isLoading: boolean;
} {
  const { data: migraines, isLoading } = useAllMigraineEvents();

  if (isLoading || !migraines) {
    return { helpers: [], completedCount: 0, isLoading: true };
  }

  const completed = migraines.filter((m) => m.endedAt !== null);
  const helpers = deriveTopHelpers(migraines, limit);
  return { helpers, completedCount: completed.length, isLoading: false };
}

// ---------------------------------------------------------------------------
// Minutes since migraine started
// ---------------------------------------------------------------------------

/** Re-renders every 60 seconds to keep the "X ago" label fresh. */
export function useMinutesSince(startedAt: Date | null): number {
  const [mins, setMins] = useState(() =>
    startedAt ? Math.floor((Date.now() - startedAt.getTime()) / 60_000) : 0,
  );

  useEffect(() => {
    if (!startedAt) return;
    const tick = () =>
      setMins(Math.floor((Date.now() - startedAt.getTime()) / 60_000));
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [startedAt]);

  return mins;
}
