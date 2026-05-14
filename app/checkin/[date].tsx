import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { format, parseISO } from 'date-fns';

import { Stepper } from '@/components/ui/Stepper';
import { Slider } from '@/components/ui/Slider';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { FONT_FAMILY } from '@/theme/fonts';
import { checkinCopy } from '@/copy';
import { useSetting } from '@/features/settings/store';
import { useCheckinForDate, useUpsertCheckin } from '@/features/checkins/hooks';
import { FoodTagPicker } from '@/features/checkins/components/FoodTagPicker';
import * as cycleRepo from '@/features/cycle/repo';

type CycleOption = 'period_start' | 'period_end' | 'no_change';

const CYCLE_OPTIONS: { value: CycleOption; label: string }[] =
  checkinCopy.cycle.options.map((o) => ({ value: o.value as CycleOption, label: o.label }));

const QUALITY_OPTIONS = checkinCopy.sleep.qualityOptions.map((o) => ({
  value: String(o.value),
  label: o.label,
}));

function SectionHeading({ text }: { text: string }) {
  return (
    <View accessibilityRole="header">
      <Text
        style={{ fontFamily: FONT_FAMILY.serifMedium, letterSpacing: -0.2 }}
        className="text-text-primary text-xl"
      >
        {text}
      </Text>
    </View>
  );
}

function SleepSection({
  hours,
  quality,
  onHoursChange,
  onQualityChange,
}: {
  hours: number;
  quality: string;
  onHoursChange: (v: number) => void;
  onQualityChange: (v: string) => void;
}) {
  return (
    <View className="gap-4">
      <SectionHeading text={checkinCopy.sleep.label} />
      <View className="gap-3">
        <SectionLabel>{checkinCopy.sleep.hoursLabel}</SectionLabel>
        <Stepper
          value={hours}
          onValueChange={onHoursChange}
          min={0}
          max={14}
          step={0.5}
          unit="h"
          testID="sleep-hours-stepper"
        />
      </View>
      <View className="gap-3">
        <SectionLabel>{checkinCopy.sleep.qualityLabel}</SectionLabel>
        <SegmentedControl
          options={QUALITY_OPTIONS}
          value={quality}
          onChange={onQualityChange}
          ariaLabel={checkinCopy.sleep.qualityLabel}
          testID="sleep-quality-control"
        />
      </View>
    </View>
  );
}

export default function CheckinScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { data: existing, isLoading } = useCheckinForDate(date ?? '');
  const upsertCheckin = useUpsertCheckin(date ?? '');
  const cycleEnabled = useSetting('cycle.tracking_enabled', 'true') === 'true';

  const [initialized, setInitialized] = useState(false);
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState('');
  const [stressLevel, setStressLevel] = useState(3);
  const [waterCups, setWaterCups] = useState(0);
  const [foodTagIds, setFoodTagIds] = useState<string[]>([]);
  const [caffeineCups, setCaffeineCups] = useState(0);
  const [cycleOption, setCycleOption] = useState<CycleOption>('no_change');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialized || isLoading) return;
    setInitialized(true);
    if (!existing) return;
    if (existing.sleepHours !== null) setSleepHours(existing.sleepHours);
    if (existing.sleepQuality !== null) setSleepQuality(String(existing.sleepQuality));
    if (existing.stressLevel !== null) setStressLevel(existing.stressLevel);
    if (existing.waterCups !== null) setWaterCups(existing.waterCups);
    if (existing.foodTagIds.length > 0) setFoodTagIds(existing.foodTagIds);
    if (existing.caffeineCups !== null) setCaffeineCups(existing.caffeineCups);
    if (existing.notes) setNotes(existing.notes);
  }, [existing, isLoading, initialized]);

  const formattedDate = date ? format(parseISO(date), 'EEEE, MMMM d') : '';

  function handleSave() {
    if (!date) return;

    upsertCheckin.mutate(
      {
        foodTagIds,
        sleepHours,
        sleepQuality: sleepQuality ? Number(sleepQuality) : null,
        stressLevel,
        waterCups,
        caffeineCups,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          if (cycleEnabled && cycleOption !== 'no_change') {
            cycleRepo.insert({ date, eventType: cycleOption });
          }
          router.back();
        },
        onError: (e) => {
          Alert.alert(
            'Could not save',
            e instanceof Error ? e.message : 'Unknown error',
          );
        },
      },
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <Text className="text-text-secondary">Loading…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 128, gap: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={{ gap: 4 }}>
          <Text
            style={{ fontFamily: FONT_FAMILY.serifMedium, letterSpacing: -0.4 }}
            className="text-text-primary text-3xl"
          >
            {checkinCopy.title}
          </Text>
          <Text className="text-text-secondary text-base italic">{formattedDate}</Text>
        </View>

        {/* Sleep */}
        <SleepSection
          hours={sleepHours}
          quality={sleepQuality}
          onHoursChange={setSleepHours}
          onQualityChange={setSleepQuality}
        />

        {/* Stress */}
        <View style={{ gap: 12 }}>
          <SectionHeading text={checkinCopy.stress.label} />
          <Text className="text-text-secondary text-sm">{checkinCopy.stress.helper}</Text>
          <Slider
            value={stressLevel}
            onValueChange={setStressLevel}
            min={1}
            max={5}
            ariaLabel="Stress level"
            testID="stress-slider"
          />
        </View>

        {/* Water */}
        <View style={{ gap: 12 }}>
          <SectionHeading text={checkinCopy.water.label} />
          <Stepper
            value={waterCups}
            onValueChange={setWaterCups}
            min={0}
            max={20}
            unit={checkinCopy.water.unit}
            testID="water-stepper"
          />
        </View>

        {/* Food */}
        <View style={{ gap: 12 }}>
          <SectionHeading text={checkinCopy.food.label} />
          <FoodTagPicker
            selectedIds={foodTagIds}
            onChange={setFoodTagIds}
            addCta={checkinCopy.food.addCta}
          />
        </View>

        {/* Caffeine */}
        <View style={{ gap: 12 }}>
          <SectionHeading text={checkinCopy.caffeine.label} />
          <Stepper
            value={caffeineCups}
            onValueChange={setCaffeineCups}
            min={0}
            max={20}
            unit={checkinCopy.caffeine.unit}
            testID="caffeine-stepper"
          />
        </View>

        {/* Cycle — only when tracking enabled */}
        {cycleEnabled && (
          <View style={{ gap: 12 }}>
            <SectionHeading text={checkinCopy.cycle.label} />
            <SegmentedControl
              options={CYCLE_OPTIONS}
              value={cycleOption}
              onChange={setCycleOption}
              ariaLabel={checkinCopy.cycle.label}
              testID="cycle-control"
            />
          </View>
        )}

        {/* Notes */}
        <View style={{ gap: 12 }}>
          <SectionHeading text={checkinCopy.notes.label} />
          <TextField
            value={notes}
            onChangeText={setNotes}
            placeholder={checkinCopy.notes.placeholder}
            multiline
            ariaLabel={checkinCopy.notes.label}
            testID="notes-field"
          />
        </View>
      </ScrollView>

      {/* Sticky save button */}
      <View
        className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-bg border-t border-divider"
      >
        <Button
          label={checkinCopy.saveCta}
          onPress={handleSave}
          variant="primary"
          size="lg"
          loading={upsertCheckin.isPending}
          fullWidth
          testID="save-button"
        />
      </View>
    </View>
  );
}
