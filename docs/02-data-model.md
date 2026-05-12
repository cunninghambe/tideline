# Tideline — v0.1 Spec: Data Model

> **For Brad.** Types, schemas, sync boundaries, privacy enforcement.
> All TypeScript. All Zod-validated at boundaries. Drizzle for SQL.
> Three storage tiers: **local (SQLite)**, **per-user cloud (Supabase)**, **central anonymised pool (Supabase, separate schema)**.

---

## Tier diagram

```
┌─────────────────────────┐
│  DEVICE (SQLite)        │  ← Source of truth. Offline-first. Full data.
│  - migraine_events      │
│  - medications          │
│  - medication_doses     │
│  - daily_checkins       │
│  - food_tags (user list)│
│  - cycle_events         │
│  - free_text_notes      │
│  - weather_snapshots    │
│  - settings             │
└──────────┬──────────────┘
           │ syncs full data, encrypted at rest
           ▼
┌─────────────────────────┐
│  SUPABASE — per-user    │  ← Cloud backup + cross-device sync.
│  schema: app            │     Same shape as local. RLS per user_id.
│  (mirror of local)      │     Never accessed across users.
└──────────┬──────────────┘
           │ on opt-in: anonymisation transform → upload
           │   - drop notes, exact GPS, brand names, cycle data
           │   - bucket location → H3 hex
           │   - bucket severity → enum
           │   - rotate user_id → contributor_id (k-anonymous)
           ▼
┌─────────────────────────┐
│  SUPABASE — central pool│  ← Anonymised. No user PII.
│  schema: pool           │     Aggregation queries only. RLS-enforced read.
│  - pool_observations    │     Materialized views for the community feed.
│  - pool_aggregates      │
│  - pool_h3_summaries    │
└─────────────────────────┘
```

The arrows are **one-way**. Pool data never flows back into per-user data. The transformation that produces pool data is irreversible (anonymisation).

---

## Local SQLite schema (Drizzle)

```ts
// schema/migraines.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const migraineEvents = sqliteTable('migraine_events', {
  id: text('id').primaryKey(), // ulid
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  endedAt: integer('ended_at', { mode: 'timestamp' }), // null = ongoing
  peakSeverity: integer('peak_severity').notNull(), // 1..10
  symptomTags: text('symptom_tags', { mode: 'json' }).$type<SymptomTag[]>().notNull().default(sql`'[]'`),
  helpers: text('helpers', { mode: 'json' }).$type<HelperTag[]>().notNull().default(sql`'[]'`),
  postState: text('post_state').$type<PostState | null>(),
  notes: text('notes'), // NEVER goes to pool
  weatherSnapshotId: text('weather_snapshot_id').references(() => weatherSnapshots.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
  pooledAt: integer('pooled_at', { mode: 'timestamp' }), // null if not contributed
});

export type SymptomTag =
  | 'throbbing' | 'aura' | 'nausea'
  | 'light_sensitive' | 'sound_sensitive' | 'smell_sensitive'
  | 'behind_eyes' | 'one_sided' | 'whole_head';

export type HelperTag =
  | 'sleep' | 'dark_room' | 'cold_compress' | 'hot_shower'
  | 'eating' | 'hydration' | 'caffeine' | 'massage'
  | 'medication' | 'nothing'
  | string; // user-added custom tags allowed

export type PostState = 'drained' | 'fragile' | 'almost_normal' | 'fine';
```

```ts
export const medications = sqliteTable('medications', {
  id: text('id').primaryKey(),
  brandName: text('brand_name').notNull(), // local-only
  medicationClass: text('medication_class').$type<MedClass>().notNull(),
  defaultDose: text('default_dose').notNull(),
  type: text('type').$type<'rescue' | 'preventive'>().notNull(),
  pillsRemaining: integer('pills_remaining'),
  refillThreshold: integer('refill_threshold').notNull().default(7),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export type MedClass =
  | 'nsaid' | 'triptan' | 'anticonvulsant' | 'beta_blocker'
  | 'cgrp' | 'antiemetic' | 'opioid' | 'ergotamine' | 'other';

export const medicationDoses = sqliteTable('medication_doses', {
  id: text('id').primaryKey(),
  medicationId: text('medication_id').notNull().references(() => medications.id),
  migraineEventId: text('migraine_event_id').references(() => migraineEvents.id), // null = preventive dose
  takenAt: integer('taken_at', { mode: 'timestamp' }).notNull(),
  doseAmount: text('dose_amount').notNull(),
  effectivenessRating: text('effectiveness_rating').$type<'helped' | 'kind_of' | 'didnt_help' | 'unsure' | null>(),
  timeToReliefMinutes: integer('time_to_relief_minutes'),
});
```

