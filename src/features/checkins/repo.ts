import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';

import { db } from '@/db/client';
import { dailyCheckins, outbox } from '@/db/schema';
import { ok, err, type Result } from '@/lib/result';

type CheckinRow = typeof dailyCheckins.$inferSelect;
type UpsertData = Omit<typeof dailyCheckins.$inferInsert, 'id' | 'createdAt' | 'updatedAt' | 'date'>;

function writeOutbox(
  entityId: string,
  operation: 'insert' | 'update',
  payload: unknown,
): void {
  db.insert(outbox)
    .values({
      id: ulid(),
      entityType: 'daily_checkin',
      entityId,
      operation,
      payload,
      createdAt: new Date(),
    })
    .run();
}

export function getByDate(date: string): Result<CheckinRow | null> {
  try {
    const row = db
      .select()
      .from(dailyCheckins)
      .where(eq(dailyCheckins.date, date))
      .get();
    return ok(row ?? null);
  } catch (cause) {
    return err({ kind: 'database', message: 'Failed to get check-in by date', cause });
  }
}

/** Insert or update the check-in for a given date (YYYY-MM-DD). */
export function upsert(date: string, data: UpsertData): Result<CheckinRow> {
  try {
    const existing = db
      .select()
      .from(dailyCheckins)
      .where(eq(dailyCheckins.date, date))
      .get();

    const now = new Date();

    if (existing) {
      const patch = { ...data, updatedAt: now };
      db.update(dailyCheckins)
        .set(patch)
        .where(eq(dailyCheckins.date, date))
        .run();
      writeOutbox(existing.id, 'update', { date, ...patch });
      return ok({ ...existing, ...patch, date } as CheckinRow);
    }

    const id = ulid();
    const values = {
      id,
      date,
      ...data,
      createdAt: now,
      updatedAt: now,
    } satisfies typeof dailyCheckins.$inferInsert;
    db.insert(dailyCheckins).values(values).run();
    writeOutbox(id, 'insert', values);
    return ok(values as CheckinRow);
  } catch (cause) {
    return err({ kind: 'database', message: 'Failed to upsert check-in', cause });
  }
}
