import { sql } from 'drizzle-orm';
import { db, runMigrations } from '@/db/client';
import { setSetting } from './store';
import { ok, err } from '@/lib/result';
import type { Result } from '@/lib/result';

/**
 * Wipes every table, re-runs migrations (no-op since schema is unchanged),
 * then sets onboarding.completed = false so the user re-enters onboarding.
 *
 * Deletion order respects FK constraints (children before parents).
 */
export async function deleteAll(): Promise<Result<void>> {
  try {
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

    setSetting('onboarding.completed', 'false');

    return ok(undefined);
  } catch (e) {
    return err({
      kind: 'database',
      message: 'Delete failed',
      cause: e,
    });
  }
}
