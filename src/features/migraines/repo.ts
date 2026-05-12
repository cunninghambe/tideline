import { eq, isNull, and, gte, lt } from 'drizzle-orm';
import { ulid } from 'ulid';

import { db } from '@/db/client';
import { migraineEvents, outbox } from '@/db/schema';
import { ok, err, type Result } from '@/lib/result';
import type { HelperTag, PostState, SymptomTag } from '@/db/schema/migraines';

type MigraineRow = typeof migraineEvents.$inferSelect;

type InsertActiveData = {
  peakSeverity: number;
  symptomTags: SymptomTag[];
  notes?: string | null;
  weatherSnapshotId?: string | null;
};

type InsertCompletedData = {
  startedAt: Date;
  endedAt: Date;
  peakSeverity: number;
  symptomTags: SymptomTag[];
  helpers: HelperTag[];
  postState?: PostState | null;
  notes?: string | null;
  weatherSnapshotId?: string | null;
};

type EndActiveData = {
  endedAt: Date;
  peakSeverity: number;
  helpers: HelperTag[];
  postState?: PostState | null;
};

type MigPatch = Partial<
  Omit<typeof migraineEvents.$inferInsert, 'id' | 'createdAt'>
>;

function writeOutbox(
  entityId: string,
  operation: 'insert' | 'update' | 'delete',
  payload: unknown,
): void {
  db.insert(outbox)
    .values({
      id: ulid(),
      entityType: 'migraine_event',
      entityId,
      operation,
      payload,
      createdAt: new Date(),
    })
    .run();
}

export function getActive(): Result<MigraineRow | null> {
  try {
    const row = db
      .select()
      .from(migraineEvents)
      .where(isNull(migraineEvents.endedAt))
      .get();
    return ok(row ?? null);
  } catch (cause) {
    return err({ kind: 'database', message: 'Failed to get active migraine', cause });
  }
}

export function getById(id: string): Result<MigraineRow | null> {
  try {
    const row = db
      .select()
      .from(migraineEvents)
      .where(eq(migraineEvents.id, id))
      .get();
    return ok(row ?? null);
  } catch (cause) {
    return err({ kind: 'database', message: 'Failed to get migraine by id', cause });
  }
}

/** Returns all migraines whose startedAt falls within a given YYYY-MM month. */
export function getByMonth(yearMonth: string): Result<MigraineRow[]> {
  try {
    const [year, month] = yearMonth.split('-').map(Number);
    const rangeStart = new Date(year!, month! - 1, 1);
    const rangeEnd = new Date(year!, month!, 1);
    const rows = db
      .select()
      .from(migraineEvents)
      .where(
        and(
          gte(migraineEvents.startedAt, rangeStart),
          lt(migraineEvents.startedAt, rangeEnd),
        ),
      )
      .all();
    return ok(rows);
  } catch (cause) {
    return err({ kind: 'database', message: 'Failed to get migraines by month', cause });
  }
}

export function getAll(): Result<MigraineRow[]> {
  try {
    const rows = db.select().from(migraineEvents).all();
    return ok(rows);
  } catch (cause) {
    return err({ kind: 'database', message: 'Failed to get all migraines', cause });
  }
}

/** Inserts an active (ongoing) migraine with startedAt=now and endedAt=null. */
export function insertActive(data: InsertActiveData): Result<MigraineRow> {
  try {
    const now = new Date();
    const id = ulid();
    const values = {
      id,
      startedAt: now,
      endedAt: null,
      peakSeverity: data.peakSeverity,
      symptomTags: data.symptomTags,
      helpers: [],
      postState: null,
      notes: data.notes ?? null,
      weatherSnapshotId: data.weatherSnapshotId ?? null,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
      pooledAt: null,
    } satisfies typeof migraineEvents.$inferInsert;

    db.insert(migraineEvents).values(values).run();
    writeOutbox(id, 'insert', values);

    return ok(values as MigraineRow);
  } catch (cause) {
    return err({ kind: 'database', message: 'Failed to insert active migraine', cause });
  }
}

/** Inserts a completed (retrospective) migraine with both timestamps set. */
export function insertCompleted(data: InsertCompletedData): Result<MigraineRow> {
  try {
    const now = new Date();
    const id = ulid();
    const values = {
      id,
      startedAt: data.startedAt,
      endedAt: data.endedAt,
      peakSeverity: data.peakSeverity,
      symptomTags: data.symptomTags,
      helpers: data.helpers,
      postState: data.postState ?? null,
      notes: data.notes ?? null,
      weatherSnapshotId: data.weatherSnapshotId ?? null,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
      pooledAt: null,
    } satisfies typeof migraineEvents.$inferInsert;

    db.insert(migraineEvents).values(values).run();
    writeOutbox(id, 'insert', values);

    return ok(values as MigraineRow);
  } catch (cause) {
    return err({ kind: 'database', message: 'Failed to insert completed migraine', cause });
  }
}

export function update(id: string, patch: MigPatch): Result<void> {
  try {
    const updatedPatch = { ...patch, updatedAt: new Date() };
    db.update(migraineEvents)
      .set(updatedPatch)
      .where(eq(migraineEvents.id, id))
      .run();
    writeOutbox(id, 'update', updatedPatch);
    return ok(undefined);
  } catch (cause) {
    return err({ kind: 'database', message: 'Failed to update migraine', cause });
  }
}

/** Sets endedAt on an active migraine and records the end-of-attack data. */
export function endActive(id: string, data: EndActiveData): Result<void> {
  try {
    const patch = {
      endedAt: data.endedAt,
      peakSeverity: data.peakSeverity,
      helpers: data.helpers,
      postState: data.postState ?? null,
      updatedAt: new Date(),
    };
    db.update(migraineEvents)
      .set(patch)
      .where(eq(migraineEvents.id, id))
      .run();
    writeOutbox(id, 'update', patch);
    return ok(undefined);
  } catch (cause) {
    return err({ kind: 'database', message: 'Failed to end active migraine', cause });
  }
}
