# Tideline — v0.1 Spec: Implementation Tokens

> **For coder agents.** Every concrete value an implementation needs. Do NOT invent values not in this file. If you find yourself reaching for a number/color/copy string not listed here, stop and either (a) use the closest match here or (b) flag it for human decision.
>
> This file complements `00`/`01`/`02`/`03`. It does not replace them — read them first for *what* and *why*. Read this for *exact*.

---

## 1. Theme palettes (the 4 from spec section 0.4)

Each palette defines the same 14 tokens. The "meaning" of each token is fixed; only the hue varies.

### Token names

```ts
type PaletteTokens = {
  // Surfaces
  bg: string;                 // Screen background
  surface: string;            // Cards, sheets
  surfaceElevated: string;    // Modals, popovers

  // Text
  textPrimary: string;        // Body text, headings
  textSecondary: string;      // Subtle text, metadata
  textMuted: string;          // Hints, placeholders
  textInverse: string;        // Text on accent buttons

  // Borders + dividers
  border: string;             // Hairline borders
  divider: string;            // Section dividers

  // Accents (the "your colour" of the palette)
  accentPrimary: string;      // Primary action, today indicator
  accentSecondary: string;    // Secondary accent, aura encoding

  // Migraine severity encoding (calendar day cells)
  severitySevere: string;     // Severity 8-10
  severityModerate: string;   // Severity 5-7
  severityMild: string;       // Severity 1-4

  // In-migraine companion mode
  duringTint: string;         // Overlay tint when active migraine
};
```

### Palette: Calm Sand

```ts
{
  bg: '#F5EFE6',
  surface: '#FBF7F0',
  surfaceElevated: '#FFFEFB',
  textPrimary: '#3A2E1F',
  textSecondary: '#7A6A52',
  textMuted: '#A89A82',
  textInverse: '#FBF7F0',
  border: '#E5DCCB',
  divider: '#EFE7D7',
  accentPrimary: '#B85C38',     // terracotta
  accentSecondary: '#7A8B6F',   // sage
  severitySevere: '#8B2E1F',    // deep clay
  severityModerate: '#C97A4B',  // amber
  severityMild: '#E5C29F',      // pale sand
  duringTint: '#1F1810',        // very deep brown overlay
}
```

### Palette: Soft Storm

```ts
{
  bg: '#EEF1F5',
  surface: '#F7F9FC',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#1F2A3A',
  textSecondary: '#5A6678',
  textMuted: '#8A95A8',
  textInverse: '#F7F9FC',
  border: '#D8DFEA',
  divider: '#E2E8F0',
  accentPrimary: '#3B6BA5',     // storm blue
  accentSecondary: '#8B6FA5',   // lavender
  severitySevere: '#1F3A5C',    // deep navy
  severityModerate: '#4F7BB0',  // mid blue
  severityMild: '#A8BDD9',      // pale blue
  duringTint: '#0A0F1A',        // near black
}
```

### Palette: Quiet Night

```ts
{
  bg: '#0F1419',
  surface: '#1A2028',
  surfaceElevated: '#252D38',
  textPrimary: '#E8EAED',
  textSecondary: '#9CA5B3',
  textMuted: '#6B7585',
  textInverse: '#0F1419',
  border: '#2D3540',
  divider: '#252D38',
  accentPrimary: '#7EB8D4',     // cool blue
  accentSecondary: '#B89B7A',   // warm amber
  severitySevere: '#D4654A',    // ember
  severityModerate: '#C49B7A',  // muted amber
  severityMild: '#5A6878',      // slate
  duringTint: '#000000',        // pure black
}
```

### Palette: Forest Pale

```ts
{
  bg: '#F2F4EE',
  surface: '#F9FAF6',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#2A3328',
  textSecondary: '#5C6855',
  textMuted: '#8A957F',
  textInverse: '#F9FAF6',
  border: '#DCE3D5',
  divider: '#E5EBDF',
  accentPrimary: '#5C7A4B',     // forest
  accentSecondary: '#9C7A4B',   // earth
  severitySevere: '#3D5230',    // deep forest
  severityModerate: '#7A9663',  // sage
  severityMild: '#C2D1B0',      // pale moss
  duringTint: '#0F1A0A',        // very deep green
}
```

### Day-cell colour mapping (from spec section 1.2)

