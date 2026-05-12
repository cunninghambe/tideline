import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { parseISO, isToday, isYesterday, addDays, subDays, format } from 'date-fns';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { usePalette } from '@/theme/useTheme';
import { emptyCopy } from '@/copy';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { useDayDetail, type DoseWithMed } from '@/features/calendar/hooks';
import { useWeatherForDate } from '@/features/weather/hooks';
import { formatTime, formatDate, formatDuration } from '@/lib/format';

import type { MigraineRow, DailyCheckinRow } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function severityLabel(sev: number): string {
  if (sev === 0) return 'Aura only — no pain';
  if (sev >= 8) return `Severe (${sev}/10)`;
  if (sev >= 5) return `Moderate (${sev}/10)`;
  return `Mild (${sev}/10)`;
}

function cyclePhaseName(phase: string): string {
  const map: Record<string, string> = {
    period: 'Period',
    follicular: 'Follicular',
    ovulation_window: 'Ovulation window',
    luteal: 'Luteal',
    late_luteal: 'Late luteal',
  };
  return map[phase] ?? phase;
}

function migraineDuration(m: MigraineRow): string {
  if (!m.endedAt) return 'Ongoing';
  const end = m.endedAt instanceof Date ? m.endedAt : new Date(m.endedAt);
  const start = m.startedAt instanceof Date ? m.startedAt : new Date(m.startedAt);
  const mins = Math.round((end.getTime() - start.getTime()) / 60_000);
  return formatDuration(mins);
}

function tagToLabel(tag: string): string {
  const map: Record<string, string> = {
    throbbing: 'Throbbing',
    aura: 'Aura',
    nausea: 'Nausea',
    light_sensitive: 'Light hurts',
    sound_sensitive: 'Sound hurts',
    smell_sensitive: 'Smell hurts',
    behind_eyes: 'Behind eyes',
    one_sided: 'One side',
    whole_head: 'Whole head',
    sleep: 'Sleep',
    dark_room: 'Dark room',
    hydration: 'Hydration',
    cold_compress: 'Cold compress',
    hot_shower: 'Hot shower',
    medication: 'The medication',
    eating: 'Eating',
    caffeine: 'Caffeine',
    massage: 'Massage',
    nothing: 'Nothing helped',
  };
  return map[tag] ?? tag;
}

// ---------------------------------------------------------------------------
// Sub-sections
// ---------------------------------------------------------------------------

function WeatherSummary({ date }: { date: string }) {
  const palette = usePalette();
  const snapshot = useWeatherForDate(date);
  if (!snapshot) return null;

  const change = snapshot.pressureChange24hHpa;
  const trendArrow =
    change === null ? '' :
    change > 1 ? ' ↑' :
    change < -1 ? ' ↓' : ' →';

  const parts: string[] = [];
  if (snapshot.temperatureC !== null) parts.push(`${Math.round(snapshot.temperatureC)}°C`);
  if (snapshot.humidityPct !== null) parts.push(`${Math.round(snapshot.humidityPct)}% humidity`);
  if (snapshot.pressureHpa !== null) parts.push(`${snapshot.pressureHpa.toFixed(0)} hPa${trendArrow}`);

  if (parts.length === 0) return null;

  return (
    <Text style={{ color: palette.textSecondary, fontSize: 13 }}>
      {parts.join(' · ')}
    </Text>
  );
}

type MigraneSectionProps = {
  migraine: MigraineRow;
  onEdit: () => void;
  doses: DoseWithMed[];
};

