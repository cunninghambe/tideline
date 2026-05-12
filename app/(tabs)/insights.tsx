import React from 'react';
import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { format } from 'date-fns';

import { emptyCopy } from '@/copy';
import { useCorrelations, useWeeklyBrief, useMonthlyNarrative } from '@/features/insights/hooks';
import { InsightCard } from '@/features/insights/components/InsightCard';
import { WeeklyBriefCard } from '@/features/insights/components/WeeklyBriefCard';
import { AINarrativeCard } from '@/features/insights/components/AINarrativeCard';
import { useAllMigraineEvents } from '@/features/migraines/hooks';

const MIN_MIGRAINES_FOR_INSIGHTS = 5;

export default function InsightsScreen() {
  const { data: allMigraines = [], isLoading: migrainesLoading } = useAllMigraineEvents();
  const { correlations, isLoading: correlationsLoading } = useCorrelations();
  const { brief, isLoading: briefLoading } = useWeeklyBrief(new Date());

  const now = new Date();
  const yearMonth = format(now, 'yyyy-MM');
  const narrativeState = useMonthlyNarrative(yearMonth);

  const completedCount = allMigraines.filter((m) => m.endedAt != null).length;
  const totalDays =
    allMigraines.length > 0
      ? daysBetween(
          new Date(
            Math.min(
              ...allMigraines.map((m) =>
                (m.startedAt instanceof Date ? m.startedAt : new Date(m.startedAt)).getTime(),
              ),
            ),
          ),
          now,
        )
      : 0;

  const isLoading = migrainesLoading || correlationsLoading || briefLoading;

  if (isLoading) {
    return (
      <View
        className="flex-1 bg-bg items-center justify-center"
        accessibilityLabel="Loading insights"
      >
        <ActivityIndicator size="large" className="text-accent-primary" />
      </View>
    );
  }

  if (completedCount < MIN_MIGRAINES_FOR_INSIGHTS) {
    return (
      <ScrollView
        className="flex-1 bg-bg"
        contentContainerClassName="px-4 pt-6 pb-10"
      >
        <Text
          className="text-text-primary text-2xl font-semibold mb-2"
          accessibilityRole="header"
        >
          Your patterns
        </Text>
        <View className="mt-10 items-center px-4">
          <Text
            className="text-text-secondary text-base leading-6 text-center"
            testID="empty-state-text"
          >
            {emptyCopy.insightsNotEnoughData}
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerClassName="px-4 pt-6 pb-10"
      accessibilityLabel="Insights dashboard"
    >
      {/* Header — spec §8.1 */}
      <Text
        className="text-text-primary text-2xl font-semibold mb-1"
        accessibilityRole="header"
      >
        Your patterns
      </Text>
      <Text className="text-text-secondary text-sm mb-1">
        {`Based on ${totalDays} days of data, ${completedCount} migraines logged.`}
      </Text>
      <Text className="text-text-muted text-xs mb-6">
        Confidence improves with more data.
      </Text>

      {/* Monthly AI narrative — spec §8.4, gated */}
      <View className="mb-4">
        <AINarrativeCard yearMonth={yearMonth} state={narrativeState} />
      </View>

      {/* Weekly brief — spec §8.3 */}
      <View className="mb-4">
        <WeeklyBriefCard brief={brief} />
      </View>

      {/* Correlation cards — spec §8.2 */}
      {correlations.length > 0 ? (
        <View className="gap-3">
          {correlations.map((correlation, idx) => (
            <InsightCard
              key={`${correlation.kind}-${idx}`}
              correlation={correlation}
              testID={`insight-card-${correlation.kind}`}
            />
          ))}
        </View>
      ) : (
        <View className="mt-4 px-2">
          <Text className="text-text-muted text-sm text-center">
            No strong patterns yet. Keep logging daily check-ins to help us find them.
          </Text>
        </View>
      )}

      <Text className="text-text-muted text-xs text-center mt-8 px-4">
        These are correlations, not diagnoses. This is not medical advice.
      </Text>
    </ScrollView>
  );
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 86_400_000));
}