```ts
export const dailyCheckins = sqliteTable('daily_checkins', {
  id: text('id').primaryKey(),
  date: text('date').notNull().unique(), // YYYY-MM-DD, local timezone
  sleepHours: real('sleep_hours'),
  sleepQuality: integer('sleep_quality'), // 1..4
  stressLevel: integer('stress_level'), // 1..5
  waterCups: integer('water_cups'),
  caffeineCups: integer('caffeine_cups'),
  foodTagIds: text('food_tag_ids', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  notes: text('notes'), // NEVER goes to pool
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
  pooledAt: integer('pooled_at', { mode: 'timestamp' }),
});

export const foodTags = sqliteTable('food_tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(), // normalized: lowercase, trimmed
  displayName: text('display_name').notNull(), // as user typed it
  usageCount: integer('usage_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

```ts
export const cycleEvents = sqliteTable('cycle_events', {
  id: text('id').primaryKey(),
  date: text('date').notNull(), // YYYY-MM-DD
  eventType: text('event_type').$type<'period_start' | 'period_end' | 'spotting' | 'note'>().notNull(),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  // NEVER syncs to pool. Stays local + per-user cloud only.
});
```

```ts
export const weatherSnapshots = sqliteTable('weather_snapshots', {
  id: text('id').primaryKey(),
  capturedAt: integer('captured_at', { mode: 'timestamp' }).notNull(),
  // location stored as h3 cell + rough bucket; raw lat/lng held in a separate
  // local-only table (`device_locations`) so we can re-pull weather later.
  h3Cell: text('h3_cell').notNull(), // resolution 7 (~5km), aggregated to 5 (~25km) for pool
  temperatureC: real('temperature_c'),
  humidityPct: real('humidity_pct'),
  pressureHpa: real('pressure_hpa'),
  pressureChange24hHpa: real('pressure_change_24h_hpa'),
  windKph: real('wind_kph'),
  uvIndex: real('uv_index'),
  pollenIndex: text('pollen_index').$type<'low' | 'moderate' | 'high' | 'very_high' | null>(),
  source: text('source').notNull().default('open-meteo'),
});

export const deviceLocations = sqliteTable('device_locations', {
  id: text('id').primaryKey(),
  weatherSnapshotId: text('weather_snapshot_id').notNull().references(() => weatherSnapshots.id),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  // LOCAL ONLY. Never syncs anywhere. Used to re-query weather APIs if needed.
});
```

```ts
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Settings keys (typed):
type SettingsKeys = {
  'theme.palette': PaletteName;
  'theme.mode': 'light' | 'dark' | 'system';
  'notifications.daily_checkin_time': string; // 'HH:mm'
  'notifications.daily_checkin_enabled': boolean;
  'notifications.refill_reminders_enabled': boolean;
  'cycle.tracking_enabled': boolean;
  'community.sharing_enabled': boolean;
  'community.last_opt_in_at': string | null; // ISO
  'account.user_id': string | null;
  'sync.last_full_sync_at': string | null;
};

type PaletteName = 'calm_sand' | 'soft_storm' | 'quiet_night' | 'forest_pale' | 'custom';
```

---

## Per-user Supabase schema (`app` schema)

Mirrors local. Same column types where SQLite supports them; converts to Postgres equivalents.

- `app.migraine_events` — same shape, `id uuid`, `notes text`
- `app.medications`, `app.medication_doses`, `app.daily_checkins`, `app.food_tags`, `app.cycle_events`, `app.weather_snapshots`, `app.settings`
- All tables: `user_id uuid not null` foreign key to `auth.users`
- **RLS enforced on every row:** `user_id = auth.uid()`. No cross-user reads, ever.
- `app.device_locations` does **not** exist server-side. Raw lat/lng never leaves the phone.
- Encryption at rest is Supabase default (AES-256). Per-row encryption is **not** added in v1 — Supabase's default is enough for our threat model. Reconsider if we ever store anything truly sensitive (e.g. images).

### Sync mechanics

- Local writes get a `synced_at = null` marker.
- Background job (every 5 min when app is open + on backgrounding + on foregrounding) finds unsynced rows and pushes them.
- Conflicts: last-write-wins by `updated_at`. Conflict events are logged locally so we can revisit if it ever bites us. Single-user app so this should be rare.
- Pulls: timestamp-based incremental. Server returns rows with `updated_at > last_sync`.
- All sync calls go through the Supabase JS client with the user's session JWT. No service role key on the device, ever.

---

## Central pool Supabase schema (`pool` schema)

Separate Postgres schema. Different RLS posture (read = aggregated public via materialized views; write = system only).

```sql
-- Each pool row represents one observation contributed by one user, anonymised.
create table pool.pool_observations (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null,           -- rotated weekly per user; not joinable to auth.users
  observation_date date not null,
  h3_cell_r5 text not null,               -- ~25km hex
  observation_kind text not null,         -- 'migraine' | 'daily_checkin' | 'medication_dose'
  payload jsonb not null,                 -- shape depends on kind, see below
  created_at timestamptz not null default now()
);

