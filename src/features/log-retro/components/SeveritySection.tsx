import React from 'react';
import { View, Text, Switch } from 'react-native';

import { Slider } from '@/components/ui/Slider';
import { Chip } from '@/components/ui/Chip';
import { SYMPTOM_CHIPS_UI } from '@/copy';
import type { SymptomTag } from '@/db/schema/migraines';
import { toggleInList } from '../logic';

type SeveritySectionProps = {
  peakSeverity: number;
  auraOnly: boolean;
  symptomTags: SymptomTag[];
  onSeverity: (n: number) => void;
  onAuraOnly: (v: boolean) => void;
  onSymptomTags: (tags: SymptomTag[]) => void;
};

export function SeveritySection({
  peakSeverity,
  auraOnly,
  symptomTags,
  onSeverity,
  onAuraOnly,
  onSymptomTags,
}: SeveritySectionProps) {
  return (
    <View className="gap-4">
      <Text className="text-text-primary text-xl font-semibold">Severity + symptoms</Text>

      <View className="gap-3">
        <Text className="text-text-secondary text-sm font-medium">
          How bad was it?
        </Text>
        <Slider
          value={auraOnly ? 1 : peakSeverity}
          onValueChange={onSeverity}
          min={1}
          max={10}
          ariaLabel="Peak severity"
          testID="severity-slider"
        />
        <View className="flex-row items-center justify-between">
          <Text className="text-text-primary text-base">Aura only — no pain</Text>
          <Switch
            value={auraOnly}
            onValueChange={onAuraOnly}
            accessibilityLabel="Aura only, no pain"
            accessibilityRole="switch"
          />
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-text-secondary text-sm font-medium">
          Feeling? (tap any that apply)
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {SYMPTOM_CHIPS_UI.map((chip) => (
            <Chip
              key={chip.value}
              label={chip.label}
              selected={symptomTags.includes(chip.value)}
              onPress={() =>
                onSymptomTags(
                  toggleInList(symptomTags, chip.value) as SymptomTag[],
                )
              }
              testID={`symptom-chip-${chip.value}`}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
