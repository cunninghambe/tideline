import React from 'react';
import { View } from 'react-native';
import { vars } from 'nativewind';

import { useThemeStore } from '@/stores/useThemeStore';
import { PALETTES, type PaletteTokens } from './palettes';

function paletteToVars(p: PaletteTokens): Record<string, string> {
  return {
    '--bg': p.bg,
    '--surface': p.surface,
    '--surface-elevated': p.surfaceElevated,
    '--text-primary': p.textPrimary,
    '--text-secondary': p.textSecondary,
    '--text-muted': p.textMuted,
    '--text-inverse': p.textInverse,
    '--border': p.border,
    '--divider': p.divider,
    '--accent-primary': p.accentPrimary,
    '--accent-secondary': p.accentSecondary,
    '--severity-severe': p.severitySevere,
    '--severity-moderate': p.severityModerate,
    '--severity-mild': p.severityMild,
    '--aura-only': p.auraOnly,
    '--during-tint': p.duringTint,
  };
}

type ThemeProviderProps = {
  children: React.ReactNode;
};

/**
 * Wraps the app and injects palette CSS variables so NativeWind
 * classes like bg-[var(--surface)] resolve to the active palette colour.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const paletteName = useThemeStore((s) => s.palette);
  const palette = PALETTES[paletteName];
  const cssVars = vars(paletteToVars(palette));

  return (
    <View style={[{ flex: 1, backgroundColor: palette.bg }, cssVars]}>
      {children}
    </View>
  );
}
