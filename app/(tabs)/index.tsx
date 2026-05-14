import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { addMonths, subMonths } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { usePalette } from '@/theme/useTheme';
import { useDensity } from '@/theme/calendarTokenHooks';
import { FONT_FAMILY } from '@/theme/fonts';
import { useActiveMigraineStore } from '@/stores/useActiveMigraineStore';
import { emptyCopy } from '@/copy';
import { Sheet } from '@/components/ui/Sheet';
import {
  useMigraineEventsByMonth,
  useCycleMarkersForMonth,
  useActiveMigraineWatcher,
} from '@/features/calendar/hooks';
import { toYearMonth, toDateString } from '@/features/calendar/utils';
import { CalendarMonthGrid } from '@/features/calendar/components/CalendarMonthGrid';
import { DuringTintBanner } from '@/features/calendar/components/DuringTintBanner';
import { BrandHeader } from '@/features/calendar/components/BrandHeader';
import { MonthNav } from '@/features/calendar/components/MonthNav';
import { SeverityLegend } from '@/features/calendar/components/SeverityLegend';

import type { DailyCheckinRow } from '@/types';
import { getByDate } from '@/features/checkins/repo';
import { useCurrentWeather } from '@/features/weather/hooks';
import { AppFallbackBanner } from '@/components/ui/AppFallbackBanner';
import { isExpoGo } from '@/lib/runtime';
import { shouldShowCheckinFallback } from '@/features/checkins/notifications';
import { AutoEndPrompt } from '@/features/log-active';
import { getById } from '@/features/migraines/repo';
import { getSetting } from '@/features/settings/store';

// ---------------------------------------------------------------------------
// Month picker sheet
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const YEAR_RANGE_BACK = 3;
const YEAR_RANGE_FORWARD = 1;

type MonthPickerProps = {
  open: boolean;
  onClose: () => void;
  selected: Date;
  onSelect: (date: Date) => void;
};

