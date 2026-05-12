import React from 'react';
import { View } from 'react-native';

import type { PaletteTokens } from '@/theme/palettes';

type MiniCalendarPreviewProps = {
  palette: PaletteTokens;
  testID?: string;
};

/**
 * 4-row × 7-column grid of small squares previewing a palette.
 * Three cells are coloured with severity colours so the user can
 * see how their palette will look on the calendar.
 */
export function MiniCalendarPreview({ palette, testID }: MiniCalendarPreviewProps) {
  const ROWS = 4;
  const COLS = 7;
  const CELL_SIZE = 10;
  const GAP = 2;

  // Cells to highlight: [row, col] → colour
  const highlights: Record<string, string> = {
    '0,2': palette.severitySevere,
    '1,5': palette.severityModerate,
    '3,1': palette.severityMild,
  };

  const rows = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      const key = `${r},${c}`;
      return { key: `${r}-${c}`, color: highlights[key] ?? palette.surface };
    }),
  );

  return (
    <View
      testID={testID}
      style={{ gap: GAP }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: GAP }}>
          {row.map((cell) => (
            <View
              key={cell.key}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                borderRadius: 2,
                backgroundColor: cell.color,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
