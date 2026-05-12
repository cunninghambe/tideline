import { create } from 'zustand';

import type { PaletteName } from '@/theme/palettes';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeState = {
  palette: PaletteName;
  mode: ThemeMode;
  setPalette: (name: PaletteName) => void;
  setMode: (mode: ThemeMode) => void;
};

/**
 * Stores the user's active palette and theme mode.
 * Hydrated from settings on mount in the root layout.
 */
export const useThemeStore = create<ThemeState>((set) => ({
  palette: 'calm_sand',
  mode: 'system',
  setPalette: (name) => set({ palette: name }),
  setMode: (mode) => set({ mode }),
}));
