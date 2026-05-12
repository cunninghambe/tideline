import { describe, it, expect } from 'vitest';

import {
  pressureDropCorrelation,
  cyclePhaseCorrelation,
  sleepCorrelation,
  stressCorrelation,
  caffeineCorrelation,
  foodCorrelation,
  toDateString,
} from './analytics';

import type { MigraineRow, DailyCheckinRow, WeatherSnapshotRow } from '@/types';
import type { CyclePhase } from '@/features/cycle/repo';

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

/**
 * Creates a MigraineRow with a given start date string (YYYY-MM-DD).
 * Default: completed (endedAt 4h after start). Pass noEnd=true for active.
 */
function makeMigraine(
  startDate: string,
  opts: {
    peakSeverity?: number;
    helpers?: MigraineRow['helpers'];
    weatherSnapshotId?: string | null;
    noEnd?: boolean;
  } = {},
): MigraineRow {
  const started = new Date(`${startDate}T08:00:00`);
  const ended = opts.noEnd ? null : new Date(started.getTime() + 4 * 3_600_000);
  return {
    id: `mig-${startDate}-${Math.random().toString(36).slice(2, 7)}`,
    startedAt: started,
    endedAt: ended,
    peakSeverity: opts.peakSeverity ?? 6,
    symptomTags: [],
    helpers: opts.helpers ?? [],
    postState: null,
    notes: null,
    weatherSnapshotId: opts.weatherSnapshotId ?? null,
    createdAt: started,
    updatedAt: started,
    syncedAt: null,
    pooledAt: null,
  } as MigraineRow;
}

function makeCheckin(
  date: string,
  opts: {
    sleepHours?: number;
    stressLevel?: number;
    caffeineCups?: number;
    foodTagIds?: string[];
  } = {},
): DailyCheckinRow {
  const now = new Date();
  return {
    id: `checkin-${date}`,
    date,
    sleepHours: opts.sleepHours ?? null,
    sleepQuality: null,
    stressLevel: opts.stressLevel ?? null,
    waterCups: null,
    caffeineCups: opts.caffeineCups ?? null,
    foodTagIds: opts.foodTagIds ?? [],
    notes: null,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
    pooledAt: null,
  } as DailyCheckinRow;
}

function makeWeatherSnapshot(
  id: string,
  pressureChange: number | null = null,
): WeatherSnapshotRow {
  return {
    id,
    capturedAt: new Date(),
    h3Cell: 'test-cell',
    temperatureC: 20,
    humidityPct: 50,
    pressureHpa: 1013,
    pressureChange24hHpa: pressureChange,
    windKph: 10,
    uvIndex: null,
    pollenIndex: null,
    source: 'open-meteo',
  } as WeatherSnapshotRow;
}

