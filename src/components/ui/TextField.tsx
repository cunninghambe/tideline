import React from 'react';
import { View, Text, TextInput } from 'react-native';

import { usePalette } from '@/theme/useTheme';
import { useDensity } from '@/theme/calendarTokenHooks';
import { FONT_FAMILY } from '@/theme/fonts';

type TextFieldProps = {
  value: string;
  onChangeText: (s: string) => void;
  label?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  ariaLabel?: string;
  testID?: string;
};

export function TextField({
  value,
  onChangeText,
  label,
  placeholder,
  multiline = false,
  rows = 3,
  maxLength,
  ariaLabel,
  testID,
}: TextFieldProps) {
  const palette = usePalette();
  const density = useDensity();
  const inputId = label ?? ariaLabel ?? 'text-field';
  const lineHeight = 14 * density.typeScale * 1.5;
  const minHeight = multiline ? rows * lineHeight + 24 : 44;

  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text
          nativeID={inputId}
          style={{
            color: palette.textSecondary,
            fontFamily: FONT_FAMILY.sansMedium,
            fontSize: 13 * density.typeScale,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.textMuted}
        multiline={multiline}
        maxLength={maxLength}
        testID={testID}
        accessibilityLabel={ariaLabel ?? label}
        accessibilityLabelledBy={label ? inputId : undefined}
        style={{
          backgroundColor: palette.surface,
          borderWidth: 1,
          borderColor: palette.border,
          borderRadius: density.cellRadius + 2,
          paddingHorizontal: 14,
          paddingVertical: 12,
          color: palette.textPrimary,
          fontFamily: FONT_FAMILY.sans,
          fontSize: 14 * density.typeScale,
          lineHeight,
          minHeight,
          textAlignVertical: multiline ? 'top' : 'auto',
        }}
      />
    </View>
  );
}
