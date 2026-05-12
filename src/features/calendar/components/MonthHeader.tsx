import React from 'react';
import { View, Text } from 'react-native';

import { usePalette } from '@/theme/useTheme';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function MonthHeader() {
  const palette = usePalette();

  return (
    <View style={{ flexDirection: 'row' }}>
      {WEEKDAY_LABELS.map((label) => (
        <View
          key={label}
          style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}
        >
          <Text
            style={{ color: palette.textMuted, fontSize: 12, fontWeight: '500' }}
            accessibilityElementsHidden
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}
