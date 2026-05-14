import React, { useMemo } from 'react';
import { View, Text } from 'react-native';

import { isSameMonth, format, getISOWeek } from 'date-fns';

import { FEATURE_FLAGS } from '@/config/feature-flags';
import { usePalette } from '@/theme/useTheme';
import { useDensity, useCalendarLayout, useShowCycle } from '@/theme/calendarTokenHooks';
import { FONT_FAMILY } from '@/theme/fonts';
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
  const palette = usePalette();
  const density = useDensity();
  const layout = useCalendarLayout();
  const showCycleSetting = useShowCycle();

  const grid = useMemo(() => getMonthGrid(yearMonth), [yearMonth]);
  const migraineMap = useMemo(() => buildMigraineMap(migraines), [migraines]);
  const checkinSet = useMemo(() => buildCheckinSet(checkins), [checkins]);

  const [year, month] = yearMonth.split('-').map(Number);
  const currentMonthDate = useMemo(() => new Date(year!, month! - 1, 1), [year, month]);

  const renderDay = (day: Date) => {
    const ds = toDateString(day);
    const migraine = migraineMap.get(ds);
    const dayState: DayState = {
      migraine: migraine
        ? { peakSeverity: migraine.peakSeverity, symptomTags: migraine.symptomTags }
        : null,
      triggerLikely: false,
    };
    const inMonth = isSameMonth(day, currentMonthDate);
    const cycleEnabled = FEATURE_FLAGS.cycleTracking && showCycleSetting;
    const cyclePhase = cycleEnabled ? (cycleMarkers[ds] ?? null) : null;

    return (
      <DayCell
        key={ds}
        date={day}
        currentMonth={currentMonthDate}
        dayState={dayState}
        hasCheckin={checkinSet.has(ds)}
        cyclePhase={inMonth ? cyclePhase : null}
        onPress={() => onDayPress(ds)}
        onLongPress={() => onDayLongPress(ds)}
      />
    );
  };

  if (layout === 'tidemark') {
    return (
      <View testID={testID} style={{ paddingHorizontal: density.headerPad - 4 }}>
        {grid.map((week, weekIdx) => {
          const firstInMonth = week.find((d) => isSameMonth(d, currentMonthDate)) ?? week[0]!;
          const weekNum = getISOWeek(firstInMonth);
          return (
            <View key={weekIdx} style={{ flexDirection: 'row', alignItems: 'stretch' }}>
              <View
                style={{
                  width: 22,
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  paddingLeft: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 9 * density.typeScale,
                    fontFamily: FONT_FAMILY.mono,
                    color: palette.textMuted,
                    letterSpacing: 1,
                  }}
                >
                  w{weekNum.toString().padStart(2, '0')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', flex: 1 }}>
                {week.map((day) => renderDay(day))}
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View testID={testID}>
      <MonthHeader />
      {grid.map((week, weekIdx) => (
        <View
          key={weekIdx}
          style={{
            flexDirection: 'row',
            paddingHorizontal: density.headerPad - 4,
          }}
        >
          {week.map((day) => renderDay(day))}
        </View>
      ))}
    </View>
  );
}

/**
 * Render-time month label used by tests and the screen chrome.
 * Kept here so the calendar feature owns its display formatting.
 */
export function formatCalendarMonthLabel(date: Date): string {
  return format(date, 'MMMM yyyy');
}
