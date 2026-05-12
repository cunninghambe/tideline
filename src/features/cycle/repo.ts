import { gte, lt, and } from 'drizzle-orm';
import { ulid } from 'ulid';

import { db } from '@/db/client';
import { cycleEvents } from '@/db/schema';
import { ok, err, type Result } from '@/lib/result';

type CycleRow = typeof cycleEvents.$inferSelect;
type InsertData = Omit<typeof cycleEvents.$inferInsert, 'id' | 'createdAt'>;

export type CyclePhase =
  | 'period'
  | 'follicular'
  | 'ovulation_window'
  | 'luteal'
  | 'late_luteal';

export function list(): Result<CycleRow[]> {
  try {
    const rows = db.select().from(cycleEvents).all();
    return ok(rows);
  } catch (cause) {
    return err({ kind: 'database', message: 'Failed to list cycle events', cause });
  }
}

export function insert(data: InsertData): Result<CycleRow> {
  try {
    const id = ulid();
    const values = { id, ...data, createdAt: new Date() } satisfies typeof cycleEvents.$inferInsert;
    db.insert(cycleEvents).values(values).run();
    return ok(values as CycleRow);
  } catch (cause) {
    return err({ kind: 'database', message: 'Failed to insert cycle event', cause });
  }
}

export function getMonth(yearMonth: string): Result<CycleRow[]> {
  try {
    const [year, month] = yearMonth.split('-').map(Number);
    const startDate = `${year!.toString().padStart(4, '0')}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month! + 1;
    const nextYear = month === 12 ? year! + 1 : year!;
    const endDate = `${String(nextYear).padStart(4, '0')}-${String(nextMonth).padStart(2, '0')}-01`;

    const rows = db
      .select()
      .from(cycleEvents)
      .where(
        and(
          gte(cycleEvents.date, startDate),
          lt(cycleEvents.date, endDate),
        ),
      )
      .all();
    return ok(rows);
  } catch (cause) {
    return err({ kind: 'database', message: 'Failed to get cycle events for month', cause });
  }
}

/**
 * Estimates the cycle phase for a given date (YYYY-MM-DD).
 *
 * Algorithm: uses a simple rolling average of cycle length from logged
 * period_start events. Falls back to 28-day cycle if fewer than 2 periods logged.
 *
 * Period days: day 1-5
 * Follicular: day 6 to ovulation-3
 * Ovulation window: 3 days before estimated ovulation (cycle_len/2 - 1 to cycle_len/2 + 1)
 * Luteal: ovulation+2 to cycle_len-2
 * Late luteal: cycle_len-2 to cycle_len
 */
export function phaseForDate(date: string): Result<CyclePhase | null> {
  try {
    const allResult = list();
    if (!allResult.ok) return allResult;

    const periodStarts = allResult.value
      .filter((e) => e.eventType === 'period_start')
      .map((e) => e.date)
      .sort();

    if (periodStarts.length === 0) return ok(null);

    // Compute average cycle length from consecutive period starts
    let avgCycleLen = 28;
    if (periodStarts.length >= 2) {
      const lengths: number[] = [];
      for (let i = 1; i < periodStarts.length; i++) {
        const prev = new Date(periodStarts[i - 1]!).getTime();
        const curr = new Date(periodStarts[i]!).getTime();
        lengths.push(Math.round((curr - prev) / 86_400_000));
      }
      avgCycleLen = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
    }

    // Find the most recent period start on or before the target date
    const targetMs = new Date(date).getTime();
    const recentStart = periodStarts
      .filter((d) => new Date(d).getTime() <= targetMs)
      .at(-1);

    if (!recentStart) return ok(null);

    const cycleDay = Math.round(
      (targetMs - new Date(recentStart).getTime()) / 86_400_000,
    ) + 1; // 1-indexed

    if (cycleDay < 1 || cycleDay > avgCycleLen + 14) return ok(null);

    const ovulationDay = Math.round(avgCycleLen / 2);

    if (cycleDay <= 5) return ok('period');
    if (cycleDay >= ovulationDay - 1 && cycleDay <= ovulationDay + 1) return ok('ovulation_window');
    if (cycleDay >= avgCycleLen - 2) return ok('late_luteal');
    if (cycleDay > ovulationDay + 1) return ok('luteal');
    return ok('follicular');
  } catch (cause) {
    return err({ kind: 'database', message: 'Failed to compute cycle phase', cause });
  }
}
