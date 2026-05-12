import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfWeek, addDays, format } from 'date-fns';

import { useAllMigraineEvents } from '@/features/migraines/hooks';
import { db } from '@/db/client';
import { dailyCheckins, foodTags, weatherSnapshots, medicationDoses } from '@/db/schema';
import { phaseForDate, list as listCycleEvents } from '@/features/cycle/repo';
import { FEATURE_FLAGS } from '@/config/feature-flags';
import type { MigraineRow, DailyCheckinRow, WeatherSnapshotRow } from '@/types';
import type { CyclePhase } from '@/features/cycle/repo';
import type { HelperTag } from '@/db/schema/migraines';

import {
  pressureDropCorrelation,
  cyclePhaseCorrelation,
  foodCorrelation,
  sleepCorrelation,
  stressCorrelation,
  caffeineCorrelation,
  sortCorrelations,
  type Correlation,
} from './analytics';

// ---------------------------------------------------------------------------
// Query key factories
// ---------------------------------------------------------------------------

const INSIGHTS_KEYS = {
  checkins: ['insights', 'checkins'] as const,
  weather: ['insights', 'weather'] as const,
  foodTags: ['insights', 'foodTags'] as const,
  cycle: ['insights', 'cycle'] as const,
  doses: ['insights', 'doses'] as const,
};

// ---------------------------------------------------------------------------
// Data-loading hooks (TanStack Query wrappers around sync DB calls)
// ---------------------------------------------------------------------------

function useAllCheckins() {
  return useQuery({
    queryKey: INSIGHTS_KEYS.checkins,
    queryFn: () => db.select().from(dailyCheckins).all(),
    staleTime: 30_000,
  });
}

function useAllWeatherSnapshots() {
  return useQuery({
    queryKey: INSIGHTS_KEYS.weather,
    queryFn: () => db.select().from(weatherSnapshots).all(),
    staleTime: 60_000,
  });
}

function useAllFoodTags() {
  return useQuery({
    queryKey: INSIGHTS_KEYS.foodTags,
    queryFn: () => db.select().from(foodTags).all(),
    staleTime: 60_000,
  });
}

function useAllCycleEvents() {
  return useQuery({
    queryKey: INSIGHTS_KEYS.cycle,
    queryFn: () => {
      const result = listCycleEvents();
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    },
    staleTime: 60_000,
  });
}

// ---------------------------------------------------------------------------
// useCorrelations
// ---------------------------------------------------------------------------

/** Runs all correlation functions and returns sorted insight list. */
export function useCorrelations(): {
  correlations: Correlation[];
  isLoading: boolean;
  migraineCount: number;
} {
  const { data: migraines = [], isLoading: ml } = useAllMigraineEvents();
  const { data: checkinRows = [], isLoading: cl } = useAllCheckins();
  const { data: snapshots = [], isLoading: wl } = useAllWeatherSnapshots();
  const { data: foodTagRows = [], isLoading: fl } = useAllFoodTags();
  const { data: cycleEvents = [], isLoading: ycl } = useAllCycleEvents();

  const isLoading = ml || cl || wl || fl || ycl;

  const correlations = useMemo(() => {
    const completed = migraines.filter((m: MigraineRow) => m.endedAt != null);

    // Build lookup maps
    const checkinsByDate = new Map<string, DailyCheckinRow>(
      checkinRows.map((c) => [c.date, c]),
    );

    const weatherByMigraineId = new Map<string, WeatherSnapshotRow>();
    const snapshotById = new Map<string, WeatherSnapshotRow>(snapshots.map((s) => [s.id, s]));
    for (const m of completed) {
      if (m.weatherSnapshotId) {
        const snap = snapshotById.get(m.weatherSnapshotId);
        if (snap) weatherByMigraineId.set(m.id, snap);
      }
    }

    const foodTagNames = new Map<string, string>(foodTagRows.map((t) => [t.id, t.displayName]));

    // Cycle phase map: build for all checkin dates + migraine dates
    const allDates = new Set([
      ...Array.from(checkinsByDate.keys()),
      ...completed.map((m) =>
        toDateString(m.startedAt instanceof Date ? m.startedAt : new Date(m.startedAt)),
      ),
    ]);
    const phaseByDate = new Map<string, CyclePhase | null>();
    for (const date of allDates) {
      const result = phaseForDate(date);
      phaseByDate.set(date, result.ok ? result.value : null);
    }

    // Count distinct cycles (period_start events)
    const cycleCount = cycleEvents.filter((e) => e.eventType === 'period_start').length;

    const results: Correlation[] = [];
    const push = (c: Correlation | null) => { if (c) results.push(c); };

    push(pressureDropCorrelation(migraines, weatherByMigraineId, snapshots, snapshots.length));
    push(cyclePhaseCorrelation(migraines, phaseByDate, cycleCount));
    push(foodCorrelation(migraines, checkinsByDate, foodTagNames));
    push(sleepCorrelation(migraines, checkinsByDate));
    push(stressCorrelation(migraines, checkinsByDate));
    push(caffeineCorrelation(migraines, checkinsByDate));

    return sortCorrelations(results);
  }, [migraines, checkinRows, snapshots, foodTagRows, cycleEvents]);

  const migraineCount = useMemo(
    () => migraines.filter((m: MigraineRow) => m.endedAt != null).length,
    [migraines],
  );

  return { correlations, isLoading, migraineCount };
}

