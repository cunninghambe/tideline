import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AppFallbackBannerProps = {
  message: string;
  testID?: string;
};

/**
 * In-app banner shown when running in Expo Go where scheduled notifications
 * may not fire (spec-gap G11). Dismissable by the user.
 */
export function AppFallbackBanner({ message, testID }: AppFallbackBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <View
      testID={testID}
      className="flex-row items-center gap-3 bg-surface border border-border rounded-xl p-4 mx-4"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Ionicons name="notifications-outline" size={20} color="var(--accent-primary)" />
      <Text className="flex-1 text-text-primary text-sm">{message}</Text>
      <Pressable
        onPress={() => setDismissed(true)}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
        hitSlop={12}
      >
        <Ionicons name="close" size={18} color="var(--text-muted)" />
      </Pressable>
    </View>
  );
}
