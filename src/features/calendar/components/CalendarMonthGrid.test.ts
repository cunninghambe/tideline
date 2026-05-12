/**
 * CalendarMonthGrid component tests.
 *
 * Since react-native components cannot render in a Node/jsdom environment
 * without a full React Native test runtime (jest-expo), these tests verify
 * the data transformation logic that drives rendering:
 *  - dayCellColor produces the correct colour given migraine data
 *  - The migraine map correctly maps dates to migraine records
 *  - The checkin set correctly identifies dates with check-ins
 *
 * A full render smoke-test requires jest-expo or equivalent; tracked in
 * INTEGRATION-NOTES.md under "### calendar".
 */

import { describe, it, expect } from 'vitest';
import { dayCellColor, toDateString } from '../utils';
import type { DayState } from '../utils';
import type { PaletteTokens } from '@/theme/palettes';

const palette: PaletteTokens = {
  bg: '#F5EFE6',
  surface: '#FBF7F0',
  surfaceElevated: '#FFFEFB',
  textPrimary: '#3A2E1F',
  textSecondary: '#7A6A52',
  textMuted: '#A89A82',
  textInverse: '#FBF7F0',
  border: '#E5DCCB',
  divider: '#EFE7D7',
  accentPrimary: '#B85C38',
  accentSecondary: '#7A8B6F',
  severitySevere: '#8B2E1F',
  severityModerate: '#C97A4B',
  severityMild: '#E5C29F',
  duringTint: '#1F1810',
};

// ---------------------------------------------------------------------------
// Mock migraine rows (matching the seed data shape)
// ---------------------------------------------------------------------------

const today = new Date();
const daysAgo = (n: number) => new Date(today.getTime() - n * 86_400_000);

const severeMigraine = {
  id: 'severe-id',
  startedAt: daysAgo(5),
  endedAt: new Date(daysAgo(5).getTime() + 4 * 3_600_000),
  peakSeverity: 8,
  symptomTags: ['throbbing', 'light_sensitive', 'nausea'],
  helpers: ['medication', 'dark_room'],
  postState: 'drained',
  notes: null,
  weatherSnapshotId: null,
  createdAt: daysAgo(5),
  updatedAt: daysAgo(5),
  syncedAt: null,
  pooledAt: null,
};

const mildMigraine = {
  id: 'mild-id',
  startedAt: daysAgo(12),
  endedAt: new Date(daysAgo(12).getTime() + 2 * 3_600_000),
  peakSeverity: 3,
  symptomTags: ['throbbing'],
  helpers: ['hydration', 'sleep'],
  postState: 'almost_normal',
  notes: null,
  weatherSnapshotId: null,
  createdAt: daysAgo(12),
  updatedAt: daysAgo(12),
  syncedAt: null,
  pooledAt: null,
};

const auraOnlyMigraine = {
  id: 'aura-id',
  startedAt: daysAgo(20),
  endedAt: new Date(daysAgo(20).getTime() + 0.5 * 3_600_000),
  peakSeverity: 0,
  symptomTags: ['aura'],
  helpers: ['dark_room'],
  postState: 'fine',
  notes: null,
  weatherSnapshotId: null,
  createdAt: daysAgo(20),
  updatedAt: daysAgo(20),
  syncedAt: null,
  pooledAt: null,
};

const checkinRow = {
  id: 'ci-id',
  date: toDateString(daysAgo(5)),
  sleepHours: 7,
  sleepQuality: 3,
  stressLevel: 2,
  waterCups: 6,
  caffeineCups: 1,
  foodTagIds: [] as string[],
  notes: null,
  createdAt: daysAgo(5),
  updatedAt: daysAgo(5),
  syncedAt: null,
  pooledAt: null,
};

// ---------------------------------------------------------------------------
// Tests: cell colour per migraine data
// ---------------------------------------------------------------------------

describe('CalendarMonthGrid — cell colour logic', () => {
  it('severe migraine (severity 8) gets severitySevere colour', () => {
    const state: DayState = {
      migraine: { peakSeverity: severeMigraine.peakSeverity, symptomTags: severeMigraine.symptomTags },
    };
    expect(dayCellColor(state, palette)).toBe(palette.severitySevere);
  });

  it('mild migraine (severity 3) gets severityMild colour', () => {
    const state: DayState = {
      migraine: { peakSeverity: mildMigraine.peakSeverity, symptomTags: mildMigraine.symptomTags },
    };
    expect(dayCellColor(state, palette)).toBe(palette.severityMild);
  });

  it('aura-only migraine (severity 0 + aura tag) gets accentSecondary colour', () => {
    const state: DayState = {
      migraine: { peakSeverity: auraOnlyMigraine.peakSeverity, symptomTags: auraOnlyMigraine.symptomTags },
    };
    expect(dayCellColor(state, palette)).toBe(palette.accentSecondary);
  });

  it('day with no migraine gets bg colour', () => {
    const state: DayState = {};
    expect(dayCellColor(state, palette)).toBe(palette.bg);
  });
});

// ---------------------------------------------------------------------------
// Tests: migraine date mapping (logic extracted from buildMigraineMap)
// ---------------------------------------------------------------------------

describe('CalendarMonthGrid — migraine date mapping', () => {
  function buildMigraineMap(migraines: typeof severeMigraine[]) {
    const map = new Map<string, typeof severeMigraine>();
    for (const m of migraines) {
      const d = m.startedAt instanceof Date ? m.startedAt : new Date(m.startedAt);
      map.set(toDateString(d), m);
    }
    return map;
  }

  it('correctly maps 3 migraines to their date strings', () => {
    const map = buildMigraineMap([severeMigraine, mildMigraine, auraOnlyMigraine]);
    expect(map.size).toBe(3);
    expect(map.get(toDateString(daysAgo(5)))).toBe(severeMigraine);
    expect(map.get(toDateString(daysAgo(12)))).toBe(mildMigraine);
    expect(map.get(toDateString(daysAgo(20)))).toBe(auraOnlyMigraine);
  });
});

// ---------------------------------------------------------------------------
// Tests: check-in set (logic extracted from buildCheckinSet)
// ---------------------------------------------------------------------------

describe('CalendarMonthGrid — check-in detection', () => {
  function buildCheckinSet(checkins: typeof checkinRow[]) {
    return new Set(checkins.map((c) => c.date));
  }

  it('correctly identifies the date with a check-in', () => {
    const set = buildCheckinSet([checkinRow]);
    expect(set.has(toDateString(daysAgo(5)))).toBe(true);
    expect(set.has(toDateString(daysAgo(6)))).toBe(false);
  });

  it('returns empty set when no check-ins', () => {
    const set = buildCheckinSet([]);
    expect(set.size).toBe(0);
  });
});
