import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { TextField } from '@/components/ui/TextField';
import { TimeSection } from '@/features/log-retro/components/TimeSection';
import { SeveritySection } from '@/features/log-retro/components/SeveritySection';
import { FoodWaterSection } from '@/features/log-retro/components/FoodWaterSection';
import { MedsSection } from '@/features/log-retro/components/MedsSection';
import { HelpersSection } from '@/features/log-retro/components/HelpersSection';
import {
  useFoodTagsFallback,
  useUpsertFoodTagFallback,
  useSortedHelpers,
  useMedicationsList,
  useMigraineById,
  useCheckinForDate,
  useSaveRetro,
  makeInitialState,
  hasChanged,
  type RetroFormState,
} from '@/features/log-retro/hooks';
import { toISODate, toggleInList } from '@/features/log-retro/logic';
import type { HelperTag, SymptomTag } from '@/db/schema/migraines';

// ---------------------------------------------------------------------------
// Helpers to build form state from an existing migraine row (edit mode)
// ---------------------------------------------------------------------------

function formFromMigraineRow(row: {
  startedAt: Date;
  endedAt: Date | null;
  peakSeverity: number;
  symptomTags: SymptomTag[];
  helpers: HelperTag[];
  notes: string | null;
}): RetroFormState {
  const startDate = toISODate(row.startedAt);
  const endDate = row.endedAt ? toISODate(row.endedAt) : startDate;
  return {
    startDate,
    startHour: row.startedAt.getHours(),
    startMinute: row.startedAt.getMinutes(),
    endDate,
    endHour: row.endedAt ? row.endedAt.getHours() : row.startedAt.getHours(),
    endMinute: row.endedAt ? row.endedAt.getMinutes() : row.startedAt.getMinutes(),
    stillGoing: row.endedAt === null,
    peakSeverity: row.peakSeverity === 0 ? 5 : row.peakSeverity,
    auraOnly: row.peakSeverity === 0,
    symptomTags: row.symptomTags,
    waterCups: 0,
    foodTagIds: [],
    helpers: row.helpers,
    notes: row.notes ?? '',
    queuedDoses: [],
  };
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function LogRetroScreen() {
  const params = useLocalSearchParams<{ id?: string; date?: string }>();
  const router = useRouter();

  const editId = params.id ?? null;
  const prefillDate = params.date ?? undefined;
  const isEditMode = Boolean(editId);

  const [form, setForm] = useState<RetroFormState>(() =>
    makeInitialState(prefillDate),
  );
  const [initialForm, setInitialForm] = useState<RetroFormState>(() =>
    makeInitialState(prefillDate),
  );
  const [discardSheetOpen, setDiscardSheetOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Data hooks
  const { data: existingMigraine, isLoading: migraineLoading } = useMigraineById(editId);
  const { data: foodTags } = useFoodTagsFallback();
  const sortedHelpers = useSortedHelpers();
  const { data: medications } = useMedicationsList();
  const upsertFoodTag = useUpsertFoodTagFallback();
  const { save, isSaving } = useSaveRetro();

  // Check-in for the start date (to show read-only or inline)
  const { data: checkinForDate } = useCheckinForDate(form.startDate);

  // In edit mode: prefill form from the existing row once loaded
  useEffect(() => {
    if (isEditMode && existingMigraine) {
      const prefilled = formFromMigraineRow(existingMigraine);
      setForm(prefilled);
      setInitialForm(prefilled);
    }
  }, [isEditMode, existingMigraine]);

  function handleCancel() {
    if (hasChanged(form, initialForm)) {
      setDiscardSheetOpen(true);
    } else {
      router.back();
    }
  }

  function handleSave() {
    setSaveError(null);

    let result;
    if (isEditMode && editId) {
      result = save({ mode: 'update', migraineId: editId, form });
    } else {
      result = save({
        mode: 'insert',
        form,
        inlineCheckinDate: checkinForDate ? null : form.startDate,
      });
    }

    if (result.ok) {
      router.back();
    } else {
      setSaveError(result.error);
    }
  }

  function handleAddNewFoodTag(name: string) {
    const id = upsertFoodTag(name);
    setForm((prev) => ({
      ...prev,
      foodTagIds: prev.foodTagIds.includes(id)
        ? prev.foodTagIds
        : [...prev.foodTagIds, id],
    }));
  }

  if (isEditMode && migraineLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <Text className="text-text-secondary text-base">Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Button
          label="Cancel"
          onPress={handleCancel}
          variant="ghost"
          testID="cancel-button"
        />
        <Text className="text-text-primary text-lg font-semibold">
          {isEditMode ? 'Edit migraine' : 'Log a migraine'}
        </Text>
        <Button
          label={isEditMode ? 'Update' : 'Save'}
          onPress={handleSave}
          variant="primary"
          loading={isSaving}
          testID="save-button"
        />
      </View>

      {saveError && (
        <View className="mx-6 mb-2 bg-severity-severe/10 rounded-xl px-4 py-3">
          <Text className="text-severity-severe text-sm">{saveError}</Text>
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Time */}
        <TimeSection
          startDate={form.startDate}
          startHour={form.startHour}
          startMinute={form.startMinute}
          endDate={form.endDate}
          endHour={form.endHour}
          endMinute={form.endMinute}
          stillGoing={form.stillGoing}
          onStartDate={(d) => setForm((p) => ({ ...p, startDate: d }))}
          onStartHour={(h) => setForm((p) => ({ ...p, startHour: h }))}
          onStartMinute={(m) => setForm((p) => ({ ...p, startMinute: m }))}
          onEndDate={(d) => setForm((p) => ({ ...p, endDate: d }))}
          onEndHour={(h) => setForm((p) => ({ ...p, endHour: h }))}
          onEndMinute={(m) => setForm((p) => ({ ...p, endMinute: m }))}
          onStillGoing={(v) => setForm((p) => ({ ...p, stillGoing: v }))}
        />

        {/* 2. Severity + symptoms */}
        <SeveritySection
          peakSeverity={form.peakSeverity}
          auraOnly={form.auraOnly}
          symptomTags={form.symptomTags}
          onSeverity={(n) => setForm((p) => ({ ...p, peakSeverity: n }))}
          onAuraOnly={(v) => setForm((p) => ({ ...p, auraOnly: v }))}
          onSymptomTags={(tags) => setForm((p) => ({ ...p, symptomTags: tags }))}
        />

        {/* 3. Food + water */}
        <FoodWaterSection
          date={form.startDate}
          existingCheckin={checkinForDate ?? null}
          allFoodTags={foodTags}
          waterCups={form.waterCups}
          selectedFoodTagIds={form.foodTagIds}
          onWaterCups={(n) => setForm((p) => ({ ...p, waterCups: n }))}
          onToggleFoodTag={(id) =>
            setForm((p) => ({ ...p, foodTagIds: toggleInList(p.foodTagIds, id) }))
          }
          onAddNewFoodTag={handleAddNewFoodTag}
        />

        {/* 4. Medications */}
        <MedsSection
          medications={medications}
          queuedDoses={form.queuedDoses}
          onAddDose={(dose) =>
            setForm((p) => ({ ...p, queuedDoses: [...p.queuedDoses, dose] }))
          }
          onRemoveDose={(idx) =>
            setForm((p) => ({
              ...p,
              queuedDoses: p.queuedDoses.filter((_, i) => i !== idx),
            }))
          }
        />

        {/* 5. What helped */}
        <HelpersSection
          sortedHelpers={sortedHelpers}
          selectedHelpers={form.helpers}
          onHelpers={(helpers) => setForm((p) => ({ ...p, helpers }))}
        />

        {/* 6. Notes */}
        <TextField
          value={form.notes}
          onChangeText={(v) => setForm((p) => ({ ...p, notes: v }))}
          label="Notes"
          placeholder="Optional notes"
          multiline
          ariaLabel="Notes"
          testID="notes-field"
        />

        {/* 7. Save button (bottom) */}
        <Button
          label={isEditMode ? 'Update' : 'Save'}
          onPress={handleSave}
          variant="primary"
          size="lg"
          fullWidth
          loading={isSaving}
          testID="save-button-bottom"
        />
      </ScrollView>

      {/* Discard confirmation sheet */}
      <Sheet
        open={discardSheetOpen}
        onClose={() => setDiscardSheetOpen(false)}
        title="Discard changes?"
        testID="discard-sheet"
      >
        <View className="px-6 pb-8 gap-4">
          <Text className="text-text-secondary text-base">
            You&apos;ve started filling this in. Are you sure you want to leave?
          </Text>
          <Button
            label="Discard"
            onPress={() => {
              setDiscardSheetOpen(false);
              router.back();
            }}
            variant="danger"
            fullWidth
            testID="discard-button"
          />
          <Button
            label="Keep editing"
            onPress={() => setDiscardSheetOpen(false)}
            variant="secondary"
            fullWidth
            testID="keep-editing-button"
          />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}
