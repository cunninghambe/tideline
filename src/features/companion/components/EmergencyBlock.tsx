import React from 'react';
import { View, Text } from 'react-native';

import { companionCopy } from '@/copy';

/** Subtle bordered block for the "When to seek help" section. Not alarming. */
export function EmergencyBlock() {
  return (
    <View className="border border-border rounded-xl p-4 gap-3">
      <Text className="text-text-primary text-2xl font-semibold">
        {companionCopy.emergencyHeading}
      </Text>
      <Text className="text-text-secondary text-xl">
        {companionCopy.emergencyBody}
      </Text>
    </View>
  );
}
