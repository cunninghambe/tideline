import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const dailyCheckins = sqliteTable('daily_checkins', {
  id: text('id').primaryKey(),
  date: text('date').notNull().unique(), // YYYY-MM-DD, local timezone
  sleepHours: real('sleep_hours'),
  sleepQuality: integer('sleep_quality'), // 1..4
  stressLevel: integer('stress_level'), // 1..5
  waterCups: integer('water_cups'),
  caffeineCups: integer('caffeine_cups'),
  foodTagIds: text('food_tag_ids', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'`),
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
