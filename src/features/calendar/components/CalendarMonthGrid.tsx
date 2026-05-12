import React, { useMemo } from 'react';
import { View } from 'react-native';

import { isSameMonth } from 'date-fns';

import { FEATURE_FLAGS } from '@/config/feature-flags';
import { getMonthGrid, toDateString, type DayState } from '../utils';
import { MonthHeader } from './MonthHeader';
import { DayCell } from './DayCell';

import type { MigraineRow, DailyCheckinRow } from '@/types';
import type { CyclePhase } from '@/features/cycle/repo';

type CalendarMonthGridProps = {
  yearMonth: string;
  migraines: MigraineRow[];
  checkins: DailyCheckinRow[];
  cycleMarkers: Record<string, CyclePhase | null>;
  onDayPress: (dateString: string) => void;
  onDayLongPress: (dateString: string) => void;
  testID?: string;
};

function buildMigraineMap(migraines: MigraineRow[]): Map<string, MigraineRow> {
  const map = new Map<string, MigraineRow>();
  for (const m of migraines) {
    const d = m.startedAt instanceof Date ? m.startedAt : new Date(m.startedAt);
    map.set(toDateString(d), m);
  }
  return map;
}

function buildCheckinSet(checkins: DailyCheckinRow[]): Set<string> {
  return new Set(checkins.map((c) => c.date));
}

export function CalendarMonthGrid({
  yearMonth,
  migraines,
  checkins,
  cycleMarkers,
  onDayPress,
  onDayLongPress,
  testID,
}: CalendarMonthGridProps) {
  const grid = useMemo(() => getMonthGrid(yearMonth), [yearMonth]);
  const migraineMap = useMemo(() => buildMigraineMap(migraines), [migraines]);
  const checkinSet = useMemo(() => buildCheckinSet(checkins), [checkins]);

  const [year, month] = yearMonth.split('-').map(Number);
  const currentMonthDate = useMemo(() => new Date(year!, month! - 1, 1), [year, month]);

  return (
    <View testID={testID}>
      <MonthHeader />
      {grid.map((week, weekIdx) => (
        <View key={weekIdx} style={{ flexDirection: 'row' }}>
          {week.map((day) => {
            const ds = toDateString(day);
            const migraine = migraineMap.get(ds);
            const dayState: DayState = {
              migraine: migraine
                ? { peakSeverity: migraine.peakSeverity, symptomTags: migraine.symptomTags }
                : null,
              triggerLikely: false,
            };
            const cyclePhase = FEATURE_FLAGS.cycleTracking ? (cycleMarkers[ds] ?? null) : null;

            return (
              <DayCell
                key={ds}
                date={day}
                currentMonth={currentMonthDate}
                dayState={dayState}
                hasCheckin={checkinSet.has(ds)}
                cyclePhase={isSameMonth(day, currentMonthDate) ? cyclePhase : null}
                onPress={() => onDayPress(ds)}
                onLongPress={() => onDayLongPress(ds)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}