```ts
function dayCellColor(day: DayState, palette: PaletteTokens): string {
  if (day.migraine?.peakSeverity >= 8) return palette.severitySevere;
  if (day.migraine?.peakSeverity >= 5) return palette.severityModerate;
  if (day.migraine?.peakSeverity >= 1) return palette.severityMild;
  if (day.migraine?.symptomTags.includes('aura') && day.migraine.peakSeverity === 0) {
    return palette.accentSecondary; // aura-only
  }
  if (day.triggerLikely) return 'transparent'; // border-only, no fill
  return palette.bg; // logged-only or empty
}
```

---

## 2. Spacing scale

Tailwind-default 4px base. Use these tokens consistently.

```
spacing.0  = 0px
spacing.1  = 4px
spacing.2  = 8px
spacing.3  = 12px
spacing.4  = 16px      ← default for component padding
spacing.5  = 20px
spacing.6  = 24px      ← default for section padding
spacing.8  = 32px
spacing.10 = 40px
spacing.12 = 48px
spacing.16 = 64px
spacing.20 = 80px
```

In NativeWind: `p-4`, `gap-3`, etc.

---

## 3. Typography scale

```
text-xs   = 12px / 16 line
text-sm   = 14px / 20 line       ← metadata, hints
text-base = 16px / 24 line       ← body default
text-lg   = 18px / 28 line       ← emphasized body
text-xl   = 20px / 28 line       ← section headings
text-2xl  = 24px / 32 line       ← page headings
text-3xl  = 30px / 36 line       ← rare; severity numbers
text-4xl  = 36px / 40 line       ← in-migraine companion mode "right now" lines
```

Font: system default (`-apple-system`, `Roboto`). No custom font loading in v1 — too much bundle weight for too little gain.

Font weights: `normal` (400), `medium` (500), `semibold` (600). No `bold`, no `black`.

---

## 4. Touch target sizes

| Element | Min size |
|---|---|
| Primary action buttons | 56pt height |
| Secondary buttons | 44pt height |
| Chips (selectable) | 40pt height, 16pt horizontal padding |
| Calendar day cells | 44x44pt (standard 7-col grid) |
| Severity slider thumb | 32pt diameter |
| Floating "+" button | 64pt diameter |
| In-migraine mode buttons | 64pt height (larger than normal) |

WCAG 2.1 AA requires 44x44pt minimum for interactive elements. We exceed for in-migraine mode.

---

## 5. Component primitives

These live in `src/components/ui/`. Coder agents implementing screens import these — do NOT reinvent.

```ts
// Button.tsx
type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';  // 'xl' for in-migraine mode
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof IoniconsName;  // optional leading icon
  fullWidth?: boolean;
  testID?: string;
};

// Card.tsx
type CardProps = {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';  // maps to spacing 0/3/4/6
  testID?: string;
};

// Chip.tsx — selectable tag (food, symptoms, helpers)
type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: 'default' | 'severity-severe' | 'severity-moderate' | 'severity-mild';
  size?: 'sm' | 'md';
  testID?: string;
};

// Slider.tsx — for severity, stress
type SliderProps = {
  value: number;
  onValueChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;          // default 1
  showValue?: boolean;    // default true
  ariaLabel: string;      // required for a11y
  testID?: string;
};

// Sheet.tsx — bottom sheet for log flows
type SheetProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  height?: 'auto' | 'half' | 'full';
  testID?: string;
};

// TextField.tsx
type TextFieldProps = {
  value: string;
  onChangeText: (s: string) => void;
  label?: string;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  ariaLabel?: string;
  testID?: string;
};

// Stepper.tsx — for water cups, sleep hours
type StepperProps = {
  value: number;
  onValueChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;          // default 1; sleep uses 0.5
  unit?: string;          // 'h' for hours, 'cups' for water
  testID?: string;
};

// SegmentedControl.tsx — for sleep quality
type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  testID?: string;
};
```

---

## 6. UI copy strings (use VERBATIM, do NOT paraphrase)

Coder agents must use these exact strings. If you need a string that isn't here, add it to this file in your branch and it'll be reviewed at integration.

### Onboarding (spec section 0)

