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

**vitest.config.ts created:** No vitest config existed. Added `vitest.config.ts` at repo root with `environment: 'node'` and path alias resolution matching `tsconfig.json`. Tests live at `src/**/*.test.ts`.

**Component render tests blocked by runtime:** `@testing-library/react-native` v13 requires `jest` + `react-test-renderer`, neither of which is installed. The component test in `CalendarMonthGrid.test.ts` tests the pure data-mapping logic (migraine map, checkin set, `dayCellColor` with component-realistic inputs) rather than mounting the component. A full mount test requires jest-expo to be added — tracked here for the integration step.

**Checkins loaded per-day in calendar screen:** `getByDate` is called for migraine days + last 7 days of the month. There is no `getByMonth` equivalent for checkins in `@/features/checkins/repo`. Integration step may want to add `getByMonth(yearMonth)` to the checkins repo to avoid N+1 queries. Calendar currently loads ~7–30 queries per month refresh — acceptable for v1 offline-first, but flagged.

**Weather graceful degradation:** `DayDetailScreen` renders a no-op `WeatherPlaceholder` component when weather feature is not yet merged. Wire up to `@/features/weather/hooks → useWeatherForDate(date)` at integration step.

**`pointerEvents: 'none'` on during-tint overlay:** RN 0.81 supports `pointerEvents` as a style prop directly (not as a View prop). Used as style property per modern RN API.

**Route paths used:** `/log/retro?date=YYYY-MM-DD` and `/log/retro?id={migraineId}` for day-detail navigation per G7/G8. Log-retro agent handles these params.

