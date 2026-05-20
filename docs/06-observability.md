# Tideline — v0.1 Spec: Observability (crash + hang reporting)

> **For Brad.** Wire up crash, hang, and unhandled-error reporting so beta-tester
> reports like "the app hangs" become actionable instead of opaque.
> Privacy posture: errors + breadcrumbs, **no PII**.

Status: implemented 2026-05-19, backed by Brad's self-hosted **uh-oh** service
at `http://5.161.200.212:8300/`. Original draft of this spec targeted Sentry;
swapped to uh-oh the same day once Brad surfaced that uh-oh had just shipped
its v0.1. The Sentry-era prose has been edited in place; the privacy contract
and acceptance criteria carry over with field-path adjustments for uh-oh's
flatter wire format.

---

## Problem statement

Tideline has no observability. When Nadia or another beta tester says "the app
hangs," we have no stack trace, no breadcrumb of what they were doing, no device
or OS context, and no way to tell whether it's a JS deadlock, a native ANR, a
SQLite lock, a render-loop, or a network stall. The three existing
`console.error` calls (`app/_layout.tsx:32`, `app/_layout.tsx:41`,
`src/services/weather.ts:50`) write to a device console nobody reads. There is
no React error boundary, no `ErrorUtils` global handler, and no unhandled-promise
handler. Phase 1 ends with Nadia using the app for real — we cannot reach that
milestone blind.

## Boundaries

**This does:**

- Capture unhandled JS exceptions, unhandled promise rejections, and React render
  errors and forward them to uh-oh.
- Capture Android ANRs and native crashes via uh-oh's xCrash + UEH bridge.
- Attach scoped, scrubbed breadcrumbs: navigation events, network calls, console
  calls, taps on instrumented controls.
- Auto-attach release version + build number (via env vars), OS, device model.
- Provide a `reportError(err, context?)` helper for code that catches recoverable
  errors but wants telemetry anyway (e.g. weather fetch failure).
- Provide a React error boundary at the root that reports + shows a try-again UI.

**This does NOT:**

