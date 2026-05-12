import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';

import { db } from '@/db/client';
import { foodTags } from '@/db/schema/checkins';
import * as migraineRepo from '@/features/migraines/repo';
import * as medsRepo from '@/features/meds/repo';
import * as checkinsRepo from '@/features/checkins/repo';
import { useAllMigraineEvents } from '@/features/migraines/hooks';
import { sortHelpersByUserFrequency } from '@/features/migraines/helpers';
import { HELPER_TAGS_DEFAULT_ORDER } from '@/copy';
import type { FoodTagRow, MigraineRow, MedicationRow, DailyCheckinRow, SymptomTag } from '@/types';

import {
  makeInitialState,
  hasChanged,
  toDate,
  normaliseFoodTagName,
  type RetroFormState,
  type QueuedDose,
} from './logic';

export type { RetroFormState, QueuedDose };
export { hasChanged };

// ---------------------------------------------------------------------------
// Food tags — fallback since checkin agent's foodTags module may not be merged
// ---------------------------------------------------------------------------

const FOOD_TAGS_QUERY_KEY = ['food-tags'] as const;

export function useFoodTagsFallback(): {
  data: FoodTagRow[];
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: FOOD_TAGS_QUERY_KEY,
    queryFn: () => db.select().from(foodTags).all(),
    staleTime: 60_000,
  });
  return { data: data ?? [], isLoading };
}

export function useUpsertFoodTagFallback(): (name: string) => string {
  const queryClient = useQueryClient();

  return useCallback(
    (name: string) => {
      const normalised = normaliseFoodTagName(name);
      const existing = db
        .select()
        .from(foodTags)
        .where(eq(foodTags.name, normalised))
        .get();

      if (existing) {
        db.update(foodTags)
          .set({ usageCount: existing.usageCount + 1 })
          .where(eq(foodTags.id, existing.id))
          .run();
        queryClient.invalidateQueries({ queryKey: FOOD_TAGS_QUERY_KEY });
        return existing.id;
      }

      const id = ulid();
      db.insert(foodTags)
        .values({
          id,
          name: normalised,
          displayName: name.trim(),
          usageCount: 1,
          createdAt: new Date(),
        })
        .run();
      queryClient.invalidateQueries({ queryKey: FOOD_TAGS_QUERY_KEY });
      return id;
    },
    [queryClient],
  );
}

// ---------------------------------------------------------------------------
// Helper chips sorted by user frequency
// ---------------------------------------------------------------------------

export function useSortedHelpers(): { value: string; label: string }[] {
  const { data: allMigraines } = useAllMigraineEvents();
  const sorted = sortHelpersByUserFrequency(allMigraines ?? []);
  const labelMap = new Map(HELPER_TAGS_DEFAULT_ORDER.map((h) => [h.value, h.label]));
  return sorted.map((tag) => ({ value: tag, label: labelMap.get(tag) ?? tag }));
}

// ---------------------------------------------------------------------------
// Medication list (for the med picker sheet)
// ---------------------------------------------------------------------------

export function useMedicationsList(): { data: MedicationRow[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['meds'],
    queryFn: () => {
      const result = medsRepo.list();
      if (!result.ok) throw new Error(result.error.message);
      return result.value.filter((m) => m.active);
    },
    staleTime: 30_000,
  });
  return { data: data ?? [], isLoading };
}

// ---------------------------------------------------------------------------
// Load existing migraine for edit mode
// ---------------------------------------------------------------------------

export function useMigraineById(id: string | null): {
  data: MigraineRow | null;
  isLoading: boolean;
  error: string | null;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: ['migraines', id],
    queryFn: () => {
      if (!id) return null;
      const result = migraineRepo.getById(id);
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    },
    enabled: Boolean(id),
    staleTime: 0,
  });
  return {
    data: data ?? null,
    isLoading,
    error: error ? String(error) : null,
  };
}

// ---------------------------------------------------------------------------
// Check-in for the migraine's start date
// ---------------------------------------------------------------------------

export function useCheckinForDate(date: string): {
  data: DailyCheckinRow | null;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ['checkins', date],
    queryFn: (): DailyCheckinRow | null => {
      const result = checkinsRepo.getByDate(date);
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    },
    enabled: Boolean(date),
    staleTime: 30_000,
  });
  return { data: data ?? null, isLoading };
}

// ---------------------------------------------------------------------------
// Save migraine (insert or update) + flush queued doses
// ---------------------------------------------------------------------------

type SaveResult =
  | { ok: true; migraineId: string }
  | { ok: false; error: string };

type SaveInsertData = {
  mode: 'insert';
  form: RetroFormState;
  inlineCheckinDate: string | null;
};

