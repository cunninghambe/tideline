import { useThemeStore } from '@/stores/useThemeStore';
import { PALETTES, type PaletteName, type PaletteTokens } from './palettes';

/** Returns the currently active palette token values. */
export function usePalette(): PaletteTokens {
  const paletteName = useThemeStore((s) => s.palette);
  return PALETTES[paletteName];
}

/** Returns a function to change the active palette. */
export function useSetPalette(): (name: PaletteName) => void {
  return useThemeStore((s) => s.setPalette);
}

/** Returns the current theme mode preference. */
export function useThemeMode(): 'light' | 'dark' | 'system' {
  return useThemeStore((s) => s.mode);
}