- Send any PII or migraine content to uh-oh. See [Privacy contract](#privacy-contract).
- Replace the in-app `Result<T,E>` discriminated-union error pattern. Business
  logic still returns typed errors; uh-oh receives only programmer errors,
  crashes, hangs, and explicitly-reported failures.
- Cover iOS. uh-oh v0.1 is Android-only — Tideline's iOS shell still
  uninstrumented until uh-oh adds iOS support or Tideline grows iOS-specific
  beta users.
- Add session replay or performance tracing in v0.1. (Replay is a privacy
  non-starter; tracing is out of scope for v0.1.)
- Add user-facing "report a bug" form. Out of scope for this spec.
- Add server-side observability (Supabase edge functions). Separate spec when
  Phase 2 brings the server online.

**External dependencies added:**

- `@uh-oh/react-native` — installed via `pnpm add github:cunninghambe/uh-oh#sdk-dist`.
  Auto-published from uh-oh's main branch via `scripts/build-sdk-dist.mjs`.
  Brings the JS SDK + Android native module (xCrash NDK + UEH Java).
- `@react-native-async-storage/async-storage` — peer dep, used by the offline
  spool that queues events when network is unavailable and flushes on
  reconnect / next app launch.
- The uh-oh server itself (already deployed on Brad's Hetzner box at
  `http://5.161.200.212:8300/` — see [[project-uh-oh]] memory).

Adding these deps requires an entry in
[`03-stack-and-deployment.md`](03-stack-and-deployment.md) under "Observability".
That edit is part of this spec's implementation.

## Architecture decision

**New module.** All uh-oh concerns live in a new feature folder:

```
src/observability/
  client.ts              # initObservability(), reportError(), setUserContext()
  client.test.ts         # unit tests for scrubbing + tag shape
  scrub.ts               # PII-stripping breadcrumb + event processors
  scrub.test.ts          # the privacy contract tests live here
  error-boundary.tsx     # root React error boundary component
  types.ts               # local types (ErrorContext, ScrubResult)
  README.md              # one-page operator doc: "where do errors go, how to read them"
```

`app/_layout.tsx` is modified in three places only:

1. Import + call `initObservability()` at module top level (before `SplashScreen.preventAutoHideAsync`).
2. Wrap the existing `<QueryClientProvider>` subtree in `<RootErrorBoundary>`.
3. Replace the two existing `console.error` calls in `useEffect` with
   `reportError(e, { where: 'migrations' })` and
   `reportError(e, { where: 'scheduleDailyCheckinReminder' })`.

`src/services/weather.ts:50` `console.error` is similarly replaced with
`reportError`.

Rationale for a dedicated folder vs. dropping it in `src/lib/`: observability
has its own privacy contract (scrubbing) that needs colocated tests and a
README. `src/lib/` is for pure utilities with no side effects; uh-oh is the
opposite.

## Interface contract

```ts
// src/observability/types.ts

/** Categorises where an error came from. Drives uh-oh tag `tideline.where`. */
export type ErrorWhere =
  | 'migrations'
  | 'scheduleDailyCheckinReminder'
  | 'weatherFetch'
  | 'supabaseSync'         // Phase 2+
  | 'poolIngest'           // Phase 3+
  | 'render'               // from error boundary
  | 'unknown';

export type ErrorContext = {
  where: ErrorWhere;
  /** Optional structured extras. MUST NOT contain PII. Scrubbed before send. */
  extra?: Record<string, string | number | boolean | null>;
};

/** Result of running the event scrubber. */
export type ScrubResult =
  | { kind: 'send'; event: EventEnvelope }
  | { kind: 'drop'; reason: string };
```

```ts
// src/observability/client.ts

/**
 * Initialise uh-oh. Idempotent. Safe to call before fonts/DB are ready.
 * Reads DSN from `EXPO_PUBLIC_UH_OH_DSN`. If missing, logs once and no-ops
 * (dev convenience — devs without a DSN don't get prompts).
 */
export function initObservability(): void;

/**
 * Report a caught error with structured context. Use this in catch blocks
 * where you want telemetry but the error is not unhandled.
 * Returns the uh-oh event ID for correlation with logs, or null if dropped
 * (e.g. scrubber dropped it, or uh-oh is uninitialised).
 */
export function reportError(err: unknown, ctx: ErrorContext): string | null;

/**
 * Set the anonymous install ID as the uh-oh user identifier.
 * Install ID is a random ULID generated once per install, stored in
 * SecureStore. It is NOT a real user ID and never crosses devices.
 * Lets us group "all errors from this install" without identifying anyone.
 */
export function setInstallId(installId: string): void;
```

```ts
// src/observability/scrub.ts

/**
 * uh-oh beforeSend hook. Strips known-PII keys from event payloads,
 * normalises stack frames, and drops events whose tags violate the privacy
 * contract. See PRIVACY CONTRACT section.
 */
export function scrubEvent(event: EventEnvelope): ScrubResult;

/**
 * uh-oh beforeBreadcrumb hook. Strips note/location/migraine content from
 * navigation, fetch, and console breadcrumbs.
 */
export function scrubBreadcrumb(crumb: Breadcrumb): Breadcrumb | null;
```

```tsx
// src/observability/error-boundary.tsx

type Props = { children: React.ReactNode };

/**
 * Root-level React error boundary. On caught render error:
 *  - reports via reportError(err, { where: 'render' })
 *  - shows fallback UI: "Something went wrong" + "Try again" button
 *  - "Try again" clears the captured error and re-mounts children. If the
 *    error reproduces immediately the boundary catches it again and shows the
 *    fallback. No dependency on expo-updates (not installed; avoided per the
 *    project rule about adding deps).
 *  - Uses plain React Native primitives only — no NativeWind, no theme — so a
 *    bug in the theme/styling system cannot prevent the fallback from rendering.
 */
export function RootErrorBoundary({ children }: Props): JSX.Element;
```

## Privacy contract

The whole project has a 3-tier privacy model (see project root `CLAUDE.md`).
uh-oh is a fourth destination and gets the **most restrictive treatment** — it
is a third party we do not control and our users did not opt into.

### Hard-denylist — these MUST NEVER reach uh-oh

| Field | Source | Why |
|---|---|---|
| Free-text notes | `migraines.notes`, `checkins.notes` | Personal medical content |
| Exact GPS coords | `expo-location` results | Identifies home/work |
| H3 hex region | `weather/repo.ts` | Identifies general location |
| Cycle data | `cycle.*` tables | Sensitive medical |
| Brand-name medications | `meds.brand` | Identifies specific drugs |
| Migraine severity values | `migraines.severity` | Personal medical |
| Symptom flags | `migraines.symptoms` | Personal medical |
| Food tags | `checkins.food_tags` | Behavioural |
| Supabase JWT, install ID | env, SecureStore | Auth secret + identifier |

### Allowlist — these MAY reach uh-oh

- Error message + stack trace (with file paths normalised to relative)
- `tideline.where` tag (one of the `ErrorWhere` union)
- Release version, build number, OS, device model, app locale
- Anonymous install ULID (as uh-oh user ID, no other user fields)
- Breadcrumb categories: `navigation`, `http`, `console`, `ui.click`
- Breadcrumb `data` keys: `route` (route name only, no params), `status`
  (HTTP status), `method`, `url.host` (host only, no path or query)

### Scrubber rules

`scrubEvent` MUST:

1. Walk `event.exception.values[].stacktrace.frames[]` and replace any
   absolute file path with the part after `/tideline/`.
2. Delete `event.request` entirely (we don't run on web).
3. Delete `event.user` except for `id` (the install ULID).
4. For every key in `event.extra` and `event.tags`, drop the entry if the key
   matches `/note|gps|location|hex|cycle|brand|severity|symptom|food|jwt|token|password|secret/i`
   (singular `note` catches plural `notes` too).
5. Drop the event entirely if `event.message`, any `exception.value`, or any
   stack `frame.vars` value contains a substring matching the denylist regex
   above.

`scrubBreadcrumb` MUST:

1. Drop breadcrumbs in category `console` whose `message` matches the denylist regex.
2. For `navigation` breadcrumbs, keep `data.from` and `data.to` but strip route
   params: anything in `[brackets]`, anything after `?`, and any path segment
   containing a digit (catches resolved dates like `/day/2026-05-16` and
   numeric/ULID IDs that bypass the bracket form).
3. For `http` breadcrumbs, keep `data.method`, `data.status_code`, and the URL
   host only — overwrite full URL with `${host}/<redacted>`.
4. For `ui.click` breadcrumbs, drop `data.label` (might contain user content);
   keep `data.testID` only.

Tests in `scrub.test.ts` cover all four breadcrumb categories with at least
one positive case (kept and shaped correctly) and one denylist hit (dropped or
redacted). Per [user CLAUDE.md `test_detector_contracts_fully`], also cover
input-degradation (malformed event, missing fields).

## Edge cases

| # | Case | Handling |
|---|---|---|
| 1 | `EXPO_PUBLIC_UH_OH_DSN` missing in dev | `initObservability` logs once: `[observability] DSN not set — disabled` and returns. All subsequent `reportError` calls no-op and return `null`. |
| 2 | uh-oh SDK throws during init (e.g. native module missing in Expo Go) | Catch internally, log once, no-op forever. Never crash the host app because telemetry failed. |
| 3 | `reportError` called before `initObservability` | Internally buffer up to 50 events; flush on init. Drop oldest if buffer fills. |
| 4 | Error boundary catches an error in its own fallback render | Hard-fallback to a plain `<View><Text>Tideline crashed. Force-quit and reopen.</Text></View>` with no further reporting (prevents infinite loop). |
| 5 | Hang detection fires while user is in `companion.tsx` (in-migraine UI) | Hang event sent normally. Companion screen is the most important UX surface — we MUST get hang data here. |
| 6 | User has airplane mode | uh-oh's native transport queues to disk; flushes on next launch with network. No code changes needed; verify in acceptance criteria. |
| 7 | Migration error during `runMigrations()` | Reported with `where: 'migrations'`. App continues to show splash → renders empty calendar (existing behaviour). Migration errors are blocking but not fatal in the spec. |
| 8 | Breadcrumb buffer fills during a 5-minute hang loop | uh-oh default ring buffer (100 crumbs) is sufficient. Don't customise. |
| 9 | Same error fires 1000×/sec from a render loop | Use uh-oh's built-in deduplication (`maxBreadcrumbs`, `sampleRate: 1.0` is fine for beta; switch to `tracesSampleRate: 0.0` to confirm no perf overhead). |
| 10 | Beta tester installs a build, never opens it, errors arrive from another install | Install ULID is per-install — events naturally segregate. |
| 11 | Scrubber regex matches a legitimate error message (e.g. error literally contains "token") | Drops the event. Documented trade-off: privacy over completeness. Add a counter in dev (`__DEV__` console) so we notice if we're dropping too aggressively. |

## Acceptance criteria

Format: Given X, Y happens.

1. **Init success.** Given a valid DSN in `EXPO_PUBLIC_UH_OH_DSN`, when the app
   boots, `initObservability` registers uh-oh within 200ms and a synthetic
   `reportError(new Error('init-smoke'), { where: 'unknown' })` from the dev
   console appears in the uh-oh project within 60s.

2. **Init no-op in dev without DSN.** Given no DSN, when the app boots, no
   crash, no warning beyond the single `[observability] DSN not set` log line,
   and `reportError` returns `null`.

3. **JS exception captured.** Given a button in a dev-only debug screen that
   calls `throw new Error('forced-js-exception')`, the error appears in uh-oh
   tagged `tideline.where=unknown` with full RN stack trace and file paths
   relative to `tideline/`.

4. **Unhandled promise captured.** Given a dev-only button that runs
   `Promise.reject(new Error('forced-unhandled'))`, the error appears in
   uh-oh within 30s.

5. **Render error captured + UI shown.** Given a dev-only debug screen whose
   render throws, `<RootErrorBoundary>` shows the fallback UI with a
   "Reload app" button. Tapping it calls `Updates.reloadAsync()` and the app
   restarts. The error appears in uh-oh tagged `tideline.where=render`.

6. **iOS ANR captured.** Given a dev-only debug button that runs
   `while (Date.now() - start < 5000) {}` blocking the JS thread for 5s, an
   `ANR` event appears in uh-oh from an iOS device build (not Expo Go —
   hang detection requires a dev build with native modules).

7. **Android ANR captured.** Same as #6 on Android — ANR event in uh-oh.

8. **Privacy contract — note text dropped.** Given a synthetic event whose
   `extra.notes = 'I had wine and chocolate'`, the event reaches uh-oh with
   `extra.notes` absent. Unit test in `scrub.test.ts`.

9. **Privacy contract — GPS dropped.** Given a synthetic breadcrumb with
   `data.gps = { lat: 50.1, lon: 14.4 }`, the breadcrumb arrives with that key
   absent. Unit test.

10. **Privacy contract — denylist substring drops whole event.** Given a
    synthetic error message `"failed to insert note 'migraine ended at 14:00'"`,
    the event is dropped entirely. Unit test.

11. **Privacy contract — URL redacted.** Given an HTTP breadcrumb to
    `https://api.open-meteo.com/v1/forecast?latitude=50.1&longitude=14.4`,
    the breadcrumb URL is `api.open-meteo.com/<redacted>`. Unit test.

12. **Offline queue.** With airplane mode on, force three JS exceptions, then
    re-enable network. All three appear in uh-oh within 2 minutes of network
    restore. Manual test on device.

13. **Stack/deps doc updated.** `docs/03-stack-and-deployment.md` has a new
    "Observability" row for `@uh-oh/react-native` with the rationale.

14. **`runMigrations` error reaches uh-oh.** Forcing a migration failure (e.g.
    a temp schema with a syntax error) results in a uh-oh event tagged
    `tideline.where=migrations`, replacing the existing `console.error`.

## Spec for the operator README

`src/observability/README.md` covers, in one page:

- Where errors go (uh-oh org + project name + link)
- How to read the dashboard (filter by `tideline.where`, by release)
- How to triage a hang report from a beta tester (find by install ID, look at
  breadcrumbs leading up to hang event)
- The privacy contract in one paragraph + link to this spec
- How to add a new `ErrorWhere` value

## Resolved decisions

1. **uh-oh server:** `http://5.161.200.212:8300/` (Brad's Hetzner box, Caddy
   reverse-proxy → Fastify on 127.0.0.1:3300). TLS deferred — plain HTTP for
   now per Brad's "raw IP & port for now" call on 2026-05-19. Swap to a real
   domain with Caddy auto-TLS before any non-dogfood traffic. See
   [[project-uh-oh]] memory for the deploy state.
2. **Tideline project public key:** generated 2026-05-19 by the dashboard.
   Stored in `/root/.secrets/uh-oh.md` on the box and inlined into
   `.env.local` + `eas.json` build profiles. The key is not a secret (it ships
   in every mobile binary the customer receives) but we keep it out of
   `.env.example` and source-controlled docs as hygiene.
3. **SDK distribution:** consumed via `pnpm add github:cunninghambe/uh-oh#sdk-dist`.
   The `sdk-dist` branch is an orphan-branch auto-published from main by
   `scripts/build-sdk-dist.mjs` (force-push on every run). Re-run that script
   in `/opt/uh-oh` whenever a new SDK version should ship to consumers.
4. **Install ID storage:** `expo-secure-store` (already a project dep). Not
   yet implemented — `setInstallId()` is wired but never called. Adding install
   ID generation + persistence is a follow-up.
5. **Hang threshold:** uh-oh server-side ANR detection fires when the Android
   OS reports an ANR (5s default). Configurable via the native bridge if we
   need a lower threshold once we see real data.
6. **Sample rate:** every event (no client-side sampling). Volume is bounded
   by uh-oh's per-fingerprint rate limit and the beta cohort size.

## Open questions / follow-ups

1. **Move to a real domain + TLS.** Plain HTTP over the public IP works for
   tonight but the dashboard login password travels plaintext. Cost: ~10 min
   if Brad has a domain he can A-record to `5.161.200.212`. Caddy
   auto-provisions Let's Encrypt.
2. **Install ID lifecycle.** Generate a ULID on first launch, persist in
   `expo-secure-store`, call `setInstallId()` after init. Group events by
   install without identifying users.
3. **Subtask 13 verification.** uh-oh's native xCrash + UEH bridge has
   `[done] (on-device verification pending Brad)` status. Tideline on Nadia's
   Android device is the planned verification path. If hangs or native crashes
   don't surface in the dashboard, that's a uh-oh bug to fix upstream.

## Implementation order (delivered 2026-05-19)

1. ✓ Add uh-oh row to `docs/03-stack-and-deployment.md`.
2. ✓ Deploy uh-oh server to this Hetzner box (systemd + Caddy + UFW + nightly backup).
3. ✓ Create Tideline project in uh-oh dashboard, capture public key.
4. ✓ Write `scripts/build-sdk-dist.mjs` in `/opt/uh-oh`, force-push to `sdk-dist`.
5. ✓ `pnpm add github:cunninghambe/uh-oh#sdk-dist @react-native-async-storage/async-storage` in Tideline.
6. ✓ Write `src/observability/{types,scrub,scrub.test,client,client.test,error-boundary,error-boundary.test}`.
7. ✓ Wire `initObservability()` + `<RootErrorBoundary>` into `app/_layout.tsx`.
8. ✓ Replace `console.error` in `src/services/weather.ts` with `reportError`.
9. ✓ Add dev-only smoke screen at `app/observability-smoke.tsx` (`__DEV__` gated).
10. ✓ Configure `eas.json` env entries for development/preview/production profiles.

Follow-up (NOT done):

- Install-ID lifecycle (point #2 of Open questions above).
- TLS / real domain (point #1).
- EAS Android preview build + APK to Nadia for on-device verification.

Each step is independently completable, verifiable, and committable per project
discipline.