type SaveUpdateData = {
  mode: 'update';
  migraineId: string;
  form: RetroFormState;
  /** When set, the food/water section of the form is persisted to that date's check-in. */
  inlineCheckinDate?: string | null;
};

/** Flushes queued doses to the database once we have the migraine id. */
function flushQueuedDoses(migraineId: string, doses: QueuedDose[]): void {
  for (const dose of doses) {
    medsRepo.recordDose({
      medicationId: dose.medicationId,
      migraineEventId: migraineId,
      takenAt: dose.takenAt,
      doseAmount: dose.doseAmount,
      effectivenessRating: dose.effectivenessRating,
      timeToReliefMinutes: null,
    });
  }
}

export function useSaveRetro(): {
  save: (data: SaveInsertData | SaveUpdateData) => SaveResult;
  isSaving: boolean;
} {
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const save = useCallback(
    (data: SaveInsertData | SaveUpdateData): SaveResult => {
      setIsSaving(true);
      try {
        const { form } = data;
        const startedAt = toDate(form.startDate, form.startHour, form.startMinute);
        const endedAt = form.stillGoing
          ? null
          : toDate(form.endDate, form.endHour, form.endMinute);
        const peakSeverity = form.auraOnly ? 0 : form.peakSeverity;
        // Aura-only forces the 'aura' symptom tag so the calendar can colour the day.
        const symptomTags: SymptomTag[] =
          form.auraOnly && !form.symptomTags.includes('aura')
            ? [...form.symptomTags, 'aura']
            : form.symptomTags;

        if (data.mode === 'insert') {
          const result = migraineRepo.insertCompleted({
            startedAt,
            // Honor "still going" — endedAt stays null so the row is treated as active.
            endedAt,
            peakSeverity,
            symptomTags,
            helpers: form.helpers,
            notes: form.notes || null,
            weatherSnapshotId: null,
          });

          if (!result.ok) return { ok: false, error: result.error.message };

          const migraineId = result.value.id;

          // Flush queued doses now that we have the id
          flushQueuedDoses(migraineId, form.queuedDoses);

          // Write inline check-in if the user filled food/water inline
          if (
            data.inlineCheckinDate &&
            (form.waterCups > 0 || form.foodTagIds.length > 0)
          ) {
            checkinsRepo.upsert(data.inlineCheckinDate, {
              sleepHours: null,
              sleepQuality: null,
              stressLevel: null,
              waterCups: form.waterCups,
              caffeineCups: null,
              foodTagIds: form.foodTagIds,
              notes: null,
              syncedAt: null,
              pooledAt: null,
            });
          }

          queryClient.invalidateQueries({ queryKey: ['migraines'] });
          return { ok: true, migraineId };
        }

        // Update mode
        const updateResult = migraineRepo.update(data.migraineId, {
          startedAt,
          endedAt,
          peakSeverity,
          symptomTags,
          helpers: form.helpers,
          notes: form.notes || null,
        });

        if (!updateResult.ok) return { ok: false, error: updateResult.error.message };

        // Persist food/water changes to the day's check-in (G7 fix).
        if (
          data.inlineCheckinDate &&
          (form.waterCups > 0 || form.foodTagIds.length > 0)
        ) {
          const existing = checkinsRepo.getByDate(data.inlineCheckinDate);
          const existingCheckin = existing.ok ? existing.value : null;
          checkinsRepo.upsert(data.inlineCheckinDate, {
            sleepHours: existingCheckin?.sleepHours ?? null,
            sleepQuality: existingCheckin?.sleepQuality ?? null,
            stressLevel: existingCheckin?.stressLevel ?? null,
            waterCups: form.waterCups || existingCheckin?.waterCups || null,
            caffeineCups: existingCheckin?.caffeineCups ?? null,
            foodTagIds:
              form.foodTagIds.length > 0
                ? form.foodTagIds
                : existingCheckin?.foodTagIds ?? [],
            notes: existingCheckin?.notes ?? null,
            syncedAt: null,
            pooledAt: null,
          });
          queryClient.invalidateQueries({ queryKey: ['checkin', data.inlineCheckinDate] });
        }

        // Flush any newly queued doses for the edit
        flushQueuedDoses(data.migraineId, form.queuedDoses);

        queryClient.invalidateQueries({ queryKey: ['migraines'] });
        return { ok: true, migraineId: data.migraineId };
      } finally {
        setIsSaving(false);
      }
    },
    [queryClient],
  );

  return { save, isSaving };
}

// ---------------------------------------------------------------------------
// Form state initialiser — used by the screen to build initial state
// ---------------------------------------------------------------------------

export { makeInitialState };
