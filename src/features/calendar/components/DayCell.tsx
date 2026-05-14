import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { isSameMonth, isToday, isFuture } from 'date-fns';

import { usePalette } from '@/theme/useTheme';
import { useDensity, useAccentOpacity, useCalendarLayout } from '@/theme/calendarTokenHooks';
import { FONT_FAMILY } from '@/theme/fonts';
import type { PaletteTokens } from '@/theme/palettes';
import type { DensityTokens } from '@/theme/calendarTokens';
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

// ---------------------------------------------------------------------------
// Cycle marker — 6px glyph in the corner of a day cell.
// ---------------------------------------------------------------------------

function CycleMarker({ phase, color, size = 6 }: { phase: CyclePhase; color: string; size?: number }) {
  if (phase === 'follicular' || phase === 'luteal') return null;

  const common = { width: size, height: size, borderRadius: size / 2 };

  if (phase === 'period') {
    return (
      <View
        style={{ ...common, backgroundColor: color }}
        accessibilityLabel="period"
      />
    );
  }

  if (phase === 'ovulation_window') {
    return (
      <View
        style={{ ...common, borderWidth: 1, borderColor: color, backgroundColor: 'transparent' }}
        accessibilityLabel="ovulation window"
      />
    );
  }

  if (phase === 'late_luteal') {
    return (
      <View
        style={{ ...common, borderWidth: 1, borderColor: color, overflow: 'hidden' }}
        accessibilityLabel="late luteal"
      >
        <View style={{ width: size / 2, height: size, backgroundColor: color }} />
      </View>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Luminance helper — for contrast-aware text colour on filled cells.
// ---------------------------------------------------------------------------

function getLuminance(hex: string): number {
  if (!hex || hex === 'transparent') return 1;
  const m = hex.replace('#', '');
  if (m.length < 6) return 1;
  const r = parseInt(m.substr(0, 2), 16) / 255;
  const g = parseInt(m.substr(2, 2), 16) / 255;
  const b = parseInt(m.substr(4, 2), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// ---------------------------------------------------------------------------
// Variant-internal props
// ---------------------------------------------------------------------------

type VariantContext = {
  palette: PaletteTokens;
  density: DensityTokens;
  accentOpacity: number;
};

type ResolvedDay = {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  todayDay: boolean;
  futureDay: boolean;
  severity: number | null | undefined;
  severityColor: string | null;
  isAuraOnly: boolean;
  isTriggerLikely: boolean;
  hasCheckin: boolean;
  cyclePhase: CyclePhase | null;
};

// ---------------------------------------------------------------------------
// Grid variant — full-cell severity fill (the design's primary variant).
// ---------------------------------------------------------------------------

function GridVariant({
  resolved,
  ctx,
  onPress,
  onLongPress,
  testID,
  accessibilityLabel,
}: {
  resolved: ResolvedDay;
  ctx: VariantContext;
  onPress: () => void;
  onLongPress: () => void;
  testID: string;
  accessibilityLabel: string;
}) {
  const { palette, density, accentOpacity } = ctx;
  const showFill = !!resolved.severityColor && !resolved.futureDay;
  const cellBg = showFill ? resolved.severityColor! : 'transparent';

  const textColor = !resolved.isCurrentMonth
    ? palette.textMuted
    : resolved.futureDay
      ? palette.textMuted
      : showFill && getLuminance(cellBg) < 0.45
        ? palette.textInverse
        : palette.textPrimary;

  return (
    <Pressable
      onPress={resolved.futureDay ? undefined : onPress}
      onLongPress={resolved.futureDay ? undefined : onLongPress}
      disabled={resolved.futureDay}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: resolved.futureDay }}
      style={{
        flex: 1,
        minHeight: density.cellSize,
        margin: density.cellGap / 2,
        borderWidth: resolved.todayDay ? 1 : resolved.isTriggerLikely ? 1 : 0,
        borderColor: resolved.todayDay || resolved.isTriggerLikely ? palette.accentPrimary : 'transparent',
        borderStyle: resolved.isTriggerLikely && !resolved.todayDay ? 'dashed' : 'solid',
        borderRadius: density.cellRadius,
        backgroundColor: cellBg,
        opacity: showFill ? accentOpacity : 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {resolved.cyclePhase && resolved.isCurrentMonth && (
        <View style={{ position: 'absolute', top: 4, right: 4 }}>
          <CycleMarker
            phase={resolved.cyclePhase}
            color={textColor === palette.textInverse ? palette.textInverse : palette.accentPrimary}
          />
        </View>
      )}
      <Text
        style={{
          color: textColor,
          fontSize: 14 * density.typeScale,
          fontFamily: resolved.todayDay ? FONT_FAMILY.sansSemibold : FONT_FAMILY.sans,
          opacity: resolved.isCurrentMonth ? 1 : 0.5,
        }}
      >
        {resolved.dayNumber}
      </Text>
      {resolved.isAuraOnly && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 4,
            left: 4,
            right: 4,
            bottom: 4,
            borderRadius: Math.max(density.cellRadius - 2, 2),
            borderWidth: 1,
            borderColor: palette.auraOnly,
          }}
        />
      )}
      {resolved.hasCheckin && resolved.isCurrentMonth && !showFill && (
        <View
          style={{
            position: 'absolute',
            bottom: 4,
            width: 3,
            height: 3,
            borderRadius: 2,
            backgroundColor: palette.textMuted,
            opacity: 0.7,
          }}
          accessibilityLabel="check-in logged"
        />
      )}
      {resolved.hasCheckin && resolved.isCurrentMonth && showFill && (
        <View
          style={{
            position: 'absolute',
            bottom: 4,
            width: 3,
            height: 3,
            borderRadius: 2,
            backgroundColor: palette.textInverse,
            opacity: 0.7,
          }}
          accessibilityLabel="check-in logged"
        />
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Tidemark variant — taller cell with severity as a bottom bar.
// ---------------------------------------------------------------------------

function TidemarkVariant({
  resolved,
  ctx,
  onPress,
  onLongPress,
  testID,
  accessibilityLabel,
}: {
  resolved: ResolvedDay;
  ctx: VariantContext;
  onPress: () => void;
  onLongPress: () => void;
  testID: string;
  accessibilityLabel: string;
}) {
  const { palette, density, accentOpacity } = ctx;
  const cellHeight = density.cellSize + 16;
  const level = typeof resolved.severity === 'number' ? resolved.severity : 0;
  const barWidth = level > 0 ? Math.max(0.25, level / 10) : 0;

  return (
    <Pressable
      onPress={resolved.futureDay ? undefined : onPress}
      onLongPress={resolved.futureDay ? undefined : onLongPress}
      disabled={resolved.futureDay}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: resolved.futureDay }}
      style={{
        flex: 1,
        height: cellHeight,
        margin: density.cellGap / 2,
        borderWidth: 1,
        borderColor: resolved.todayDay
          ? palette.accentPrimary
          : resolved.isTriggerLikely
            ? palette.accentPrimary
            : palette.border,
        borderStyle: resolved.isTriggerLikely && !resolved.todayDay ? 'dashed' : 'solid',
        borderRadius: density.cellRadius,
        backgroundColor: palette.surface,
        opacity: resolved.futureDay ? 0.4 : 1,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Text
        style={{
          position: 'absolute',
          top: 6,
          left: 8,
          color: resolved.isCurrentMonth ? palette.textPrimary : palette.textMuted,
          fontSize: 13 * density.typeScale,
          fontFamily: resolved.todayDay ? FONT_FAMILY.sansSemibold : FONT_FAMILY.sans,
        }}
      >
        {resolved.dayNumber}
      </Text>
      {resolved.cyclePhase && resolved.isCurrentMonth && (
        <View style={{ position: 'absolute', top: 6, right: 6 }}>
          <CycleMarker phase={resolved.cyclePhase} color={palette.accentPrimary} />
        </View>
      )}
      {resolved.hasCheckin && resolved.isCurrentMonth && (
        <View
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginLeft: -1.5,
            marginTop: -1.5,
            width: 3,
            height: 3,
            borderRadius: 2,
            backgroundColor: palette.textMuted,
            opacity: 0.5,
          }}
          accessibilityLabel="check-in logged"
        />
      )}
      {resolved.isAuraOnly && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: 6,
            left: '50%',
            marginLeft: -6,
            width: 12,
            height: 2,
            borderRadius: 1,
            borderWidth: 1,
            borderColor: palette.auraOnly,
            backgroundColor: 'transparent',
          }}
        />
      )}
      {resolved.severityColor && level > 0 && resolved.isCurrentMonth && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            paddingHorizontal: 1,
            paddingBottom: 1,
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${barWidth * 100}%`,
              backgroundColor: resolved.severityColor,
              opacity: accentOpacity,
              borderBottomLeftRadius: Math.max(density.cellRadius - 1, 1),
              borderBottomRightRadius: barWidth >= 0.95 ? Math.max(density.cellRadius - 1, 1) : 0,
            }}
          />
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Constellation variant — dot grid; severity = dot size + opacity.
// ---------------------------------------------------------------------------

function ConstellationVariant({
  resolved,
  ctx,
  onPress,
  onLongPress,
  testID,
  accessibilityLabel,
}: {
  resolved: ResolvedDay;
  ctx: VariantContext;
  onPress: () => void;
  onLongPress: () => void;
  testID: string;
  accessibilityLabel: string;
}) {
  const { palette, density, accentOpacity } = ctx;
  const level = typeof resolved.severity === 'number' ? resolved.severity : 0;
  const dotSize = level > 0 ? 6 + (level / 10) * (density.cellSize - 18) : 0;
  const dotOpacity = level > 0 ? 0.45 + (level / 10) * 0.55 : 0;

  return (
    <Pressable
      onPress={resolved.futureDay ? undefined : onPress}
      onLongPress={resolved.futureDay ? undefined : onLongPress}
      disabled={resolved.futureDay}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: resolved.futureDay }}
      style={{
        flex: 1,
        minHeight: density.cellSize,
        margin: density.cellGap / 2,
        borderRadius: density.cellSize / 2,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {resolved.todayDay && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 2,
            left: 2,
            right: 2,
            bottom: 2,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: palette.accentPrimary,
          }}
        />
      )}
      {resolved.isTriggerLikely && !resolved.severityColor && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            right: 6,
            bottom: 6,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: palette.accentPrimary,
            borderStyle: 'dashed',
            opacity: 0.6,
          }}
        />
      )}
      {resolved.severityColor && level > 0 && (
        <View
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: resolved.severityColor,
            opacity: dotOpacity * accentOpacity,
          }}
        />
      )}
      {resolved.isAuraOnly && (
        <View
          pointerEvents="none"
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            borderWidth: 1.5,
            borderColor: palette.auraOnly,
          }}
        />
      )}
      <Text
        style={{
          position: 'absolute',
          bottom: 4,
          fontSize: 10 * density.typeScale,
          fontFamily: resolved.todayDay ? FONT_FAMILY.monoMedium : FONT_FAMILY.mono,
          color: !resolved.isCurrentMonth
            ? palette.textMuted
            : resolved.severityColor
              ? palette.textPrimary
              : palette.textSecondary,
          opacity: !resolved.isCurrentMonth ? 0.4 : resolved.futureDay ? 0.4 : 0.85,
        }}
      >
        {resolved.dayNumber}
      </Text>
      {resolved.cyclePhase && resolved.isCurrentMonth && (
        <View style={{ position: 'absolute', top: 4 }}>
          <CycleMarker phase={resolved.cyclePhase} color={palette.accentPrimary} size={4} />
        </View>
      )}
      {resolved.hasCheckin && resolved.isCurrentMonth && !resolved.severityColor && !resolved.isAuraOnly && (
        <View
          style={{
            position: 'absolute',
            width: 3,
            height: 3,
            borderRadius: 2,
            backgroundColor: palette.textMuted,
            opacity: 0.5,
          }}
          accessibilityLabel="check-in logged"
        />
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Public — DayCell. Picks the active variant from `useCalendarLayout()`.
// ---------------------------------------------------------------------------

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
  const density = useDensity();
  const accentOpacity = useAccentOpacity();
  const layout = useCalendarLayout();

  const isCurrentMonth = isSameMonth(date, currentMonth);
  const todayDay = isToday(date);
  const futureDay = isFuture(date) && !todayDay;

  const severity = dayState.migraine?.peakSeverity;
  const severityColor = isCurrentMonth && !futureDay ? dayCellColor(dayState, palette) : null;
  // dayCellColor returns palette.bg for empty days — coerce that to null so
  // the cell does not paint a redundant background swatch over the canvas.
  const effectiveSeverityColor =
    severityColor && severityColor !== palette.bg && severityColor !== 'transparent'
      ? severityColor
      : null;

  const isAuraOnly =
    severity === 0 && (dayState.migraine?.symptomTags.includes('aura') ?? false);
  const isTriggerLikely =
    isCurrentMonth && !futureDay && !!dayState.triggerLikely && !dayState.migraine;

  const resolved: ResolvedDay = {
    date,
    dayNumber: date.getDate(),
    isCurrentMonth,
    todayDay,
    futureDay,
    severity,
    severityColor: effectiveSeverityColor,
    isAuraOnly,
    isTriggerLikely,
    hasCheckin: hasCheckin && isCurrentMonth,
    cyclePhase,
  };

  const ctx: VariantContext = { palette, density, accentOpacity };
  const resolvedTestID = testID ?? `day-cell-${toDateString(date)}`;
  const accessibilityLabel = `${date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}${todayDay ? ', today' : ''}`;

  if (layout === 'tidemark') {
    return (
      <TidemarkVariant
        resolved={resolved}
        ctx={ctx}
        onPress={onPress}
        onLongPress={onLongPress}
        testID={resolvedTestID}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }
  if (layout === 'constellation') {
    return (
      <ConstellationVariant
        resolved={resolved}
        ctx={ctx}
        onPress={onPress}
        onLongPress={onLongPress}
        testID={resolvedTestID}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }
  return (
    <GridVariant
      resolved={resolved}
      ctx={ctx}
      onPress={onPress}
      onLongPress={onLongPress}
      testID={resolvedTestID}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
