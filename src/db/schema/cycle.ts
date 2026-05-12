import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// NEVER syncs to pool. Stays local + per-user cloud only.
export const cycleEvents = sqliteTable('cycle_events', {
  id: text('id').primaryKey(),
  date: text('date').notNull(), // YYYY-MM-DD
  eventType: text('event_type')
    .$type<'period_start' | 'period_end' | 'spotting' | 'note'>()
    .notNull(),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