// ---------------------------------------------------------------------------
// useWeeklyBrief
// ---------------------------------------------------------------------------

export type WeeklyBrief = {
  migraineCount: number;
  migraineDetails: string[];
  pressureNotes: string[];
  sleepNotes: string[];
  stressNotes: string[];
  cluster: string | null;
};

/**
 * Generates a brief on-device summary of the given week (no AI).
 *
 * @param weekStart  Any date in the desired week; the hook normalises to Sunday.
 */
export function useWeeklyBrief(weekStart: Date): {
  brief: WeeklyBrief;
  isLoading: boolean;
} {
  const { data: migraines = [], isLoading: ml } = useAllMigraineEvents();
  const { data: snapshots = [], isLoading: wl } = useAllWeatherSnapshots();
  const { data: checkinRows = [], isLoading: cl } = useAllCheckins();

  const brief = useMemo<WeeklyBrief>(() => {
    const sunday = startOfWeek(weekStart, { weekStartsOn: 0 });
    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      weekDates.push(format(addDays(sunday, i), 'yyyy-MM-dd'));
    }
    const weekDateSet = new Set(weekDates);

    const weekMigraines = migraines.filter((m: MigraineRow) => {
      const d = m.startedAt instanceof Date ? m.startedAt : new Date(m.startedAt);
      return weekDateSet.has(toDateString(d));
    });

    // Build details for each migraine
    const migraineDetails = weekMigraines.map((m: MigraineRow) => {
      const d = m.startedAt instanceof Date ? m.startedAt : new Date(m.startedAt);
      const dayName = format(d, 'EEEE');
      const durationMs = m.endedAt
        ? (m.endedAt instanceof Date ? m.endedAt : new Date(m.endedAt)).getTime() - d.getTime()
        : null;
      const durationStr = durationMs != null ? formatDurationMs(durationMs) : 'ongoing';
      return `${dayName}, severity ${m.peakSeverity}, ${durationStr}`;
    });

    // Pressure notes for migraine days
    const snapshotById = new Map(snapshots.map((s: WeatherSnapshotRow) => [s.id, s]));
    const pressureNotes: string[] = [];
    for (const m of weekMigraines) {
      const d = m.startedAt instanceof Date ? m.startedAt : new Date(m.startedAt);
      const dayName = format(d, 'EEE');
      if (m.weatherSnapshotId) {
        const snap = snapshotById.get(m.weatherSnapshotId);
        if (snap?.pressureChange24hHpa != null && snap.pressureChange24hHpa <= -5) {
          const drop = Math.abs(Math.round(snap.pressureChange24hHpa));
          pressureNotes.push(`Pressure dropped ${drop}mb on ${dayName} morning.`);
        }
      }
    }

    // Sleep notes (below 6h on days before migraines)
    const checkinsByDate = new Map(checkinRows.map((c: DailyCheckinRow) => [c.date, c]));
    const sleepNotes: string[] = [];
    for (const m of weekMigraines) {
      const d = m.startedAt instanceof Date ? m.startedAt : new Date(m.startedAt);
      const prevDay = format(addDays(d, -1), 'yyyy-MM-dd');
      const prevDayName = format(addDays(d, -1), 'EEE');
      const checkin = checkinsByDate.get(prevDay);
      if (checkin?.sleepHours != null && checkin.sleepHours < 6) {
        sleepNotes.push(`Sleep was ${checkin.sleepHours}h on ${prevDayName}.`);
      }
    }

    // Stress notes (4+ on days before migraines)
    const stressNotes: string[] = [];
    for (const m of weekMigraines) {
      const d = m.startedAt instanceof Date ? m.startedAt : new Date(m.startedAt);
      const mDate = toDateString(d);
      const prevDay = format(addDays(d, -1), 'yyyy-MM-dd');
      const mDateCheckin = checkinsByDate.get(mDate);
      const prevDayCheckin = checkinsByDate.get(prevDay);

      const stressLines: string[] = [];
      if (mDateCheckin?.stressLevel != null && mDateCheckin.stressLevel >= 4) {
        stressLines.push(toDateString(d).slice(5)); // MM-DD
      }
      if (prevDayCheckin?.stressLevel != null && prevDayCheckin.stressLevel >= 4) {
        stressLines.push(prevDay.slice(5));
      }
      if (stressLines.length > 0) {
        const dayName = format(d, 'EEE');
        const prevDayName = format(addDays(d, -1), 'EEE');
        const stressDays = [prevDayCheckin?.stressLevel != null ? `${prevDayName} (${prevDayCheckin.stressLevel}/5)` : null, mDateCheckin?.stressLevel != null ? `${dayName} (${mDateCheckin.stressLevel}/5)` : null].filter(Boolean).join(' and ');
        stressNotes.push(`Stress was high on ${stressDays}.`);
      }
    }

    // Cluster: if we have low sleep + high stress + pressure drop on same migraine
    let cluster: string | null = null;
    if (
      weekMigraines.length > 0 &&
      sleepNotes.length > 0 &&
      stressNotes.length > 0 &&
      pressureNotes.length > 0
    ) {
      cluster = 'Possible cluster: low sleep + high stress + pressure drop.';
    }

    return {
      migraineCount: weekMigraines.length,
      migraineDetails,
      pressureNotes,
      sleepNotes,
      stressNotes,
      cluster,
    };
  }, [migraines, snapshots, checkinRows, weekStart]);

  return { brief, isLoading: ml || wl || cl };
}

