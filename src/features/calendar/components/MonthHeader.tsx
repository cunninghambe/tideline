import React from 'react';
import { View, Text } from 'react-native';

import { usePalette } from '@/theme/useTheme';
import { useDensity } from '@/theme/calendarTokenHooks';
import { FONT_FAMILY } from '@/theme/fonts';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

type MonthHeaderProps = {
  /** When true (Tidemark layout), the header is suppressed entirely. */
  suppress?: boolean;
};

export function MonthHeader({ suppress = false }: MonthHeaderProps) {
  const palette = usePalette();
  const density = useDensity();

  if (suppress) return null;

  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: density.headerPad - 4, paddingTop: 4, paddingBottom: 8 }}>
      {WEEKDAY_LABELS.map((label, idx) => (
        <View key={idx} style={{ flex: 1, alignItems: 'center' }}>
          <Text
            style={{
              color: palette.textMuted,
              fontSize: 10 * density.typeScale,
              fontFamily: FONT_FAMILY.monoMedium,
              letterSpacing: 1.6,
            }}
            accessibilityElementsHidden
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}
