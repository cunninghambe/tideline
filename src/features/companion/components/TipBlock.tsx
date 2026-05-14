import React from 'react';
import { View, Text } from 'react-native';

import { usePalette } from '@/theme/useTheme';
import { useDensity } from '@/theme/calendarTokenHooks';
import { FONT_FAMILY } from '@/theme/fonts';
import { companionCopy } from '@/copy';
import type { HelperTag } from '@/db/schema/migraines';
import { CompanionBlock, CompanionDivider } from './CompanionBlock';

type HelperSummary = { tag: HelperTag; count: number };

type Props = {
  helpers: HelperSummary[];
  completedCount: number;
};

function helperHeadline(h: HelperSummary): string {
  return h.tag.replace(/_/g, ' ');
}

function helperDetail(h: HelperSummary): string {
  return `worked ${h.count} ${h.count === 1 ? 'time' : 'times'} for you`;
}

export function TipBlock({ helpers, completedCount }: Props) {
  const palette = usePalette();
  const density = useDensity();
  const showPersonalized = completedCount >= 3 && helpers.length > 0;

  return (
    <View>
      <CompanionBlock label="Things that have helped you before">
        {showPersonalized ? (
          helpers.map((h) => (
            <View key={h.tag} style={{ marginBottom: 10 }}>
              <Text
                style={{
                  fontFamily: FONT_FAMILY.sansMedium,
                  fontSize: 16 * density.typeScale,
                  lineHeight: 24 * density.typeScale,
                  color: palette.textPrimary,
                }}
              >
                {`· ${helperHeadline(h)}`}
              </Text>
              <Text
                style={{
                  marginLeft: 16,
                  fontFamily: FONT_FAMILY.sans,
                  fontSize: 13 * density.typeScale,
                  lineHeight: 20 * density.typeScale,
                  color: palette.textSecondary,
                }}
              >
                {helperDetail(h)}
              </Text>
            </View>
          ))
        ) : (
          <Text
            style={{
              fontFamily: FONT_FAMILY.sans,
              fontStyle: 'italic',
              fontSize: 15 * density.typeScale,
              lineHeight: 24 * density.typeScale,
              color: palette.textSecondary,
            }}
          >
            {companionCopy.emptyHelpedHistory}
          </Text>
        )}
      </CompanionBlock>

      <CompanionDivider />

      <CompanionBlock label="General things to try">
        {companionCopy.generalTips.map((tip) => (
          <Text
            key={tip}
            style={{
              fontFamily: FONT_FAMILY.sans,
              fontSize: 15 * density.typeScale,
              lineHeight: 23 * density.typeScale,
              color: palette.textPrimary,
              opacity: 0.92,
              marginBottom: 10,
            }}
          >
            {`· ${tip}`}
          </Text>
        ))}
      </CompanionBlock>
    </View>
  );
}
