/**
 * Pure correlation/aggregation functions for the Insights dashboard.
 * No DB calls, no React, no side effects. All inputs passed as arguments for testability.
 */

import type { MigraineRow, DailyCheckinRow, WeatherSnapshotRow } from '@/types';
import type { CyclePhase } from '@/features/cycle/repo';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type Confidence = 'low' | 'medium' | 'high';

export type Correlation = {
  kind:
    | 'pressure_drop'
    | 'cycle_phase'
    | 'food'
    | 'sleep'
    | 'stress'
    | 'caffeine';
  title: string;
  body: string;
  confidence: Confidence;
  sampleSize: number;
  /** Higher = more notable; used for sort order. */
  score: number;
};

/** Minimum number of completed migraines required to compute any correlation. */
const MIN_SAMPLE = 5;

function computeConfidence(n: number): Confidence {
  if (n >= 30) return 'high';
  if (n >= 10) return 'medium';
  return 'low';
}

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

// ---------------------------------------------------------------------------
// Weather snapshot lookup helper
// ---------------------------------------------------------------------------

/** Build a map from migraine id → weather snapshot for that migraine. */
type WeatherByMigraineId = Map<string, WeatherSnapshotRow>;

// ---------------------------------------------------------------------------
// 1. Pressure drop correlation
// ---------------------------------------------------------------------------

/**
 * Checks how often a pressure drop of >5 hPa in the 24h before an attack
 * preceded a migraine vs. how often pressure drops occurred on all days.
 *
 * @param migraines  All completed migraine events (endedAt != null).
 * @param snapshots  All weather snapshots.
 * @param totalDays  Total number of days with a weather snapshot logged.
 */
export function pressureDropCorrelation(
  migraines: MigraineRow[],
  weatherByMigraineId: WeatherByMigraineId,
  snapshots: WeatherSnapshotRow[],
  totalDays: number,
): Correlation | null {
  const completed = migraines.filter((m) => m.endedAt != null);
  if (completed.length < MIN_SAMPLE) return null;

  const dropDays = snapshots.filter(
    (s) => s.pressureChange24hHpa != null && s.pressureChange24hHpa <= -5,
  ).length;

  const migrainesAfterDrop = completed.filter((m) => {
    const snap = weatherByMigraineId.get(m.id);
    return snap != null && snap.pressureChange24hHpa != null && snap.pressureChange24hHpa <= -5;
  }).length;

  const migraineRate = pct(migrainesAfterDrop, completed.length);
  const baselineRate = pct(dropDays, totalDays);

  if (dropDays === 0) return null;

  const lift = baselineRate > 0 ? migraineRate / baselineRate : 0;
  const confidence = computeConfidence(completed.length);

  return {
    kind: 'pressure_drop',
    title: 'Pressure drops correlate with your migraines',
    body:
      `${migrainesAfterDrop} of your last ${completed.length} attacks (${migraineRate}%) followed ` +
      `a barometric pressure drop of >5mb in the prior 24 hours. Baseline rate: ${baselineRate}% of all days.`,
    confidence,
    sampleSize: completed.length,
    score: lift,
  };
}

// ---------------------------------------------------------------------------
// 2. Cycle phase correlation
// ---------------------------------------------------------------------------

export type PhaseRate = {
  phase: CyclePhase;
  migraineCount: number;
  dayCount: number;
  rate: number; // percent
};

/**
 * Computes per-cycle-phase migraine rates vs. baseline.
 *
 * @param migraineDates  Migraine dates as YYYY-MM-DD strings.
 * @param phaseByDate    Map of YYYY-MM-DD → CyclePhase for all tracked days.
 */