function MonthPicker({ open, onClose, selected, onSelect }: MonthPickerProps) {
  const palette = usePalette();
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear - YEAR_RANGE_BACK; y <= currentYear + YEAR_RANGE_FORWARD; y++) {
    years.push(y);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Jump to month" height="half">
      <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        {years.map((year) => (
          <View key={year}>
            <Text style={{
              color: palette.textSecondary,
              fontSize: 12,
              fontFamily: FONT_FAMILY.monoMedium,
              letterSpacing: 1.5,
              paddingVertical: 8,
            }}>
              {year}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {MONTH_NAMES.map((name, idx) => {
                const isSelected =
                  selected.getFullYear() === year && selected.getMonth() === idx;
                return (
                  <Pressable
                    key={name}
                    onPress={() => {
                      onSelect(new Date(year, idx, 1));
                      onClose();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${name} ${year}`}
                    accessibilityState={{ selected: isSelected }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: isSelected ? palette.accentPrimary : palette.surface,
                      minHeight: 40,
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{
                      color: isSelected ? palette.textInverse : palette.textPrimary,
                      fontFamily: FONT_FAMILY.sans,
                      fontSize: 14,
                    }}>
                      {name.slice(0, 3)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Main calendar screen
// ---------------------------------------------------------------------------

export default function CalendarScreen() {
  const router = useRouter();
  const palette = usePalette();
  const density = useDensity();
  const queryClient = useQueryClient();

  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const yearMonth = toYearMonth(currentMonth);

  const { data: migraines = [], isLoading: migrainesLoading } = useMigraineEventsByMonth(yearMonth);
  const cycleMarkers = useCycleMarkersForMonth(yearMonth);
  useActiveMigraineWatcher(yearMonth);

  const activeMigraineId = useActiveMigraineStore((s) => s.activeMigraineId);

  // Expo Go fallback banner for daily check-in
  const showCheckinBanner = useMemo(
    () => isExpoGo() && shouldShowCheckinFallback(),
    [],
  );

  // Auto-end prompt (G6): mount when active migraine > 24h old and snooze passed
  const autoEndState = useMemo(() => {
    if (!activeMigraineId) return null;
    const result = getById(activeMigraineId);
    if (!result.ok || !result.value) return null;
    const startedAt = result.value.startedAt instanceof Date
      ? result.value.startedAt
      : new Date(result.value.startedAt);
    const ageHours = (Date.now() - startedAt.getTime()) / (60 * 60 * 1000);
    if (ageHours <= 24) return null;
    const snoozeUntilStr = getSetting('log-active.auto_end_snooze_until');
    if (snoozeUntilStr) {
      const snoozeUntil = new Date(snoozeUntilStr);
      if (!isNaN(snoozeUntil.getTime()) && snoozeUntil.getTime() > Date.now()) return null;
    }
    return { migraineId: activeMigraineId, startedAt };
  }, [activeMigraineId]);

  const [autoEndDismissed, setAutoEndDismissed] = useState(false);

  // Load checkins for the month to display dots
  const [checkinsMap, setCheckinsMap] = useState<Record<string, DailyCheckinRow>>({});
  useEffect(() => {
    const dateSet = new Set<string>();
    for (const m of migraines) {
      const d = m.startedAt instanceof Date ? m.startedAt : new Date(m.startedAt);
      dateSet.add(toDateString(d));
    }
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (toYearMonth(d) === yearMonth) {
        dateSet.add(toDateString(d));
      }
    }
    const newMap: Record<string, DailyCheckinRow> = {};
    for (const ds of dateSet) {
      const result = getByDate(ds);
      if (result.ok && result.value) {
        newMap[ds] = result.value;
      }
    }
    setCheckinsMap(newMap);
  }, [migraines, yearMonth]);

  const checkinRows = useMemo(() => Object.values(checkinsMap), [checkinsMap]);

  const hasAnyMigraine = migraines.length > 0;

  const { captureNow: captureWeatherNow } = useCurrentWeather();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['migraines', 'month', yearMonth] }),
      captureWeatherNow().catch(() => {}),
    ]);
    setRefreshing(false);
  }, [queryClient, yearMonth, captureWeatherNow]);

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((m) => subMonths(m, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((m) => addMonths(m, 1));
  }, []);

  const isCurrentMonthToday = toYearMonth(new Date()) === yearMonth;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* During-tint overlay — warm tone, opacity 0.28 per design */}
      {activeMigraineId && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            backgroundColor: palette.duringTint,
            opacity: 0.16,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* During-migraine action banner */}
      <DuringTintBanner />

      {/* Auto-end prompt (G6) for stale active migraines */}
      {autoEndState && !autoEndDismissed && (
        <AutoEndPrompt
          migraineId={autoEndState.migraineId}
          startedAt={autoEndState.startedAt}
          onDismiss={() => setAutoEndDismissed(true)}
        />
      )}

      {/* Daily check-in fallback banner (Expo Go) */}
      {showCheckinBanner && (
        <View style={{ marginTop: 8 }}>
          <AppFallbackBanner message="Quick check-in: how was yesterday?" />
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* tideline. brand + SETTINGS */}
        <BrandHeader onSettingsPress={() => router.push('/(tabs)/settings')} />

        {/* Month nav — centred Newsreader title, chevrons left/right */}
        <MonthNav
          current={currentMonth}
          onPrev={goToPrevMonth}
          onNext={goToNextMonth}
          onTitlePress={() => setShowMonthPicker(true)}
        />

        {/* Today affordance — kept compact so it doesn't crowd the nav */}
        {!isCurrentMonthToday && (
          <View style={{ alignItems: 'center', paddingBottom: 4 }}>
            <Pressable
              onPress={() => setCurrentMonth(new Date())}
              accessibilityRole="button"
              accessibilityLabel="Go to today"
              hitSlop={12}
              style={{ paddingVertical: 4, paddingHorizontal: 8 }}
            >
              <Text style={{
                color: palette.accentPrimary,
                fontFamily: FONT_FAMILY.mono,
                fontSize: 11,
                letterSpacing: 1.5,
              }}>
                JUMP TO TODAY
              </Text>
            </Pressable>
          </View>
        )}

        {/* Calendar grid — swipe horizontally to change month */}
        <GestureDetector
          gesture={Gesture.Pan()
            .activeOffsetX([-30, 30])
            .failOffsetY([-20, 20])
            .onEnd((e) => {
              if (e.translationX < -50) runOnJS(goToNextMonth)();
              else if (e.translationX > 50) runOnJS(goToPrevMonth)();
            })}
        >
          <View>
            <CalendarMonthGrid
              yearMonth={yearMonth}
              migraines={migraines}
              checkins={checkinRows}
              cycleMarkers={cycleMarkers}
              onDayPress={(ds) => router.push(`/day/${ds}`)}
              onDayLongPress={(ds) => router.push(`/log/retro?date=${ds}`)}
              testID="calendar-month-grid"
            />
          </View>
        </GestureDetector>

        {/* Severity legend */}
        <SeverityLegend />

        {/* Empty state — shown when no migraines ever logged */}
        {!migrainesLoading && !hasAnyMigraine && (
          <View
            style={{
              marginHorizontal: density.headerPad,
              marginTop: 8,
              padding: 14,
              backgroundColor: palette.surface,
              borderRadius: density.cellRadius,
              borderWidth: 1,
              borderColor: palette.border,
            }}
            accessibilityRole="text"
          >
            <Text
              style={{
                color: palette.textSecondary,
                fontFamily: FONT_FAMILY.sans,
                fontSize: 12,
                lineHeight: 18,
              }}
            >
              {emptyCopy.calendarFirstUse}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB — density-driven size */}
      <Pressable
        onPress={() => router.push('/log/choose')}
        accessibilityRole="button"
        accessibilityLabel="Log a migraine"
        style={{
          position: 'absolute',
          bottom: 24,
          right: 20,
          width: density.fabSize,
          height: density.fabSize,
          borderRadius: density.fabSize / 2,
          backgroundColor: palette.accentPrimary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 16,
          elevation: 4,
        }}
      >
        <Ionicons name="add" size={28} color={palette.textInverse} />
      </Pressable>

      {/* Month picker sheet */}
      <MonthPicker
        open={showMonthPicker}
        onClose={() => setShowMonthPicker(false)}
        selected={currentMonth}
        onSelect={setCurrentMonth}
      />
    </View>
  );
}
