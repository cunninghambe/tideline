import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/TextField';
import { activeLogCopy, SYMPTOM_CHIPS_UI } from '@/copy';
import { insertActive } from '@/features/migraines/repo';
import { useActiveMigraineStore } from '@/stores/useActiveMigraineStore';
import { useSeverityState, useSymptomSelection, useWeatherCapture } from '@/features/log-active/hooks';
import type { SymptomTag } from '@/db/schema/migraines';

export default function LogActiveScreen() {
  const router = useRouter();
  const setActiveMigraineId = useActiveMigraineStore((s) => s.setActiveMigraineId);

  const { severity, setSeverity, auraOnly, toggleAuraOnly, getValueOnSave } = useSeverityState(5);
  const { selected, toggle } = useSymptomSelection();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { captureAndGetId } = useWeatherCapture();

  const handleSave = useCallback(async (openCompanion: boolean) => {
    setSaving(true);

    // Capture weather snapshot id without blocking save
    const weatherSnapshotId = await captureAndGetId();

    // Aura-only forces the 'aura' symptom tag so the calendar can colour the day.
    const symptomTags = (
      auraOnly && !selected.includes('aura')
        ? [...selected, 'aura']
        : selected
    ) as SymptomTag[];

    const result = insertActive({
      peakSeverity: getValueOnSave(),
      symptomTags,
      notes: notes.trim() || null,
      weatherSnapshotId,
    });

    setSaving(false);

    if (!result.ok) {
      Alert.alert('Error', 'Could not save migraine. Please try again.');
      return;
    }

    setActiveMigraineId(result.value.id);

    if (openCompanion) {
      router.replace('/(tabs)');
      router.push('/companion');
    } else {
      router.replace('/(tabs)');
    }
  }, [captureAndGetId, getValueOnSave, auraOnly, selected, notes, setActiveMigraineId, router]);

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerClassName="px-6 py-8 gap-8"
      keyboardShouldPersistTaps="handled"
    >
      {/* Title */}
      <View className="gap-1" accessibilityRole="header">
        <Text className="text-text-primary text-2xl font-semibold">
          {activeLogCopy.title}
        </Text>
        <Text className="text-text-secondary text-base">
          {activeLogCopy.subtitle}
        </Text>
      </View>

      {/* Severity */}
      <View className="gap-3">
        <Text className="text-text-primary text-lg font-medium">
          {activeLogCopy.severityLabel}
        </Text>
        <Slider
          value={severity}
          onValueChange={setSeverity}
          min={1}
          max={10}
          ariaLabel="Migraine severity"
          testID="active-severity-slider"
          showValue
        />
        {/* Aura-only toggle */}
        <View
          className="flex-row items-center justify-between"
          accessibilityRole="none"
        >
          <Text
            className="text-text-secondary text-base flex-1"
            nativeID="aura-only-label"
          >
            Aura only — no pain
          </Text>
          <Switch
            value={auraOnly}
            onValueChange={toggleAuraOnly}
            accessibilityRole="switch"
            accessibilityLabel="Aura only — no pain"
            accessibilityState={{ checked: auraOnly }}
            testID="active-aura-toggle"
          />
        </View>
      </View>

      {/* Symptoms */}
      <View className="gap-3">
        <Text className="text-text-primary text-lg font-medium">
          {activeLogCopy.symptomsLabel}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {SYMPTOM_CHIPS_UI.map((chip) => (
            <Chip
              key={chip.value}
              label={chip.label}
              selected={selected.includes(chip.value)}
              onPress={() => toggle(chip.value)}
              testID={`active-chip-${chip.value}`}
            />
          ))}
        </View>
      </View>

      {/* Notes */}
      <TextField
        value={notes}
        onChangeText={setNotes}
        label={activeLogCopy.notesLabel}
        placeholder="Optional"
        multiline
        ariaLabel={activeLogCopy.notesLabel}
        testID="active-notes"
      />

      {/* Buttons */}
      <View className="gap-4 pb-4">
        <Button
          label={activeLogCopy.saveCta}
          onPress={() => void handleSave(false)}
          variant="primary"
          size="xl"
          fullWidth
          loading={saving}
          testID="active-save"
        />
        <Button
          label={activeLogCopy.companionCta}
          onPress={() => void handleSave(true)}
          variant="secondary"
          size="xl"
          fullWidth
          loading={saving}
          testID="active-companion"
        />
      </View>
    </ScrollView>
  );
}
