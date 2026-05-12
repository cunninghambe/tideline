import React from 'react';
import { Pressable, Text } from 'react-native';

type ChipVariant = 'default' | 'severity-severe' | 'severity-moderate' | 'severity-mild';
type ChipSize = 'sm' | 'md';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: ChipVariant;
  size?: ChipSize;
  testID?: string;
};

const variantSelectedBg: Record<ChipVariant, string> = {
  default: 'bg-accent-primary',
  'severity-severe': 'bg-severity-severe',
  'severity-moderate': 'bg-severity-moderate',
  'severity-mild': 'bg-severity-mild',
};

export function Chip({
  label,
  selected,
  onPress,
  variant = 'default',
  size = 'md',
  testID,
}: ChipProps) {
  const bgClass = selected ? variantSelectedBg[variant] : 'bg-surface border border-border';
  const textClass = selected ? 'text-text-inverse' : 'text-text-primary';
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5 text-base';

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      style={{ minHeight: 40 }}
      className={['rounded-full flex-row items-center justify-center', bgClass].join(' ')}
    >
      <Text className={[textClass, sizeClass, 'font-medium'].join(' ')}>
        {label}
      </Text>
    </Pressable>
  );
}