```ts
export const onboardingCopy = {
  welcome: {
    title: 'Hi. Tideline helps you understand your migraines.',
    body: "Log attacks. Track what you ate, how you slept, how the weather felt. Over time, patterns appear.\n\nYour data lives on your phone. Nothing leaves it unless you choose to share it.",
    cta: 'Continue',
  },
  location: {
    title: 'One quick ask: your location.',
    body: 'The app pulls weather data — temperature, humidity, barometric pressure — from where you actually are. Pressure changes in particular show up as triggers for many people.\n\nYour exact location stays on your phone. We never upload it.',
    primary: 'Allow location',
    secondary: 'Maybe later',
  },
  notifications: {
    title: 'Want a daily nudge to log?',
    body: 'A 30-second daily check-in (sleep, water, how you\'re feeling) is what makes the patterns work.',
    primary: 'Yes, remind me',
    secondary: 'No thanks',
    timeLabel: 'Reminder time',
    defaultTime: '09:00',
  },
  theme: {
    title: 'Pick a palette.',
    body: 'You can change this any time in Settings.',
  },
  done: {
    title: "You're set.",
    body: 'Tap the + to log your first migraine, or just go about your day — we\'ll be here when you need us.',
    cta: 'Get started',
  },
};
```

### Active migraine logging (spec section 3.2)

```ts
export const activeLogCopy = {
  title: "You're having a migraine.",
  subtitle: "Started just now. We'll keep counting.",
  severityLabel: 'How bad? (slide later if you can\'t tell)',
  symptomsLabel: 'Feeling? (tap any that apply)',
  notesLabel: 'Notes (optional)',
  saveCta: 'Save',
  companionCta: 'Open companion mode →',
};
```

### In-migraine companion (spec section 6)

```ts
export const companionCopy = {
  title: 'Tideline is here.',
  rightNowHeading: 'Right now:',
  loggedAgo: (mins: number) => `You logged this migraine ${formatDuration(mins)} ago.`,
  severityLine: (n: number) => `Severity: ${n} (tap to update)`,
  helpedHistoryHeading: 'Things that have helped you before:',
  emptyHelpedHistory: "We'll start learning what helps you specifically once you've logged a few attacks.",
  generalTipsHeading: 'General things to try:',
  generalTips: [
    'Hydrate slowly. Sip, don\'t gulp.',
    'Dim the lights. Close curtains. Phone brightness all the way down.',
    'Cold compress on the forehead or back of the neck.',
    'If you have a triptan, the earlier you take it the better it works.',
  ],
  emergencyHeading: 'When to seek help:',
  emergencyBody: 'Sudden "worst headache of your life," vision loss, weakness on one side, confusion, or stiff neck with fever — this could be more than a migraine. Call emergency services.',
  ctas: {
    tookSomething: 'I took something',
    gettingWorse: 'It\'s getting worse',
    ended: 'It ended',
  },
};
```

### Daily check-in (spec section 7)

```ts
export const checkinCopy = {
  title: 'Yesterday — quick check-in',
  sleep: {
    label: 'Sleep',
    hoursLabel: 'Hours',
    qualityLabel: 'Quality',
    qualityOptions: [
      { value: 1, label: '😣' },
      { value: 2, label: '😐' },
      { value: 3, label: '🙂' },
      { value: 4, label: '😊' },
    ],
  },
  stress: { label: 'Stress', helper: '1 = calm, 5 = very stressed' },
  water: { label: 'Water', unit: 'cups' },
  food: { label: 'Food', addCta: '+ Add' },
  caffeine: { label: 'Caffeine', unit: 'cups' },
  cycle: {
    label: 'Cycle',
    options: [
      { value: 'period_start', label: 'Period started today' },
      { value: 'period_end', label: 'Period ended today' },
      { value: 'no_change', label: 'No change' },
    ],
  },
  notes: { label: 'Anything else?', placeholder: 'Optional notes' },
  saveCta: 'Save',
};
```

### Empty states

```ts
export const emptyCopy = {
  calendarFirstUse: 'Log your first migraine to start seeing patterns. Daily check-ins help us learn faster — try the + button.',
  insightsNotEnoughData: 'We need a bit more data before patterns are meaningful. Keep logging — we\'ll show you what we find once there\'s enough to be honest about.',
  communityNotEnoughContributors: (count: number) => `We need at least 50 active contributors in your region to show meaningful trends. Right now there are ${count}. Tideline gets smarter as more people in your area opt in.`,
  noMigraineForDay: 'No migraine logged for this day',
  noCheckinForDay: 'No daily check-in',
  helpersHistoryEmpty: "We'll start learning what helps you specifically once you've logged a few attacks.",
};
```

---

## 7. Open-Meteo API contract

### Endpoint

```
https://api.open-meteo.com/v1/forecast
```

### Query parameters (all required for our use)

```
latitude={lat}
longitude={lon}
current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,uv_index,weather_code
hourly=surface_pressure
past_days=1
forecast_days=1
timezone=auto
```

### Response shape (Zod schema)