// ---------------------------------------------------------------------------
// useTopHelpers
// ---------------------------------------------------------------------------

export type TopHelper = {
  helper: HelperTag;
  helpedCount: number;
  totalCount: number;
};

/**
 * Returns top-N helpers ranked by helped count across all migraine helpers arrays
 * and medication dose effectiveness ratings.
 */
export function useTopHelpers(limit: number): {
  topHelpers: TopHelper[];
  isLoading: boolean;
} {
  const { data: migraines = [], isLoading: ml } = useAllMigraineEvents();
  const dosesQuery = useQuery({
    queryKey: INSIGHTS_KEYS.doses,
    queryFn: () => db.select().from(medicationDoses).all(),
    staleTime: 30_000,
  });
  const { data: doses = [], isLoading: dl } = dosesQuery;

  const topHelpers = useMemo<TopHelper[]>(() => {
    const helpedCounts = new Map<HelperTag, number>();
    const totalCounts = new Map<HelperTag, number>();

    const inc = (tag: HelperTag, helped: boolean) => {
      totalCounts.set(tag, (totalCounts.get(tag) ?? 0) + 1);
      if (helped) helpedCounts.set(tag, (helpedCounts.get(tag) ?? 0) + 1);
    };

    // Migraine helpers arrays (each tag in helpers[] = "helped")
    for (const m of migraines as MigraineRow[]) {
      for (const tag of m.helpers) {
        inc(tag, true);
      }
    }

    // Medication dose effectiveness
    for (const dose of doses) {
      inc('medication', dose.effectivenessRating === 'helped' || dose.effectivenessRating === 'kind_of');
    }

    const all: TopHelper[] = [];
    for (const [helper, totalCount] of totalCounts) {
      all.push({ helper, helpedCount: helpedCounts.get(helper) ?? 0, totalCount });
    }

    all.sort((a, b) => {
      const aRate = a.helpedCount / a.totalCount;
      const bRate = b.helpedCount / b.totalCount;
      if (bRate !== aRate) return bRate - aRate;
      return b.helpedCount - a.helpedCount;
    });

    return all.slice(0, limit);
  }, [migraines, doses, limit]);

  return { topHelpers, isLoading: ml || dl };
}

// ---------------------------------------------------------------------------
// useMonthlyNarrative
// ---------------------------------------------------------------------------

export type MonthlyNarrativeState =
  | { isUnavailable: true; narrative: null; generate: null }
  | { isUnavailable: false; narrative: string | null; generate: () => void };

/**
 * Gated by FEATURE_FLAGS.monthlyAINarrative.
 * When off: returns isUnavailable=true. UI shows the "Cloud sync isn't enabled yet" sheet.
 */
export function useMonthlyNarrative(_yearMonth: string): MonthlyNarrativeState {
  if (!FEATURE_FLAGS.monthlyAINarrative) {
    return { isUnavailable: true, narrative: null, generate: null };
  }
  // When the flag is on, this would call Claude Haiku. Not implemented in v1.
  return { isUnavailable: false, narrative: null, generate: () => {} };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDurationMs(ms: number): string {
  const totalMins = Math.round(ms / 60_000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