### log-active
**Note for log-active (preset by integrator):** Weather agent exports `captureWeatherNow()` as a plain async function AND a `captureNow` callback returned from `useCurrentWeather()`. The standalone `captureWeatherNow()` does NOT auto-invalidate the TanStack Query cache (it can't call `useQueryClient()` outside a hook). Use `useCurrentWeather().captureNow` for automatic cache invalidation, or invalidate manually with `queryClient.invalidateQueries({ queryKey: ['weather', 'current'] })` after calling the bare function.

### log-retro

**Files created:**
- `app/log/retro.tsx` — replaces placeholder; full retrospective logging screen
- `src/features/log-retro/logic.ts` — pure logic (no RN imports): `RetroFormState`, `QueuedDose`, `makeInitialState`, `hasChanged`, `toDate`, `toISODate`, `formatHHMM`, `normaliseFoodTagName`, `toggleInList`
- `src/features/log-retro/logic.test.ts` — 30 unit tests covering all pure logic; runs in Node (no RN)
- `src/features/log-retro/hooks.ts` — TanStack Query hooks: food tags fallback, sorted helpers, meds list, migraine-by-id, checkin-for-date, save (insert + update)
- `src/features/log-retro/components/TimeSection.tsx` — start/end date+time steppers + "still going" toggle
- `src/features/log-retro/components/SeveritySection.tsx` — severity slider + aura-only toggle + symptom chips
- `src/features/log-retro/components/FoodWaterSection.tsx` — read-only checkin display OR inline food/water entry
- `src/features/log-retro/components/MedsSection.tsx` — med picker sheet + queued dose list
- `src/features/log-retro/components/HelpersSection.tsx` — helper chips (frequency-sorted)

**`@/features/checkins/foodTags` not yet exported by checkin agent:** Fell back to direct Drizzle queries against `food_tags` table in `useFoodTagsFallback()` / `useUpsertFoodTagFallback()`. Both normalise food tag names (lowercase + trim) per spec. Integration step: once checkin agent's `@/features/checkins/foodTags` is merged, swap `useFoodTagsFallback` / `useUpsertFoodTagFallback` calls in `hooks.ts` for `useFoodTags` / `useUpsertFoodTag` from that module.

**Queued doses pattern:** `QueuedDose` (defined in `logic.ts`) has no `migraineEventId` — it is added at flush time. `useSaveRetro` calls `migraineRepo.insertCompleted` first, gets the id from `result.value.id`, then calls `medsRepo.recordDose` for each queued dose with `migraineEventId` set to the new id. Edit mode: additional doses queued during editing are also flushed after `update` returns.

**Edit mode (G7):** `?id=<migraineId>` param → `useMigraineById` loads the row → `formFromMigraineRow` maps it to `RetroFormState` → save calls `migraineRepo.update`. Save button label becomes "Update".

**Prefill date (G8):** `?date=YYYY-MM-DD` param → passed to `makeInitialState(prefillDate)` → start date stepper pre-populated.

**Aura-only (G4):** Toggle sets `auraOnly = true` on the form; save maps that to `peakSeverity = 0`. Slider remains visible on aura-only — severity value is ignored.

**Food + water section (resolved decision #1 — before meds):** When a check-in exists for the start date, shown read-only with a link to `/checkin/<date>`. When absent, inline mini-form appears (water Stepper + food chip picker + "+ Add" flow). On save in insert mode, if `inlineCheckinDate` is set and `waterCups > 0 || foodTagIds.length > 0`, `checkinsRepo.upsert` writes a `daily_checkins` row.

**Helper sort (G3):** `useSortedHelpers` calls `sortHelpersByUserFrequency(allMigraines ?? [])`, then maps tags to labels via `HELPER_TAGS_DEFAULT_ORDER`. Tie-break handled inside the helper function.

**Discard confirmation:** `hasChanged(form, initialForm)` in `handleCancel`. If true, opens a Sheet with "Discard" (danger) and "Keep editing" (secondary). If false, `router.back()` immediately.

**`isSaving` is local `useState`:** `useSaveRetro.save()` is synchronous. The flag flips true/false synchronously around the try/finally — it will never be `true` when the next render fires. If Supabase sync is added later, convert `save` to async.

**Slider colours note:** The Slider primitive uses CSS var strings for tint colours per foundation. If slider thumb colours are wrong on device, use `usePalette().accentPrimary` per foundation's INTEGRATION-NOTES note.

**Test count:** 30 unit tests in `src/features/log-retro/logic.test.ts`. Covers all `hasChanged` field paths (13 cases), queued-dose flush contract, `toDate`, `toISODate`, `formatHHMM`, `normaliseFoodTagName`, `toggleInList`.

**Checks passed:**
- `pnpm typecheck` — 0 errors
- `pnpm lint` — 0 warnings, 0 errors
- `pnpm test` — 224 tests pass (194 existing + 30 new)

### checkin

**Files created:**
- `app/checkin/[date].tsx` — replaces the foundation placeholder with the full daily check-in screen per spec §7
- `src/features/checkins/foodTags.ts` — `normalizeFoodTagName` (pure), `useFoodTags()`, `useUpsertFoodTag()`
- `src/features/checkins/hooks.ts` — `useCheckinForDate(date)` and `useUpsertCheckin(date)` TanStack Query wrappers
- `src/features/checkins/components/FoodTagPicker.tsx` — chip row + Sheet-based tag picker with search + "Add new" flow
- `src/features/checkins/foodTags.test.ts` — 11 unit tests: `normalizeFoodTagName` edge cases + upsert logic
- `src/features/checkins/checkin.test.ts` — 12 tests: repo (getByDate, upsert insert/update/partial), copy verbatim strings

**`useUpsertFoodTag` return type:** `mutationFn` must return `Promise<FoodTagRow>` (not a bare value). Wrapped the synchronous DB call with `Promise.resolve()`. Generic `useMutation<FoodTagRow, Error, string>` type parameters added to let TypeScript infer `mutateAsync` correctly.

**Cycle option type narrowing:** `checkinCopy.cycle.options` is `readonly` (deep const), so a plain `as` cast to a mutable `[]` fails at TS. Used `.map(o => ({ value: o.value as CycleOption, label: o.label }))` instead — maps to a fresh mutable array with the narrowed union type.

**Partial save semantics (spec §7.3):** All numeric fields are passed as-is; only `notes` is explicitly guarded to `null` on empty string. The spec says empty fields "just don't save" — Drizzle `upsert` writes whatever is passed, so callers can pass `null` for fields they want omitted. The screen passes the current state values (defaulting to 0 / '' on first open) which is correct — water 0 = none consumed, caffeine 0 = none consumed. Only notes goes to null on empty string to avoid storing "".

**Cycle event insert on save:** `cycleRepo.insert()` is fire-and-forget (no await). The result is a `Result<CycleRow>` discriminated union; the screen does not surface the error to the user (a failed cycle log should not block the checkin save). If cycle logging errors matter downstream, add a separate alert here.

**`useSetting` for cycle tracking:** reads `'cycle.tracking_enabled'` (string `'true'/'false'`) from the settings KV store per INTEGRATION-NOTES settings key conventions. Falls back to `'false'` (disabled) if not set.

**NativeWind `gap` in `contentContainerStyle`:** `gap` in inline `contentContainerStyle` object works on RN 0.81 (uses Yoga gap support). Avoided `contentContainerClassName` because NativeWind 4 doesn't always apply gap reliably on ScrollView containers — used `style` object instead (confirmed pattern from existing screens).

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

**Vitest config added:** `vitest.config.ts` at worktree root — sets `environment: 'node'`, `globals: true`, and resolves `@/` → `./src`. Run with `npx vitest run` from the worktree directory (not `pnpm vitest run` from the repo root, which doesn't find the worktree config).

**Background refresh deferred:** The 4-hour background pull (spec §7 pull cadence) requires native background task support. Not implemented in v1. When `expo-task-manager` / `expo-background-fetch` are added in Phase 2, wire them to call `captureWeatherNow()` with a 4-hour interval. Gap: app only pulls on foreground (if stale) and when log-active calls `captureWeatherNow()` directly.

**Privacy boundary tested:** Integration test explicitly asserts that `weatherSnapshots` rows have no `latitude`/`longitude` properties, and that `deviceLocations.weatherSnapshotId` matches the snapshot row id. This is the canonical test for the privacy contract.

**`weather_unavailable` flag:** `WeatherSnapshotWithFlag` in `src/features/weather/types.ts` extends `WeatherSnapshotRow` with an optional non-persisted `weather_unavailable: true` property. Callers (log-active, log-retro) should check this flag and show a "weather unavailable" badge. The flag is never stored in the DB.

**`useCurrentWeather` auto-trigger pattern:** Uses a shadow query (`['weather', 'current', 'auto']`) to trigger `captureWeatherNow()` on mount when data is stale. The shadow query's result is discarded; only the subsequent invalidation of `['weather', 'current']` matters.

**`useWeatherForDate` date boundary:** Filters `capturedAt >= start` in SQL; the `< end` check is done in JS. This avoids an unused `lt` import and keeps the Drizzle query simple.

### insights
*(insights appends here)*

### settings

**New dependency added:** `expo-file-system ~19.0.22` — installed via `npx expo install expo-file-system`. Required by `src/features/settings/exporter.ts` to write the JSON export to the app cache directory before sharing. Added to `package.json`.

**expo-file-system v19 legacy API path:** The modern `expo-file-system` v19 export does NOT include `cacheDirectory`, `writeAsStringAsync`, or `EncodingType` on its main entry point — these moved to a legacy sub-path. The exporter imports directly from `expo-file-system/build/legacy/FileSystem` and `expo-file-system/build/legacy/FileSystem.types`. Metro resolves these at runtime; vitest mocks them by path in tests.

**Settings KV store:** `src/features/settings/store.ts` exports `getSetting(key)` / `setSetting(key, value)` (sync, direct DB) and `useSetting(key, fallback)` / `useSetSetting()` (React hooks via TanStack Query). Other agents may import these if they need to read/write settings (e.g. onboarding writing `onboarding.completed`, notifications writing time prefs).

**Settings key conventions (all string-encoded):**
- `theme.palette` — PaletteName (e.g. `'calm_sand'`)
- `theme.mode` — `'light' | 'dark' | 'system'`
- `cycle.tracking_enabled` — `'true' | 'false'`
- `community.sharing_enabled` — `'true' | 'false'`
- `notifications.daily_checkin_enabled` — `'true' | 'false'`
- `notifications.daily_checkin_time` — `'HH:MM'` (24h)
- `notifications.refill_reminders_enabled` — `'true' | 'false'`
- `notifications.in_migraine_enabled` — `'true' | 'false'`
- `onboarding.completed` — `'true' | 'false'`

**Delete flow:** `deleter.deleteAll()` wipes all tables in FK-safe order, calls `runMigrations()`, then sets `onboarding.completed = false`. Navigates to `/(onboarding)/welcome` after success. Cloud deletion is out of scope while `FEATURE_FLAGS.cloudSync = false`.

**vitest + vi.hoisted pattern:** When mocking modules that reference outer `const` variables in `vi.mock()` factories, use `vi.hoisted()` to create the mock functions — otherwise hoisting causes "Cannot access before initialization" errors at runtime.

### companion
*(companion appends here)*

### onboarding

**Time picker: no new dependency.** Spec says "use a simple inline picker or RN `<DateTimePicker>` — if you must add a dep, use `@react-native-community/datetimepicker`." The inline picker using two `Stepper` components (hour 0–23, minute 0–59 in steps of 5) is sufficient and avoids the dep. No `@react-native-community/datetimepicker` installed.

**Button accessibilityLabel:** `Button` from `@/components/ui/Button` uses `label` as its internal `accessibilityLabel` (see Pressable in Button.tsx). Do not pass `accessibilityLabel` as a separate prop — it's not in `ButtonProps` and will cause a TS error.

**Notifications screen primary CTA:** The `onboardingCopy.notifications.primary` string is `'Yes, remind me'`, not `'Yes, remind me at 9:00'` as spec §0.3 prose suggests. The copy module is the source of truth per spec §6. The time is shown inline via the picker instead.

**Settings key-value writes:** `writeSetting(key, value)` in `src/features/onboarding/repo.ts` handles all five settings keys. Uses Drizzle `insert().onConflictDoUpdate()` on `settings.key` primary key.

**MiniCalendarPreview:** `src/features/onboarding/components/MiniCalendarPreview.tsx`. Pure presentational, takes `palette: PaletteTokens`. 4×7 grid, 3 highlighted cells at fixed positions (row 0 col 2 = severe, row 1 col 5 = moderate, row 3 col 1 = mild). Hidden from accessibility tree (decorative).

**Expo Go caption (G11):** Shows `"Reminders show as in-app banners in Expo Go."` as a `Text` element below the time picker when `isExpoGo()` returns true. Does not block the permission flow.

**vitest config:** Added `vitest.config.ts` (node env, `@/` alias) and `test`/`test:watch` scripts to `package.json`. 105 tests pass. Tests cover: verbatim copy strings for all 5 screens, palette count/names (spec G1), all 15 palette tokens for all 4 palettes, `formatHHMM` edge cases, `writeSetting` mock integration, `MiniCalendarPreview` severity colours per palette, and full flow settings contract.

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
