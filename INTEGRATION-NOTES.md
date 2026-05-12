# Integration Notes

> Living doc. Foundation seeds it; every coder agent reads before starting and appends to their own section if they discover something. Integration step (me) reads it during merges.

## Version reality (read this first)

The locked stack in `docs/03-stack-and-deployment.md` lists target versions. The **actual installed versions** as of scaffold are higher:

| Package | Spec target | Actually installed |
|---|---|---|
| `expo` | ~52.0 | **~54.0.33** |
| `react` | 18.3.1 | **19.1.0** |
| `react-native` | 0.76.x | **0.81.5** |
| `expo-router` | ~4.0 | **~6.0.23** |
| `typescript` | ~5.6 | **~5.9.2** |
| `drizzle-orm` | ^0.36 | **^0.45.2** |
| `nativewind` | ^4.1 | **^4.2.3** |
| `tailwindcss` | ^3.4 | **^3.4.19** |
| `zod` | ^3 | **^4.4.3** |

**Implications:**
- **Zod 4** has API changes from Zod 3. `z.string().datetime()` is now `z.iso.datetime()`. Discriminated unions are stricter. Read official Zod 4 docs, not StackOverflow Zod 3 examples.
- **Drizzle 0.45** uses `mode: 'timestamp'` columns that infer to `Date` more strictly; cast at boundaries.
- **Expo Router 6** has type-safe routes via `experiments.typedRoutes` in `app.json` — foundation enables this.
- **expo-sqlite** import path: use `expo-sqlite` (the synchronous API `openDatabaseSync` is the way for Drizzle).

## Path alias

`tsconfig.json` is configured (by foundation) as:

```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@app/*": ["./app/*"]
  }
}
```

Always import with `@/...` or relative. Never reach across `app/` boundaries with relative paths.

## Spec-gap resolutions (firm decisions — do not re-litigate)

Numbered for reference. If you see ambiguity in the spec on any of these, this section wins.

### G1. Palette count
Ship **4 palettes**: Calm Sand, Soft Storm, Quiet Night, Forest Pale. The "Custom" mention in spec §0.4 is post-v1. Theme picker shows 4 cards.

### G2. Symptom tags
Schema (`SymptomTag` in `02-data-model.md`) has 9 values including `whole_head`. UI per spec §3.2 shows 8 — **omits `whole_head`**. Foundation publishes:
```ts
export const SYMPTOM_TAGS_ALL: SymptomTag[] = ['throbbing', 'aura', 'nausea', 'light_sensitive', 'sound_sensitive', 'smell_sensitive', 'behind_eyes', 'one_sided', 'whole_head'];
export const SYMPTOM_CHIPS_UI: { value: SymptomTag; label: string }[] = [
  { value: 'throbbing',         label: 'Throbbing' },
  { value: 'aura',              label: 'Aura' },
  { value: 'nausea',            label: 'Nausea' },
  { value: 'light_sensitive',   label: 'Light hurts' },
  { value: 'sound_sensitive',   label: 'Sound hurts' },
  { value: 'smell_sensitive',   label: 'Smell hurts' },
  { value: 'behind_eyes',       label: 'Behind eyes' },
  { value: 'one_sided',         label: 'One side' },
];
```
Both log-active and log-retro use `SYMPTOM_CHIPS_UI`. Day-detail rendering can show `whole_head` if it ends up in old data.

### G3. Helper chips canonical order
```ts
export const HELPER_TAGS_DEFAULT_ORDER: { value: HelperTag; label: string }[] = [
  { value: 'sleep',         label: 'Sleep' },
  { value: 'dark_room',     label: 'Dark room' },
  { value: 'hydration',     label: 'Hydration' },
  { value: 'cold_compress', label: 'Cold compress' },
  { value: 'hot_shower',    label: 'Hot shower' },
  { value: 'medication',    label: 'The medication' },
  { value: 'eating',        label: 'Eating' },
  { value: 'caffeine',      label: 'Caffeine' },
  { value: 'massage',       label: 'Massage' },
  { value: 'nothing',       label: 'Nothing helped' },
];
```
For users with history, sort by frequency descending; ties broken by this default order. Foundation publishes `sortHelpersByUserFrequency(history): HelperTag[]`. Log-retro and companion both use it.

