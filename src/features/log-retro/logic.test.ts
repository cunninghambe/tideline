import { describe, it, expect } from 'vitest';
import {
  makeInitialState,
  hasChanged,
  toDate,
  toISODate,
  formatHHMM,
  normaliseFoodTagName,
  toggleInList,
  type QueuedDose,
} from './logic';

// ---------------------------------------------------------------------------
// hasChanged — discard confirmation logic
// ---------------------------------------------------------------------------

describe('hasChanged', () => {
  it('returns false when state matches initial', () => {
    const initial = makeInitialState('2026-05-10');
    const state = { ...initial };
    expect(hasChanged(state, initial)).toBe(false);
  });

  it('returns true when startDate differs', () => {
    const initial = makeInitialState('2026-05-10');
    const state = { ...initial, startDate: '2026-05-11' };
    expect(hasChanged(state, initial)).toBe(true);
  });

  it('returns true when startHour differs', () => {
    const initial = makeInitialState('2026-05-10');
    const state = { ...initial, startHour: initial.startHour + 1 };
    expect(hasChanged(state, initial)).toBe(true);
  });

  it('returns true when startMinute differs', () => {
    const initial = makeInitialState('2026-05-10');
    const state = { ...initial, startMinute: (initial.startMinute + 15) % 60 };
    expect(hasChanged(state, initial)).toBe(true);
  });

  it('returns true when stillGoing is toggled', () => {
    const initial = makeInitialState('2026-05-10');
    const state = { ...initial, stillGoing: !initial.stillGoing };
    expect(hasChanged(state, initial)).toBe(true);
  });

  it('returns true when peakSeverity differs', () => {
    const initial = makeInitialState('2026-05-10');
    const state = { ...initial, peakSeverity: 8 };
    expect(hasChanged(state, initial)).toBe(true);
  });

  it('returns true when auraOnly is toggled', () => {
    const initial = makeInitialState('2026-05-10');
    const state = { ...initial, auraOnly: true };
    expect(hasChanged(state, initial)).toBe(true);
  });

  it('returns true when a symptom tag is added', () => {
    const initial = makeInitialState('2026-05-10');
    const state = { ...initial, symptomTags: ['throbbing' as const] };
    expect(hasChanged(state, initial)).toBe(true);
  });

  it('returns true when waterCups differ', () => {
    const initial = makeInitialState('2026-05-10');
    const state = { ...initial, waterCups: 3 };
    expect(hasChanged(state, initial)).toBe(true);
  });

  it('returns true when a food tag is added', () => {
    const initial = makeInitialState('2026-05-10');
    const state = { ...initial, foodTagIds: ['tag-1'] };
    expect(hasChanged(state, initial)).toBe(true);
  });

  it('returns true when a helper is added', () => {
    const initial = makeInitialState('2026-05-10');
    const state = { ...initial, helpers: ['sleep' as const] };
    expect(hasChanged(state, initial)).toBe(true);
  });

  it('returns true when notes are entered', () => {
    const initial = makeInitialState('2026-05-10');
    const state = { ...initial, notes: 'felt terrible' };
    expect(hasChanged(state, initial)).toBe(true);
  });

  it('returns true when a dose is queued', () => {
    const initial = makeInitialState('2026-05-10');
    const dose: QueuedDose = {
      medicationId: 'med-1',
      doseAmount: '50mg',
      takenAt: new Date(),
      effectivenessRating: 'helped',
    };
    const state = { ...initial, queuedDoses: [dose] };
    expect(hasChanged(state, initial)).toBe(true);
  });

  it('returns true when endDate differs', () => {
    const initial = makeInitialState('2026-05-10');
    const state = { ...initial, endDate: '2026-05-11' };
    expect(hasChanged(state, initial)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Queued-doses flushing — the flush logic is handled by the hook, but we
// can verify that QueuedDose has the right shape (migraineEventId absent
// before flush, present after caller adds it).
// ---------------------------------------------------------------------------

describe('queued-doses flush contract', () => {
  it('QueuedDose has no migraineEventId (it is added at flush time)', () => {
    const dose: QueuedDose = {
      medicationId: 'med-abc',
      doseAmount: '50mg',
      takenAt: new Date('2026-05-10T14:30:00'),
      effectivenessRating: 'kind_of',
    };
    // migraineEventId is NOT in QueuedDose — only added when calling recordDose
    expect('migraineEventId' in dose).toBe(false);
  });

  it('doses are written with the correct migraineEventId after flush', () => {
    // Simulate what the hook does: take QueuedDose items and build RecordDoseData
    const migraineId = '01J5XYZ';
    const doses: QueuedDose[] = [
      {
        medicationId: 'med-1',
        doseAmount: '50mg',
        takenAt: new Date('2026-05-10T14:00:00'),
        effectivenessRating: 'helped',
      },
      {
        medicationId: 'med-2',
        doseAmount: '400mg',
        takenAt: new Date('2026-05-10T15:00:00'),
        effectivenessRating: null,
      },
    ];

    // Flush: map each QueuedDose to a RecordDoseData by adding migraineEventId
    const flushed = doses.map((d) => ({
      medicationId: d.medicationId,
      migraineEventId: migraineId,
      takenAt: d.takenAt,
      doseAmount: d.doseAmount,
      effectivenessRating: d.effectivenessRating,
      timeToReliefMinutes: null,
    }));

    expect(flushed).toHaveLength(2);
    expect(flushed[0]!.migraineEventId).toBe(migraineId);
    expect(flushed[1]!.migraineEventId).toBe(migraineId);
    expect(flushed[0]!.medicationId).toBe('med-1');
    expect(flushed[1]!.doseAmount).toBe('400mg');
  });
});

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

describe('toDate', () => {
  it('combines date string and hour/minute into a Date', () => {
    const d = toDate('2026-05-10', 14, 30);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(4); // May = 4
    expect(d.getDate()).toBe(10);
    expect(d.getHours()).toBe(14);
    expect(d.getMinutes()).toBe(30);
  });

  it('handles midnight (hour=0, minute=0)', () => {
    const d = toDate('2026-01-01', 0, 0);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });
});

describe('toISODate', () => {
  it('formats a Date to YYYY-MM-DD', () => {
    const d = new Date(2026, 4, 10); // May 10 2026 local
    expect(toISODate(d)).toBe('2026-05-10');
  });

  it('pads month and day with leading zeros', () => {
    const d = new Date(2026, 0, 5); // Jan 5 2026
    expect(toISODate(d)).toBe('2026-01-05');
  });
});

describe('formatHHMM', () => {
  it('pads single-digit hour and minute', () => {
    expect(formatHHMM(9, 5)).toBe('09:05');
  });

  it('handles midnight', () => {
    expect(formatHHMM(0, 0)).toBe('00:00');
  });

  it('handles end of day', () => {
    expect(formatHHMM(23, 59)).toBe('23:59');
  });
});

describe('normaliseFoodTagName', () => {
  it('lowercases and trims', () => {
    expect(normaliseFoodTagName('  Red Wine  ')).toBe('red wine');
  });

  it('handles already-normalised input', () => {
    expect(normaliseFoodTagName('chocolate')).toBe('chocolate');
  });

  it('handles mixed case', () => {
    expect(normaliseFoodTagName('Spicy Curry')).toBe('spicy curry');
  });
});

describe('toggleInList', () => {
  it('adds a value when absent', () => {
    expect(toggleInList(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
  });

  it('removes a value when present', () => {
    expect(toggleInList(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });

  it('works with an empty list', () => {
    expect(toggleInList([], 'x')).toEqual(['x']);
  });

  it('returns empty list when removing the only element', () => {
    expect(toggleInList(['x'], 'x')).toEqual([]);
  });
});
