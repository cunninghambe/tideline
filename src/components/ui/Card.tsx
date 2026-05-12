import React from 'react';
import { Pressable, View } from 'react-native';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

type CardProps = {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated';
  padding?: CardPadding;
  testID?: string;
};

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  children,
  onPress,
  variant = 'default',
  padding = 'md',
  testID,
}: CardProps) {
  const bgClass = variant === 'elevated' ? 'bg-surface-elevated' : 'bg-surface';
  const className = [
    bgClass,
    'rounded-2xl border border-border',
    paddingClasses[padding],
  ].join(' ');

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        testID={testID}
        accessibilityRole="button"
        className={className}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View testID={testID} className={className}>
      {children}
    </View>
  );
}
