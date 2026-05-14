import React from 'react';
import { View, Text, Pressable } from 'react-native';

import { usePalette } from '@/theme/useTheme';
import { useDensity } from '@/theme/calendarTokenHooks';
import { FONT_FAMILY } from '@/theme/fonts';

type BrandHeaderProps = {
  onSettingsPress: () => void;
};

/**
 * The `tideline.` wordmark with the trailing dot painted in the active accent,
 * paired with a Geist Mono uppercase SETTINGS text button.
 */
export function BrandHeader({ onSettingsPress }: BrandHeaderProps) {
  const palette = usePalette();
  const density = useDensity();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingHorizontal: density.headerPad,
        paddingTop: density.headerPad,
      }}
    >
      <Text
        accessibilityRole="header"
        accessibilityLabel="tideline"
        style={{
          fontFamily: FONT_FAMILY.serifMedium,
          fontSize: 17,
          color: palette.textPrimary,
          letterSpacing: -0.17,
        }}
      >
        tideline
        <Text style={{ color: palette.accentPrimary }}>.</Text>
      </Text>

      <Pressable
        onPress={onSettingsPress}
        accessibilityRole="button"
        accessibilityLabel="Settings"
        hitSlop={8}
      >
        <Text
          style={{
            fontFamily: FONT_FAMILY.mono,
            fontSize: 12,
            color: palette.textSecondary,
            letterSpacing: 1.8,
          }}
        >
          SETTINGS
        </Text>
      </Pressable>
    </View>
  );
}
