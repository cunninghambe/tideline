# Tideline observability

Where Tideline's errors, hangs, and Android crashes land — and how to read them.

Full spec: [`docs/06-observability.md`](../../docs/06-observability.md).

## Where errors go

Brad's self-hosted **uh-oh** instance: `http://5.161.200.212:8300/`. Log in with the admin password from `/root/.secrets/uh-oh.md`. Tideline events show up under the `tideline` project.

DSN format: `http://<publicKey>@5.161.200.212:8300`. Lives in `EXPO_PUBLIC_UH_OH_DSN` — real value in `.env.local` (gitignored) and in `eas.json` build profiles; placeholder in `.env.example`.

## How to read the dashboard

Useful filters:

- **`tideline.where:weatherFetch`** — anything that bubbled up from the Open-Meteo client
- **`tideline.where:migrations`** — Drizzle migration failures on app start
- **`tideline.where:render`** — caught by the root `<RootErrorBoundary>` (something blew up during render)
- **`tideline.where:scheduleDailyCheckinReminder`** — notification scheduling failures
- **Filter by `release.version`** — narrow to a single build (passed via `EXPO_PUBLIC_APP_VERSION` + `EXPO_PUBLIC_APP_BUILD` at build time)
- **Filter by `exception.mechanism`** — `js-global` / `js-promise` / `js-manual` distinguish unhandled JS, unhandled rejections, and reportError calls; `android-anr` / `android-java-ueh` / `android-ndk-signal` distinguish ANR, Java uncaught, and native crash via xCrash

## How to triage a hang report

1. Get the rough time from the user.
2. Filter the dashboard by that window + `exception.mechanism:android-anr` (or `android-java-ueh` for a hard crash that froze the UI before dying).
3. If found: open the event, scroll to **Breadcrumbs**. Look at the last 5–10 to see what the user was doing in the seconds before the freeze.
4. If no ANR event but the user says it hung: the freeze may have been below Android's 5s ANR threshold, or in JS code the OS doesn't flag. Check the same window for any JS exception or unhandled promise rejection — often a render loop manifests as both a hang and a stream of identical exceptions.
5. The breadcrumb `category:navigation` entries tell you the route flow. `category:http` entries tell you which network calls were in flight. `category:ui.click` entries show the last interaction (we only keep `testID`, not labels).

## The privacy contract (one paragraph)

uh-oh receives error messages, stack traces, scrubbed breadcrumbs, an anonymous install ULID (once we wire that), and device/OS/release metadata. uh-oh NEVER receives: free-text notes, exact GPS, H3 hex regions, cycle data, brand-name medications, severity/symptom values, food tags, JWTs, or anything that could identify a specific user or migraine. The scrubber in `scrub.ts` enforces this with a denylist regex applied to the event payload and to every breadcrumb in the envelope; tests in `scrub.test.ts` are the contract. **Audit `scrub.ts` harder than any other code in this folder.**

## How to add a new `ErrorWhere` value

1. Add the literal to the `ErrorWhere` union in `types.ts`.
2. Call `reportError(err, { where: 'newValue' })` in the catch block.
3. Add a dashboard filter for `tags.tideline.where=newValue` if you care about it.

That's it — no uh-oh config change needed. Tags are free-form on the wire.

## What is NOT instrumented (yet)

- iOS. uh-oh v0.1 is Android-only. Tideline's iOS shell installs the JS layer (so JS exceptions get reported even on iOS), but native crashes and ANRs are not captured.
- Server-side errors (Supabase edge functions) — separate spec, comes in Phase 2.
- Session replay — privacy non-starter. Won't add.
- Performance tracing — not in uh-oh v0.1.
- Install ID lifecycle — `setInstallId()` is wired but no caller generates the ULID + persists to `expo-secure-store` yet. Follow-up.
- User feedback widget — not in v0.1.

## How to verify after a release

Open the dev-only smoke screen (`__DEV__` only, route: `/observability-smoke`) and fire each of the five test buttons. All five should produce a uh-oh event within 60s with the correct `tideline.where` tag. ANR detection (button #5) only works in an EAS dev build / preview APK — Expo Go doesn't ship the native module.
