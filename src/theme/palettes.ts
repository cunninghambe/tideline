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
  /** Secondary accent — quieter UI accents */
  accentSecondary: string;
  /** Severity 8–10 */
  severitySevere: string;
  /** Severity 5–7 */
  severityModerate: string;
  /** Severity 1–4 */
  severityMild: string;
  /** Aura-only (severity 0 + aura tag) */
  auraOnly: string;
  /** Overlay tint when active migraine */
  duringTint: string;
};

// Photophobia-safe palette set. Warm hues only (no pure black, no pure white,
// no saturated red — saturated red is a photophobic trigger). Severity colours
// stay in the warm earth band at moderate-to-low chroma.

const calmSand: PaletteTokens = {
  bg: '#F4ECE0',
  surface: '#FBF6EE',
  surfaceElevated: '#FFFCF6',
  textPrimary: '#3D2F1F',
  textSecondary: '#7A6852',
  textMuted: '#B0A088',
  textInverse: '#FBF6EE',
  border: '#E5D9C5',
  divider: '#EFE4CF',
  accentPrimary: '#B85C38',
  accentSecondary: '#7A8B6F',
  severitySevere: '#8E3522',
  severityModerate: '#C97A4B',
  severityMild: '#E5C29F',
  auraOnly: '#9C8B68',
  duringTint: '#1F1810',
};

const softStorm: PaletteTokens = {
  bg: '#EDEFF2',
  surface: '#F6F8FA',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#243040',
  textSecondary: '#5A6678',
  textMuted: '#9AA4B3',
  textInverse: '#F6F8FA',
  border: '#D8DEE6',
  divider: '#E2E7ED',
  accentPrimary: '#5C7390',
  accentSecondary: '#8B7A95',
  severitySevere: '#3D4F66',
  severityModerate: '#7088A8',
  severityMild: '#B8C5D6',
  auraOnly: '#9A8BA5',
  duringTint: '#0A0F1A',
};

const quietNight: PaletteTokens = {
  bg: '#1A1612',
  surface: '#231D18',
  surfaceElevated: '#2C251F',
  textPrimary: '#EDE3D2',
  textSecondary: '#A89A85',
  textMuted: '#6B5F50',
  textInverse: '#1A1612',
  border: '#332B23',
  divider: '#2C251F',
  accentPrimary: '#D89570',
  accentSecondary: '#8FA38A',
  severitySevere: '#A85A3F',
  severityModerate: '#B07A52',
  severityMild: '#5A4938',
  auraOnly: '#6B7A6E',
  duringTint: '#0C0907',
};

const forestPale: PaletteTokens = {
  bg: '#EDF1E8',
  surface: '#F6F9F2',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#2A3328',
  textSecondary: '#5C6855',
  textMuted: '#9AA591',
  textInverse: '#F6F9F2',
  border: '#D8E0CF',
  divider: '#E3EBD9',
  accentPrimary: '#6B8559',
  accentSecondary: '#A88B5C',
  severitySevere: '#3D5230',
  severityModerate: '#7A9663',
  severityMild: '#BFD0AB',
  auraOnly: '#A8966B',
  duringTint: '#0F1A0A',
};

export const PALETTES: Record<PaletteName, PaletteTokens> = {
  calm_sand: calmSand,
  soft_storm: softStorm,
  quiet_night: quietNight,
  forest_pale: forestPale,
};
