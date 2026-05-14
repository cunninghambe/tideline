// ---------------------------------------------------------------------------
// Calendar layout — three reading models for the same data.
//   grid          — classic 7×6 month grid, severity as full-cell fill
//   tidemark      — week strips, severity as a bottom bar (lower colour load)
//   constellation — dot grid, severity as dot size + opacity
// ---------------------------------------------------------------------------

export type CalendarLayout = 'grid' | 'tidemark' | 'constellation';

export const CALENDAR_LAYOUTS: readonly CalendarLayout[] = [
  'grid',
  'tidemark',
  'constellation',
] as const;

export function isCalendarLayout(v: string): v is CalendarLayout {
  return (CALENDAR_LAYOUTS as readonly string[]).includes(v);
}

// ---------------------------------------------------------------------------
// Density — affects cell size, paddings, type scale, FAB size.
//   compact  — max info, for scanning healthy stretches
//   standard — balanced default
//   roomy    — max tap targets, for in-pain use
// ---------------------------------------------------------------------------

export type DensityName = 'compact' | 'standard' | 'roomy';

export type DensityTokens = {
  cellSize: number;
  cellGap: number;
  cellRadius: number;
  headerPad: number;
  fabSize: number;
  typeScale: number;
};

export const DENSITIES: Record<DensityName, DensityTokens> = {
  compact: {
    cellSize: 40,
    cellGap: 2,
    cellRadius: 6,
    headerPad: 12,
    fabSize: 56,
    typeScale: 0.92,
  },
  standard: {
    cellSize: 46,
    cellGap: 3,
    cellRadius: 8,
    headerPad: 16,
    fabSize: 64,
    typeScale: 1,
  },
  roomy: {
    cellSize: 52,
    cellGap: 4,
    cellRadius: 10,
    headerPad: 20,
    fabSize: 72,
    typeScale: 1.08,
  },
};

export const DENSITY_NAMES: readonly DensityName[] = ['compact', 'standard', 'roomy'] as const;

export function isDensityName(v: string): v is DensityName {
  return (DENSITY_NAMES as readonly string[]).includes(v);
}

// ---------------------------------------------------------------------------
// Accent intensity — how loudly severity reads.
//   whisper  — gentlest, pattern only (mutes severity hues further)
//   standard — balanced legibility (the default)
//   signal   — high-contrast (closer to raw severity hex)
// ---------------------------------------------------------------------------

export type AccentIntensityName = 'whisper' | 'standard' | 'signal';

export type AccentIntensityTokens = {
  /** Multiplier applied to severity fill opacity (0..1). */
  opacity: number;
};

export const ACCENT_INTENSITIES: Record<AccentIntensityName, AccentIntensityTokens> = {
  whisper: { opacity: 0.55 },
  standard: { opacity: 0.85 },
  signal: { opacity: 1 },
};

export const ACCENT_INTENSITY_NAMES: readonly AccentIntensityName[] = [
  'whisper',
  'standard',
  'signal',
] as const;

export function isAccentIntensityName(v: string): v is AccentIntensityName {
  return (ACCENT_INTENSITY_NAMES as readonly string[]).includes(v);
}

// ---------------------------------------------------------------------------
// Settings keys
// ---------------------------------------------------------------------------

export const CALENDAR_SETTING_KEYS = {
  layout: 'calendar.layout',
  density: 'calendar.density',
  accentIntensity: 'calendar.accent_intensity',
  showCycle: 'calendar.show_cycle',
} as const;

// Hooks that read these settings live in `./calendarTokenHooks.ts` — they
// import react-native + tanstack/query and are therefore not safe to import
// from a Node test context. Keep this file pure.