export function cyclePhaseCorrelation(
  migraines: MigraineRow[],
  phaseByDate: Map<string, CyclePhase | null>,
  cycleCount: number,
): Correlation | null {
  const completed = migraines.filter((m) => m.endedAt != null);
  if (completed.length < MIN_SAMPLE) return null;
  if (cycleCount < 2) return null;

  // Count phase occurrences across all tracked days
  const phaseDayCounts = new Map<CyclePhase, number>();
  const phaseMigraineCounts = new Map<CyclePhase, number>();

  for (const [, phase] of phaseByDate) {
    if (phase == null) continue;
    phaseDayCounts.set(phase, (phaseDayCounts.get(phase) ?? 0) + 1);
  }

  for (const m of completed) {
    const date = toDateString(m.startedAt instanceof Date ? m.startedAt : new Date(m.startedAt));
    const phase = phaseByDate.get(date);
    if (phase == null) continue;
    phaseMigraineCounts.set(phase, (phaseMigraineCounts.get(phase) ?? 0) + 1);
  }

  // Find the highest-rate phase
  let bestPhase: CyclePhase | null = null;
  let bestRate = 0;
  let bestDayCount = 0;
  let bestMigraineCount = 0;

  for (const [phase, dayCount] of phaseDayCounts) {
    const migraineCount = phaseMigraineCounts.get(phase) ?? 0;
    const rate = dayCount > 0 ? migraineCount / dayCount : 0;
    if (rate > bestRate) {
      bestRate = rate;
      bestPhase = phase;
      bestDayCount = dayCount;
      bestMigraineCount = migraineCount;
    }
  }

  if (bestPhase == null || bestDayCount === 0) return null;

  const totalTrackedDays = Array.from(phaseDayCounts.values()).reduce((a, b) => a + b, 0);
  const baselineRate = totalTrackedDays > 0
    ? pct(completed.length, totalTrackedDays)
    : 0;
  const phaseRatePct = pct(bestMigraineCount, bestDayCount);
  const lift = baselineRate > 0 ? phaseRatePct / baselineRate : 0;
  const confidence = computeConfidence(completed.length);
  const label = phaseLabel(bestPhase);

  return {
    kind: 'cycle_phase',
    title: `${label} days show higher migraine risk`,
    body:
      `${bestMigraineCount} of your migraines have started during ${label.toLowerCase()} ` +
      `(${phaseRatePct}% of those days). Baseline rate: ${baselineRate}%.`,
    confidence,
    sampleSize: completed.length,
    score: lift,
  };
}

function phaseLabel(phase: CyclePhase): string {
  switch (phase) {
    case 'period': return 'Period';
    case 'follicular': return 'Follicular';
    case 'ovulation_window': return 'Ovulation window';
    case 'luteal': return 'Luteal';
    case 'late_luteal': return 'Late luteal';
  }
}

// ---------------------------------------------------------------------------
// 3. Food correlation
// ---------------------------------------------------------------------------

export type FoodLift = {
  tagName: string;
  migraineCount: number;
  totalCount: number;
  migraineRate: number;
  baselineRate: number;
  lift: number;
};

/**
 * Finds food tags that appear more on migraine days than non-migraine days.
 * Only considers tags logged ≥3 times total.
 *
 * @param migraines       All completed migraines.
 * @param checkinsByDate  Map of YYYY-MM-DD → check-in row.
 * @param foodTagNames    Map of food tag id → display name.
 */
export function foodCorrelation(
  migraines: MigraineRow[],
  checkinsByDate: Map<string, DailyCheckinRow>,
  foodTagNames: Map<string, string>,
): Correlation | null {
  const completed = migraines.filter((m) => m.endedAt != null);
  if (completed.length < MIN_SAMPLE) return null;

  const migrateDates = new Set(
    completed.map((m) =>
      toDateString(m.startedAt instanceof Date ? m.startedAt : new Date(m.startedAt)),
    ),
  );

  // Tally tag appearances on migraine days vs all days
  const tagMigraineCount = new Map<string, number>();
  const tagTotalCount = new Map<string, number>();

  for (const [date, checkin] of checkinsByDate) {
    for (const tagId of checkin.foodTagIds) {
      tagTotalCount.set(tagId, (tagTotalCount.get(tagId) ?? 0) + 1);
      if (migrateDates.has(date)) {
        tagMigraineCount.set(tagId, (tagMigraineCount.get(tagId) ?? 0) + 1);
      }
    }
  }

  const totalDays = checkinsByDate.size;
  const migDays = migrateDates.size;

  const lifts: FoodLift[] = [];
  for (const [tagId, total] of tagTotalCount) {
    if (total < 3) continue;
    const migraineCount = tagMigraineCount.get(tagId) ?? 0;
    const nonMigDays = totalDays - migDays;
    const baselineCount = total - migraineCount;
    const migraineRate = migDays > 0 ? migraineCount / migDays : 0;
    const baselineRate = nonMigDays > 0 ? baselineCount / nonMigDays : 0;
    const lift = baselineRate > 0 ? migraineRate / baselineRate : 0;
    const name = foodTagNames.get(tagId) ?? tagId;
    lifts.push({ tagName: name, migraineCount, totalCount: total, migraineRate, baselineRate, lift });
  }

  if (lifts.length === 0) return null;

  lifts.sort((a, b) => b.lift - a.lift);
  const top = lifts[0]!;
  const confidence = computeConfidence(completed.length);
  const migraineRatePct = pct(top.migraineCount, migDays);
  const nonMigDays = totalDays - migDays;
  const baselineMigraineCount = top.totalCount - top.migraineCount;
  const baselineRatePct = pct(baselineMigraineCount, nonMigDays);

  return {
    kind: 'food',
    title: `${top.tagName} appears often on migraine days`,
    body:
      `Logged on ${top.migraineCount} of ${migDays} migraine days (${migraineRatePct}%) ` +
      `vs ${baselineMigraineCount} of ${nonMigDays} non-migraine days (${baselineRatePct}%). ` +
      `${top.lift < 1.5 ? 'Could be coincidence — needs more data.' : ''}`,
    confidence,
    sampleSize: completed.length,
    score: top.lift,
  };
}

