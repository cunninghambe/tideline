import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { usePalette } from '@/theme/useTheme';
import { useDensity } from '@/theme/calendarTokenHooks';
import { FONT_FAMILY } from '@/theme/fonts';

type MonthNavProps = {
  current: Date;
  onPrev: () => void;
  onNext: () => void;
  onTitlePress?: () => void;
};

/**
 * Centered Newsreader month title with chevron prev/next on either side.
 * Tapping the title opens the month picker (when wired).
 */
export function MonthNav({ current, onPrev, onNext, onTitlePress }: MonthNavProps) {
  const palette = usePalette();
  const density = useDensity();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: density.headerPad,
        paddingTop: density.headerPad,
        paddingBottom: density.headerPad / 2,
      }}
    >
      <Pressable
        onPress={onPrev}
        accessibilityRole="button"
        accessibilityLabel="Previous month"
        hitSlop={12}
        style={{ padding: 4 }}
      >
        <Ionicons name="chevron-back" size={20} color={palette.accentPrimary} />
      </Pressable>

      <Pressable
        onPress={onTitlePress}
        accessibilityRole={onTitlePress ? 'button' : 'text'}
        accessibilityLabel={`${format(current, 'MMMM yyyy')}${onTitlePress ? ', tap to change month' : ''}`}
        style={{ flex: 1, alignItems: 'center' }}
      >
        <Text
          style={{
            fontFamily: FONT_FAMILY.serifMedium,
            fontSize: 22 * density.typeScale,
            color: palette.textPrimary,
            letterSpacing: -0.22,
          }}
        >
          {format(current, 'MMMM')}{' '}
          <Text style={{ color: palette.textSecondary, fontFamily: FONT_FAMILY.serif }}>
            {format(current, 'yyyy')}
          </Text>
        </Text>
      </Pressable>

      <Pressable
        onPress={onNext}
        accessibilityRole="button"
        accessibilityLabel="Next month"
        hitSlop={12}
        style={{ padding: 4 }}
      >
        <Ionicons name="chevron-forward" size={20} color={palette.accentPrimary} />
      </Pressable>
    </View>
  );
}
