import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: IoniconsName;
  fullWidth?: boolean;
  testID?: string;
};

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-accent-primary',
    text: 'text-text-inverse font-semibold',
  },
  secondary: {
    container: 'bg-surface border border-border',
    text: 'text-text-primary font-medium',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-accent-primary font-medium',
  },
  danger: {
    container: 'bg-severity-severe',
    text: 'text-text-inverse font-semibold',
  },
};

const sizeStyles: Record<ButtonSize, { container: string; text: string; iconSize: number; minHeight: number }> = {
  sm: { container: 'px-3 py-2 rounded-lg', text: 'text-sm', iconSize: 14, minHeight: 36 },
  md: { container: 'px-4 py-3 rounded-xl', text: 'text-base', iconSize: 16, minHeight: 44 },
  lg: { container: 'px-5 py-4 rounded-xl', text: 'text-lg', iconSize: 18, minHeight: 56 },
  xl: { container: 'px-6 py-4 rounded-2xl', text: 'text-lg', iconSize: 20, minHeight: 64 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  testID,
}: ButtonProps) {
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
      style={{ minHeight: sStyle.minHeight, opacity: isDisabled ? 0.5 : 1 }}
      className={[
        'flex-row items-center justify-center',
        vStyle.container,
        sStyle.container,
        fullWidth ? 'w-full' : 'self-start',
      ].join(' ')}
    >
      {loading ? (
        <ActivityIndicator size="small" className={vStyle.text} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon && (
            <Ionicons
              name={icon}
              size={sStyle.iconSize}
              className={vStyle.text}
            />
          )}
          <Text className={[vStyle.text, sStyle.text].join(' ')}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
