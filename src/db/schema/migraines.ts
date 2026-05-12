import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

import { weatherSnapshots } from './weather';

export type SymptomTag =
  | 'throbbing'
  | 'aura'
  | 'nausea'
  | 'light_sensitive'
  | 'sound_sensitive'
  | 'smell_sensitive'
  | 'behind_eyes'
  | 'one_sided'
  | 'whole_head';

export type HelperTag =
  | 'sleep'
  | 'dark_room'
  | 'cold_compress'
  | 'hot_shower'
  | 'eating'
  | 'hydration'
  | 'caffeine'
  | 'massage'
  | 'medication'
  | 'nothing'
  | string; // user-added custom tags allowed

export type PostState = 'drained' | 'fragile' | 'almost_normal' | 'fine';

export const migraineEvents = sqliteTable('migraine_events', {
  id: text('id').primaryKey(), // ulid
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  endedAt: integer('ended_at', { mode: 'timestamp' }), // null = ongoing
  /**
   * Severity 0..10. Zero means aura without pain (aura-only event).
   * UI slider presents 1–10; the "Aura only — no pain" toggle sets 0.
   * SQLite does not enforce this constraint natively.
   */
  peakSeverity: integer('peak_severity').notNull(),
  symptomTags: text('symptom_tags', { mode: 'json' })
    .$type<SymptomTag[]>()
    .notNull()
    .default(sql`'[]'`),
  helpers: text('helpers', { mode: 'json' })
    .$type<HelperTag[]>()
    .notNull()
    .default(sql`'[]'`),
  postState: text('post_state').$type<PostState | null>(),
  notes: text('notes'), // NEVER goes to pool
  weatherSnapshotId: text('weather_snapshot_id').references(
    () => weatherSnapshots.id,
  ),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
  pooledAt: integer('pooled_at', { mode: 'timestamp' }), // null if not contributed
});
