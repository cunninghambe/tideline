import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Stepper } from '@/components/ui/Stepper';
import { Chip } from '@/components/ui/Chip';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { usePalette } from '@/theme/useTheme';
import { FONT_FAMILY } from '@/theme/fonts';
import type { MedicationRow } from '@/types';
import type { QueuedDose, EffectivenessRating } from '../logic';
import { formatHHMM } from '../logic';

type MedsSectionProps = {
  medications: MedicationRow[];
  queuedDoses: QueuedDose[];
  onAddDose: (dose: QueuedDose) => void;
  onRemoveDose: (index: number) => void;
};

const EFFECTIVENESS_OPTIONS: { value: EffectivenessRating; label: string }[] = [
  { value: 'helped', label: 'Yes' },
  { value: 'kind_of', label: 'Kind of' },
  { value: 'didnt_help', label: "No" },
  { value: 'unsure', label: 'Unsure' },
];

type DoseEntryState = {
  medicationId: string;
  doseAmount: string;
  takenAtHour: number;
  takenAtMinute: number;
  effectivenessRating: EffectivenessRating | null;
};

function makeDoseEntry(med: MedicationRow, baseDate: Date): DoseEntryState {
  return {
    medicationId: med.id,
    doseAmount: med.defaultDose,
    takenAtHour: baseDate.getHours(),
    takenAtMinute: baseDate.getMinutes(),
    effectivenessRating: null,
  };
}

export function MedsSection({
  medications,
  queuedDoses,
  onAddDose,
  onRemoveDose,
}: MedsSectionProps) {
  const palette = usePalette();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState<MedicationRow | null>(null);
  const [entry, setEntry] = useState<DoseEntryState | null>(null);
  const [search, setSearch] = useState('');

  function openMedPicker() {
    setSelectedMed(null);
    setEntry(null);
    setSearch('');
    setSheetOpen(true);
  }

  function selectMed(med: MedicationRow) {
    setSelectedMed(med);
    setEntry(makeDoseEntry(med, new Date()));
  }

  function confirmDose() {
    if (!entry) return;
    const takenAt = new Date();
    takenAt.setHours(entry.takenAtHour, entry.takenAtMinute, 0, 0);
    onAddDose({
      medicationId: entry.medicationId,
      doseAmount: entry.doseAmount,
      takenAt,
      effectivenessRating: entry.effectivenessRating,
    });
    setSheetOpen(false);
    setSelectedMed(null);
    setEntry(null);
  }

  const filteredMeds =
    search.trim() === ''
      ? medications
      : medications.filter((m) =>
          m.brandName.toLowerCase().includes(search.toLowerCase()),
        );

  return (
    <View className="gap-3">
      <Text
        style={{ fontFamily: FONT_FAMILY.serifMedium }}
        className="text-text-primary text-xl"
      >
        Medications
      </Text>

      {queuedDoses.length > 0 && (
        <View className="gap-2">
          {queuedDoses.map((dose, idx) => {
            const med = medications.find((m) => m.id === dose.medicationId);
            const h = dose.takenAt.getHours();
            const m = dose.takenAt.getMinutes();
            return (
              <View
                key={idx}
                className="flex-row items-center justify-between bg-surface border border-border rounded-xl px-4 py-3"
              >
                <View className="flex-1 gap-0.5">
                  <Text className="text-text-primary text-base font-medium">
                    {med?.brandName ?? 'Unknown'} {dose.doseAmount}
                  </Text>
                  <Text className="text-text-secondary text-sm">
                    {formatHHMM(h, m)}
                    {dose.effectivenessRating
                      ? ` · ${EFFECTIVENESS_OPTIONS.find((e) => e.value === dose.effectivenessRating)?.label ?? ''}`
                      : ''}
                  </Text>
                </View>
                <Pressable
                  onPress={() => onRemoveDose(idx)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${med?.brandName ?? 'medication'} dose`}
                  style={{ minHeight: 44, minWidth: 44 }}
                  className="items-center justify-center"
                >
                  <Text className="text-severity-severe text-sm font-medium">Remove</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      <Button
        label="+ Add medication taken"
        onPress={openMedPicker}
        variant="secondary"
        fullWidth
        testID="add-med-button"
      />

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Medication taken"
        height="half"
        testID="med-picker-sheet"
      >
        <View className="px-6 pb-6 gap-4">
          {!selectedMed ? (
            <>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search medications…"
                placeholderTextColor={palette.textMuted}
                accessibilityLabel="Search medications"
                className="bg-surface border border-border rounded-xl px-4 py-3 text-text-primary text-base"
              />
              {filteredMeds.length === 0 ? (
                <Text className="text-text-muted text-sm text-center py-4">
                  No medications found. Add them in the Meds tab.
                </Text>
              ) : (
                <View className="gap-2">
                  {filteredMeds.map((med) => (
                    <Pressable
                      key={med.id}
                      onPress={() => selectMed(med)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${med.brandName}`}
                      style={{ minHeight: 56 }}
                      className="flex-row items-center justify-between bg-surface border border-border rounded-xl px-4 py-3"
                    >
                      <View>
                        <Text className="text-text-primary text-base font-medium">
                          {med.brandName}
                        </Text>
                        <Text className="text-text-secondary text-sm">
                          Default: {med.defaultDose}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          ) : entry ? (
            <View className="gap-4">
              <Text className="text-text-primary text-base font-semibold">
                {selectedMed.brandName}
              </Text>

              {/* Dose amount */}
              <View className="gap-1">
                <SectionLabel>Dose</SectionLabel>
                <TextInput
                  value={entry.doseAmount}
                  onChangeText={(v) => setEntry({ ...entry, doseAmount: v })}
                  placeholder={selectedMed.defaultDose}
                  placeholderTextColor={palette.textMuted}
                  accessibilityLabel="Dose amount"
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-text-primary text-base"
                />
              </View>

              {/* Time taken */}
              <View className="gap-2">
                <SectionLabel>
                  Time taken — {formatHHMM(entry.takenAtHour, entry.takenAtMinute)}
                </SectionLabel>
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text className="text-text-muted text-xs mb-1">Hour</Text>
                    <Stepper
                      value={entry.takenAtHour}
                      onValueChange={(h) => setEntry({ ...entry, takenAtHour: h })}
                      min={0}
                      max={23}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-text-muted text-xs mb-1">Minute</Text>
                    <Stepper
                      value={entry.takenAtMinute}
                      onValueChange={(m) => setEntry({ ...entry, takenAtMinute: m })}
                      min={0}
                      max={59}
                      step={5}
                    />
                  </View>
                </View>
              </View>

              {/* Did it help? */}
              <View className="gap-2">
                <SectionLabel>Did it help?</SectionLabel>
                <View className="flex-row flex-wrap gap-2">
                  {EFFECTIVENESS_OPTIONS.map((opt) => (
                    <Chip
                      key={opt.value}
                      label={opt.label}
                      selected={entry.effectivenessRating === opt.value}
                      onPress={() =>
                        setEntry({ ...entry, effectivenessRating: opt.value })
                      }
                    />
                  ))}
                </View>
              </View>

              <View className="flex-row gap-3">
                <Button
                  label="Back"
                  onPress={() => {
                    setSelectedMed(null);
                    setEntry(null);
                  }}
                  variant="secondary"
                />
                <Button
                  label="Add"
                  onPress={confirmDose}
                  variant="primary"
                  testID="confirm-dose-button"
                />
              </View>
            </View>
          ) : null}
        </View>
      </Sheet>
    </View>
  );
}
