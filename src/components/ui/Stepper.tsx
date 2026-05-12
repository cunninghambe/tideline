import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePalette } from '@/theme/useTheme';

type StepperProps = {
  value: number;
  onValueChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  testID?: string;
};

export function Stepper({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  unit,
  testID,
}: StepperProps) {
  const palette = usePalette();
  const decrement = () => onValueChange(Math.max(min, value - step));
  const increment = () => onValueChange(Math.min(max, value + step));
  const canDecrement = value > min;
  const canIncrement = value < max;

  const displayValue = Number.isInteger(value) ? String(value) : value.toFixed(1);

  return (
    <View
      className="flex-row items-center gap-4"
      testID={testID}
      accessibilityRole="adjustable"
      accessibilityLabel={unit ? `${displayValue} ${unit}` : displayValue}
      accessibilityValue={{ min, max, now: value }}
      accessibilityHint="Double tap and swipe to adjust"
    >
      <Pressable
        onPress={decrement}
        disabled={!canDecrement}
        accessibilityRole="button"
        accessibilityLabel="Decrease"
        accessibilityState={{ disabled: !canDecrement }}
        style={{ minHeight: 44, minWidth: 44, opacity: canDecrement ? 1 : 0.3 }}
        className="items-center justify-center rounded-full bg-surface border border-border"
      >
        <Ionicons name="remove" size={20} color={palette.textPrimary} />
      </Pressable>

      <Text className="text-text-primary font-semibold text-xl min-w-[40px] text-center">
        {displayValue}
        {unit ? <Text className="text-text-secondary text-base"> {unit}</Text> : null}
      </Text>

      <Pressable
        onPress={increment}
        disabled={!canIncrement}
        accessibilityRole="button"
        accessibilityLabel="Increase"
        accessibilityState={{ disabled: !canIncrement }}
        style={{ minHeight: 44, minWidth: 44, opacity: canIncrement ? 1 : 0.3 }}
        className="items-center justify-center rounded-full bg-surface border border-border"
      >
        <Ionicons name="add" size={20} color={palette.textPrimary} />
      </Pressable>
    </View>
  );
}