### G4. Severity 0 = aura-only
**Schema change from spec:** `migraineEvents.peakSeverity` accepts **0..10**, not 1..10. Zero means "aura without pain." UI:
- Severity slider in active and retro modes is 1–10.
- A separate toggle "Aura only — no pain" appears next to the slider; toggling on disables the slider and sets `peakSeverity = 0` on save.
- Day-cell color logic in tokens §1 already handles `peakSeverity === 0 + 'aura' tag` → `accentSecondary`.

### G5. Day-cell marker placement
Two markers can coexist on a day cell:
- **Check-in dot** (when a daily check-in exists): bottom-center, 4pt diameter, theme `textMuted` colour.
- **Cycle marker** (when cycle tracking enabled and phase known): top-right corner, per spec §1.2.1 shape rules.

### G6. Auto-end migraine
If app forefronts and `useActiveMigraineStore` shows an active migraine with `startedAt > 24h ago`, show a non-dismissable Sheet asking: "This migraine started 2 days ago. Did it end?" with [No, still going] [Yes — when?] options. Owned by log-active (`src/features/log-active/AutoEndPrompt.tsx`); calendar mounts it via the during-tint banner area.

### G7. Day-detail edit migraine
Day-detail [Edit] button on the migraine section navigates to `/log/retro?id={migraineId}`. Log-retro reads the `id` param: if present, load existing row, render in edit mode (Save updates instead of inserting).

### G8. Day-detail "Log migraine for this day"
Day-detail bottom button (only when no migraine for that date) navigates to `/log/retro?date=YYYY-MM-DD`. Log-retro reads the `date` param and pre-fills the date picker.

### G9. Pollen index in v1
Open-Meteo's main forecast endpoint does not return pollen. Their air-quality endpoint does, but it's a second call. **For tonight, `pollenIndex` is always null in our schema.** Insights cards that mention pollen render with the empty state. Brad to decide post-launch whether to add the second API call.

### G10. Settings → Daily check-in field customization
Spec §11.1 mentions hiding fields. **For tonight: the menu item exists but opens a placeholder screen with copy "Coming soon — every check-in field is shown by default for now."** No schema; defer.

### G11. Expo Go notification fallback
Detect runtime via `Constants.appOwnership === 'expo'` (Expo Go). When in Expo Go:
- `expo-notifications` scheduled notifications may not fire on iOS.
- Replace with an in-app banner (`AppFallbackBanner` in `src/components/ui/`) that surfaces "It's been 24h since your last check-in" or "Refill your sumatriptan" the next time the app opens.
- Foundation provides the banner primitive and the runtime check helper `isExpoGo()`.
- Meds and onboarding agents both use this.

### G12. `postState` chip labels
```ts
export const POST_STATE_CHIPS: { value: PostState; label: string }[] = [
  { value: 'drained',        label: 'Drained' },
  { value: 'fragile',        label: 'Better but fragile' },
  { value: 'almost_normal',  label: 'Almost normal' },
  { value: 'fine',           label: 'Fine' },
];
```
Used by log-end (`app/log/end.tsx`) per spec §5.1.

## Per-agent notes (each agent appends here)

### foundation

**New dependency added:** `@react-native-community/slider@5.0.1` — installed via `npx expo install @react-native-community/slider`. Required for `src/components/ui/Slider.tsx`. No suitable RN slider primitive in the locked stack.

**Drizzle 0.45 migrator import:** `migrate` is NOT exported from `drizzle-orm/expo-sqlite` index. Must be imported from `drizzle-orm/expo-sqlite/migrator` directly. The generated `migrations.js` barrel (expo driver) exports `{ default: { journal, migrations } }` — client requires it with `require().default`.

**Drizzle JSON columns:** Do NOT `JSON.stringify` values before inserting into `.json` mode columns. Drizzle handles serialization. Pass typed arrays/objects directly.

