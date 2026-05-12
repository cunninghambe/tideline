# Tideline — v0.1 Spec: Overview

> **Status:** Draft for review. Working codename "Tideline" — final public name TBD before launch.
> **Audience:** Nadia (user #1, design driver) and Brad (technical reviewer, GitHub host).
> **Last updated:** 2026-05-11

---

## What we're building

A migraine tracking mobile app that learns from each user's own data and, with explicit opt-in, contributes anonymised observations to a community pool that surfaces environmental triggers no individual could see alone.

Three things make Tideline different from the dozen-plus migraine apps already on the App Store:

1. **In-the-moment companion.** Most apps make you do work to log. Tideline switches into a calm, low-light "during" mode the moment you log an active attack — vetted tips, your own history of what helped, and minimal taps because you feel awful.
2. **Real environmental science.** Auto-pulls barometric pressure, humidity, temperature, and weather trend data. Surfaces which of *your* triggers actually correlate.
3. **Community-powered geo-signals.** Opt-in users contribute anonymised data bucketed by H3 hex region (~10–25km). When 14 people in your region all have a migraine on the same day, the app tells you what the conditions were. Nobody else is building this.

## Who it's for

**Primary user:** Nadia. Adult woman who gets occasional migraines, wants to understand her triggers, wants help in the moment, willing to log daily inputs for a few weeks to get value.

**Future users (post-launch):** Migraine sufferers who care enough to track. Skews female (migraine prevalence ~3:1). Tech-comfortable enough to install an app and grant location. Likely already tried Migraine Buddy or N1-Headache and found them too clinical, ugly, or paywalled.

**Explicitly not for:** People who want a passive background app (Tideline needs daily inputs to learn). People who want medical-grade diagnosis or AI medical advice (we're not doctors and we won't pretend).

## In scope for v1

- Calendar home view with themeable palette + meaningful colour encoding
- Log a migraine: active mode (during) and retrospective mode (after the fact)
- Daily inputs: sleep, stress, water, food tags, caffeine, menstrual cycle
- Auto weather pull (Open-Meteo)
- Medication management: meds list, dose + time logging, refill tracking
- On-device personal insights dashboard
- In-migraine companion mode (curated tips + personalised from your history)
- Opt-in community feed: "in your area today" environmental signals
- Monthly opt-in AI narrative summary (Claude Haiku)
- Cloud sync of personal data (Supabase, encrypted, per-user)
- Settings: theme, sharing toggles, account, export your data

## Explicitly out of scope for v1

- HealthKit / Fitbit / Apple Watch / Google Fit integration *(deferred — manual entry of sleep for now)*
- AI chat during migraines *(rejected — liability, no medical advice from AI)*
- Apple Watch app, iPad-specific UI *(phone first)*
- Doctor-facing dashboard / sharing reports with clinicians *(post-v1)*
- Multi-language support *(English only at launch)*
- Web app *(phone first, web view possibly later)*
- Photo logging *(food / aura visuals — too much friction for v1)*

## Privacy posture (the most important section)

This is health data. We treat it with the seriousness that implies.

**Three data tiers, and what lives where:**

| Tier | What's there | Who can read it |
|---|---|---|
| **Local (your phone)** | Everything — full migraine logs, food, meds with brand names, free-text notes, exact GPS, cycle data | Only you on your device |
| **Per-user cloud (Supabase)** | Same as local — full sync of your personal data, encrypted at rest, behind your account | Only you, signed in to your account |
| **Central anonymised pool** | Date, H3 hex region (~10–25km), did-you-have-a-migraine, severity bucket, weather snapshot, sleep hours, stress 1-5, caffeine cups, food *tags* (not brands), medication *classes* (not brands) | Aggregated, never per-user |

**What never leaves your device or per-user cloud, regardless of opt-in:**
- Free-text notes
- Exact GPS coordinates (only the H3 hex centroid is uploaded, and only if you opt in)
- Menstrual cycle data
- Brand-name medications (we upload the class — "NSAID" — not the brand — "Advil 400mg")
- Photos (we don't take any in v1 anyway)
- Email, name, phone number beyond what's needed for your account

**Sharing is opt-in, default OFF.** Onboarding explains the community benefit and asks. People who want pure-personal use never see a community feed.

**Aggregation thresholds:** No pattern is shown to any user that would identify another user. The "in your area" feed only displays insights when ≥50 users are active in that H3 region. Single-user insights stay personal.

**Pre-launch requirements:**
- Privacy policy reviewed by a lawyer (not generic generated text)
- Terms of Service reviewed by a lawyer
- "This is not medical advice" disclaimer where any tip / prediction / pattern is shown
- Data export tool (full JSON download of your own data)
- Account deletion that actually deletes (including from the central pool's user-attributable identifiers)

## Operating principles

These are the rules I'll hold the implementation to.

1. **Local-first.** The app works offline. Sync is a background nicety, not a requirement to log a migraine.
2. **Two-tap logging.** Logging an active migraine takes two taps minimum. Anything more during an attack is too much.
3. **No dark patterns.** No streak guilt-trips, no notification spam, no "premium" upsells around features people need.
4. **Honest about uncertainty.** Correlations are shown with sample size and confidence. We never say "X causes your migraines" — we say "X appears in 7 of your last 10 attacks, but you've only logged 12 attacks total."
5. **Quiet by default.** Empty states, low colour, no celebration animations for tracking suffering.
6. **Accessible from day one.** WCAG 2.1 AA baseline. Big tap targets. Works with screen readers. Works in dark mode and in actual darkness.
7. **Data portability.** Users can export their full history at any time, in a format they can read.

## Timeline (realistic, not optimistic)

3–4 months from spec sign-off to public launch. Internal phasing keeps Nadia using it from week 4 onward so she's collecting real data while the rest gets built.

| Phase | Weeks | What ships |
|---|---|---|
| **0 — Setup** | 1 | Repo scaffold, Expo project, Supabase project, CI, base navigation, theme system |
| **1 — Solo tracker** | 2–4 | Calendar, day detail, log-migraine flow (active + retro), daily inputs, manual sleep, weather pull, meds list, local SQLite. **Nadia starts using it for real at end of week 4.** |
| **2 — Personal insights** | 5–6 | On-device correlation dashboard, weekly brief, settings, theme picker, data export |
| **3 — Cloud + community plumbing** | 7–9 | Supabase sync, account/auth, opt-in onboarding flow, anonymised pool upload, H3 bucketing, community feed UI (empty until other users exist) |
| **4 — Companion + AI** | 10–11 | In-migraine companion mode, monthly Claude Haiku narrative, refill tracking |
| **5 — Polish + launch prep** | 12–14 | Accessibility audit, privacy policy lawyer review, ToS, App Store / Play Store assets, beta cohort onboarding, $99/yr Apple Developer account, TestFlight → public launch |

## Roles

- **Nadia:** Primary user. Drives design and copy. Reviews UX spec (`01-screens.md`). Final sign-off on what the app feels like.
- **Brad:** Technical reviewer. Reviews data model and stack specs (`02-data-model.md`, `03-stack-and-deployment.md`). Hosts the GitHub repo on his account.
- **Claude (me):** Builds and maintains. Writes the spec, writes the code, writes the tests, manages deployments. Asks before any action that touches shared state (GitHub repo creation, pushes, App Store submissions).

## What I need from you to move forward

1. Read `01-screens.md` (Nadia) and `02-data-model.md` + `03-stack-and-deployment.md` (Brad).
2. Mark anything that's wrong, missing, or doesn't match what you wanted.
3. Once both of you sign off, I'll ask explicit permission to scaffold the project and create the GitHub repo.

Nothing happens on `cunninghambe`'s GitHub or anywhere public until you both say yes.
