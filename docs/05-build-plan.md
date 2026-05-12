# Tideline — Parallel Build Plan (overnight)

> Produced by the Plan agent on 2026-05-11. Captures the dependency graph, agent allocation, and spec-gap resolutions used by the autonomous overnight build. **Reference for integrators and future sessions.**

## Phasing

```
Phase 0 — foundation (sequential, blocking everything)
   ↓
Phase 1 — Wave 1: 5 parallel coder agents
   - calendar, weather, meds, onboarding, settings
   ↓
Integration checkpoint 1 (rebase, typecheck, smoke-test app boot)
   ↓
Phase 2 — Wave 2: 5 parallel coder agents
   - checkin, log-active, log-retro, companion, insights
   ↓
Integration checkpoint 2 (full Expo Go smoke test)
   ↓
Phase 3 — Final pass: dev server + morning report
```

## Foundation must publish before any feature agent starts

- Path alias fix (`@/*` → `./src/*`, `@app/*` → `./app/*`)
- Template cleanup (delete unused create-expo-app boilerplate)
- NativeWind fully wired (verify with one className in `_layout.tsx`)
- Theme system: palettes, tokens, provider, `useTheme` hook
- Drizzle: schemas, generated migration, client, runMigrations()
- **Shared repos** (so feature agents don't reinvent CRUD): `src/features/migraines/repo.ts`, `meds/repo.ts`, `checkins/repo.ts`, `cycle/repo.ts`, `weather/repo.ts`
- Base UI primitives in `src/components/ui/`
- Copy module `src/copy/index.ts`
- Feature flags `src/config/feature-flags.ts`
- Shared schemas / types `src/types/index.ts`, `src/types/schemas.ts`
- Navigation skeleton: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(onboarding)/_layout.tsx`, `app/index.tsx` (redirect)
- Stores: `useThemeStore`, `useActiveMigraineStore`
- Seed data `src/db/seed.ts`
- `INTEGRATION-NOTES.md` (extends the spec-gap resolutions baked in by integrator)

## Wave 1 agents (independent — no Wave-1-internal deps)

| Agent | Spec | Key files |
|---|---|---|
| **calendar** | §1, §1.2.1, §2 | `app/(tabs)/index.tsx`, `app/day/[date].tsx`, `src/features/calendar/*` |
| **weather** | tokens §7-8, data model | `src/services/{weather,h3}.ts`, `src/features/weather/*` (no screens) |
| **meds** | §10 | `app/(tabs)/meds.tsx`, `app/meds/{add,[id]}.tsx`, `src/features/meds/*` |
| **onboarding** | §0 | `app/(onboarding)/*`, `src/features/onboarding/*` |
| **settings** | §11 | `app/(tabs)/settings/*`, `src/features/settings/*` |

## Wave 2 agents (depend on Wave 1 outputs already merged)

| Agent | Spec | Depends on Wave 1 |
|---|---|---|
| **checkin** | §7 | foundation only; exports `useFoodTags()` for log-retro |
| **log-active** | §3, §5, §1.5 | weather (`captureWeatherNow`), meds (`list`) |
| **log-retro** | §4 | checkin (`useFoodTags`), meds, weather |
| **insights** | §8 | calendar (`useMigraineEventsByMonth`), exposes `useTopHelpers` for companion |
| **companion** | §6 | insights (`useTopHelpers`) |

## Spec-gap resolutions (locked into INTEGRATION-NOTES.md)

1. **Palettes:** ship 4 (Calm Sand, Soft Storm, Quiet Night, Forest Pale). "Custom" deferred post-v1.
2. **Symptom tags:** schema has 9; UI shows 8 (omit `whole_head`). Foundation publishes both type + UI-ordered chip list.
3. **Helper chips:** canonical order from spec §4.5 — Sleep, Dark room, Hydration, Cold compress, Hot shower, The medication, Eating, Caffeine, Massage, Nothing helped.
4. **Severity 0 = aura-only:** schema constraint changed from 1..10 to 0..10. UI slider stays 1–10; an explicit "Aura only — no pain" toggle sets severity to 0.
5. **Day-cell markers:** check-in dot bottom-center, cycle marker top-right (no collision).
6. **Auto-end migraine:** if `startedAt > 24h ago` and `endedAt = null`, prompt user "Did this end? When?" sheet on app foreground. Owned by log-active.
7. **Day-detail edit migraine:** reuse `app/log/retro.tsx?id=...` for editing existing migraines. Log-retro handles the param.
8. **Day-detail "Log migraine for this day":** `router.push('/log/retro?date=YYYY-MM-DD')`. Log-retro handles the param.
9. **Pollen index null in v1:** Open-Meteo air-quality endpoint is separate; not implemented tonight.
10. **Settings → Daily check-in fields customization:** placeholder card "coming soon" for tonight; owned by settings.
11. **Expo Go notifications fallback:** detect `Constants.appOwnership === 'expo'`, degrade to in-app banner instead of system notification. Affects meds (refill) + onboarding (permission ask).
12. **`postState` chip mapping:** "Better but fragile" → `fragile`; foundation publishes `POST_STATE_CHIPS` with display labels.

## Integration risks

See full plan agent output for the complete risk register. Top three:
- Two agents define `MigraineRow` differently → foundation publishes canonical type from `@/types`.
- Helper-chip frequency-sort logic implemented twice → foundation publishes `sortHelpersByUserFrequency()`.
- Active-migraine state duplicated → foundation owns `useActiveMigraineStore` as single source of truth.

## Sequencing rationale

Two waves of five with an integration checkpoint between them, not all 10 at once. Reasons:
- Worktree merges scale superlinearly with concurrent branches
- Integrator (me) needs to hold a synthesis of in-flight work; 5 is tractable, 10 is not
- Foundation bugs would be inherited 10 times if all fired at once
