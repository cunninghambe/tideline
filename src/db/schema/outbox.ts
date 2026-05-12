import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Sync outbox: every local write queues a row here so cloud sync can
 * replay operations without backfilling. Drained by the sync service when
 * FEATURE_FLAGS.cloudSync is enabled.
 */
export const outbox = sqliteTable('outbox', {
  id: text('id').primaryKey(),
  entityType: text('entity_type').notNull(), // e.g. 'migraine_event'
  entityId: text('entity_id').notNull(),
  operation: text('operation')
    .$type<'insert' | 'update' | 'delete'>()
    .notNull(),
  payload: text('payload', { mode: 'json' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