-- Indexes for the queries we care about
create index on pool.pool_observations (h3_cell_r5, observation_date);
create index on pool.pool_observations (observation_date) where observation_kind = 'migraine';
```

### Pool payload shapes (per `observation_kind`)

```ts
// observation_kind = 'migraine'
type MigrainePoolPayload = {
  severity_bucket: 'mild' | 'moderate' | 'severe';
  duration_bucket: 'under_2h' | '2_to_6h' | '6_to_24h' | 'over_24h' | 'ongoing';
  symptom_tags: SymptomTag[];               // standard tags only; custom user tags stripped
  helper_tags: HelperTag[];                 // standard only
  weather: {
    // Weather fields are kept at high precision in the pool. They describe a
    // region+date, not a person, so bucketing them loses signal without buying
    // privacy. The whole hypothesis depends on detecting environmental shifts.
    temperature_c: number;                  // 1 decimal place
    humidity_pct: number;                   // integer
    pressure_hpa: number;                   // 1 decimal
    pressure_change_24h_hpa: number;        // 1 decimal
    wind_kph: number;                       // integer
    uv_index: number | null;                // 1 decimal
    pollen_index: 'low' | 'moderate' | 'high' | 'very_high' | null;
  };
  // Things explicitly excluded:
  //   - notes (free text)
  //   - exact start/end timestamps (only date)
  //   - exact lat/lng
  //   - cycle phase
  //   - brand-name medications
};

// observation_kind = 'daily_checkin'
type CheckinPoolPayload = {
  sleep_hours_bucket: 'under_5' | '5_to_7' | '7_to_9' | 'over_9' | null;
  sleep_quality: 1 | 2 | 3 | 4 | null;
  stress_level: 1 | 2 | 3 | 4 | 5 | null;
  water_cups_bucket: 'under_4' | '4_to_8' | 'over_8' | null;
  caffeine_cups_bucket: '0' | '1_to_2' | '3_to_5' | 'over_5' | null;
  food_tags: string[];                      // normalized, only tags shared by ≥10 contributors globally
};

// observation_kind = 'medication_dose'
type DosePoolPayload = {
  medication_class: MedClass;               // class only, never brand
  type: 'rescue' | 'preventive';
  effectiveness_rating: 'helped' | 'kind_of' | 'didnt_help' | 'unsure' | null;
  time_to_relief_bucket: 'under_30m' | '30_to_60m' | '1_to_2h' | 'over_2h' | null;
  // No timestamp beyond date. No dose amount.
};
```

### Materialized views for the community feed

```sql
-- Daily migraine count per region
create materialized view pool.h3_daily_migraine_counts as
select h3_cell_r5, observation_date, count(*) as migraine_count
from pool.pool_observations
where observation_kind = 'migraine'
group by h3_cell_r5, observation_date;

-- Region baseline (90-day average, refreshed nightly)
create materialized view pool.h3_baselines as
select
  h3_cell_r5,
  avg(migraine_count) as baseline_migraines_per_day,
  count(distinct contributor_id) as active_contributors_90d
from pool.h3_daily_migraine_counts
where observation_date > current_date - 90
group by h3_cell_r5;
```

### Aggregation thresholds (enforced in the API)

```ts
// Server-side only. The mobile app only ever calls aggregated endpoints.
const MIN_CONTRIBUTORS_PER_REGION = 50;
const MIN_OBSERVATIONS_FOR_PATTERN = 30;

// Example: getRegionalSummary
async function getRegionalSummary(h3CellR5: string, date: Date) {
  const baseline = await db.query.h3Baselines.findFirst({ where: eq(h3CellR5, ...) });
  if (!baseline || baseline.active_contributors_90d < MIN_CONTRIBUTORS_PER_REGION) {
    return { kind: 'insufficient_data', activeContributors: baseline?.active_contributors_90d ?? 0 };
  }
  // ... return aggregated counts and weather correlations
}
```

If a region has fewer than 50 active contributors, the API returns `insufficient_data` and the app shows the "we need more contributors here" empty state.

---

## Anonymisation transform (the most important code)

Lives in a server function (Supabase Edge Function). Runs when an opted-in user's data flows from per-user to central pool.

```ts
// supabase/functions/pool_ingest/index.ts
import { z } from 'zod';
import { latLngToCell } from 'h3-js';

const PoolIngestRequest = z.object({
  user_id: z.string().uuid(),
  observations: z.array(z.discriminatedUnion('kind', [
    MigraineObservation, CheckinObservation, MedicationDoseObservation,
  ])),
});

