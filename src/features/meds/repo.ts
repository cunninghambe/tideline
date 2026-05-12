import { eq, sql } from 'drizzle-orm';
import { ulid } from 'ulid';

import { db } from '@/db/client';
import { medications, medicationDoses, outbox } from '@/db/schema';
import { ok, err, type Result } from '@/lib/result';

type MedRow = typeof medications.$inferSelect;
type DoseRow = typeof medicationDoses.$inferSelect;

type InsertMedData = Omit<typeof medications.$inferInsert, 'id' | 'createdAt'>;
type MedPatch = Partial<Omit<typeof medications.$inferInsert, 'id' | 'createdAt'>>;

type RecordDoseData = Omit<typeof medicationDoses.$inferInsert, 'id'>;

function writeMedOutbox(
  entityId: string,
  operation: 'insert' | 'update' | 'delete',
  payload: unknown,
): void {
  db.insert(outbox)
    .values({
      id: ulid(),
      entityType: 'medication',
      entityId,
      operation,
      payload,
      createdAt: new Date(),
    })
    .run();
}

function writeDoseOutbox(
  entityId: string,
  operation: 'insert' | 'update' | 'delete',
  payload: unknown,
): void {
  db.insert(outbox)
    .values({
      id: ulid(),
      entityType: 'medication_dose',
      entityId,
      operation,
      payload,
      createdAt: new Date(),
    })
    .run();
}

export function list(): Result<MedRow[]> {
  try {
    const rows = db.select().from(medications).all();
    return ok(rows);
  } catch (cause) {
    return err({ kind: 'database', message: 'Failed to list medications', cause });
  }
}

export function getById(id: string): Result<MedRow | null> {
  try {
    const row = db
      .select()
      .from(medications)
      .where(eq(medications.id, id))
      .get();
    return ok(row ?? null);
  } catch (cause) {
    return err({ kind: 'database', message: 'Failed to get medication by id', cause });
  }
}

export function insert(data: InsertMedData): Result<MedRow> {
  try {
    const id = ulid();
    const values = { id, ...data, createdAt: new Date() } satisfies typeof medications.$inferInsert;
    db.insert(medications).values(values).run();
    writeMedOutbox(id, 'insert', values);
    return ok(values as MedRow);
  } catch (cause) {
    return err({ kind: 'database', message: 'Failed to insert medication', cause });
  }
}

export function update(id: string, patch: MedPatch): Result<void> {
  try {
    db.update(medications).set(patch).where(eq(medications.id, id)).run();
    writeMedOutbox(id, 'update', patch);
    return ok(undefined);
  } catch (cause) {
    return err({ kind: 'database', message: 'Failed to update medication', cause });
  }
}

export function decrementPills(id: string, count: number): Result<void> {
  try {
    db.update(medications)
      .set({ pillsRemaining: sql`MAX(0, COALESCE(${medications.pillsRemaining}, 0) - ${count})` })
      .where(eq(medications.id, id))
      .run();
    return ok(undefined);
  } catch (cause) {
    return err({ kind: 'database', message: 'Failed to decrement pills', cause });
  }
}

/** Records a dose, decrements pill count, and writes outbox. */
export function recordDose(data: RecordDoseData): Result<DoseRow> {
  try {
    const id = ulid();
    const values = { id, ...data } satisfies typeof medicationDoses.$inferInsert;
    db.insert(medicationDoses).values(values).run();
    writeDoseOutbox(id, 'insert', values);

    // Decrement pills if this is a rescue dose
    const decResult = decrementPills(data.medicationId, 1);
    if (!decResult.ok) return decResult as Result<DoseRow>;

    return ok(values as DoseRow);
  } catch (cause) {
    return err({ kind: 'database', message: 'Failed to record medication dose', cause });
  }
}
