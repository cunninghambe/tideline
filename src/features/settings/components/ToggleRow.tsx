import React from 'react';
import { View, Text, Switch } from 'react-native';
import { usePalette } from '@/theme/useTheme';

type ToggleRowProps = {
  label: string;
  caption?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  testID?: string;
};

/**
 * A settings row with an inline Switch toggle.
 */
export function ToggleRow({
  label,
  caption,
  value,
  onValueChange,
  disabled = false,
  testID,
}: ToggleRowProps) {
  const palette = usePalette();

  return (
    <View
      className="flex-row items-center justify-between py-4 px-4 bg-surface border-b border-divider"
      style={{ minHeight: 56 }}
      testID={testID}
      accessibilityLabel={label}
    >
      <View className="flex-1 gap-0.5 mr-4">
        <Text className="text-text-primary text-base font-medium">{label}</Text>
        {caption ? (
          <Text className="text-text-muted text-sm">{caption}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: palette.border, true: palette.accentPrimary }}
        thumbColor={palette.surfaceElevated}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value, disabled }}
      />
    </View>
  );
}
