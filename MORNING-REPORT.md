# Tideline — Overnight Build Report

> Written for Brad, who was asleep. Read this first before opening the app.
>
> **Status: DRAFT — finalised after Wave 2 integration completes.** This file will be updated with final test counts, screen walkthrough, and the QR code instructions before the build ends.

---

## How to start using it

1. **On this server (or wherever the dev server is running):**
   ```bash
   cd /root/tideline
   pnpm start --tunnel
   ```
   The tunnel mode lets Nadia's iPhone reach the dev server through Expo's tunnel infrastructure (no port-forwarding, no public IP needed at her end).

2. **On Nadia's iPhone:**
   - Install **Expo Go** from the App Store (free).
   - Open Expo Go → scan the QR code printed by the dev server above.
   - The app loads in Expo Go in dev mode.

3. **On your Android (for full-feature testing):**
   - Same QR scan in Expo Go for Android.

### Limitations of Expo Go testing
- **Background location pulls won't fire** in Expo Go on iOS (Expo Go limitation, not ours). Weather pulls work foreground only — pull-to-refresh on calendar, automatic on log-active.
- **Scheduled local notifications** (daily check-in reminder, refill reminder) are unreliable in Expo Go on iOS. The app falls back to **in-app banners** that surface the next time the app opens.
- Both limitations go away when you produce a real build via `eas build` (requires a free Expo account).

---

## What works tonight

(Filled in after final integration.)

## What's stubbed (deliberate, per spec §14 feature flags)

- **Cloud sync (Supabase per-user backup)**: feature flag OFF. UI renders on Settings → Account but the toggle is disabled with caption "coming next session". Local SQLite stores everything; data persists between app opens but doesn't sync to a cloud or another device.
- **Community feed (in your area today)**: feature flag OFF. Tab is hidden. Settings → Community sharing renders the full UI with the toggle disabled and the same "coming next session" message.
- **Monthly AI narrative (Claude Haiku)**: feature flag OFF. Insights → "Generate AI narrative" button shows a sheet with the same message.

These three are the cloud-dependent features. Wiring is in place — flipping the flags to `true` and adding Supabase credentials in next session activates them with no UI changes.

---

## Decisions I made tonight on your behalf

(Bullet list filled in after final integration. Will include: spec gap resolutions G1–G12, test infra choices, dependency additions like @react-native-community/slider and expo-file-system, the time-picker workaround, deferred items.)

## Test/build status

(Filled in after final smoke.)

## Known issues / TODOs for next session

(Filled in after final smoke.)

## Repository

- **GitHub:** https://github.com/cunninghambe/tideline (private)
- **Default branch:** `main`
- **All work pushed?** (TBD after final commit)
- **Specs:** `docs/00-overview.md` → `docs/05-build-plan.md`
- **Integration notes (every cross-feature concession):** `INTEGRATION-NOTES.md`

## Suggested next-session priorities

1. Set up free Supabase account → flip `cloudSync` flag → real cross-device sync working
2. Set up free Expo account → produce a TestFlight or APK build for sharing beyond your two phones
3. Wire the Anthropic API call for monthly narrative (your existing Anthropic account)
4. Address whatever Nadia hates about the UX after a day of using it

---

*Generated overnight by an autonomous build process. All code reviewable in the GitHub repo. Spec sign-off captured in conversation history.*
