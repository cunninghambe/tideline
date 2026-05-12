import { useQuery } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { medicationDoses } from '@/db/schema';
import * as repo from '@/features/meds/repo';
import { deriveEffectivenessStats, dosesPerWeek } from './effectiveness';

export type { EffectivenessStats } from './effectiveness';
export { deriveEffectivenessStats, dosesPerWeek };

export const MEDS_QUERY_KEY = ['meds'] as const;
export const MED_DETAIL_QUERY_KEY = (id: string) => ['meds', id] as const;
export const MED_DOSES_QUERY_KEY = (medId: string) => ['meds', medId, 'doses'] as const;

export function useMedicationsList() {
  return useQuery({
    queryKey: MEDS_QUERY_KEY,
    queryFn: () => {
      const result = repo.list();
      if (!result.ok) throw new Error(result.error.message);
      return result.value.filter((m) => m.active);
    },
  });
}

export function useMedicationDetail(id: string) {
  return useQuery({
    queryKey: MED_DETAIL_QUERY_KEY(id),
    queryFn: () => {
      const result = repo.getById(id);
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    },
    enabled: Boolean(id),
  });
}

export function useEffectivenessStats(medId: string) {
  return useQuery({
    queryKey: MED_DOSES_QUERY_KEY(medId),
    queryFn: () => {
      const doses = db
        .select()
        .from(medicationDoses)
        .where(eq(medicationDoses.medicationId, medId))
        .all();
      return deriveEffectivenessStats(doses);
    },
    enabled: Boolean(medId),
  });
}

/** Returns all doses for a medication, sorted newest-first. Used for supply rate calculation. */
export function useAllDoses(medId: string) {
  return useQuery({
    queryKey: [...MED_DOSES_QUERY_KEY(medId), 'all'],
    queryFn: () =>
      db
        .select()
        .from(medicationDoses)
        .where(eq(medicationDoses.medicationId, medId))
        .all()
        .sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime()),
    enabled: Boolean(medId),
  });
}

/** Returns last N doses for a medication, sorted newest-first. */
export function useRecentDoses(medId: string, limit = 5) {
  return useQuery({
    queryKey: [...MED_DOSES_QUERY_KEY(medId), 'recent', limit],
    queryFn: () =>
      db
        .select()
        .from(medicationDoses)
        .where(eq(medicationDoses.medicationId, medId))
        .all()
        .sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime())
        .slice(0, limit),
    enabled: Boolean(medId),
  });
}
