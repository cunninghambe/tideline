import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { usePalette } from '@/theme/useTheme';
import { useDensity } from '@/theme/calendarTokenHooks';
import { FONT_FAMILY } from '@/theme/fonts';

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
  const density = useDensity();
  const decrement = () => onValueChange(Math.max(min, value - step));
  const increment = () => onValueChange(Math.min(max, value + step));
  const canDecrement = value > min;
  const canIncrement = value < max;

  const displayValue = Number.isInteger(value) ? String(value) : value.toFixed(1);

  const buttonStyle = {
    width: 44,
    height: 44,
    borderRadius: density.cellRadius,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  return (
    <View
      testID={testID}
      accessibilityRole="adjustable"
      accessibilityLabel={unit ? `${displayValue} ${unit}` : displayValue}
      accessibilityValue={{ min, max, now: value }}
      accessibilityHint="Double tap and swipe to adjust"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
    >
      <Pressable
        onPress={decrement}
        disabled={!canDecrement}
        accessibilityRole="button"
        accessibilityLabel="Decrease"
        accessibilityState={{ disabled: !canDecrement }}
        style={{ ...buttonStyle, opacity: canDecrement ? 1 : 0.3 }}
      >
        <Ionicons name="remove" size={20} color={palette.textPrimary} />
      </Pressable>

      <View style={{ minWidth: 56, alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: FONT_FAMILY.monoMedium,
            fontSize: 17 * density.typeScale,
            color: palette.textPrimary,
          }}
        >
          {displayValue}
          {unit ? (
            <Text
              style={{
                fontFamily: FONT_FAMILY.mono,
                fontSize: 12 * density.typeScale,
                color: palette.textMuted,
              }}
            >
              {' '}
              {unit}
            </Text>
          ) : null}
        </Text>
      </View>

      <Pressable
        onPress={increment}
        disabled={!canIncrement}
        accessibilityRole="button"
        accessibilityLabel="Increase"
        accessibilityState={{ disabled: !canIncrement }}
        style={{ ...buttonStyle, opacity: canIncrement ? 1 : 0.3 }}
      >
        <Ionicons name="add" size={20} color={palette.textPrimary} />
      </Pressable>
    </View>
  );
}