```ts
import { z } from 'zod';

export const OpenMeteoResponse = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    relative_humidity_2m: z.number(),
    surface_pressure: z.number(),
    wind_speed_10m: z.number(),
    uv_index: z.number().nullable(),
    weather_code: z.number(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    surface_pressure: z.array(z.number()),
  }),
});

export type OpenMeteoResponse = z.infer<typeof OpenMeteoResponse>;
```

### Mapping to our `weather_snapshots` table

```ts
function mapToSnapshot(r: OpenMeteoResponse, h3Cell: string): NewWeatherSnapshot {
  const pressureNow = r.current.surface_pressure;
  // Pressure 24h ago = first entry of hourly array (since past_days=1)
  const pressure24hAgo = r.hourly.surface_pressure[0];

  return {
    id: ulid(),
    capturedAt: new Date(r.current.time),
    h3Cell,
    temperatureC: r.current.temperature_2m,
    humidityPct: r.current.relative_humidity_2m,
    pressureHpa: pressureNow,
    pressureChange24hHpa: pressureNow - pressure24hAgo,
    windKph: r.current.wind_speed_10m * 3.6,  // m/s → kph
    uvIndex: r.current.uv_index,
    pollenIndex: null,  // Open-Meteo air quality endpoint is separate; v1 leaves null
    source: 'open-meteo',
  };
}
```

### Pull cadence

- On app foreground (if last pull > 1 hour ago)
- After logging an active migraine (immediate)
- Background refresh every 4 hours when app is backgrounded (Phase 2+ once we have native modules)

### Error handling

- Network failure → use most recent cached snapshot, show "weather unavailable" badge
- 4xx response → log to local error table, surface in Settings → Diagnostics, do NOT crash
- 5xx response → exponential backoff, max 3 retries

---

## 8. H3 hex cell utilities

```ts
import { latLngToCell, cellToLatLng } from 'h3-js';

export const H3_RESOLUTION_LOCAL = 7;   // ~5km, used for personal weather caching
export const H3_RESOLUTION_POOL = 5;    // ~25km, used for community pool

export function deviceCellLocal(lat: number, lon: number): string {
  return latLngToCell(lat, lon, H3_RESOLUTION_LOCAL);
}

export function deviceCellPool(lat: number, lon: number): string {
  return latLngToCell(lat, lon, H3_RESOLUTION_POOL);
}

export function cellCentroid(cell: string): [number, number] {
  return cellToLatLng(cell);  // returns [lat, lon]
}
```

---

## 9. Routing structure (Expo Router)

```
app/
├── _layout.tsx                          Root: providers, theme, fonts
├── index.tsx                            → redirect to /(onboarding) or /(tabs)
├── (onboarding)/
│   ├── _layout.tsx                      Sequential flow, no tabs
│   ├── welcome.tsx                      Screen 0.1
│   ├── location.tsx                     Screen 0.2
│   ├── notifications.tsx                Screen 0.3
│   ├── theme.tsx                        Screen 0.4
│   └── done.tsx                         Screen 0.5
├── (tabs)/
│   ├── _layout.tsx                      Tab bar: Calendar / Insights / Meds / Settings
│   ├── index.tsx                        Calendar (screen 1)
│   ├── insights.tsx                     Patterns dashboard (screen 8)
│   ├── community.tsx                    In-your-area (screen 9), tab hidden until opt-in
│   ├── meds.tsx                         Medications list (screen 10)
│   └── settings/
│       ├── index.tsx                    Settings menu (screen 11.1)
│       ├── theme.tsx                    Palette picker
│       ├── notifications.tsx            Notification settings
│       ├── checkin-fields.tsx           Customize daily check-in fields
│       ├── community.tsx                Community sharing detail (screen 11.2)
│       ├── account.tsx                  Account / sign-in (screen 12)
│       ├── export.tsx                   Data export (screen 11.1)
│       └── delete.tsx                   Data deletion (screen 11.3)
├── day/[date].tsx                       Day detail (screen 2)
├── log/
│   ├── choose.tsx                       Active vs retro picker (screen 3.1)
│   ├── active.tsx                       Active mode (screen 3.2)
│   ├── retro.tsx                        Retrospective mode (screen 4)
│   └── end.tsx                          End-active migraine (screen 5)
├── companion.tsx                        In-migraine companion (screen 6)
└── checkin/[date].tsx                   Daily check-in (screen 7)
```

---

## 10. File ownership map (for parallel coder agents)

Each agent OWNS a set of files. They can read everything but only write to files they own.

