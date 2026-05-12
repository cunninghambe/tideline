import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { isSameMonth, isToday, isFuture } from 'date-fns';

import { usePalette } from '@/theme/useTheme';
import { dayCellColor, toDateString, type DayState } from '../utils';
import type { CyclePhase } from '@/features/cycle/repo';

type DayCellProps = {
  date: Date;
  currentMonth: Date;
  dayState: DayState;
  hasCheckin: boolean;
  cyclePhase: CyclePhase | null;
  onPress: () => void;
  onLongPress: () => void;
  testID?: string;
};

function CycleMarker({ phase, color }: { phase: CyclePhase; color: string }) {
  if (phase === 'follicular' || phase === 'luteal') return null;

  if (phase === 'period') {
    return (
      <View
        style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }}
        accessibilityLabel="period"
      />
    );
  }

  if (phase === 'ovulation_window') {
    return (
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          borderWidth: 1,
          borderColor: color,
          backgroundColor: 'transparent',
        }}
        accessibilityLabel="ovulation window"
      />
    );
  }

  // late_luteal: half-filled dot — approximated with two layered views
  if (phase === 'late_luteal') {
    return (
      <View
        style={{ width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: color, overflow: 'hidden' }}
        accessibilityLabel="late luteal"
      >
        <View style={{ width: 3, height: 6, backgroundColor: color }} />
      </View>
    );
  }

  return null;
}

export function DayCell({
  date,
  currentMonth,
  dayState,
  hasCheckin,
  cyclePhase,
  onPress,
  onLongPress,
  testID,
}: DayCellProps) {
  const palette = usePalette();

  const isCurrentMonth = isSameMonth(date, currentMonth);
  const todayDay = isToday(date);
  const futureDay = isFuture(date) && !todayDay;

  const bgColor = isCurrentMonth && !futureDay ? dayCellColor(dayState, palette) : palette.bg;
  const isTriggerLikely = isCurrentMonth && !futureDay && dayState.triggerLikely && !dayState.migraine;

  const dayNumber = date.getDate();
  const textColor = isCurrentMonth && !futureDay ? palette.textPrimary : palette.textMuted;

  return (
    <Pressable
      onPress={futureDay ? undefined : onPress}
      onLongPress={futureDay ? undefined : onLongPress}
      disabled={futureDay}
      testID={testID ?? `day-cell-${toDateString(date)}`}
      accessibilityRole="button"
      accessibilityLabel={`${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}${todayDay ? ', today' : ''}`}
      accessibilityState={{ disabled: futureDay }}
      style={{
        flex: 1,
        minHeight: 44,
        minWidth: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bgColor,
        borderWidth: todayDay ? 1 : isTriggerLikely ? 1 : 0,
        borderColor: todayDay ? palette.accentPrimary : isTriggerLikely ? palette.accentPrimary : 'transparent',
        borderRadius: 4,
        margin: 1,
      }}
    >
      {/* Cycle marker — top-right corner */}
      {cyclePhase && isCurrentMonth && (
        <View style={{ position: 'absolute', top: 3, right: 3 }}>
          <CycleMarker phase={cyclePhase} color={palette.accentPrimary} />
        </View>
      )}

      {/* Day number */}
      <Text
        style={{
          color: textColor,
          fontSize: 14,
          fontWeight: todayDay ? '600' : '400',
        }}
      >
        {dayNumber}
      </Text>

      {/* Check-in dot — bottom-center */}
      {hasCheckin && isCurrentMonth && (
        <View
          style={{
            position: 'absolute',
            bottom: 3,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: palette.textMuted,
          }}
          accessibilityLabel="check-in logged"
        />
      )}
    </Pressable>
  );
}
