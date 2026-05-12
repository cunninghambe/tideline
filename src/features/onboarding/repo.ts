import { db } from '@/db/client';
import { settings } from '@/db/schema/settings';

/** Writes a single key-value pair to the settings table (upsert). */
export function writeSetting(key: string, value: unknown): void {
  db.insert(settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() },
    })
    .run();
}
