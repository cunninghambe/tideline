import React from 'react';
import { View, Text } from 'react-native';
import RNSlider from '@react-native-community/slider';
import { usePalette } from '@/theme/useTheme';

type SliderProps = {
  value: number;
  onValueChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  showValue?: boolean;
  ariaLabel: string;
  testID?: string;
};

export function Slider({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  showValue = true,
  ariaLabel,
  testID,
}: SliderProps) {
  const palette = usePalette();
  return (
    <View className="flex-row items-center gap-3" testID={testID}>
      <View className="flex-1">
        <RNSlider
          value={value}
          onValueChange={onValueChange}
          minimumValue={min}
          maximumValue={max}
          step={step}
          accessible
          accessibilityLabel={ariaLabel}
          accessibilityValue={{ min, max, now: value }}
          minimumTrackTintColor={palette.accentPrimary}
          maximumTrackTintColor={palette.border}
          thumbTintColor={palette.accentPrimary}
          style={{ height: 32 }}
        />
      </View>
      {showValue && (
        <Text
          className="text-text-primary font-semibold text-xl w-8 text-right"
          accessibilityElementsHidden
        >
          {value}
        </Text>
      )}
    </View>
  );
}