function MigraineSection({ migraine, onEdit, doses }: MigraneSectionProps) {
  const palette = usePalette();
  const start = migraine.startedAt instanceof Date ? migraine.startedAt : new Date(migraine.startedAt);
  const end = migraine.endedAt
    ? (migraine.endedAt instanceof Date ? migraine.endedAt : new Date(migraine.endedAt))
    : null;

  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: palette.textPrimary, fontSize: 18, fontWeight: '600' }}>
          Migraine
        </Text>
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel="Edit migraine"
          hitSlop={12}
        >
          <Text style={{ color: palette.accentPrimary, fontSize: 14, fontWeight: '500' }}>
            Edit
          </Text>
        </Pressable>
      </View>

      <View style={{ gap: 8 }}>
        {/* Times */}
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View>
            <Text style={{ color: palette.textMuted, fontSize: 12 }}>Started</Text>
            <Text style={{ color: palette.textPrimary, fontSize: 15 }}>{formatTime(start)}</Text>
          </View>
          <View>
            <Text style={{ color: palette.textMuted, fontSize: 12 }}>Ended</Text>
            <Text style={{ color: palette.textPrimary, fontSize: 15 }}>
              {end ? formatTime(end) : 'Ongoing'}
            </Text>
          </View>
          <View>
            <Text style={{ color: palette.textMuted, fontSize: 12 }}>Duration</Text>
            <Text style={{ color: palette.textPrimary, fontSize: 15 }}>{migraineDuration(migraine)}</Text>
          </View>
        </View>

        {/* Severity */}
        <View>
          <Text style={{ color: palette.textMuted, fontSize: 12 }}>Peak severity</Text>
          <Text style={{ color: palette.textPrimary, fontSize: 15 }}>{severityLabel(migraine.peakSeverity)}</Text>
        </View>

        {/* Symptoms */}
        {migraine.symptomTags.length > 0 && (
          <View>
            <Text style={{ color: palette.textMuted, fontSize: 12, marginBottom: 6 }}>Symptoms</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {migraine.symptomTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tagToLabel(tag)}
                  selected={false}
                  onPress={() => undefined}
                  size="sm"
                />
              ))}
            </View>
          </View>
        )}

        {/* Meds taken */}
        {doses.length > 0 && (
          <View>
            <Text style={{ color: palette.textMuted, fontSize: 12, marginBottom: 6 }}>Meds taken</Text>
            <View style={{ gap: 4 }}>
              {doses.map((d) => {
                const taken = d.takenAt instanceof Date ? d.takenAt : new Date(d.takenAt);
                const label = d.medication
                  ? `${d.medication.brandName} ${d.doseAmount}`
                  : `Dose ${d.doseAmount}`;
                return (
                  <Text key={d.id} style={{ color: palette.textPrimary, fontSize: 14 }}>
                    {label} · {formatTime(taken)}
                    {d.effectivenessRating ? ` · ${d.effectivenessRating.replace('_', ' ')}` : ''}
                  </Text>
                );
              })}
            </View>
          </View>
        )}

        {/* Helpers */}
        {migraine.helpers.length > 0 && (
          <View>
            <Text style={{ color: palette.textMuted, fontSize: 12, marginBottom: 6 }}>What helped</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {migraine.helpers.map((tag) => (
                <Chip
                  key={tag}
                  label={tagToLabel(tag)}
                  selected={false}
                  onPress={() => undefined}
                  size="sm"
                />
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        {migraine.notes && (
          <View
            style={{
              backgroundColor: palette.surface,
              borderLeftWidth: 3,
              borderLeftColor: palette.border,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 4,
            }}
          >
            <Text style={{ color: palette.textSecondary, fontSize: 14, fontStyle: 'italic' }}>
              {migraine.notes}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

type CheckinSectionProps = {
  checkin: DailyCheckinRow;
  onEdit: (date: string) => void;
  date: string;
};

function CheckinSection({ checkin, onEdit, date }: CheckinSectionProps) {
  const palette = usePalette();

  return (
    <View style={{ marginTop: 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: palette.textPrimary, fontSize: 18, fontWeight: '600' }}>
          Daily check-in
        </Text>
        <Pressable
          onPress={() => onEdit(date)}
          accessibilityRole="button"
          accessibilityLabel="Edit check-in"
          hitSlop={12}
        >
          <Text style={{ color: palette.accentPrimary, fontSize: 14, fontWeight: '500' }}>
            Edit
          </Text>
        </Pressable>
      </View>

      <View style={{ gap: 8 }}>
        {checkin.sleepHours != null && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Text style={{ color: palette.textMuted, fontSize: 14, width: 100 }}>Sleep</Text>
            <Text style={{ color: palette.textPrimary, fontSize: 14 }}>
              {checkin.sleepHours}h
              {checkin.sleepQuality != null ? ` · quality ${checkin.sleepQuality}/4` : ''}
            </Text>
          </View>
        )}
        {checkin.stressLevel != null && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Text style={{ color: palette.textMuted, fontSize: 14, width: 100 }}>Stress</Text>
            <Text style={{ color: palette.textPrimary, fontSize: 14 }}>{checkin.stressLevel}/5</Text>
          </View>
        )}
        {checkin.waterCups != null && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Text style={{ color: palette.textMuted, fontSize: 14, width: 100 }}>Water</Text>
            <Text style={{ color: palette.textPrimary, fontSize: 14 }}>{checkin.waterCups} cups</Text>
          </View>
        )}
        {checkin.caffeineCups != null && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Text style={{ color: palette.textMuted, fontSize: 14, width: 100 }}>Caffeine</Text>
            <Text style={{ color: palette.textPrimary, fontSize: 14 }}>{checkin.caffeineCups} cups</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function DayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const palette = usePalette();

  const { data, isLoading } = useDayDetail(date ?? '');

  if (!date) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: palette.textMuted }}>Invalid date</Text>
      </View>
    );
  }

  const parsedDate = parseISO(date);
  const dateLabel = formatDate(parsedDate);
  const canAddCheckin = isToday(parsedDate) || isYesterday(parsedDate);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: palette.textMuted }}>Loading…</Text>
      </View>
    );
  }

  const { migraine, checkin, cyclePhase, doses } = data ?? { migraine: null, checkin: null, cyclePhase: null, doses: [] };

  const goToDay = (delta: number) => {
    if (!date) return;
    const next = delta > 0 ? addDays(parseISO(date), delta) : subDays(parseISO(date), Math.abs(delta));
    router.replace(`/day/${format(next, 'yyyy-MM-dd')}`);
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .failOffsetY([-20, 20])
    .onEnd((e) => {
      if (e.translationX < -50) runOnJS(goToDay)(1);
      else if (e.translationX > 50) runOnJS(goToDay)(-1);
    });

  return (
    <GestureDetector gesture={swipeGesture}>
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
    >
      {/* Date heading */}
      <Text style={{ color: palette.textPrimary, fontSize: 24, fontWeight: '600', marginBottom: 4 }}>
        {dateLabel}
      </Text>

      {/* Cycle phase + weather */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {cyclePhase && (
          <Text style={{ color: palette.textSecondary, fontSize: 13 }}>
            {cyclePhaseName(cyclePhase)}
          </Text>
        )}
        <WeatherSummary date={date} />
      </View>

      <View style={{ height: 1, backgroundColor: palette.divider, marginBottom: 16 }} />

      {/* Migraine section */}
      {migraine ? (
        <MigraineSection
          migraine={migraine}
          doses={doses}
          onEdit={() => router.push(`/log/retro?id=${migraine.id}`)}
        />
      ) : (
        <Text style={{ color: palette.textMuted, fontSize: 14 }}>
          {emptyCopy.noMigraineForDay}
        </Text>
      )}

      <View style={{ height: 1, backgroundColor: palette.divider, marginTop: 24, marginBottom: 16 }} />

      {/* Check-in section */}
      {checkin ? (
        <CheckinSection checkin={checkin} onEdit={(d) => router.push(`/checkin/${d}`)} date={date} />
      ) : (
        <View>
          <Text style={{ color: palette.textPrimary, fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
            Daily check-in
          </Text>
          <Text style={{ color: palette.textMuted, fontSize: 14, marginBottom: canAddCheckin ? 12 : 0 }}>
            {emptyCopy.noCheckinForDay}
          </Text>
          {canAddCheckin && (
            <Button
              label="Add check-in"
              variant="secondary"
              size="md"
              onPress={() => router.push(`/checkin/${date}`)}
            />
          )}
        </View>
      )}

      {/* Log migraine CTA — only when none logged */}
      {!migraine && (
        <View style={{ marginTop: 32 }}>
          <Button
            label="Log migraine for this day"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => router.push(`/log/retro?date=${date}`)}
          />
        </View>
      )}
    </ScrollView>
    </GestureDetector>
  );
}
