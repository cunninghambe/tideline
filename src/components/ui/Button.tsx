import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { usePalette } from '@/theme/useTheme';
import { FONT_FAMILY } from '@/theme/fonts';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'duringPrimary';
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

const sizeStyles: Record<ButtonSize, { fontSize: number; paddingX: number; minHeight: number; iconSize: number; radius: number }> = {
  sm: { fontSize: 13, paddingX: 12, minHeight: 36, iconSize: 14, radius: 8 },
  md: { fontSize: 14, paddingX: 18, minHeight: 44, iconSize: 16, radius: 10 },
  lg: { fontSize: 16, paddingX: 22, minHeight: 56, iconSize: 18, radius: 12 },
  xl: { fontSize: 18, paddingX: 26, minHeight: 64, iconSize: 20, radius: 14 },
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
  const palette = usePalette();
  const sStyle = sizeStyles[size];
  const isDisabled = disabled || loading;

  let backgroundColor: string;
  let textColor: string;
  let borderColor: string;
  let textWeightFamily: string = FONT_FAMILY.sansMedium;

  switch (variant) {
    case 'primary':
      backgroundColor = palette.accentPrimary;
      textColor = palette.textInverse;
      borderColor = 'transparent';
      textWeightFamily = FONT_FAMILY.sansSemibold;
      break;
    case 'secondary':
      backgroundColor = palette.surface;
      textColor = palette.textPrimary;
      borderColor = palette.border;
      break;
    case 'ghost':
      backgroundColor = 'transparent';
      textColor = palette.accentPrimary;
      borderColor = 'transparent';
      break;
    case 'danger':
      backgroundColor = palette.severitySevere;
      textColor = palette.textInverse;
      borderColor = 'transparent';
      textWeightFamily = FONT_FAMILY.sansSemibold;
      break;
    case 'duringPrimary':
      // Muted button for in-pain surfaces — no accent loudness.
      backgroundColor = palette.surfaceElevated;
      textColor = palette.textPrimary;
      borderColor = palette.border;
      break;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
      style={{
        minHeight: sStyle.minHeight,
        paddingHorizontal: sStyle.paddingX,
        backgroundColor,
        borderRadius: sStyle.radius,
        borderWidth: 1,
        borderColor,
        opacity: isDisabled ? 0.4 : 1,
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon && (
            <Ionicons name={icon} size={sStyle.iconSize} color={textColor} />
          )}
          <Text
            style={{
              fontFamily: textWeightFamily,
              fontSize: sStyle.fontSize,
              color: textColor,
              textAlign: 'center',
            }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
