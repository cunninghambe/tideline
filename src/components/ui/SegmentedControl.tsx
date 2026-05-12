import React from 'react';
import { View, Pressable, Text } from 'react-native';

type Option<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  testID?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  testID,
}: SegmentedControlProps<T>) {
  return (
    <View
      className="flex-row bg-surface border border-border rounded-xl overflow-hidden"
      testID={testID}
      accessibilityRole="radiogroup"
      accessibilityLabel={ariaLabel}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: isSelected }}
            style={{ minHeight: 44 }}
            className={[
              'flex-1 items-center justify-center py-2.5 px-3',
              isSelected ? 'bg-accent-primary' : 'bg-transparent',
            ].join(' ')}
          >
            <Text
              className={[
                'text-sm font-medium text-center',
                isSelected ? 'text-text-inverse' : 'text-text-primary',
              ].join(' ')}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
