import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNowStrict } from 'date-fns';

import { Card } from '@/components/ui/Card';
import type { MedicationRow } from '@/types';

type MedClass = MedicationRow['medicationClass'];

const CLASS_LABELS: Record<MedClass, string> = {
  nsaid: 'NSAID',
  triptan: 'Triptan',
  anticonvulsant: 'Anticonvulsant',
  beta_blocker: 'Beta-blocker',
  cgrp: 'CGRP',
  antiemetic: 'Anti-emetic',
  opioid: 'Opioid',
  ergotamine: 'Ergotamine',
  other: 'Other',
};

type MedRowProps = {
  med: MedicationRow;
  lastTakenAt: Date | null;
  onPress: () => void;
  testID?: string;
};

function formatLastTaken(date: Date | null): string {
  if (!date) return 'Never';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function MedRow({ med, lastTakenAt, onPress, testID }: MedRowProps) {
  const isLow =
    med.pillsRemaining != null && med.pillsRemaining <= med.refillThreshold;

  return (
    <Card onPress={onPress} testID={testID} padding="md">
      <View className="flex-row items-start justify-between gap-3">
        {/* Left: name + class */}
        <View className="flex-1 gap-1">
          <Text
            className="text-text-primary text-lg font-semibold"
            accessibilityRole="text"
          >
            {med.brandName}
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="bg-surface border border-border rounded-full px-2.5 py-0.5">
              <Text className="text-text-secondary text-xs font-medium">
                {CLASS_LABELS[med.medicationClass]}
              </Text>
            </View>
            <Text className="text-text-muted text-xs capitalize">
              {med.type}
            </Text>
          </View>
        </View>

        {/* Right: doses left + last taken */}
        <View className="items-end gap-1">
          {med.pillsRemaining != null ? (
            <View className="flex-row items-center gap-1">
              {isLow && (
                <Ionicons
                  name="warning-outline"
                  size={14}
                  color="orange"
                  accessibilityLabel="Low supply warning"
                />
              )}
              <Text
                className={[
                  'text-sm font-medium',
                  isLow ? 'text-[orange]' : 'text-text-secondary',
                ].join(' ')}
                accessibilityLabel={`${med.pillsRemaining} pills remaining${isLow ? ', low supply' : ''}`}
              >
                {med.pillsRemaining} left
              </Text>
            </View>
          ) : (
            <Text className="text-text-muted text-sm">— left</Text>
          )}
          <Text className="text-text-muted text-xs">
            {formatLastTaken(lastTakenAt)}
          </Text>
        </View>
      </View>
    </Card>
  );
}
