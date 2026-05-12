import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type SettingsRowProps = {
  label: string;
  caption?: string;
  badge?: string;
  onPress?: () => void;
  /** When true renders the label in danger colour (red) */
  danger?: boolean;
  testID?: string;
};

/**
 * A single tappable row for the settings menu.
 * Shows label + optional caption/badge, chevron when onPress is provided.
 */
export function SettingsRow({
  label,
  caption,
  badge,
  onPress,
  danger = false,
  testID,
}: SettingsRowProps) {
  const labelClass = danger
    ? 'text-severity-severe text-base font-medium'
    : 'text-text-primary text-base font-medium';

  const content = (
    <View
      className="flex-row items-center justify-between py-4 px-4 bg-surface border-b border-divider"
      style={{ minHeight: 56 }}
    >
      <View className="flex-1 gap-0.5">
        <Text className={labelClass}>{label}</Text>
        {caption ? (
          <Text className="text-text-muted text-sm">{caption}</Text>
        ) : null}
      </View>
      <View className="flex-row items-center gap-2">
        {badge ? (
          <Text className="text-text-secondary text-sm font-medium">{badge}</Text>
        ) : null}
        {onPress ? (
          <Ionicons
            name="chevron-forward"
            size={16}
            className="text-text-muted"
          />
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={{ minHeight: 56 }}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View testID={testID} accessibilityLabel={label}>
      {content}
    </View>
  );
}
