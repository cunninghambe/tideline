# Tideline — v0.1 Spec: Stack & Deployment

> **For Brad.** Concrete dependency list with rationale, environments, build pipeline, deployment plan.
> Pin exact versions. No semver ranges.

---

## Mobile app stack

### Core

| Package | Version | Why |
|---|---|---|
| `expo` | `~52.0.0` | RN cross-platform, fastest iteration, Expo Go works for Nadia's iPhone without dev account |
| `expo-router` | `~4.0.0` | File-based routing, type-safe, the right default for new Expo apps in 2026 |
| `react` | `18.3.1` | Pinned to what Expo 52 ships |
| `react-native` | `0.76.x` | Same |
| `typescript` | `5.6.x` | Latest stable; strict mode on |

### Styling

| Package | Why |
|---|---|
| `nativewind` `^4.1.x` | Tailwind-for-RN, makes the theme/palette system trivial; CSS variables for the per-palette colour swap |
| `tailwindcss` `^3.4.x` | The actual Tailwind |

Theme palettes live in `src/theme/palettes.ts` as plain objects mapped to CSS vars. Switching theme = updating root vars. Zero re-renders of the tree.

### Local data

| Package | Why |
|---|---|
| `expo-sqlite` | First-party, no native build hassles, works in Expo Go for Nadia's iPhone |
| `drizzle-orm` `^0.36.x` | Type-safe SQL, lightweight, no codegen step at runtime, great DX |
| `drizzle-kit` (dev) | Migration generation |

Migrations live in `src/db/migrations/` and run on app start. Idempotent.

### State & data fetching

| Package | Why |
|---|---|
| `zustand` `^5.0.x` | UI state. Tiny, ergonomic, no provider hell |
| `@tanstack/react-query` `^5.x` | Server state (Supabase reads, weather pulls). Caching, retries, background refetch |

### Auth + sync + cloud

| Package | Why |
|---|---|
| `@supabase/supabase-js` `^2.x` | Auth, db client, edge functions client. We use the JWT-only path; never embed service role |
| `expo-secure-store` | Stores Supabase session token securely on device |

### Native APIs

| Package | Why |
|---|---|
| `expo-location` | GPS for weather pulls. Background location is post-Expo-Go (need a dev build) |
| `expo-notifications` | Daily checkin reminder, refill reminder. Same — local notifications work in Expo Go; rich/scheduled push needs dev build |
| `expo-haptics` | Subtle feedback on key actions (logging, ending migraine). Optional, off by default |

### Date / time / geo

| Package | Why |
|---|---|
| `date-fns` `^4.x` | Date math. Smaller and more functional than moment. We tree-shake to ~10kB |
| `h3-js` `^4.x` | Uber's H3 hex bucketing. Used both in app (figuring out current cell) and in server (pool ingest) |
| `ulid` `^2.x` | Client-generated sortable ids |

### Charts

| Package | Why |
|---|---|
| `victory-native` `^41.x` | Used for the insights dashboard charts. Mature, RN-native, accessible |

### Validation

| Package | Why |
|---|---|
| `zod` `^3.x` | Runtime validation at every boundary: API responses, form inputs, env vars, deep-link params |

### Testing

| Package | Why |
|---|---|
| `vitest` `^2.x` | Unit + integration tests for pure logic and hooks. Fast |
| `@testing-library/react-native` `^12.x` | Component tests via accessible roles |
| `maestro` (CLI, not npm) | E2E tests on real Android device. iOS coverage waits for $99/yr account |

### Lint / format

| Package | Why |
|---|---|
| `eslint` `^9.x` (flat config) | Linting |
| `prettier` `^3.x` | Formatting |
| `@trivago/prettier-plugin-sort-imports` | Stable import order |

### What we explicitly do NOT install

- `moment` — use date-fns
- `axios` — use fetch
- `lodash` — use native + small custom utils
- `redux` / `redux-toolkit` — Zustand is enough
- `styled-components` / `emotion` — NativeWind handles styling
- Any analytics SDK (Amplitude, Segment, Mixpanel) — health data + analytics is a privacy nightmare; we'll add minimal first-party event logging post-launch if needed
- Crashlytics / Sentry — Expo's built-in error reporting first; revisit pre-launch
- Any "AI feature" SDK that claims to learn from the user's data on-device. We use Claude Haiku via our server function only.

---

## Server / backend stack

Supabase project hosts everything. No separate backend server in v1.

### Supabase project layout

