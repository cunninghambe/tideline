# Tideline

Community-powered migraine tracker. Working codename — final public name TBD before launch.

> **Status:** spec-complete, scaffold-complete, Month 1 in progress.

## Spec

The spec is the source of truth. Read it before changing anything significant:

- [`docs/00-overview.md`](docs/00-overview.md) — vision, scope, principles, timeline
- [`docs/01-screens.md`](docs/01-screens.md) — every screen, every state, every interaction
- [`docs/02-data-model.md`](docs/02-data-model.md) — schemas, sync rules, privacy boundaries
- [`docs/03-stack-and-deployment.md`](docs/03-stack-and-deployment.md) — locked stack, build pipeline, deployment plan

If your change deviates from the spec, update the spec first.

## Quick start

```bash
pnpm install
pnpm start              # Expo dev server, scan QR with Expo Go on iPhone
                        # or `pnpm android` for Android device/emulator
```

You need:
- Node 22+, pnpm 10+
- Expo Go on your phone (App Store / Play Store) for fast iteration
- Android Studio + emulator OR a physical Android device for full-feature testing (background location, scheduled notifications)

## Stack

Locked. Don't add dependencies without justifying in `docs/03-stack-and-deployment.md`.

- Expo 54 + Expo Router 6 + React Native 0.81 + TypeScript 5.9
- NativeWind 4 + Tailwind 3 (theme system)
- Drizzle ORM + Expo SQLite (local-first persistence)
- Zustand (UI state) + TanStack Query (server state)
- Zod (runtime validation at every boundary)
- Open-Meteo (weather, free non-commercial)
- Supabase (per-user cloud + central anonymised pool, Month 2+)
- Anthropic Claude Haiku (monthly narrative, Month 3+)

## Privacy boundary (the one rule you must not break)

Three storage tiers. Data flows downstream only.

| Tier | Contains |
|---|---|
| **Local SQLite** | Full data, including notes, exact GPS, brand-name meds, cycle |
| **Per-user Supabase** | Same as local — encrypted backup + cross-device sync |
| **Central anonymised pool** | Date + H3 hex region + bucketed lifestyle + precise weather. **Never** notes, exact GPS, brand meds, or cycle data |

The anonymisation transform that produces pool data lives in `supabase/functions/pool_ingest/`. Audit it harder than any other code.

## Layout

See `docs/03-stack-and-deployment.md` for the full repo structure.

## Roles

- **Brad** (`cunninghambe`): GitHub host, technical reviewer
- **Nadia**: primary user, design driver, owner of the screens spec
- **Claude**: writes the code; asks before any action that touches shared state (GitHub, App Store, money)
