import { ulid } from 'ulid';
import { sql } from 'drizzle-orm';

import { db, runMigrations } from './client';
import {
  migraineEvents,
  medications,
  dailyCheckins,
} from './schema';
import type { SymptomTag, HelperTag, PostState } from './schema';

/**
 * Drops all data, re-runs migrations, then seeds fixed test fixtures.
 * Only call in tests or when SEED_ACTIVE env flag is set.
 *
 * Seeded data:
 * - 1 medication: Sumatriptan 50mg, triptan, rescue, 8 pills
 * - 3 historical migraines: severe (5 days ago), mild (12 days ago), aura-only (20 days ago)
 * - 5 daily check-ins on the last 5 days
 * - 1 active migraine (only if __DEV__ && SEED_ACTIVE=1)
 */
export async function resetAndSeed(): Promise<void> {
  // Drop all rows in dependency order
  db.run(sql`DELETE FROM outbox`);
  db.run(sql`DELETE FROM medication_doses`);
  db.run(sql`DELETE FROM migraine_events`);
  db.run(sql`DELETE FROM daily_checkins`);
  db.run(sql`DELETE FROM food_tags`);
  db.run(sql`DELETE FROM cycle_events`);
  db.run(sql`DELETE FROM device_locations`);
  db.run(sql`DELETE FROM weather_snapshots`);
  db.run(sql`DELETE FROM medications`);
  db.run(sql`DELETE FROM settings`);

  await runMigrations();

  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

  // Seed medication
  db.insert(medications).values({
    id: ulid(),
    brandName: 'Sumatriptan 50mg',
    medicationClass: 'triptan',
    defaultDose: '50mg',
    type: 'rescue',
    pillsRemaining: 8,
    refillThreshold: 7,
    active: true,
    createdAt: daysAgo(30),
  }).run();

  // Seed historical migraines (inserted individually)
  const migraineRows: (typeof migraineEvents.$inferInsert)[] = [
    {
      id: ulid(),
      startedAt: daysAgo(5),
      endedAt: new Date(daysAgo(5).getTime() + 4 * 3_600_000),
      peakSeverity: 8,
      symptomTags: ['throbbing', 'light_sensitive', 'nausea'] as SymptomTag[],
      helpers: ['medication', 'dark_room'] as HelperTag[],
      postState: 'drained' as PostState,
      notes: null,
      weatherSnapshotId: null,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
      syncedAt: null,
      pooledAt: null,
    },
    {
      id: ulid(),
      startedAt: daysAgo(12),
      endedAt: new Date(daysAgo(12).getTime() + 2 * 3_600_000),
      peakSeverity: 3,
      symptomTags: ['throbbing'] as SymptomTag[],
      helpers: ['hydration', 'sleep'] as HelperTag[],
      postState: 'almost_normal' as PostState,
      notes: null,
      weatherSnapshotId: null,
      createdAt: daysAgo(12),
      updatedAt: daysAgo(12),
      syncedAt: null,
      pooledAt: null,
    },
    {
      id: ulid(),
      startedAt: daysAgo(20),
      endedAt: new Date(daysAgo(20).getTime() + 0.5 * 3_600_000),
      peakSeverity: 0, // aura-only
      symptomTags: ['aura'] as SymptomTag[],
      helpers: ['dark_room'] as HelperTag[],
      postState: 'fine' as PostState,
      notes: null,
      weatherSnapshotId: null,
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
      syncedAt: null,
      pooledAt: null,
    },
  ];

  for (const row of migraineRows) {
    db.insert(migraineEvents).values(row).run();
  }

  // Seed 5 daily check-ins (last 5 days)
  for (let i = 1; i <= 5; i++) {
    const date = daysAgo(i);
    const dateStr = date.toISOString().slice(0, 10);
    db.insert(dailyCheckins).values({
      id: ulid(),
      date: dateStr,
      sleepHours: 6 + Math.round(Math.random() * 3 * 10) / 10,
      sleepQuality: (Math.floor(Math.random() * 4) + 1) as 1 | 2 | 3 | 4,
      stressLevel: (Math.floor(Math.random() * 5) + 1) as 1 | 2 | 3 | 4 | 5,
      waterCups: Math.floor(Math.random() * 8) + 2,
      caffeineCups: Math.floor(Math.random() * 3),
      foodTagIds: [] as string[],
      notes: null,
      createdAt: date,
      updatedAt: date,
      syncedAt: null,
      pooledAt: null,
    }).run();
  }

  // Optionally seed an active migraine
  if (
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    process.env['SEED_ACTIVE'] === '1'
  ) {
    db.insert(migraineEvents).values({
      id: ulid(),
      startedAt: new Date(now.getTime() - 2 * 3_600_000),
      endedAt: null,
      peakSeverity: 5,
      symptomTags: ['throbbing', 'nausea'] as SymptomTag[],
      helpers: [] as HelperTag[],
      postState: null,
      notes: null,
      weatherSnapshotId: null,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
      pooledAt: null,
    }).run();
  }
}