// ---------------------------------------------------------------------------
// 4. Sleep correlation
// ---------------------------------------------------------------------------

export type SleepBucket = '<6h' | '6-8h' | '>8h';

type SleepBucketStats = {
  bucket: SleepBucket;
  migraineCount: number;
  dayCount: number;
  rate: number;
};

function sleepBucket(hours: number): SleepBucket {
  if (hours < 6) return '<6h';
  if (hours <= 8) return '6-8h';
  return '>8h';
}

/**
 * Computes migraine rate per sleep bucket (<6h, 6-8h, >8h) vs. baseline.
 */
export function sleepCorrelation(
  migraines: MigraineRow[],
  checkinsByDate: Map<string, DailyCheckinRow>,
): Correlation | null {
  const completed = migraines.filter((m) => m.endedAt != null);
  if (completed.length < MIN_SAMPLE) return null;

  const migrateDates = new Set(
    completed.map((m) =>
      toDateString(m.startedAt instanceof Date ? m.startedAt : new Date(m.startedAt)),
    ),
  );

  const bucketDays = new Map<SleepBucket, number>();
  const bucketMigraines = new Map<SleepBucket, number>();

  for (const [date, checkin] of checkinsByDate) {
    if (checkin.sleepHours == null) continue;
    const b = sleepBucket(checkin.sleepHours);
    bucketDays.set(b, (bucketDays.get(b) ?? 0) + 1);
    if (migrateDates.has(date)) {
      bucketMigraines.set(b, (bucketMigraines.get(b) ?? 0) + 1);
    }
  }

  const buckets: SleepBucketStats[] = (['<6h', '6-8h', '>8h'] as SleepBucket[]).map((b) => {
    const dayCount = bucketDays.get(b) ?? 0;
    const migraineCount = bucketMigraines.get(b) ?? 0;
    const rate = dayCount > 0 ? migraineCount / dayCount : 0;
    return { bucket: b, migraineCount, dayCount, rate };
  });

  const lowSleep = buckets.find((b) => b.bucket === '<6h')!;
  const normalSleep = buckets.find((b) => b.bucket === '6-8h')!;
  if (lowSleep.dayCount === 0 || normalSleep.dayCount === 0) return null;

  const lift = normalSleep.rate > 0 ? lowSleep.rate / normalSleep.rate : lowSleep.rate * 10;
  const confidence = computeConfidence(completed.length);
  const lowRate = pct(lowSleep.migraineCount, lowSleep.dayCount);
  const normalRate = pct(normalSleep.migraineCount, normalSleep.dayCount);

  return {
    kind: 'sleep',
    title: 'Sleep under 6h shows correlation with migraines',
    body:
      `On days after fewer than 6 hours of sleep, ${lowRate}% resulted in a migraine ` +
      `vs ${normalRate}% on nights with 6-8h of sleep.`,
    confidence,
    sampleSize: completed.length,
    score: lift,
  };
}