- One project: `tideline-prod` (start free tier, ~$25/mo when we exceed)
- Schemas: `auth` (managed), `public` (unused), `app` (per-user data), `pool` (anonymised central data)
- Edge Functions:
  - `pool_ingest` — receives opted-in user data, runs anonymisation, writes to `pool.*`
  - `regional_summary` — returns the "in your area today" aggregated view; enforces ≥50 contributor threshold
  - `monthly_narrative` — proxies to Anthropic API with anonymised user data; returns Haiku-generated summary
  - `weather_proxy` — proxies Open-Meteo so we don't need to ship CORS-exposed API config; lightweight cache
- Cron jobs (Supabase scheduled functions):
  - Nightly: refresh `pool.h3_baselines` materialized view
  - Monthly (1st of month, 00:00 UTC): rotate all `contributor_id` mappings

### Secrets management

- Supabase env vars hold the Anthropic API key (used by `monthly_narrative` only)
- No secrets ship in the mobile app
- The app only ever uses the Supabase **anon** key, and the user's session JWT after sign-in
- RLS is the security boundary. Audit RLS policies the same way you audit auth code

### Anthropic Claude integration

- Server-side only, in `monthly_narrative` edge function
- Model: `claude-haiku-4-5-20251001` (latest Haiku as of cutoff)
- Prompt cache enabled — system prompt is static and reused across all users, only the user's anonymised monthly data varies
- Rate-limited per user: max 3 narrative generations per month per user (UI shows 1, but we allow regen)
- All requests logged with: timestamp, user_id (for billing), model, tokens in/out. Logs purged after 30 days

### Cost ballpark (v1, pre-scale)

| Item | Monthly cost |
|---|---|
| Supabase free tier (up to 500MB DB, 1GB storage, 2M edge function invocations) | $0 |
| Supabase Pro tier (when we exceed) | $25 |
| Anthropic API (Haiku, ~10 narratives/month at first) | <$1 |
| Open-Meteo (free for non-commercial; need commercial license at scale) | $0 |
| Apple Developer Program (annual, paid pre-launch) | $99/yr |
| Google Play Developer (one-time) | $25 once |
| Domain registration (`tideline.health` or similar) | ~$30/yr |

Total v1 monthly: **<$30/mo** until we have ~hundreds of active users. Anthropic costs scale with user count and narrative usage.

---

## Environments

### Development

- Brad's laptop / dev box runs the Expo dev server
- Nadia's iPhone uses **Expo Go** to load the dev app via QR code
- Brad's Android device uses the same dev server (full feature support including background location)
- Local SQLite, local seed data
- Supabase: a separate `tideline-dev` project with throwaway data

### Staging

- TBD if we need it. Likely skip for v1 — we go from dev → prod once Nadia has used it for a month and Brad is happy
- If we do add it: separate Supabase project, separate Expo channel

### Production

- Single Supabase project: `tideline-prod`
- Mobile app distributed via App Store + Play Store + TestFlight beta channel
- Pre-launch: TestFlight only, with friends/family beta cohort

---

## Build pipeline

### Local dev build

```
pnpm install
pnpm db:generate         # generate Drizzle migrations
pnpm db:migrate          # apply to local SQLite
pnpm start               # Expo dev server, scan QR with Expo Go
```

### EAS Build (for native modules / production binaries)

```
eas build --profile development --platform android   # APK for Brad's Android
eas build --profile preview --platform android       # internal testing APK
eas build --profile production --platform all        # Play Store + App Store binaries
```

`eas.json` config:

```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal", "channel": "preview" },
    "production": { "channel": "production", "autoIncrement": true }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "..." },
      "android": { "track": "production" }
    }
  }
}
```

Apple submit config waits until $99/yr account exists.

### CI

GitHub Actions on `cunninghambe/tideline` (when repo is created):