/** Returns YYYY-MM-DD string for a date N days after/before a base date string. */
function dateAdd(base: string, days: number): string {
  const d = new Date(`${base}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

// ---------------------------------------------------------------------------
// pressureDropCorrelation
// ---------------------------------------------------------------------------

describe('pressureDropCorrelation', () => {
  it('returns null when fewer than 5 completed migraines', () => {
    const migraines = ['2024-01-10', '2024-01-08', '2024-01-06'].map((d) =>
      makeMigraine(d),
    );
    expect(pressureDropCorrelation(migraines, new Map(), [], 10)).toBeNull();
  });

  it('returns null when no weather snapshots exist (totalDays=0 → baseline 0%)', () => {
    const migraines = Array.from({ length: 8 }, (_, i) =>
      makeMigraine(dateAdd('2024-01-20', -i)),
    );
    expect(pressureDropCorrelation(migraines, new Map(), [], 0)).toBeNull();
  });

  it('computes correct rates — spec example: 5/8 attacks after drops, 9/50 drop days', () => {
    const migraines: MigraineRow[] = [];
    const weatherByMigraineId = new Map<string, WeatherSnapshotRow>();

    for (let i = 0; i < 8; i++) {
      const snapId = `snap-${i}`;
      const m = makeMigraine(dateAdd('2024-01-20', -i), { weatherSnapshotId: snapId });
      migraines.push(m);
      // First 5 have pressure drops, last 3 don't
      weatherByMigraineId.set(m.id, makeWeatherSnapshot(snapId, i < 5 ? -7 : 1));
    }

    // 9 drop-day snapshots, 41 normal → total 50
    const allSnapshots: WeatherSnapshotRow[] = [
      ...Array.from({ length: 9 }, (_, j) => makeWeatherSnapshot(`drop-${j}`, -6)),
      ...Array.from({ length: 41 }, (_, j) => makeWeatherSnapshot(`no-${j}`, 2)),
    ];

    const result = pressureDropCorrelation(migraines, weatherByMigraineId, allSnapshots, 50);

    expect(result).not.toBeNull();
    expect(result!.body).toMatch(/5 of your last 8 attacks/);
    // 9/50 = 18%
    expect(result!.body).toMatch(/Baseline rate: 18%/);
    expect(result!.confidence).toBe('low'); // N=8 < 10
    expect(result!.sampleSize).toBe(8);
  });

  it('returns low/medium/high confidence based on sample size', () => {
    function makeSet(count: number) {
      const migraines = Array.from({ length: count }, (_, i) => {
        const snapId = `snap-${i}`;
        return makeMigraine(dateAdd('2024-01-20', -i), { weatherSnapshotId: snapId });
      });
      const byId = new Map(
        migraines.map((m, i) => [m.id, makeWeatherSnapshot(`snap-${i}`, -7)]),
      );
      const allSnaps = [makeWeatherSnapshot('base', -7)];
      return pressureDropCorrelation(migraines, byId, allSnaps, count + 5);
    }

    expect(makeSet(6)!.confidence).toBe('low');
    expect(makeSet(10)!.confidence).toBe('medium');
    expect(makeSet(30)!.confidence).toBe('high');
  });
});

// ---------------------------------------------------------------------------
// sleepCorrelation
// ---------------------------------------------------------------------------

describe('sleepCorrelation', () => {
  it('returns null with fewer than 5 completed migraines', () => {
    const migraines = ['2024-01-01', '2024-01-02'].map((d) => makeMigraine(d));
    const checkins = new Map([['2024-01-01', makeCheckin('2024-01-01', { sleepHours: 5 })]]);
    expect(sleepCorrelation(migraines, checkins)).toBeNull();
  });

  it('returns null with empty data', () => {
    expect(sleepCorrelation([], new Map())).toBeNull();
  });

  it('returns non-null with 10 migraines across all sleep buckets', () => {
    // 4 migraine days with <6h sleep, 4 with 6-8h, 2 with >8h
    // all checkins ON migraine dates (which is valid: the day you had a migraine,
    // your check-in records that night's sleep)
    const checkinMap = new Map<string, DailyCheckinRow>();
    const migraines: MigraineRow[] = [];
    const base = '2024-06-01';

    for (let i = 0; i < 4; i++) {
      const d = dateAdd(base, i);
      migraines.push(makeMigraine(d));
      checkinMap.set(d, makeCheckin(d, { sleepHours: 5 }));
    }
    for (let i = 4; i < 8; i++) {
      const d = dateAdd(base, i);
      migraines.push(makeMigraine(d));
      checkinMap.set(d, makeCheckin(d, { sleepHours: 7 }));
    }
    for (let i = 8; i < 10; i++) {
      const d = dateAdd(base, i);
      migraines.push(makeMigraine(d));
      checkinMap.set(d, makeCheckin(d, { sleepHours: 9 }));
    }

    const result = sleepCorrelation(migraines, checkinMap);
    expect(result).not.toBeNull();
    expect(result!.kind).toBe('sleep');
    expect(result!.sampleSize).toBe(10);
  });

  it('computes correct bucket rates: <6h days have higher migraine rate than 6-8h days', () => {
    const checkinMap = new Map<string, DailyCheckinRow>();
    const migraines: MigraineRow[] = [];
    const base = '2024-06-01';

    // 5 migraine days with <6h sleep
    for (let i = 0; i < 5; i++) {
      const d = dateAdd(base, i);
      migraines.push(makeMigraine(d));
      checkinMap.set(d, makeCheckin(d, { sleepHours: 5 }));
    }

    // 10 non-migraine days with 7h sleep (only checkins, no migraines)
    for (let i = 10; i < 20; i++) {
      const d = dateAdd(base, i);
      checkinMap.set(d, makeCheckin(d, { sleepHours: 7 }));
    }

    const result = sleepCorrelation(migraines, checkinMap);
    expect(result).not.toBeNull();
    expect(result!.kind).toBe('sleep');
    // <6h: 5/5 = 100%, 6-8h: 0/10 = 0% → lift > 1 (using max sentinel)
    expect(result!.score).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// stressCorrelation
// ---------------------------------------------------------------------------

describe('stressCorrelation', () => {
  it('returns null with fewer than 5 migraines', () => {
    expect(stressCorrelation([makeMigraine('2024-01-01')], new Map())).toBeNull();
  });

  it('returns null when stress difference is below 0.8 threshold', () => {
    const migraines = ['2024-06-01', '2024-06-02', '2024-06-03', '2024-06-04', '2024-06-05'].map(
      (d) => makeMigraine(d),
    );
    const checkinMap = new Map<string, DailyCheckinRow>();

    // Migraine days: stress 3
    ['2024-06-01', '2024-06-02', '2024-06-03', '2024-06-04', '2024-06-05'].forEach((d) => {
      checkinMap.set(d, makeCheckin(d, { stressLevel: 3 }));
    });
    // Non-migraine days: also stress 3
    ['2024-06-10', '2024-06-11', '2024-06-12', '2024-06-13', '2024-06-14'].forEach((d) => {
      checkinMap.set(d, makeCheckin(d, { stressLevel: 3 }));
    });

    expect(stressCorrelation(migraines, checkinMap)).toBeNull();
  });

  it('returns correlation when stress difference ≥ 0.8', () => {
    const migDates = ['2024-06-01', '2024-06-02', '2024-06-03', '2024-06-04', '2024-06-05'];
    const migraines = migDates.map((d) => makeMigraine(d));
    const checkinMap = new Map<string, DailyCheckinRow>();

    // Migraine days: high stress (4)
    migDates.forEach((d) => {
      checkinMap.set(d, makeCheckin(d, { stressLevel: 4 }));
    });
    // Non-migraine days: low stress (2)
    ['2024-06-10', '2024-06-11', '2024-06-12', '2024-06-13', '2024-06-14'].forEach((d) => {
      checkinMap.set(d, makeCheckin(d, { stressLevel: 2 }));
    });

    const result = stressCorrelation(migraines, checkinMap);
    expect(result).not.toBeNull();
    expect(result!.kind).toBe('stress');
    expect(result!.body).toContain('4.0/5');
    expect(result!.body).toContain('2.0/5');
  });
});

// ---------------------------------------------------------------------------
// caffeineCorrelation
// ---------------------------------------------------------------------------

describe('caffeineCorrelation', () => {
  it('returns null when difference is below 0.8 threshold', () => {
    const migDates = ['2024-06-01', '2024-06-02', '2024-06-03', '2024-06-04', '2024-06-05'];
    const migraines = migDates.map((d) => makeMigraine(d));
    const checkinMap = new Map<string, DailyCheckinRow>();

    migDates.forEach((d) => {
      checkinMap.set(d, makeCheckin(d, { caffeineCups: 2 }));
    });
    ['2024-06-10', '2024-06-11', '2024-06-12', '2024-06-13', '2024-06-14'].forEach((d) => {
      checkinMap.set(d, makeCheckin(d, { caffeineCups: 2 }));
    });

    expect(caffeineCorrelation(migraines, checkinMap)).toBeNull();
  });

  it('returns correlation when difference ≥ 0.8', () => {
    const migDates = ['2024-06-01', '2024-06-02', '2024-06-03', '2024-06-04', '2024-06-05'];
    const migraines = migDates.map((d) => makeMigraine(d));
    const checkinMap = new Map<string, DailyCheckinRow>();

    // Migraine days: 4 cups
    migDates.forEach((d) => {
      checkinMap.set(d, makeCheckin(d, { caffeineCups: 4 }));
    });
    // Clean days: 1 cup
    ['2024-06-10', '2024-06-11', '2024-06-12', '2024-06-13', '2024-06-14'].forEach((d) => {
      checkinMap.set(d, makeCheckin(d, { caffeineCups: 1 }));
    });

    const result = caffeineCorrelation(migraines, checkinMap);
    expect(result).not.toBeNull();
    expect(result!.kind).toBe('caffeine');
    expect(result!.body).toContain('4.0 cups');
  });
});

// ---------------------------------------------------------------------------
// foodCorrelation
// ---------------------------------------------------------------------------

describe('foodCorrelation', () => {
  it('returns null with fewer than 5 migraines', () => {
    expect(foodCorrelation([makeMigraine('2024-01-01')], new Map(), new Map())).toBeNull();
  });

  it('returns null when no food tag logged ≥ 3 times', () => {
    const migraines = ['2024-06-01', '2024-06-02', '2024-06-03', '2024-06-04', '2024-06-05'].map(
      (d) => makeMigraine(d),
    );
    const checkinMap = new Map([
      ['2024-06-01', makeCheckin('2024-06-01', { foodTagIds: ['tag-wine'] })],
      ['2024-06-02', makeCheckin('2024-06-02', { foodTagIds: ['tag-wine'] })],
    ]);
    expect(foodCorrelation(migraines, checkinMap, new Map([['tag-wine', 'Red wine']]))).toBeNull();
  });

  it('identifies top food tag when logged ≥ 3 times with high lift', () => {
    const migDates = ['2024-06-01', '2024-06-02', '2024-06-03', '2024-06-04', '2024-06-05'];
    const migraines = migDates.map((d) => makeMigraine(d));
    const checkinMap = new Map<string, DailyCheckinRow>();

    // Wine on all 5 migraine days
    migDates.forEach((d) => {
      checkinMap.set(d, makeCheckin(d, { foodTagIds: ['tag-wine'] }));
    });
    // Wine on 5 of 15 non-migraine days
    ['2024-06-10', '2024-06-11', '2024-06-12', '2024-06-13', '2024-06-14'].forEach((d) => {
      checkinMap.set(d, makeCheckin(d, { foodTagIds: ['tag-wine'] }));
    });
    ['2024-06-20', '2024-06-21', '2024-06-22', '2024-06-23', '2024-06-24',
      '2024-06-25', '2024-06-26', '2024-06-27', '2024-06-28', '2024-06-29'].forEach((d) => {
      checkinMap.set(d, makeCheckin(d, { foodTagIds: [] }));
    });

    const result = foodCorrelation(
      migraines,
      checkinMap,
      new Map([['tag-wine', 'Red wine']]),
    );
    expect(result).not.toBeNull();
    expect(result!.kind).toBe('food');
    expect(result!.title).toContain('Red wine');
    // wine on migraine days: 5/5 = 100%, on non-migraine: 5/15 = 33% → lift ≈ 3
    expect(result!.score).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// cyclePhaseCorrelation
// ---------------------------------------------------------------------------

describe('cyclePhaseCorrelation', () => {
  it('returns null with fewer than 5 migraines', () => {
    expect(
      cyclePhaseCorrelation([makeMigraine('2024-06-01')], new Map(), 3),
    ).toBeNull();
  });

  it('returns null when cycleCount < 2', () => {
    const migraines = ['2024-06-01', '2024-06-02', '2024-06-03', '2024-06-04', '2024-06-05', '2024-06-06'].map(
      (d) => makeMigraine(d),
    );
    expect(cyclePhaseCorrelation(migraines, new Map(), 1)).toBeNull();
  });

  it('identifies the phase with highest migraine rate', () => {
    // 4 migraines during 'period' phase, 1 during 'luteal'
    const migDates = ['2024-06-01', '2024-06-02', '2024-06-03', '2024-06-04'];
    const migraines = [
      ...migDates.map((d) => makeMigraine(d)),
      makeMigraine('2024-06-15'), // luteal migraine
    ];

    const phaseByDate = new Map<string, CyclePhase | null>();

    // 9 period days (4 migraine + 5 non-migraine)
    for (let i = 0; i < 9; i++) {
      phaseByDate.set(dateAdd('2024-06-01', i), 'period');
    }

    // 11 luteal days (1 migraine + 10 non-migraine)
    for (let i = 0; i < 11; i++) {
      phaseByDate.set(dateAdd('2024-06-15', i), 'luteal');
    }

    const result = cyclePhaseCorrelation(migraines, phaseByDate, 3);

    expect(result).not.toBeNull();
    expect(result!.kind).toBe('cycle_phase');
    // period: 4/9 = 44%, luteal: 1/11 = 9% → period should win
    expect(result!.title).toContain('Period');
  });
});
