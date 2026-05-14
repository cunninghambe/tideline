import React from 'react';
import { Pressable, Text } from 'react-native';

import { usePalette } from '@/theme/useTheme';
import { useDensity } from '@/theme/calendarTokenHooks';
import { FONT_FAMILY } from '@/theme/fonts';

type ChipVariant = 'default' | 'severity-severe' | 'severity-moderate' | 'severity-mild';
type ChipSize = 'sm' | 'md';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: ChipVariant;
  size?: ChipSize;
  /** Use Geist Mono for the label (food tags, codes, numerics). */
  mono?: boolean;
  testID?: string;
};

export function Chip({
  label,
  selected,
  onPress,
  variant = 'default',
  size = 'md',
  mono = false,
  testID,
}: ChipProps) {
  const palette = usePalette();
  const density = useDensity();

  const selectedBg =
    variant === 'severity-severe'
      ? palette.severitySevere
      : variant === 'severity-moderate'
        ? palette.severityModerate
        : variant === 'severity-mild'
          ? palette.severityMild
          : palette.accentPrimary;

  const backgroundColor = selected ? selectedBg : palette.surface;
  const borderColor = selected ? selectedBg : palette.border;
  const textColor = selected ? palette.textInverse : palette.textPrimary;

  const fontSize = (size === 'sm' ? 12 : 13) * density.typeScale;
  const minHeight = (size === 'sm' ? 32 : 40) * density.typeScale;
  const paddingH = size === 'sm' ? 10 : 14;

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      style={{
        minHeight,
        paddingHorizontal: paddingH,
        borderRadius: 999,
        borderWidth: 1,
        borderColor,
        backgroundColor,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: mono
            ? FONT_FAMILY.mono
            : selected
              ? FONT_FAMILY.sansMedium
              : FONT_FAMILY.sans,
          fontSize,
          color: textColor,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
