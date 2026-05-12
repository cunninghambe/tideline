import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { usePalette } from '@/theme/useTheme';

type TextFieldProps = {
  value: string;
  onChangeText: (s: string) => void;
  label?: string;
  placeholder?: string;
  multiline?: boolean;
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
  maxLength,
  ariaLabel,
  testID,
}: TextFieldProps) {
  const palette = usePalette();
  const inputId = label ?? ariaLabel ?? 'text-field';

  return (
    <View className="gap-1.5">
      {label && (
        <Text
          className="text-text-secondary text-sm font-medium"
          nativeID={inputId}
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
        className={[
          'bg-surface border border-border rounded-xl px-4 text-text-primary text-base',
          multiline ? 'py-3 min-h-[88px] text-top' : 'py-3 h-12',
        ].join(' ')}
        style={{ textAlignVertical: multiline ? 'top' : 'auto' }}
      />
    </View>
  );
}