export default async function pool_ingest(req: Request) {
  // 1. Verify the user has opted in.
  const { user_id, observations } = PoolIngestRequest.parse(await req.json());
  const userSettings = await db.query.userSettings.findFirst({ where: eq(user_id, ...) });
  if (!userSettings?.communitySharing) {
    return new Response('not_opted_in', { status: 403 });
  }

  // 2. Map user_id → rotating contributor_id.
  // Rotation: every 1st of the month, every user gets a new contributor_id.
  // Prevents long-term linking; aligns with monthly environmental analysis windows.
  const contributor_id = await getCurrentContributorId(user_id);

  // 3. Anonymise each observation.
  for (const obs of observations) {
    const anonymised = anonymise(obs); // strips notes, brand names, exact GPS, cycle, custom tags

    // 4. Bucket geo to H3 resolution 5.
    if (anonymised.latitude !== undefined) {
      anonymised.h3_cell_r5 = latLngToCell(anonymised.latitude, anonymised.longitude, 5);
      delete anonymised.latitude;
      delete anonymised.longitude;
    }

    // 5. Bucket continuous values.
    bucketize(anonymised);

    // 6. Strip food tags shared by < 10 global contributors (k-anonymity).
    if (anonymised.food_tags) {
      anonymised.food_tags = await filterRareTags(anonymised.food_tags);
    }

    // 7. Insert.
    await db.insert(poolObservations).values({
      contributor_id,
      observation_date: anonymised.date,
      h3_cell_r5: anonymised.h3_cell_r5,
      observation_kind: obs.kind,
      payload: anonymised,
    });
  }

  return new Response('ok');
}
```

The `anonymise` function is the privacy contract. It's small, reviewable, tested, and the only path data takes from per-user → pool. Audit it harder than any other code in the project.

---

## Sync rules summary

| Data | Local SQLite | Per-user Supabase | Central pool |
|---|---|---|---|
| Migraine events (structured) | ✓ | ✓ (full) | ✓ (anonymised, opt-in) |
| Migraine notes (free text) | ✓ | ✓ | ✗ |
| Daily checkins (structured) | ✓ | ✓ (full) | ✓ (anonymised, opt-in) |
| Checkin notes | ✓ | ✓ | ✗ |
| Medications (brand) | ✓ | ✓ | ✗ |
| Medication doses (with class) | ✓ | ✓ (full) | ✓ (class only, opt-in) |
| Food tags (user list) | ✓ | ✓ | ✓ (only tags ≥10 contributors) |
| Cycle events | ✓ | ✓ | ✗ (NEVER) |
| Weather snapshots | ✓ | ✓ | ✓ (with h3 cell, opt-in) |
| Device locations (lat/lng) | ✓ | ✗ (NEVER) | ✗ (NEVER) |
| Settings | ✓ | ✓ | ✗ |

---

## Data export format

The "Export data" button (Settings 11.1) generates a JSON file:

```json
{
  "tideline_export_version": "1",
  "exported_at": "2026-04-12T20:00:00Z",
  "user": { "id": "...", "email": "..." },
  "migraine_events": [...],
  "medications": [...],
  "medication_doses": [...],
  "daily_checkins": [...],
  "food_tags": [...],
  "cycle_events": [...],
  "weather_snapshots": [...],
  "settings": {...}
}
```

User-readable, machine-importable, includes everything we have on them. Sent to the iOS / Android share sheet.

---

## Account deletion

The "Delete data" flow does:

1. Delete all rows in `app.*` where `user_id = current_user`.
2. Delete the user from `auth.users`.
3. Wipe local SQLite database.
4. The central pool (`pool.*`) is NOT deleted from — those rows are anonymised and not tied back to the user_id by design. The user is informed that aggregated past contributions remain but cannot be extracted.
5. Future contributions stop immediately because the account no longer exists.

This is honest: we tell the user upfront that anonymised aggregated data is not retroactively removable.

---

## Resolved data-model decisions (Brad, 2026-05-11)

1. **IDs:** ULID for client-generated, UUID for server-generated. ✓
2. **Migrations:** Drizzle migration system (Brad delegated; this is my call). ✓
3. **Supabase project structure:** Single project (`tideline-prod`), two schemas (`app`, `pool`), strict RLS as the security boundary. ✓
4. **Contributor ID rotation cadence:** **Monthly** (changed from weekly default). Stronger privacy posture; cleaner alignment with month-over-month environmental analysis windows.
5. **K-anonymity threshold for food tags:** 10 global contributors before a tag is shareable. ✓
6. **Weather fields stay precise in pool** (changed from heavy bucketing). Brad: "temp and other factors shouldn't be disregarded." Decision: pressure, temperature, humidity, wind, UV, and pressure change all stored at near-exact precision in the pool. They describe regions/dates, not people, so bucketing them loses signal without buying privacy. Severity, duration, sleep, water, caffeine remain bucketed (those are personal lifestyle data and bucketing serves real anonymisation purposes there).