- On every PR: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm db:check` (validates migration consistency)
- On merge to `main`: above + `eas build --profile preview --platform android` to keep a fresh internal APK
- Manual workflow for production builds

### Database migrations

- All migrations checked in to `src/db/migrations/`
- Local: applied automatically on app start
- Supabase: applied via `supabase db push` from CI on merge to main
- No destructive migrations without explicit approval (drop column, drop table)

---

## Repo structure (proposed)

```
tideline/
├── app/                              # Expo Router screens
│   ├── (tabs)/
│   │   ├── index.tsx                 # Calendar home
│   │   ├── insights.tsx              # Patterns dashboard
│   │   ├── community.tsx             # In-your-area feed
│   │   └── meds.tsx                  # Medications
│   ├── day/[date].tsx                # Day detail
│   ├── log/active.tsx                # Active migraine logging
│   ├── log/retro.tsx                 # Retrospective logging
│   ├── companion.tsx                 # In-migraine companion mode
│   ├── settings/                     # Settings sub-routes
│   └── _layout.tsx                   # Root layout
├── src/
│   ├── components/                   # UI primitives, shared
│   ├── features/                     # Feature-scoped logic
│   │   ├── migraines/
│   │   ├── checkins/
│   │   ├── meds/
│   │   ├── insights/
│   │   ├── community/
│   │   ├── weather/
│   │   └── companion/
│   ├── db/
│   │   ├── schema/                   # Drizzle table definitions
│   │   ├── migrations/
│   │   └── client.ts
│   ├── lib/                          # Pure utils (date, geo, formatters)
│   ├── services/                     # External integrations
│   │   ├── supabase.ts
│   │   ├── weather.ts                # Open-Meteo via Supabase proxy
│   │   ├── h3.ts
│   │   └── notifications.ts
│   ├── hooks/                        # Stateful logic
│   ├── theme/
│   │   ├── palettes.ts
│   │   └── tokens.ts
│   └── types/                        # Shared types + Zod schemas
├── supabase/
│   ├── migrations/                   # SQL migrations for the cloud DB
│   └── functions/
│       ├── pool_ingest/
│       ├── regional_summary/
│       ├── monthly_narrative/
│       └── weather_proxy/
├── tests/                            # E2E (Maestro), integration
├── docs/                             # This spec, plus future ADRs
├── .github/workflows/
├── app.json / app.config.ts
├── eas.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## Deployment plan (chronological)

### Pre-coding (now)

1. Spec sign-off from Brad and Nadia ← **we are here**
2. Create `cunninghambe/tideline` private repo on GitHub *(needs explicit permission from Brad)*
3. Create `tideline-dev` Supabase project
4. Initialise Expo project, push first scaffold commit

### Month 1 — Solo tracker

5. Implement local SQLite schema + migrations
6. Implement calendar home screen, day detail, log-migraine flows
7. Implement daily check-in, food tag system, meds list
8. Implement Open-Meteo weather pull
9. Theme system + palette picker
10. Maestro E2E tests on Android
11. Build internal preview APK, install on Nadia's Android (or Brad's)
12. **Nadia starts using it for real**

### Month 2 — Personal insights

13. On-device correlation analytics
14. Insights dashboard + weekly brief generator
15. Settings + data export
16. Sync layer (Supabase per-user, full data)
17. Account creation + email/password auth

### Month 3 — Community + AI

18. Create `tideline-prod` Supabase project; both schemas
19. Pool ingest edge function + anonymisation + audits
20. Opt-in onboarding flow
21. Community feed UI + regional summary edge function
22. In-migraine companion mode
23. Monthly narrative edge function (Anthropic API)

### Month 4 — Launch prep

24. Accessibility audit (axe-core, real screen-reader testing)
25. **Buy Apple Developer account ($99/yr)**
26. Privacy policy + ToS lawyer review
27. App Store + Play Store assets (icon, screenshots, copy)
28. TestFlight beta with friends/family cohort
29. Iterate on beta feedback
30. Public submission

---

## Resolved stack/infra decisions (Brad, 2026-05-11)

1. **Repo:** `cunninghambe/tideline` private. Approved — creation pending Supabase setup resolution (item 2).
2. **Supabase account:** Brad doesn't have one. **Decision:** defer Supabase setup to Month 2. The first ~4 weeks of work (Phase 1: solo tracker) is fully local-first and doesn't touch any cloud service. By the time we add cloud sync, Brad will have time to set up a free-tier Supabase account (no credit card needed for the free tier; takes ~5 min).
3. **Open-Meteo:** Free tier (non-commercial). Not monetizing. ✓
4. **Anthropic API:** Brad's existing Anthropic account / Claude auth. Used by the `monthly_narrative` edge function only (Month 3+). Pennies per narrative. ✓
5. **GitHub Actions:** Free tier sufficient. ✓
6. **Domain:** Deferred. Decide closer to launch. ✓
7. **Monorepo:** Single repo, Expo app + Supabase functions colocated. ✓

---

## What happens after sign-off

I will, in order:

1. Ask you (Brad) for explicit permission to create `cunninghambe/tideline` on GitHub.
2. Once granted, scaffold the Expo + Supabase structure exactly as above.
3. Push the first commit containing: scaffold + this spec doc + a `README.md` pointing to it.
4. Begin Month 1 work, committing per task, with a pull request for each phase that you can review or fast-merge as you prefer.

I will **not**:

- Create the GitHub repo without explicit per-action approval
- Push to `main` without your approval, ever
- Submit to App Store / Play Store without your explicit approval
- Add any third-party service that costs money without first asking
