/**
 * Spacing scale — Tailwind 4px base.
 * In NativeWind: p-4, gap-3, etc.
 */
export const SPACING = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

/**
 * Typography scale — font sizes in px.
 * Font: system default. No custom font loading in v1.
 */
export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

/** Line heights matching typography scale */
export const LINE_HEIGHT = {
  xs: 16,
  sm: 20,
  base: 24,
  lg: 28,
  xl: 28,
  '2xl': 32,
  '3xl': 36,
  '4xl': 40,
} as const;

/** Font weights used in the app */
export const FONT_WEIGHT = {
  normal: '400',
  medium: '500',
  semibold: '600',
} as const;

/**
 * Minimum touch target sizes in points.
 * WCAG 2.1 AA requires 44×44pt minimum.
 */
export const TOUCH_TARGET = {
  /** Primary action buttons */
  primaryButton: 56,
  /** Secondary buttons */
  secondaryButton: 44,
  /** Chips — height */
  chipHeight: 40,
  /** Chips — horizontal padding */
  chipPaddingH: 16,
  /** Calendar day cells */
  calendarCell: 44,
  /** Severity slider thumb diameter */
  sliderThumb: 32,
  /** Floating "+" button diameter */
  fabDiameter: 64,
  /** In-migraine mode buttons */
  duringButton: 64,
} as const;
