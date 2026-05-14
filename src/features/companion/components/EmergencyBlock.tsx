import React from 'react';
import { View, Text } from 'react-native';

import { usePalette } from '@/theme/useTheme';
import { useDensity } from '@/theme/calendarTokenHooks';
import { FONT_FAMILY } from '@/theme/fonts';
import { companionCopy } from '@/copy';
import { CompanionBlock } from './CompanionBlock';

/** "When to seek help" — subtle accent-bordered card, never alarming. */
export function EmergencyBlock() {
  const palette = usePalette();
  const density = useDensity();

  return (
    <CompanionBlock label={companionCopy.emergencyHeading.replace(/:$/, '')}>
      <View
        style={{
          padding: 14,
          backgroundColor: palette.surface,
          borderWidth: 1,
          borderColor: palette.border,
          borderLeftWidth: 2,
          borderLeftColor: palette.accentPrimary,
          borderRadius: 4,
        }}
      >
        <Text
          style={{
            fontFamily: FONT_FAMILY.sans,
            fontSize: 13 * density.typeScale,
            lineHeight: 20 * density.typeScale,
            color: palette.textPrimary,
          }}
        >
          {companionCopy.emergencyBody}
        </Text>
      </View>
    </CompanionBlock>
  );
}
