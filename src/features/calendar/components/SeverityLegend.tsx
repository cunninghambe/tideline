import React from 'react';
import { View, Text } from 'react-native';

import { usePalette } from '@/theme/useTheme';
import { useDensity, useCalendarLayout } from '@/theme/calendarTokenHooks';
import { FONT_FAMILY } from '@/theme/fonts';

export function SeverityLegend() {
  const palette = usePalette();
  const density = useDensity();
  const layout = useCalendarLayout();

  const items = [
    { label: 'mild', color: palette.severityMild, ring: false },
    { label: 'mod', color: palette.severityModerate, ring: false },
    { label: 'severe', color: palette.severitySevere, ring: false },
    { label: 'aura', color: palette.auraOnly, ring: true },
  ];

  const dotRadius = layout === 'constellation' ? 4 : 2;

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel="Severity legend: mild, moderate, severe, aura"
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: density.headerPad,
        paddingTop: 8,
        paddingBottom: 12,
      }}
    >
      {items.map((it) => (
        <View key={it.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: dotRadius,
              backgroundColor: it.ring ? 'transparent' : it.color,
              borderWidth: it.ring ? 1 : 0,
              borderColor: it.ring ? it.color : 'transparent',
            }}
          />
          <Text
            style={{
              fontSize: 10 * density.typeScale,
              fontFamily: FONT_FAMILY.mono,
              color: palette.textMuted,
              letterSpacing: 0.8,
            }}
          >
            {it.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
