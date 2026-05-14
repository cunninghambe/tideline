import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

import { usePalette } from '@/theme/useTheme';
import { useDensity } from '@/theme/calendarTokenHooks';
import { FONT_FAMILY } from '@/theme/fonts';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/TextField';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { activeLogCopy, SYMPTOM_CHIPS_UI } from '@/copy';
import { insertActive } from '@/features/migraines/repo';
import { useActiveMigraineStore } from '@/stores/useActiveMigraineStore';
import {
  useSeverityState,
  useSymptomSelection,
  useWeatherCapture,
} from '@/features/log-active/hooks';
import type { SymptomTag } from '@/db/schema/migraines';

export default function LogActiveScreen() {
  const router = useRouter();
  const palette = usePalette();
  const density = useDensity();
  const setActiveMigraineId = useActiveMigraineStore((s) => s.setActiveMigraineId);

  const { severity, setSeverity, auraOnly, toggleAuraOnly, getValueOnSave } = useSeverityState(5);
  const { selected, toggle } = useSymptomSelection();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { captureAndGetId } = useWeatherCapture();

  const handleSave = useCallback(async (openCompanion: boolean) => {
    setSaving(true);
    const weatherSnapshotId = await captureAndGetId();
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
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Subtle during-tint — acknowledges they're in pain */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: palette.duringTint,
          opacity: 0.18,
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            paddingHorizontal: density.headerPad + 8,
            paddingTop: density.headerPad + 8,
          }}
        >
          {/* Top mono row — CANCEL + LOGGING NOW */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 28,
            }}
          >
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              hitSlop={12}
            >
              <Text
                style={{
                  fontFamily: FONT_FAMILY.mono,
                  fontSize: 13,
                  color: palette.textSecondary,
                  letterSpacing: 0.5,
                }}
              >
                ← cancel
              </Text>
            </Pressable>
            <Text
              style={{
                fontFamily: FONT_FAMILY.mono,
                fontSize: 10,
                letterSpacing: 1.6,
                textTransform: 'uppercase',
                color: palette.textMuted,
              }}
            >
              logging now
            </Text>
          </View>

          {/* Headline — Newsreader */}
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: FONT_FAMILY.serifMedium,
              fontSize: 32 * density.typeScale,
              lineHeight: 36 * density.typeScale,
              letterSpacing: -0.64,
              color: palette.textPrimary,
            }}
          >
            {activeLogCopy.title}
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontFamily: FONT_FAMILY.sans,
              fontSize: 14 * density.typeScale,
              lineHeight: 21 * density.typeScale,
              fontStyle: 'italic',
              color: palette.textSecondary,
            }}
          >
            {activeLogCopy.subtitle}
          </Text>
        </View>

        <View
          style={{
            paddingHorizontal: density.headerPad + 8,
            paddingTop: density.headerPad * 1.4,
            gap: 28,
          }}
        >
          {/* Severity */}
          <View>
            <SectionLabel>How bad?</SectionLabel>
            <Slider
              value={severity}
              onValueChange={setSeverity}
              min={1}
              max={10}
              ariaLabel="Migraine severity"
              testID="active-severity-slider"
            />
            <Text
              style={{
                marginTop: 6,
                fontFamily: FONT_FAMILY.sans,
                fontStyle: 'italic',
                fontSize: 12 * density.typeScale,
                color: palette.textMuted,
              }}
            >
              slide later if you can&apos;t tell
            </Text>
            {/* Aura-only toggle */}
            <View
              style={{
                marginTop: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text
                nativeID="aura-only-label"
                style={{
                  flex: 1,
                  color: palette.textSecondary,
                  fontFamily: FONT_FAMILY.sans,
                  fontSize: 14 * density.typeScale,
                }}
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
          <View>
            <SectionLabel>Feeling? (tap any that apply)</SectionLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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
          <View>
            <SectionLabel>{activeLogCopy.notesLabel}</SectionLabel>
            <TextField
              value={notes}
              onChangeText={setNotes}
              placeholder="anything specific…"
              multiline
              rows={2}
              ariaLabel={activeLogCopy.notesLabel}
              testID="active-notes"
            />
          </View>
        </View>

        {/* Sticky-feel bottom actions (in-flow; ScrollView pads enough below) */}
        <View
          style={{
            paddingHorizontal: density.headerPad + 8,
            paddingTop: density.headerPad * 1.4,
            gap: 10,
          }}
        >
          <Button
            label={activeLogCopy.saveCta}
            onPress={() => void handleSave(false)}
            variant="primary"
            size="lg"
            fullWidth
            loading={saving}
            testID="active-save"
          />
          <Button
            label="save & open companion mode →"
            onPress={() => void handleSave(true)}
            variant="ghost"
            size="md"
            fullWidth
            loading={saving}
            testID="active-companion"
          />
        </View>
      </ScrollView>
    </View>
  );
}
