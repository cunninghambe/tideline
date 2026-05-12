# Tideline — project instructions for future Claude Code sessions

## What this is

Community-powered migraine tracker. iOS + Android via Expo. Spec at [`docs/`](docs/).

Read in order: `00-overview.md` → `01-screens.md` → `02-data-model.md` → `03-stack-and-deployment.md`.

## Source of truth

The spec is the source of truth. Code that contradicts the spec is wrong — update the code, or update the spec first if requirements changed.

## Stack (locked — don't add deps casually)

Read `docs/03-stack-and-deployment.md` for rationale on every dependency. Adding a new dep needs justification documented there.

Core: Expo 54, Expo Router 6, RN 0.81, TS 5.9, NativeWind 4 (Tailwind 3.4), Drizzle + Expo SQLite, Zustand, TanStack Query, Zod, Open-Meteo, Supabase (Month 2+), Claude Haiku (Month 3+).

## The one rule

Three data tiers. Data only flows downstream.

- **Local SQLite** has everything (notes, GPS, brand meds, cycle).
- **Per-user Supabase** mirrors local — encrypted, RLS enforced, only ever touched by the user themselves.
- **Central anonymised pool** is opt-in, default OFF. Receives anonymised data only — bucketed lifestyle fields, precise weather, H3 hex region (~25km). Never receives: notes, exact GPS, brand-name meds, cycle data.

The transformation that produces pool data lives in `supabase/functions/pool_ingest/`. It is the privacy contract. Audit changes to it harder than any other code.

## Common commands

```bash
pnpm install
pnpm start              # Expo dev server
pnpm android            # Android emulator/device
pnpm ios                # iOS simulator (needs Mac) / Expo Go on iPhone
pnpm lint               # ESLint
pnpm typecheck          # tsc --noEmit (add this script when needed)
```

## Operating principles (from spec)

1. Local-first. App works offline.
2. Two-tap logging during an active migraine.
3. No dark patterns, no streak guilt, no notification spam.
4. Honest about uncertainty. Show sample size and confidence with every correlation.
5. Quiet by default. No celebration animations for tracking suffering.
6. Accessible. WCAG 2.1 AA baseline.
7. Data portable. Export your full history any time.

## What requires explicit user permission

These touch shared state. Always ask Brad before:

- Pushing to `cunninghambe/tideline` (or any GitHub action visible to others)
- Submitting to App Store or Play Store
- Adding any third-party paid service
- Buying a domain
- Anything that costs money
- Modifying the anonymisation transform without test coverage

## Phase status

- **Phase 0 — Setup**: scaffold + spec ✓ (this commit)
- **Phase 1 — Solo tracker** (Month 1): calendar, day detail, log-migraine flows, daily check-in, manual sleep, weather, meds list, theme system, local SQLite. Nadia starts using it for real at end.
- **Phase 2 — Personal insights** (Month 2): on-device correlations, weekly brief, settings, data export, Supabase per-user sync.
- **Phase 3 — Community + AI** (Month 3): central pool, opt-in onboarding, community feed, in-migraine companion, monthly Claude narrative.
- **Phase 4 — Launch prep** (Month 4): a11y audit, privacy/ToS lawyer review, Apple Developer account, TestFlight beta, public submission.

## Roles

- **Brad** (GitHub `cunninghambe`): technical reviewer, repo host. Ask him before anything irreversible or paid.
- **Nadia**: primary user, design driver. Owns `docs/01-screens.md`.
- **Claude**: implements. Asks before risky or shared-state actions.

## Memory

User-level memory at `/root/.claude/projects/-root/memory/project_nadia_migraine_tracker.md` has the running context for this project across sessions.