| Agent | Owned files |
|---|---|
| **foundation** | `src/components/ui/*`, `src/theme/*`, `src/db/schema/*`, `src/db/client.ts`, `src/db/migrations/*`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `tailwind.config.js`, `metro.config.js`, `babel.config.js`, `global.css`, `nativewind-env.d.ts` |
| **calendar** | `app/(tabs)/index.tsx`, `app/day/[date].tsx`, `src/features/calendar/*` |
| **log-active** | `app/log/choose.tsx`, `app/log/active.tsx`, `app/log/end.tsx`, `src/features/log-active/*` |
| **log-retro** | `app/log/retro.tsx`, `src/features/log-retro/*` |
| **checkin** | `app/checkin/[date].tsx`, `src/features/checkins/*` |
| **meds** | `app/(tabs)/meds.tsx`, `src/features/meds/*` |
| **weather** | `src/services/weather.ts`, `src/services/h3.ts`, `src/features/weather/*` |
| **insights** | `app/(tabs)/insights.tsx`, `src/features/insights/*` |
| **settings** | `app/(tabs)/settings/*`, `src/features/settings/*` |
| **companion** | `app/companion.tsx`, `src/features/companion/*` |
| **onboarding** | `app/(onboarding)/*`, `src/features/onboarding/*` |

**Files everyone reads but no agent writes:** `docs/*`, `src/types/*` (created by foundation), copy strings (created by foundation in `src/copy/index.ts`), Zod schemas in `src/types/schemas.ts`.

If an agent needs a new shared type or utility, they create a PR-style note in `INTEGRATION-NOTES.md` (root) and the integration step picks it up.

---

## 11. Testing requirements per agent

Each feature module ships with:

1. **Unit tests** for any pure logic (correlation calculator, anonymisation, H3 utilities, formatters) — Vitest, located at `*.test.ts` next to source.
2. **Component tests** for any non-trivial component using `@testing-library/react-native` — query by accessible role/label.
3. **One integration test** per major user flow (e.g., "log an active migraine end-to-end" hits the db).
4. **Accessibility check** — every interactive element has an `accessibilityLabel`. Every input has an associated label.

Coverage target: 70% line coverage on `src/features/**` and `src/services/**`. UI screens (`app/**`) need at least one happy-path test each.

---

## 12. State management rules (avoid agent divergence)

- **Local UI state:** `useState` in the component. Default.
- **Cross-component UI state within a feature:** local Zustand store in `src/features/<feature>/store.ts`.
- **Cross-feature UI state (e.g., theme):** root Zustand store in `src/stores/`.
- **Server-fetched data (weather, future Supabase reads):** TanStack Query. Cache in memory; persistence via Drizzle on the side.
- **Form state:** plain `useState` + Zod validation on submit. No form library in v1.
- **Database access:** always through hooks in `src/features/<feature>/hooks.ts` that wrap Drizzle queries inside TanStack Query for caching.

Never use Context API for state. Always Zustand or TanStack Query.

---

## 13. Error handling pattern (avoid agent divergence)

```ts
// All async operations return discriminated unions, never throw across module boundaries.
type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

type AppError = {
  kind: 'network' | 'validation' | 'database' | 'permission' | 'unknown';
  message: string;
  cause?: unknown;
};

// Top-level error boundary at app/_layout.tsx catches anything that does throw
// (programmer errors, render errors). Logs locally (no Sentry in v1).
```

---

## 14. Stubbed-for-now feature flags

Features that need cloud or AI infra get gated by a feature flag. The UI is built; the behavior is a no-op or empty state.

```ts
// src/config/feature-flags.ts
export const FEATURE_FLAGS = {
  cloudSync: false,           // Supabase per-user sync
  communityFeed: false,       // Central pool ingest + feed
  monthlyAINarrative: false,  // Claude Haiku narrative
  cycleTracking: true,        // On but data stays local always
  notificationsLocal: true,   // Daily check-in + refill local notifications
} as const;
```

Agents implementing screens that touch flagged features must:
- Build the full UI
- When a gated feature is invoked, show a friendly empty state ("Cloud sync isn't enabled yet") instead of a stub error
- Wire up the boundary cleanly so flipping the flag to `true` activates real behavior with no UI changes

---

## 15. The "do not invent" list

If any of these come up and you don't see them in this file or the spec, STOP and add them here in your branch:

- Color values
- Copy strings
- Spacing or sizing values
- Endpoint URLs
- Database column names or types
- File paths
- Component prop names
- Time formats
- Number formats (decimal precision, etc.)

Adding to this list is cheap. Inventing values silently is what makes parallel agents diverge into a mess.
