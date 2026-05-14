import { useFonts } from 'expo-font';
import {
  Geist_300Light,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
} from '@expo-google-fonts/geist';
import {
  GeistMono_400Regular,
  GeistMono_500Medium,
} from '@expo-google-fonts/geist-mono';
import {
  Newsreader_400Regular,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
} from '@expo-google-fonts/newsreader';

// Family-name constants used as fontFamily values throughout the app.
// Keep these in sync with the keys passed to `useFonts(...)` below — the
// loaded font is registered under the same string.

export const FONT_FAMILY = {
  /** UI sans — Geist. Default body and headings. */
  sans: 'Geist_400Regular',
  sansMedium: 'Geist_500Medium',
  sansSemibold: 'Geist_600SemiBold',
  sansLight: 'Geist_300Light',
  /** Mono — Geist Mono. Labels, week numbers, numeric grid markers. */
  mono: 'GeistMono_400Regular',
  monoMedium: 'GeistMono_500Medium',
  /** Serif — Newsreader. Month title and tideline. brand wordmark. */
  serif: 'Newsreader_400Regular',
  serifMedium: 'Newsreader_500Medium',
  serifSemibold: 'Newsreader_600SemiBold',
} as const;

export function useTidelineFonts(): boolean {
  const [loaded] = useFonts({
    Geist_300Light,
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    GeistMono_400Regular,
    GeistMono_500Medium,
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
  });
  return loaded;
}
