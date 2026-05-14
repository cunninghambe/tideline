import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { Chip } from '@/components/ui/Chip';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Sheet } from '@/components/ui/Sheet';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { FONT_FAMILY } from '@/theme/fonts';
import {
  HELPER_TAGS_DEFAULT_ORDER,
  POST_STATE_CHIPS,
} from '@/copy';
import { getById, endActive } from '@/features/migraines/repo';
import { sortHelpersByUserFrequency } from '@/features/migraines/helpers';
import { list as listMeds, recordDose } from '@/features/meds/repo';
import { useAllMigraineEvents } from '@/features/migraines/hooks';
import { useActiveMigraineStore } from '@/stores/useActiveMigraineStore';
import { useSeverityState } from '@/features/log-active/hooks';
import type { HelperTag, PostState } from '@/db/schema/migraines';
import type { MedicationRow } from '@/types';

function formatDuration(startedAt: Date, now: Date): string {
  const totalMins = Math.floor((now.getTime() - startedAt.getTime()) / 60_000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

type DoseEntry = {
  medId: string;
  medName: string;
  doseAmount: string;
  takenAt: Date;
  effectiveness: 'helped' | 'kind_of' | 'didnt_help' | 'unsure';
};

type MedSheetProps = {
  migraineId: string;
  onAdd: (dose: DoseEntry) => void;
  onClose: () => void;
};

function MedSelectionSheet({ migraineId: _migraineId, onAdd, onClose }: MedSheetProps) {
  const medsResult = listMeds();
  const meds: MedicationRow[] = medsResult.ok ? medsResult.value.filter((m) => m.active) : [];
  const [selectedMedId, setSelectedMedId] = useState<string | null>(null);
  const [effectiveness, setEffectiveness] = useState<DoseEntry['effectiveness']>('unsure');

  const selectedMed = meds.find((m) => m.id === selectedMedId) ?? null;

  const handleConfirm = () => {
    if (!selectedMed) return;
    onAdd({
      medId: selectedMed.id,
      medName: selectedMed.brandName,
      doseAmount: selectedMed.defaultDose,
      takenAt: new Date(),
      effectiveness,
    });
    onClose();
  };

  const effectivenessOptions: { value: DoseEntry['effectiveness']; label: string }[] = [
    { value: 'helped', label: 'Helped' },
    { value: 'kind_of', label: 'Kind of' },
    { value: 'didnt_help', label: "Didn't help" },
    { value: 'unsure', label: 'Unsure' },
  ];

  return (
    <View className="px-6 pb-8 gap-6">
      <SectionLabel>Select medication</SectionLabel>
      <View className="gap-2">
        {meds.length === 0 ? (
          <Text className="text-text-secondary text-base">
            No medications in your list. Add one in the Meds tab.
          </Text>
        ) : (
          meds.map((med) => (
            <Chip
              key={med.id}
              label={`${med.brandName} ${med.defaultDose}`}
              selected={selectedMedId === med.id}
              onPress={() => setSelectedMedId(med.id)}
              testID={`end-med-chip-${med.id}`}
            />
          ))
        )}
      </View>
      {selectedMed && (
        <View className="gap-2">
          <SectionLabel>Did it help?</SectionLabel>
          <SegmentedControl
            options={effectivenessOptions}
            value={effectiveness}
            onChange={setEffectiveness}
            ariaLabel="Medication effectiveness"
            testID="end-med-effectiveness"
          />
        </View>
      )}
      <Button
        label="Add"
        onPress={handleConfirm}
        variant="primary"
        size="xl"
        fullWidth
        disabled={!selectedMed}
        testID="end-med-confirm"
      />
    </View>
  );
}

export default function LogEndScreen() {
  const router = useRouter();
  const activeMigraineId = useActiveMigraineStore((s) => s.activeMigraineId);
  const clearActive = useActiveMigraineStore((s) => s.clearActive);
  const { data: allMigraines = [] } = useAllMigraineEvents();

  const screenOpenedAt = useState(() => new Date())[0];
  const migraineResult = activeMigraineId ? getById(activeMigraineId) : null;
  const migraine = migraineResult?.ok ? migraineResult.value : null;

  const startedAt = migraine?.startedAt ?? screenOpenedAt;
  const initialSeverity = migraine?.peakSeverity && migraine.peakSeverity > 0
    ? migraine.peakSeverity
    : 5;

  const { severity, setSeverity, auraOnly, toggleAuraOnly, getValueOnSave } =
    useSeverityState(initialSeverity);

  const sortedHelpers = sortHelpersByUserFrequency(allMigraines);
  const helperChips = sortedHelpers.map((tag) => {
    const found = HELPER_TAGS_DEFAULT_ORDER.find((h) => h.value === tag);
    return found ?? { value: tag, label: tag };
  });

  const [selectedHelpers, setSelectedHelpers] = useState<HelperTag[]>([]);
  const [postState, setPostState] = useState<PostState>('drained');
  const [medSheetOpen, setMedSheetOpen] = useState(false);
  const [dosesToRecord, setDosesToRecord] = useState<DoseEntry[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleHelper = useCallback((tag: HelperTag) => {
    setSelectedHelpers((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!activeMigraineId) {
      Alert.alert('Error', 'No active migraine found.');
      return;
    }

    setSaving(true);

    for (const dose of dosesToRecord) {
      recordDose({
        medicationId: dose.medId,
        migraineEventId: activeMigraineId,
        takenAt: dose.takenAt,
        doseAmount: dose.doseAmount,
        effectivenessRating: dose.effectiveness,
      });
    }

    const result = endActive(activeMigraineId, {
      endedAt: new Date(),
      peakSeverity: getValueOnSave(),
      helpers: selectedHelpers,
      postState,
    });

    setSaving(false);

    if (!result.ok) {
      Alert.alert('Error', 'Could not save. Please try again.');
      return;
    }

    clearActive();
    router.replace('/(tabs)');
  }, [activeMigraineId, dosesToRecord, getValueOnSave, selectedHelpers, postState, clearActive, router]);

  if (!migraine) {
    return (
      <View className="flex-1 bg-bg items-center justify-center px-6">
        <Text className="text-text-secondary text-base text-center">
          No active migraine found.
        </Text>
        <View className="mt-4">
          <Button
            label="Go home"
            onPress={() => router.replace('/(tabs)')}
            variant="secondary"
            size="lg"
          />
        </View>
      </View>
    );
  }

  const duration = formatDuration(startedAt, screenOpenedAt);

  return (
    <>
      <ScrollView
        className="flex-1 bg-bg"
        contentContainerClassName="px-6 py-8 gap-8"
      >
        {/* Heading */}
        <View className="gap-2" accessibilityRole="header">
          <Text
            style={{ fontFamily: FONT_FAMILY.serifMedium, letterSpacing: -0.4 }}
            className="text-text-primary text-3xl"
          >
            It ended.
          </Text>
          <Text className="text-text-secondary text-base italic">
            How long it lasted: {duration}.
          </Text>
        </View>

        {/* Peak severity */}
        <View className="gap-3">
          <SectionLabel>
            Peak severity (was it worse than {migraine.peakSeverity} at any point?)
          </SectionLabel>
          <Slider
            value={severity}
            onValueChange={setSeverity}
            min={1}
            max={10}
            ariaLabel="Peak migraine severity"
            testID="end-severity-slider"
            showValue
          />
          <View className="flex-row items-center justify-between">
            <Text className="text-text-secondary text-base flex-1" nativeID="end-aura-label">
              Aura only — no pain
            </Text>
            <Switch
              value={auraOnly}
              onValueChange={toggleAuraOnly}
              accessibilityRole="switch"
              accessibilityLabel="Aura only — no pain"
              accessibilityState={{ checked: auraOnly }}
              testID="end-aura-toggle"
            />
          </View>
        </View>

        {/* What helped */}
        <View className="gap-3">
          <SectionLabel>What helped? (tap any)</SectionLabel>
          <View className="flex-row flex-wrap gap-2">
            {helperChips.map((chip) => (
              <Chip
                key={chip.value}
                label={chip.label}
                selected={selectedHelpers.includes(chip.value)}
                onPress={() => toggleHelper(chip.value)}
                testID={`end-helper-${chip.value}`}
              />
            ))}
          </View>
        </View>

        {/* Take anything */}
        <View className="gap-3">
          <SectionLabel>Take anything?</SectionLabel>
          {dosesToRecord.map((dose, i) => (
            <Text key={i} className="text-text-secondary text-base">
              {dose.medName} {dose.doseAmount} — {dose.effectiveness}
            </Text>
          ))}
          <Button
            label="+ Add medication taken"
            onPress={() => setMedSheetOpen(true)}
            variant="secondary"
            size="lg"
            fullWidth
            testID="end-add-med"
          />
        </View>

        {/* How feeling now */}
        <View className="gap-3">
          <SectionLabel>How are you feeling now?</SectionLabel>
          <SegmentedControl
            options={POST_STATE_CHIPS}
            value={postState}
            onChange={setPostState}
            ariaLabel="How are you feeling now"
            testID="end-post-state"
          />
        </View>

        {/* Save */}
        <View className="pb-4">
          <Button
            label="Save"
            onPress={() => void handleSave()}
            variant="primary"
            size="xl"
            fullWidth
            loading={saving}
            testID="end-save"
          />
        </View>
      </ScrollView>

      <Sheet
        open={medSheetOpen}
        onClose={() => setMedSheetOpen(false)}
        title="Medication taken"
        height="auto"
        testID="end-med-sheet"
      >
        <MedSelectionSheet
          migraineId={activeMigraineId ?? ''}
          onAdd={(dose) => setDosesToRecord((prev) => [...prev, dose])}
          onClose={() => setMedSheetOpen(false)}
        />
      </Sheet>
    </>
  );
}