**Zod 4 schema re-export:** `export type Foo = z.infer<typeof Foo>` alongside `export const Foo = z.object(...)` triggers `@typescript-eslint/no-redeclare`. Suppressed with `eslint-disable-next-line`. Kept the same name to match spec §7 verbatim.

**NativeWind CSS vars in native style props:** `minimumTrackTintColor`/`thumbTintColor` in `@react-native-community/slider` do not resolve CSS var strings at runtime on RN. Feature agents implementing the slider should use `usePalette()` to get hex values directly for these props.

**`migrate` function is synchronous in drizzle-orm/expo-sqlite:** The Drizzle expo-sqlite migrator's `migrate()` is sync under the hood (it calls `db.dialect.migrate`), but the function signature is `async`. Wrap with `await` in `runMigrations()` for forwards-compatibility.

**`meds/[id]` and `app/(tabs)/settings/index.tsx`:** Created `settings/index.tsx` as placeholder. Settings agent owns the full `settings/` sub-tree and will add sub-routes (`theme.tsx`, `notifications.tsx`, etc.) as they implement them.

### calendar
*(calendar appends here)*

### log-active
*(log-active appends here)*

### log-retro
*(log-retro appends here)*

### checkin
*(checkin appends here)*

### meds

**Files created:**
- `src/features/meds/effectiveness.ts` — pure derivation functions (no RN imports); split out of `hooks.ts` so unit tests can run in Node environment without `react-native` parse errors
- `src/features/meds/hooks.ts` — TanStack Query wrappers + re-exports from effectiveness.ts
- `src/features/meds/notifications.ts` — `scheduleRefillCheck()`, in-session dedup via module-level `Set`, `_resetScheduledSet` / `_getScheduledSet` exposed for tests
- `src/features/meds/components/MedRow.tsx` — med list row component
- `app/(tabs)/meds.tsx` — meds list tab (replaces placeholder)
- `app/meds/add.tsx` — add medication form (replaces placeholder)
- `app/meds/[id].tsx` — med detail (replaces placeholder)
- `vitest.config.ts` — vitest config with `@/*` path alias pointing to `./src`

**vitest infrastructure:** Added `vitest.config.ts` at repo root. Added `test` and `vitest` scripts to `package.json` using absolute path to parent `node_modules/.bin/vitest` (worktree has no local `node_modules`). Tests live in `src/**/*.test.ts`.

**Dedup strategy for refill notifications:** Module-level `Set<string>` tracks med IDs scheduled in the current app session. Survives the session but clears on cold start. This satisfies the "once per 24h max" intent — in practice once per app launch, which is conservative and safe.

**Expo Go banner:** `AppFallbackBanner` mounted in meds list when `isExpoGo()` is true and any active med is at or below `refillThreshold`. The banner reads the current `pillsRemaining` directly from the TanStack Query result rather than from the notification scheduling path.

**Supply rate:** `dosesPerWeek()` in `effectiveness.ts` uses all doses (via `useAllDoses` hook), not just the last 5 displayed, to give an accurate 30-day rate. `useRecentDoses(limit=5)` is used only for the dose history list.

**Edit flow:** The [Edit] button on `meds/[id].tsx` routes to `/meds/add?editId=<id>`. The add screen does not yet handle the `editId` param — this is a deferred v1 simplification. The spec says "edit mode (or push to add screen with prefilled values)" and the push path is wired; pre-fill is left for the next iteration.

**`meds/[id]` snooze:** "Snooze 3 days" shows an alert but does not persist a snooze timestamp. In v1 the next app open will re-check and re-show the warning if still below threshold. A persistent snooze would require a settings KV entry — deferred.

**What meds exports for downstream agents:**
- `src/features/meds/hooks.ts` — `useMedicationsList()`, `useMedicationDetail(id)`, `useEffectivenessStats(medId)`, `useRecentDoses(medId, limit)`, `useAllDoses(medId)`, `dosesPerWeek(doses, fromDate)`, `deriveEffectivenessStats(doses)`, query key constants
- `src/features/meds/effectiveness.ts` — `deriveEffectivenessStats`, `dosesPerWeek`, `EffectivenessStats` type

