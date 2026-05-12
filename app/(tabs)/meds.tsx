import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';

import { AppFallbackBanner } from '@/components/ui/AppFallbackBanner';
import { MedRow } from '@/features/meds/components/MedRow';
import { useMedicationsList, MEDS_QUERY_KEY } from '@/features/meds/hooks';
import { scheduleRefillCheck } from '@/features/meds/notifications';
import { isExpoGo } from '@/lib/runtime';
import { db } from '@/db/client';
import { medicationDoses } from '@/db/schema';
import type { MedicationRow } from '@/types';

function useLastTakenDates(medIds: string[]): Record<string, Date | null> {
  const [lastTakenMap, setLastTakenMap] = useState<Record<string, Date | null>>({});

  useEffect(() => {
    if (medIds.length === 0) return;
    const map: Record<string, Date | null> = {};
    for (const id of medIds) {
      const doses = db
        .select()
        .from(medicationDoses)
        .where(eq(medicationDoses.medicationId, id))
        .all()
        .sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime());
      map[id] = doses[0]?.takenAt ?? null;
    }
    setLastTakenMap(map);
  }, [medIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return lastTakenMap;
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8" accessibilityRole="none">
      <Ionicons name="medical-outline" size={48} color="var(--text-muted)" />
      <Text className="text-text-muted text-base text-center mt-4 leading-6">
        You haven&apos;t added any medications yet. Tap + to add one.
      </Text>
    </View>
  );
}

export default function MedsScreen() {
  const queryClient = useQueryClient();
  const { data: meds = [], isLoading } = useMedicationsList();
  const medIds = meds.map((m) => m.id);
  const lastTakenMap = useLastTakenDates(medIds);
  useEffect(() => {
    scheduleRefillCheck().catch(() => {
      // Non-critical — ignore notification scheduling errors
    });
    // Invalidate on mount so list is fresh after add/edit
    queryClient.invalidateQueries({ queryKey: MEDS_QUERY_KEY });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const belowThresholdMed = meds.find(
    (m) => m.pillsRemaining != null && m.pillsRemaining <= m.refillThreshold,
  );
  const showBanner = isExpoGo() && belowThresholdMed != null;
  const bannerMessage = showBanner
    ? `${belowThresholdMed.brandName}: ${belowThresholdMed.pillsRemaining ?? 0} pills left. Time to refill?`
    : '';

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <Text className="text-text-muted">Loading…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
        <Text
          className="text-text-primary text-2xl font-semibold"
          accessibilityRole="header"
        >
          Your medications
        </Text>
        <Pressable
          onPress={() => router.push('/meds/add')}
          accessibilityRole="button"
          accessibilityLabel="Add medication"
          style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
          className="bg-accent-primary rounded-full"
        >
          <Ionicons name="add" size={24} color="var(--text-inverse)" />
        </Pressable>
      </View>

      {/* Expo Go fallback banner */}
      {showBanner && (
        <View className="px-4 pb-2">
          <AppFallbackBanner message={bannerMessage} testID="refill-banner" />
        </View>
      )}

      {meds.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={meds}
          keyExtractor={(m: MedicationRow) => m.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 10 }}
          renderItem={({ item }: { item: MedicationRow }) => (
            <MedRow
              med={item}
              lastTakenAt={lastTakenMap[item.id] ?? null}
              onPress={() => router.push(`/meds/${item.id}`)}
              testID={`med-row-${item.id}`}
            />
          )}
          accessibilityRole="list"
          accessibilityLabel="Your medications"
        />
      )}
    </View>
  );
}
