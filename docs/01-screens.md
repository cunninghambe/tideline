# Tideline — v0.1 Spec: Screens & UX

> **For Nadia.** This is every screen the app has and every interaction you can do. If something feels wrong, missing, or annoying, mark it. We'll change it before any code is written.
> **Reading order:** Top to bottom matches the order you'd encounter screens as a new user.

---

## 0. First launch — onboarding

A short, honest setup. No "create account with email" until later — we don't need it to start logging.

### 0.1 Welcome screen

> **Hi. Tideline helps you understand your migraines.**
>
> Log attacks. Track what you ate, how you slept, how the weather felt. Over time, patterns appear.
>
> Your data lives on your phone. Nothing leaves it unless you choose to share it.
>
> [ Continue ]

### 0.2 Location permission

> **One quick ask: your location.**
>
> The app pulls weather data — temperature, humidity, barometric pressure — from where you actually are. Pressure changes in particular show up as triggers for many people.
>
> Your exact location stays on your phone. We never upload it.
>
> [ Allow location ] [ Maybe later ]

If "Maybe later": the app works, but weather is manual entry until they enable it in Settings.

### 0.3 Notifications permission

> **Want a daily nudge to log?**
>
> A 30-second daily check-in (sleep, water, how you're feeling) is what makes the patterns work.
>
> [ Yes, remind me at... ] (time picker, default 9pm) [ No thanks ]

### 0.4 Theme picker

> **Pick a palette.**
>
> Calm Sand · Soft Storm · Quiet Night · Forest Pale · Custom

Six built-in palettes shown as small calendar previews. They can change it any time in Settings. Each palette defines: background, surface, text, accent, plus the four migraine-day colours (severe, moderate, mild, aura-only).

### 0.5 Done

> **You're set. Tap the + to log your first migraine, or just go about your day — we'll be here when you need us.**
>
> [ Get started ]

**What this screen does NOT do:** Ask for an email. Ask about community sharing. Show a "skip onboarding" prompt that creates dark patterns. The community sharing decision happens later, when there's something to share.

---

## 1. Calendar — home

The screen you see when you open the app.

### 1.1 Layout

- **Top bar:** Month + year (tap to jump to a specific month). Settings icon (top right).
- **Calendar grid:** Standard month view, 7 columns, swipeable left/right between months.
- **Each day cell:**
  - Day number
  - Background colour from theme + meaning encoding (see 1.2)
  - Tiny dot indicator if a daily check-in was logged
- **Today's row** is subtly highlighted (1px accent border, not loud).
- **Bottom:** A floating "+" button to log. Big enough for a one-thumb tap.

### 1.2 Day-cell colour meanings

The theme picks the *hues*. The meanings are fixed:

| State | Colour |
|---|---|
| Severe migraine (severity 8–10) | Strongest accent in palette |
| Moderate migraine (severity 5–7) | Medium accent |
| Mild migraine (severity 1–4) | Soft accent |
| Aura-only (no pain logged) | A second accent (different family) |
| Trigger-likely (predicted but no migraine) | Faint border, no fill |
| Logged inputs only, no migraine | Theme background |
| Future days | Disabled appearance |

After enough data exists, "trigger-likely" days appear when the on-device model thinks today is a high-risk day (cycle phase + pressure drop + low sleep). They're a heads-up, not a prediction we commit to.

### 1.2.1 Cycle markers (when cycle tracking is enabled)

A small marker sits in the corner of each day cell to indicate cycle phase. Subtle, doesn't compete with the migraine colour fill.

| Phase | Marker |
|---|---|
| Period (days 1–5 typically) | Small filled dot, deep accent colour |
| Follicular | No marker |
| Ovulation window (estimated) | Small open ring |
| Luteal | No marker |
| Late luteal (estimated 2 days pre-period) | Small half-filled dot |

Markers are estimated from logged period start/end events using a simple rolling average of cycle length. Estimates only — the user can correct any day.

Cycle data is private (local + per-user cloud only). It influences calendar markers and personal insights, but **never** flows to the community pool.

### 1.3 Interactions

- **Tap a day:** Opens day detail (screen 2).
- **Tap "+":** Opens log-migraine flow (screen 3 or 4 depending on whether one is currently active).
- **Long-press a day:** Quick action: "Log migraine for this day" (retrospective).
- **Swipe left/right on calendar:** Previous / next month.
- **Pull down to refresh:** Re-pulls weather for today.
- **Tap month label:** Jump to month picker.

### 1.4 Empty state (first launch, no data yet)

The calendar shows but every day is the theme background. A small banner sits below the calendar:

> *"Log your first migraine to start seeing patterns. Daily check-ins help us learn faster — try the + button."*

Banner dismisses itself after first migraine is logged.

### 1.5 During an active migraine

The whole screen tints to the dim "during" mode (low brightness, deep palette, no animations). A persistent bar at the top shows:

> *Migraine in progress · started 2h 14m ago · [ It ended ] [ Open companion ]*

---

## 2. Day detail

What happened on a single day. Reached by tapping a day in the calendar.

### 2.1 Layout

- **Top:** Date, weather snapshot (temp, humidity, pressure + 24h trend arrow), cycle phase if applicable.
- **Migraine section:** If a migraine was logged that day — start time, end time (or "ongoing"), peak severity, symptoms, what helped, meds taken with times. Free-text notes shown as a quote block. [ Edit ] button.
- **Daily check-in section:** Sleep hours + quality, stress level, water glasses, food tags, caffeine cups. [ Edit ] button.
- **Bottom:** [ Log migraine for this day ] (only if no migraine logged for this date)

### 2.2 Empty sections

- No migraine logged: "No migraine logged for this day" (no big empty state, just quiet text).
- No check-in logged: "No daily check-in" (with [ Add check-in ] button if it's today or yesterday; older days show only the empty text).

### 2.3 Interactions

- All sections editable inline.
- Swipe left/right to navigate to previous / next day without going back to the calendar.

---

## 3. Log a migraine — active mode

Reached by tapping "+" on the calendar when no active migraine is in progress, then choosing "It's happening now."

### 3.1 The first tap

> **What's happening?**
>
> [ It's happening now ]
> [ Log one that already ended ]

### 3.2 Active mode — the only screen

This is the most important screen in the app. Logging an active attack must be possible while feeling terrible. Everything is big, slow, and forgiving.

> **You're having a migraine.**
> *Started just now. We'll keep counting.*
>
> **How bad? (slide later if you can't tell)**
> [ ━━━━○━━━━━ 4 ]
>
> **Feeling? (tap any that apply)**
> [ Throbbing ] [ Aura ] [ Nausea ] [ Light hurts ] [ Sound hurts ] [ Smell hurts ] [ Behind eyes ] [ One side ]
>
> **Notes (optional)**
> [ ____________________ ]
>
> [ Save ] [ Open companion mode → ]

After save: the calendar opens in "during" tint (see 1.5), and the user can either go back to whatever they were doing or tap "Open companion mode" for the in-the-moment screen (section 6).

### 3.3 What it writes

A new `MigraineEvent` row with: `started_at = now()`, `ended_at = null`, `peak_severity = current slider value`, `symptom_tags = selected`, `notes = text`, `weather_snapshot = current`.

---

## 4. Log a migraine — retrospective mode

For attacks logged after the fact. Same data fields, different UX flow because they have time.

### 4.1 Time

> **When did it start?**
>
> [ Date picker ] [ Time picker ]
>
> **When did it end?**
> [ Date picker ] [ Time picker ] [ Still going ]

### 4.2 Severity + symptoms

Same options as 3.2 but slower-paced layout, more breathing room.

### 4.3 What you ate / drank that day

Pulled from the day's daily check-in if one exists. Shown read-only with link to "edit day's check-in". If no check-in exists for that day, an inline mini-version of the food + water fields appears here (food tags, water cups). Quick to fill, no need to leave the migraine flow.

### 4.4 What you took

> **Did you take anything?**
>
> [ + Add medication taken ]
>
> Each tap reveals: med name (autocomplete from your med list), dose, time taken, "did it help?" (yes / kind of / no / unsure)

### 4.5 What helped

> **What helped?**
>
> [ chips, sorted by frequency-you've-used in past attacks; new users see a sensible starter order ]
>
> Default starter order: [ Sleep ] [ Dark room ] [ Hydration ] [ Cold compress ] [ Hot shower ] [ The medication ] [ Eating ] [ Caffeine ] [ Massage ] [ Nothing helped ]
>
> Multi-select. After each attack, the chips reshuffle so the ones you actually use show up first. Custom-added helpers join the list and ride the same frequency sort.

### 4.6 Notes

Free text. Optional.

### 4.7 Save

Single big [ Save ] button at the bottom. Cancel goes back without saving (with a "discard?" confirmation if anything was entered).

---

## 5. Ending an active migraine

The persistent top bar (see 1.5) has [ It ended ] button. Tap it.

### 5.1 End screen

> **It ended. How long it lasted: 4h 22m.**
>
> **Peak severity (was it worse than 4 at any point?)**
> [ ━━━━━━○━━━ 7 ]
>
> **What helped? (tap any)**
> [Same chips as 4.5]
>
> **Take anything?**
> [ + Add medication taken ]
>
> **How are you feeling now?**
> [ Drained ] [ Better but fragile ] [ Almost normal ] [ Fine ]
>
> [ Save ]

### 5.2 What it writes

Updates the existing `MigraineEvent` row: `ended_at = now()`, `peak_severity = if higher than current`, `helpers = selected`, `post_state = selected`. Adds any `MedicationDose` rows for meds taken.

---

## 6. In-migraine companion mode

Optional screen entered from the persistent bar during an active migraine. Designed to be the only thing they look at if they want help.

### 6.1 Layout

Maximum darkness. No bright colours. No animations. Single column, big text, big spacing.

> *(soft, fading title)*
> **Tideline is here.**
>
> ---
>
> **Right now:**
> - You logged this migraine 2h 14m ago.
> - Severity: 4 *(tap to update)*
>
> ---
>
> **Things that have helped you before:**
> - Sleep + ibuprofen worked in 3 of your last 5 attacks.
> - Cold compress helped on Apr 2 and Mar 18.
> - You said "dark room" helped 8 times.
>
> ---
>
> **General things to try:**
> - Hydrate slowly. Sip, don't gulp.
> - Dim the lights. Close curtains. Phone brightness all the way down.
> - Cold compress on the forehead or back of the neck.
> - If you have a triptan, the earlier you take it the better it works.
>
> ---
>
> **When to seek help:**
> Sudden "worst headache of your life," vision loss, weakness on one side, confusion, or stiff neck with fever — this could be more than a migraine. Call emergency services.
>
> ---
>
> [ I took something ] [ It's getting worse ] [ It ended ]

### 6.2 Empty state (first migraine, no history yet)

The "Things that have helped you before" section is replaced with:

> *We'll start learning what helps you specifically once you've logged a few attacks.*

### 6.3 What this screen does NOT do

- No bright animations.
- No "share to social" or anything performative.
- No AI chat. Just static, useful information.
- No nag to log more details. They can if they want; we don't push.

---

## 7. Daily check-in

A 30-second screen. Reached from a daily 9am notification (if enabled), the home screen banner, or by tapping today on the calendar.

The 9am timing is deliberate: you log about *yesterday* on the morning of *today*, while it's still recent but you're not tired. The screen header reflects this.

### 7.1 Layout (single scrollable screen)

> **Yesterday — quick check-in**
>
> **Sleep**
> Hours: [ 7.5 ] *(stepper)* — Quality: [ 😣 ] [ 😐 ] [ 🙂 ] [ 😊 ]
>
> **Stress**
> [ ━━○━━━━━━━ 2 / 5 ]
>
> **Water**
> [ 💧 💧 💧 💧 ○ ○ ○ ○ ] *(tap to fill, 1 cup each, no upper limit)*
>
> **Food**
> Tags from your list: [ + Add ] [ pasta ✕ ] [ red wine ✕ ] [ chocolate ✕ ]
>
> **Caffeine**
> [ ━━━━○━━━━━ 3 cups ]
>
> **Cycle** *(if tracking enabled)*
> [ Period started today ] [ Period ended today ] [ No change ]
>
> **Anything else?**
> [ Optional notes ]
>
> [ Save ]

### 7.2 Adding a new food tag

The "+ Add" opens a small inline picker:
- Type to search your existing tags
- If no match, "Add 'spicy curry' as new tag"
- Tags are case-insensitive, normalized at storage.

### 7.3 Skip / partial save

User can save with any subset of fields filled. Empty fields just don't get logged for that day. No guilt-tripping for partial logs.

---

## 8. Insights — patterns dashboard

Reached from a tab or button on the home screen.

### 8.1 Top of screen

> **Your patterns**
>
> *Based on 47 days of data, 8 migraines logged.*
> *Confidence improves with more data.*

### 8.2 Cards (each is a discovered pattern)

Each card looks like:

> **Pressure drops correlate with your migraines**
> 5 of your last 8 attacks (62%) followed a barometric pressure drop of >5mb in the prior 24 hours. Baseline rate: 18% of all days.
> *Confidence: medium · 8 attacks observed*

> **Cycle days 1–2 are high-risk**
> 3 of your migraines have started on cycle day 1 or 2 (37%). You've only had 6 such days in your data. Baseline rate: 13%.
> *Confidence: low · small sample*

> **Red wine appears often**
> Logged in 4 of 8 migraine days vs 11 of 39 non-migraine days. Could be coincidence — needs more data.
> *Confidence: low*

> **Sleep <6h shows mild correlation**
> *Confidence: not yet meaningful*

Cards are sorted by confidence. The honest "not yet meaningful" cards are at the bottom.

### 8.3 Weekly brief (separate section)

> **This week**
> 1 migraine (Tuesday, severity 6, 4h 30m).
> Pressure dropped 7mb on Tue morning.
> Sleep was 5.5h on Mon.
> Stress was 4/5 Mon and Tue.
> *Possible cluster: low sleep + high stress + pressure drop.*

A short paragraph generated on-device from the week's events. No AI required.

### 8.4 Monthly AI narrative (opt-in, monthly)

A separate card at the top of Insights:

> **Monthly summary — Apr 2026**
> [ Generate AI narrative ] *(uses cloud, your anonymised data only)*

When tapped, sends anonymised data to Claude Haiku via our server function and shows a 200-word plain-English narrative. User opts in each month. Saved for re-reading.

### 8.5 Empty state (less than 5 migraines logged)

> *We need a bit more data before patterns are meaningful. Keep logging — we'll show you what we find once there's enough to be honest about.*

---

## 9. Community feed — "In your area today"

A separate tab. **Only visible if community sharing is opted in (Settings).**

### 9.1 Top

> **In your area today**
>
> *Based on 64 contributors within ~25km of you. Your location is bucketed for privacy.*

### 9.2 Today card

> **Today — Apr 12**
> 8 migraines reported in your region (vs typical Tuesday: 3).
> Conditions: pressure dropped 9mb in last 24h. Humidity 78%. Pollen high.
> *⚠ Above-baseline migraine activity in your region today.*

### 9.3 Trends

> **This week in your region**
> [ small line chart: daily migraine reports over 7 days vs baseline ]

### 9.4 Conditions explorer

> **What conditions correlate with elevated migraine activity in your region (last 90 days)?**
> 1. Barometric pressure drops >5mb (3.1× baseline)
> 2. Pollen index "high" or "very high" (2.4×)
> 3. Humidity >75% (1.8×)
> 4. Temp swings >10°C in 24h (1.6×)

### 9.5 Empty state (not enough users in region yet)

> *We need at least 50 active contributors in your region to show meaningful trends. Right now there are 12. Tideline gets smarter as more people in your area opt in.*

### 9.6 Privacy reminder

Always visible at the bottom:

> *You see aggregated data only. Other contributors see only aggregated data. Your individual logs are never visible to anyone but you.*
> [ Manage what you share → ]

---

## 10. Medications

A separate screen, reached from a tab or Settings.

### 10.1 Your meds list

> **Your medications**
>
> [ + Add medication ]
>
> | Med | Class | Doses left | Last taken |
> |---|---|---|---|
> | Sumatriptan 50mg | Triptan (rescue) | 8 | Apr 5 |
> | Ibuprofen 400mg | NSAID (rescue) | 22 | Apr 11 |
> | Topiramate 50mg | Anticonvulsant (preventive) | 4 ⚠ | Apr 11 |

Class-based tagging is what gets shared to the central pool. Brand stays local.

### 10.2 Add medication

> **Add a medication**
>
> Brand name: [ ____ ]
> Class: [ Picker: NSAID / Triptan / Anticonvulsant / Beta-blocker / CGRP / Anti-emetic / Other ]
> Default dose: [ ____ ]
> Type: [ Rescue (take during attack) / Preventive (daily) ]
> Pills in current bottle: [ ____ ]
> Refill reminder when below: [ 7 ]
>
> [ Save ]

### 10.3 Med detail

> **Sumatriptan 50mg**
>
> **Effectiveness**
> Used in 6 of your last 9 attacks. "Helped" in 5, "kind of" in 1, "didn't help" in 0.
> Average time to relief: 78 min.
>
> **Refill**
> 8 pills left. At your usage rate, ~3 weeks supply. [ Refill reminder set ]
>
> **Last 5 doses**
> Apr 5 — 50mg, "helped"
> Mar 28 — 50mg, "helped"
> ...

### 10.4 Refill reminder

When pill count drops below threshold, a notification fires:

> *Sumatriptan: 7 pills left. Time to refill?*
> [ I refilled — pills now: __ ] [ Snooze 3 days ]

---

## 11. Settings

### 11.1 Top-level menu

- **Theme** → palette picker (same as onboarding, plus light/dark/system)
- **Notifications** → daily check-in time, refill reminders on/off, in-migraine reminders on/off
- **Daily check-in** → which fields appear (lets users hide fields they don't care about)
- **Cycle tracking** → enable/disable
- **Community sharing** → on/off + detail (next section)
- **Account** → email + password if signed in; "Sign in to back up your data" if not
- **Export data** → JSON download of everything, sent to share sheet
- **Delete data** → full nuke, including server-side
- **About** → privacy policy, ToS, "this is not medical advice", version

### 11.2 Community sharing detail

> **Community sharing — currently OFF**
>
> When ON, your anonymised data contributes to community insights and you see "In your area today."
>
> **What's shared:**
> ✓ Date a migraine started/ended
> ✓ Severity bucket
> ✓ Region (~25km hex, not exact location)
> ✓ Weather snapshot
> ✓ Sleep hours, stress level, caffeine, water
> ✓ Food tags (not brand names)
> ✓ Medication classes (e.g. "NSAID", not "Advil")
>
> **What's NEVER shared:**
> ✗ Your free-text notes
> ✗ Exact location
> ✗ Cycle data
> ✗ Brand-name medications
> ✗ Anything that could identify you
>
> [ Turn ON community sharing ]
>
> *You can turn this off any time. If you turn it off, your past contributions remain in the anonymised pool — there's no way to extract them since they were anonymised at upload. New data stops flowing immediately.*

### 11.3 Delete data

> **Delete all your data?**
>
> This is permanent.
>
> ✓ Local data on this phone — deleted
> ✓ Your cloud backup — deleted
> ✓ Your account — deleted
>
> *Anonymised aggregated data already in the community pool cannot be extracted, since it was anonymised at upload. We can confirm no future contributions will be made.*
>
> Type "DELETE" to confirm: [ ____ ]
> [ Delete everything ]

---

## 12. Account / sign-in (deferred but specified)

Optional, but unlocks cloud sync and community features.

### 12.1 Sign up

Email + password. Magic link option. No social login at v1 (privacy).

### 12.2 Sign in

Standard.

### 12.3 Forgot password

Magic link to email.

---

## Things I'm leaving out for v1 — confirm these

The following are common in similar apps but I am intentionally leaving them out unless you push back:

- ❌ Streak counter / "you've logged 30 days in a row!" — feels gross when tracking suffering
- ❌ Social sharing buttons — your migraine isn't content
- ❌ Gamification (badges, points) — same reason
- ❌ Doctor report PDF generation — useful but post-v1 polish
- ❌ Apple Watch app — phone first
- ❌ iPad layout — phone first
- ❌ Photo logging (food, aura, environment) — friction not worth it for v1
- ❌ Voice logging — interesting but native voice is Apple-platform-specific and adds complexity
- ❌ Multi-user / family sharing — privacy nightmare for v1
- ❌ In-app purchase / subscription — ship free, monetise later if at all
- ❌ Scientific paper citations in tips — keep tips short and trust the curation

---

## Resolved UX decisions (from Nadia, 2026-05-11)

1. **Retro logging order:** time → severity → symptoms → **food + water** → meds → what helped → notes. Food and water are pulled from that day's check-in (or filled inline if none exists), shown before meds.
2. **Calendar starts on:** Sunday.
3. **Severity scale:** 1–10 (medical standard).
4. **Daily check-in reminder time:** 9am (logging yesterday on the morning of today; check-in screen copy already says "Yesterday — quick check-in").
5. **Cycle on calendar:** Visible. Small icon/dot on each day indicating phase. Cycle data still stays private (local + per-user cloud only, never to community pool).
6. **Notes during active migraine:** Yes — notes field stays in active mode (already in section 3.2).
7. **"What helped" chip order:** Sorted by frequency-you've-used. New users see a fixed starter order until they have history. (Updated section 4.5.)