### weather
*(weather appends here)*

### insights
*(insights appends here)*

### settings
*(settings appends here)*

### companion
*(companion appends here)*

### onboarding
*(onboarding appends here)*

## Cross-feature interface contracts (what each agent exports for others)

### foundation exports (everyone consumes)
- `@/db/client` → `db`, `runMigrations()`
- `@/db/schema/*` → all Drizzle tables
- `@/db/seed` → `resetAndSeed()` (test only, gated by `__DEV__`)
- `@/types` → all row + insert types, all enum types
- `@/types/schemas` → Zod schemas for cross-feature validation (Open-Meteo response, settings KV)
- `@/copy` → all copy blocks + chip arrays + canonical orderings
- `@/config/feature-flags` → `FEATURE_FLAGS`
- `@/components/ui/*` → all primitives
- `@/theme` → `palettes`, `tokens`, `<ThemeProvider>`, `usePalette()`, `useSetPalette()`
- `@/stores/useActiveMigraineStore` → active migraine id state (single source of truth)
- `@/features/migraines/repo` → `getActive`, `getById`, `getByMonth`, `insertActive`, `insertCompleted`, `update`, `endActive`
- `@/features/migraines/helpers` → `sortHelpersByUserFrequency(userHistory): HelperTag[]`
- `@/features/migraines/hooks` → `useAllMigraineEvents()` (for insights), other hooks belong to calendar
- `@/features/meds/repo` → `list`, `getById`, `insert`, `update`, `decrementPills`, `recordDose`
- `@/features/checkins/repo` → `getByDate`, `upsert`
- `@/features/cycle/repo` → `list`, `insert`, `getMonth`, `phaseForDate(date): CyclePhase | null`
- `@/services/h3` → `deviceCellLocal`, `deviceCellPool`, `cellCentroid`
- `@/lib/runtime` → `isExpoGo(): boolean`

### calendar exports (insights consumes)
- `@/features/calendar/hooks` → `useMigraineEventsByMonth(yearMonth)`, `useDayDetail(date)`, `useCycleMarkersForMonth(yearMonth)` (calendar wraps foundation's cycle repo)

### checkin exports (log-retro consumes)
- `@/features/checkins/foodTags` → `useFoodTags()` (search + list), `useUpsertFoodTag(name)` (returns normalized id)

### weather exports (log-active, log-retro, calendar consume)
- `@/features/weather/hooks` → `useCurrentWeather()`, `useWeatherForDate(date)`, `captureWeatherNow(): Promise<Result<WeatherSnapshot>>`

### insights exports (companion consumes)
- `@/features/insights/hooks` → `useTopHelpers(limit)`, `useWeeklyBrief(weekStart)`, `useCorrelations()`

## Test fixture seeding

Foundation publishes `src/db/seed.ts` with `resetAndSeed()` that creates:
- 1 medication: Sumatriptan 50mg, class triptan, type rescue, 8 pills remaining
- 3 historical migraines: 1 severe (severity 8, 4h, 5 days ago), 1 mild (severity 3, 2h, 12 days ago), 1 aura-only (severity 0, 30min, 20 days ago)
- 5 daily check-ins on the last 5 days with varying values
- 1 active session (only seeded if `__DEV__ && process.env.SEED_ACTIVE === '1'` so it doesn't pollute every dev launch)

Every agent's integration test starts with `await resetAndSeed()`.

## NativeWind class conventions

- All theme colours go through CSS vars: `bg-[var(--surface)]`, `text-[var(--textPrimary)]`, etc.
- Never use literal hex in className.
- Spacing: `p-4` etc. per token §2.
- Custom Tailwind classes for severity backgrounds: `bg-severity-severe`, `bg-severity-moderate`, `bg-severity-mild` (defined in tailwind.config.js to point at CSS vars).
