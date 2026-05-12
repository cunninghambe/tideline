import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Stepper } from '@/components/ui/Stepper';
import { insert } from '@/features/meds/repo';
import { MEDS_QUERY_KEY } from '@/features/meds/hooks';
import type { MedClass } from '@/types';

const CLASS_OPTIONS: { value: MedClass; label: string }[] = [
  { value: 'nsaid', label: 'NSAID' },
  { value: 'triptan', label: 'Triptan' },
  { value: 'anticonvulsant', label: 'Anticonvulsant' },
  { value: 'beta_blocker', label: 'Beta-blocker' },
  { value: 'cgrp', label: 'CGRP' },
  { value: 'antiemetic', label: 'Anti-emetic' },
  { value: 'opioid', label: 'Opioid' },
  { value: 'ergotamine', label: 'Ergotamine' },
  { value: 'other', label: 'Other' },
];

const TYPE_OPTIONS: { value: 'rescue' | 'preventive'; label: string }[] = [
  { value: 'rescue', label: 'Rescue' },
  { value: 'preventive', label: 'Preventive' },
];

export default function MedsAddScreen() {
  const queryClient = useQueryClient();
  const [brandName, setBrandName] = useState('');
  const [medClass, setMedClass] = useState<MedClass>('nsaid');
  const [defaultDose, setDefaultDose] = useState('');
  const [type, setType] = useState<'rescue' | 'preventive'>('rescue');
  const [pillsRemaining, setPillsRemaining] = useState(30);
  const [refillThreshold, setRefillThreshold] = useState(7);
  const [saving, setSaving] = useState(false);

  function handleCancel() {
    router.back();
  }

  async function handleSave() {
    if (!brandName.trim()) {
      Alert.alert('Brand name required', 'Please enter the medication name.');
      return;
    }
    if (!defaultDose.trim()) {
      Alert.alert('Default dose required', 'Please enter a default dose (e.g. "50mg").');
      return;
    }

    setSaving(true);
    const result = insert({
      brandName: brandName.trim(),
      medicationClass: medClass,
      defaultDose: defaultDose.trim(),
      type,
      pillsRemaining,
      refillThreshold,
      active: true,
    });
    setSaving(false);

    if (!result.ok) {
      Alert.alert('Error', 'Could not save medication. Please try again.');
      return;
    }

    await queryClient.invalidateQueries({ queryKey: MEDS_QUERY_KEY });
    router.back();
  }

  return (
    <View className="flex-1 bg-bg">
      {/* Nav bar cancel button */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
        <Pressable
          onPress={handleCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          style={{ minHeight: 44, minWidth: 44, justifyContent: 'center' }}
        >
          <Text className="text-accent-primary text-base font-medium">Cancel</Text>
        </Pressable>
        <Text
          className="text-text-primary text-xl font-semibold"
          accessibilityRole="header"
        >
          Add medication
        </Text>
        {/* Spacer to centre heading */}
        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, gap: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand name */}
        <TextField
          label="Brand name"
          value={brandName}
          onChangeText={setBrandName}
          placeholder="e.g. Sumatriptan 50mg"
          ariaLabel="Brand name"
          testID="brand-name-input"
        />

        {/* Class picker */}
        <View className="gap-1.5">
          <Text className="text-text-secondary text-sm font-medium">Class</Text>
          <ClassPicker value={medClass} onChange={setMedClass} />
        </View>

        {/* Default dose */}
        <TextField
          label="Default dose"
          value={defaultDose}
          onChangeText={setDefaultDose}
          placeholder="e.g. 50mg"
          ariaLabel="Default dose"
          testID="default-dose-input"
        />

        {/* Type */}
        <View className="gap-1.5">
          <Text className="text-text-secondary text-sm font-medium">Type</Text>
          <SegmentedControl
            options={TYPE_OPTIONS}
            value={type}
            onChange={setType}
            ariaLabel="Medication type"
            testID="type-control"
          />
        </View>

        {/* Pills in current bottle */}
        <View className="gap-1.5">
          <Text className="text-text-secondary text-sm font-medium">Pills in current bottle</Text>
          <Stepper
            value={pillsRemaining}
            onValueChange={setPillsRemaining}
            min={0}
            max={999}
            testID="pills-stepper"
          />
        </View>

        {/* Refill threshold */}
        <View className="gap-1.5">
          <Text className="text-text-secondary text-sm font-medium">Refill reminder when below</Text>
          <Stepper
            value={refillThreshold}
            onValueChange={setRefillThreshold}
            min={1}
            max={60}
            testID="threshold-stepper"
          />
        </View>

        {/* Save button */}
        <Button
          label="Save"
          onPress={handleSave}
          size="lg"
          fullWidth
          loading={saving}
          testID="save-button"
        />
      </ScrollView>
    </View>
  );
}

/** Scrollable pill row for the 9 med classes. */
function ClassPicker({
  value,
  onChange,
}: {
  value: MedClass;
  onChange: (c: MedClass) => void;
}) {
  return (
    <View
      className="flex-row flex-wrap gap-2"
      accessibilityRole="radiogroup"
      accessibilityLabel="Medication class"
    >
      {CLASS_OPTIONS.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="radio"
            accessibilityLabel={opt.label}
            accessibilityState={{ checked: isSelected }}
            style={{ minHeight: 40 }}
            className={[
              'px-4 rounded-full border items-center justify-center',
              isSelected
                ? 'bg-accent-primary border-accent-primary'
                : 'bg-surface border-border',
            ].join(' ')}
          >
            <Text
              className={[
                'text-sm font-medium',
                isSelected ? 'text-text-inverse' : 'text-text-primary',
              ].join(' ')}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
