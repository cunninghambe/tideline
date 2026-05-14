import React from 'react';
import { Text, type TextProps } from 'react-native';

import { usePalette } from '@/theme/useTheme';
import { useDensity } from '@/theme/calendarTokenHooks';
import { FONT_FAMILY } from '@/theme/fonts';

type SectionLabelProps = TextProps & {
  children: React.ReactNode;
  testID?: string;
};

/**
 * Mono uppercase tiny label. Used as section heading on forms (e.g. "How bad?",
 * "Feeling?", "Right now"). Matches the design system's `TLabel` primitive.
 */
export function SectionLabel({ children, style, testID, ...rest }: SectionLabelProps) {
  const palette = usePalette();
  const density = useDensity();

  return (
    <Text
      testID={testID}
      style={[
        {
          fontFamily: FONT_FAMILY.mono,
          fontSize: 10 * density.typeScale,
          letterSpacing: 1.6,
          textTransform: 'uppercase',
          color: palette.textMuted,
          marginBottom: 10,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