// ---------------------------------------------------------------------------
// 5. Stress correlation
// ---------------------------------------------------------------------------

const STRESS_SIGNIFICANCE_THRESHOLD = 0.8;

/**
 * Compares average stress on migraine days vs. non-migraine days.
 * Significant if the difference exceeds 0.8 (on a 1–5 scale).
 */
export function stressCorrelation(
  migraines: MigraineRow[],
  checkinsByDate: Map<string, DailyCheckinRow>,
): Correlation | null {
  const completed = migraines.filter((m) => m.endedAt != null);
  if (completed.length < MIN_SAMPLE) return null;

  const migrateDates = new Set(
    completed.map((m) =>
      toDateString(m.startedAt instanceof Date ? m.startedAt : new Date(m.startedAt)),
    ),
  );

  const migraineStress: number[] = [];
  const cleanStress: number[] = [];

  for (const [date, checkin] of checkinsByDate) {
    if (checkin.stressLevel == null) continue;
    if (migrateDates.has(date)) {
      migraineStress.push(checkin.stressLevel);
    } else {
      cleanStress.push(checkin.stressLevel);
    }
  }

  if (migraineStress.length === 0 || cleanStress.length === 0) return null;

  const avgMigraine = avg(migraineStress);
  const avgClean = avg(cleanStress);
  const diff = avgMigraine - avgClean;

  if (diff < STRESS_SIGNIFICANCE_THRESHOLD) return null;

  const confidence = computeConfidence(completed.length);

  return {
    kind: 'stress',
    title: 'High stress appears before your migraines',
    body:
      `Average stress on migraine days: ${avgMigraine.toFixed(1)}/5. ` +
      `Average on non-migraine days: ${avgClean.toFixed(1)}/5.`,
    confidence,
    sampleSize: completed.length,
    score: diff,
  };
}

// ---------------------------------------------------------------------------
// 6. Caffeine correlation
// ---------------------------------------------------------------------------

/**
 * Compares average caffeine on migraine days vs. non-migraine days.
 * Same approach as stress — significant if difference > 0.8 cups.
 */
export function caffeineCorrelation(
  migraines: MigraineRow[],
  checkinsByDate: Map<string, DailyCheckinRow>,
): Correlation | null {
  const completed = migraines.filter((m) => m.endedAt != null);
  if (completed.length < MIN_SAMPLE) return null;

  const migrateDates = new Set(
    completed.map((m) =>
      toDateString(m.startedAt instanceof Date ? m.startedAt : new Date(m.startedAt)),
    ),
  );

  const migraine: number[] = [];
  const clean: number[] = [];

  for (const [date, checkin] of checkinsByDate) {
    if (checkin.caffeineCups == null) continue;
    if (migrateDates.has(date)) {
      migraine.push(checkin.caffeineCups);
    } else {
      clean.push(checkin.caffeineCups);
    }
  }

  if (migraine.length === 0 || clean.length === 0) return null;

  const avgMigraine = avg(migraine);
  const avgClean = avg(clean);
  const diff = Math.abs(avgMigraine - avgClean);

  if (diff < STRESS_SIGNIFICANCE_THRESHOLD) return null;

  const confidence = computeConfidence(completed.length);
  const direction = avgMigraine > avgClean ? 'higher' : 'lower';

  return {
    kind: 'caffeine',
    title: `Caffeine is ${direction} on migraine days`,
    body:
      `Average caffeine on migraine days: ${avgMigraine.toFixed(1)} cups. ` +
      `Average on non-migraine days: ${avgClean.toFixed(1)} cups.`,
    confidence,
    sampleSize: completed.length,
    score: diff,
  };
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

const CONFIDENCE_ORDER: Record<Confidence, number> = { high: 3, medium: 2, low: 1 };

/** Sort correlations: high confidence first, then by lift score descending. */
export function sortCorrelations(correlations: Correlation[]): Correlation[] {
  return [...correlations].sort((a, b) => {
    const cDiff = CONFIDENCE_ORDER[b.confidence] - CONFIDENCE_ORDER[a.confidence];
    if (cDiff !== 0) return cDiff;
    return b.score - a.score;
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function avg(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Re-export for test use
export { toDateString };
