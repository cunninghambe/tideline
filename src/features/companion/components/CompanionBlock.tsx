import React from 'react';
import { View } from 'react-native';

import { usePalette } from '@/theme/useTheme';
import { SectionLabel } from '@/components/ui/SectionLabel';

type Props = {
  label: string;
  children: React.ReactNode;
};

/** A labelled block on the companion surface. Mono uppercase label + body. */
export function CompanionBlock({ label, children }: Props) {
  return (
    <View style={{ marginBottom: 4 }}>
      <SectionLabel style={{ marginBottom: 12 }}>{label}</SectionLabel>
      {children}
    </View>
  );
}

/** Thin 32px-wide centred divider that visually breaks blocks. */
export function CompanionDivider() {
  const palette = usePalette();
  return (
    <View
      accessibilityElementsHidden
      style={{
        width: 32,
        height: 1,
        marginVertical: 28,
        alignSelf: 'center',
        backgroundColor: palette.divider,
      }}
    />
  );
}
