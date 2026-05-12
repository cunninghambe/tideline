export type PaletteName = 'calm_sand' | 'soft_storm' | 'quiet_night' | 'forest_pale';

export type PaletteTokens = {
  /** Screen background */
  bg: string;
  /** Cards, sheets */
  surface: string;
  /** Modals, popovers */
  surfaceElevated: string;
  /** Body text, headings */
  textPrimary: string;
  /** Subtle text, metadata */
  textSecondary: string;
  /** Hints, placeholders */
  textMuted: string;
  /** Text on accent buttons */
  textInverse: string;
  /** Hairline borders */
  border: string;
  /** Section dividers */
  divider: string;
  /** Primary action, today indicator */
  accentPrimary: string;
  /** Secondary accent, aura encoding */
  accentSecondary: string;
  /** Severity 8–10 */
  severitySevere: string;
  /** Severity 5–7 */
  severityModerate: string;
  /** Severity 1–4 */
  severityMild: string;
  /** Overlay tint when active migraine */
  duringTint: string;
};

const calmSand: PaletteTokens = {
  bg: '#F5EFE6',
  surface: '#FBF7F0',
  surfaceElevated: '#FFFEFB',
  textPrimary: '#3A2E1F',
  textSecondary: '#7A6A52',
  textMuted: '#A89A82',
  textInverse: '#FBF7F0',
  border: '#E5DCCB',
  divider: '#EFE7D7',
  accentPrimary: '#B85C38',
  accentSecondary: '#7A8B6F',
  severitySevere: '#8B2E1F',
  severityModerate: '#C97A4B',
  severityMild: '#E5C29F',
  duringTint: '#1F1810',
};

const softStorm: PaletteTokens = {
  bg: '#EEF1F5',
  surface: '#F7F9FC',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#1F2A3A',
  textSecondary: '#5A6678',
  textMuted: '#8A95A8',
  textInverse: '#F7F9FC',
  border: '#D8DFEA',
  divider: '#E2E8F0',
  accentPrimary: '#3B6BA5',
  accentSecondary: '#8B6FA5',
  severitySevere: '#1F3A5C',
  severityModerate: '#4F7BB0',
  severityMild: '#A8BDD9',
  duringTint: '#0A0F1A',
};

const quietNight: PaletteTokens = {
  bg: '#0F1419',
  surface: '#1A2028',
  surfaceElevated: '#252D38',
  textPrimary: '#E8EAED',
  textSecondary: '#9CA5B3',
  textMuted: '#6B7585',
  textInverse: '#0F1419',
  border: '#2D3540',
  divider: '#252D38',
  accentPrimary: '#7EB8D4',
  accentSecondary: '#B89B7A',
  severitySevere: '#D4654A',
  severityModerate: '#C49B7A',
  severityMild: '#5A6878',
  duringTint: '#000000',
};

const forestPale: PaletteTokens = {
  bg: '#F2F4EE',
  surface: '#F9FAF6',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#2A3328',
  textSecondary: '#5C6855',
  textMuted: '#8A957F',
  textInverse: '#F9FAF6',
  border: '#DCE3D5',
  divider: '#E5EBDF',
  accentPrimary: '#5C7A4B',
  accentSecondary: '#9C7A4B',
  severitySevere: '#3D5230',
  severityModerate: '#7A9663',
  severityMild: '#C2D1B0',
  duringTint: '#0F1A0A',
};

export const PALETTES: Record<PaletteName, PaletteTokens> = {
  calm_sand: calmSand,
  soft_storm: softStorm,
  quiet_night: quietNight,
  forest_pale: forestPale,
};
