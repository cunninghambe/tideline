import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TextInput,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { usePalette } from '@/theme/useTheme';
import { useAllMigraineEvents } from '@/features/migraines/hooks';
import { setSetting } from '@/features/settings/store';
import {
  useMedicationDetail,
  useEffectivenessStats,
  useRecentDoses,
  useAllDoses,
  dosesPerWeek,
  MEDS_QUERY_KEY,
  MED_DETAIL_QUERY_KEY,
  MED_DOSES_QUERY_KEY,
} from '@/features/meds/hooks';
import { update } from '@/features/meds/repo';
import { formatDate, formatTime } from '@/lib/format';
import type { MedicationRow, MedClass } from '@/types';

const CLASS_LABELS: Record<MedClass, string> = {
  nsaid: 'NSAID',
  triptan: 'Triptan',
  anticonvulsant: 'Anticonvulsant',
  beta_blocker: 'Beta-blocker',
  cgrp: 'CGRP',
  antiemetic: 'Anti-emetic',
  opioid: 'Opioid',
  ergotamine: 'Ergotamine',
  other: 'Other',
};

const RATING_LABELS: Record<string, string> = {
  helped: 'Helped',
  kind_of: 'Kind of',
  didnt_help: "Didn't help",
  unsure: 'Unsure',
};

type DoseDetailSheetProps = {
  dose: {
    id: string;
    takenAt: Date;
    doseAmount: string;
    effectivenessRating: string | null | undefined;
    timeToReliefMinutes: number | null | undefined;
    migraineEventId: string | null | undefined;
  } | null;
  onClose: () => void;
};

function DoseDetailSheet({ dose, onClose }: DoseDetailSheetProps) {
  return (
    <Sheet open={dose != null} onClose={onClose} title="Dose details" height="auto">
      {dose && (
        <View className="px-6 pb-6 gap-4">
          <View className="flex-row justify-between">
            <Text className="text-text-secondary text-sm">Date</Text>
            <Text className="text-text-primary text-sm font-medium">
              {formatDate(dose.takenAt)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-text-secondary text-sm">Time</Text>
            <Text className="text-text-primary text-sm font-medium">
              {formatTime(dose.takenAt)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-text-secondary text-sm">Dose</Text>
            <Text className="text-text-primary text-sm font-medium">{dose.doseAmount}</Text>
          </View>
          {dose.effectivenessRating && (
            <View className="flex-row justify-between">
              <Text className="text-text-secondary text-sm">Effectiveness</Text>
              <Text className="text-text-primary text-sm font-medium">
                {RATING_LABELS[dose.effectivenessRating] ?? dose.effectivenessRating}
              </Text>
            </View>
          )}
          {dose.timeToReliefMinutes != null && (
            <View className="flex-row justify-between">
              <Text className="text-text-secondary text-sm">Time to relief</Text>
              <Text className="text-text-primary text-sm font-medium">
                {dose.timeToReliefMinutes} min
              </Text>
            </View>
          )}
          {dose.migraineEventId && (
            <View className="flex-row justify-between">
              <Text className="text-text-secondary text-sm">Linked to migraine</Text>
              <Text className="text-text-primary text-sm font-medium">Yes</Text>
            </View>
          )}
        </View>
      )}
    </Sheet>
  );
}

type RefillSectionProps = {
  med: MedicationRow;
  onRefillConfirm: (newCount: number) => void;
  onSnooze: () => void;
};

function RefillSection({ med, onRefillConfirm, onSnooze }: RefillSectionProps) {
  const palette = usePalette();
  const [newCountText, setNewCountText] = useState('');
  const isLow =
    med.pillsRemaining != null && med.pillsRemaining <= med.refillThreshold;

  return (
    <View className="gap-3">
      <Text className="text-text-primary text-xl font-semibold">Refill</Text>
      <View
        className={[
          'rounded-2xl border p-4 gap-3',
          isLow ? 'bg-[orange]/10 border-[orange]/30' : 'bg-surface border-border',
        ].join(' ')}
      >
        <Text className="text-text-primary text-base">
          {med.pillsRemaining != null ? `${med.pillsRemaining} pills left.` : 'Pill count unknown.'}
        </Text>
        {isLow && (
          <View className="flex-row gap-3 items-center flex-wrap">
            <View className="flex-row items-center gap-2 flex-1">
              <TextInput
                value={newCountText}
                onChangeText={setNewCountText}
                placeholder="New count"
                placeholderTextColor={palette.textMuted}
                keyboardType="number-pad"
                accessibilityLabel="New pill count after refill"
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: palette.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  color: palette.textPrimary,
                  backgroundColor: palette.surface,
                  minHeight: 40,
                }}
              />
            </View>
            <Button
              label="I refilled"
              size="sm"
              onPress={() => {
                const n = parseInt(newCountText, 10);
                if (isNaN(n) || n < 0) {
                  Alert.alert('Enter a valid pill count.');
                  return;
                }
                onRefillConfirm(n);
              }}
            />
            <Button
              label="Snooze 3 days"
              variant="secondary"
              size="sm"
              onPress={onSnooze}
            />
          </View>
        )}
      </View>
    </View>
  );
}

export default function MedDetailScreen() {
  const palette = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: med, isLoading } = useMedicationDetail(id ?? '');
  const { data: stats } = useEffectivenessStats(id ?? '');
  const { data: recentDoses = [] } = useRecentDoses(id ?? '', 5);
  const { data: allDoses = [] } = useAllDoses(id ?? '');
  const { data: allMigraines = [] } = useAllMigraineEvents();
  const totalMigraines = allMigraines.length;
  const [selectedDose, setSelectedDose] = useState<(typeof recentDoses)[0] | null>(null);

  async function handleRefillConfirm(newCount: number) {
    if (!id) return;
    const result = update(id, { pillsRemaining: newCount });
    if (!result.ok) {
      Alert.alert('Error', 'Could not update pill count.');
      return;
    }
    await queryClient.invalidateQueries({ queryKey: MED_DETAIL_QUERY_KEY(id) });
    await queryClient.invalidateQueries({ queryKey: MEDS_QUERY_KEY });
  }

  function handleSnooze() {
    if (!id) return;
    const snoozeUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    setSetting(`meds.refill_snooze_until.${id}`, snoozeUntil);
    Alert.alert('Snoozed', "We'll remind you again in 3 days.");
  }

  async function handleDeactivate() {
    if (!id) return;
    Alert.alert(
      'Deactivate medication',
      'This medication will be hidden from your list. Your dose history is kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            const result = update(id, { active: false });
            if (!result.ok) {
              Alert.alert('Error', 'Could not deactivate medication.');
              return;
            }
            await queryClient.invalidateQueries({ queryKey: MEDS_QUERY_KEY });
            await queryClient.invalidateQueries({ queryKey: MED_DOSES_QUERY_KEY(id) });
            router.back();
          },
        },
      ],
    );
  }

  function handleEdit() {
    // Edit: navigate to add screen with pre-filled data (add screen handles prefill via params)
    // For v1: re-use the add form — pushed with the med id as a query param
    if (id) router.push(`/meds/add?editId=${id}`);
  }

  if (isLoading || !med) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <Text className="text-text-muted">Loading…</Text>
      </View>
    );
  }

  // dosesPerWeek returns doses/week; divide pills remaining by that to get weeks of supply
  const supplyRate = dosesPerWeek(
    allDoses.map((d) => ({ takenAt: d.takenAt })),
    new Date(),
  );
  const weeksSupply =
    supplyRate != null && med.pillsRemaining != null && supplyRate > 0
      ? Math.round(med.pillsRemaining / supplyRate)
      : null;

  return (
    <View className="flex-1 bg-bg">
      {/* Edit button in header via pressable */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 24 }}
      >
        {/* Top: name + class + edit */}
        <View className="flex-row items-start justify-between pt-4">
          <View className="flex-1 gap-1">
            <Text
              className="text-text-primary text-2xl font-semibold"
              accessibilityRole="header"
            >
              {med.brandName}
            </Text>
            <View className="flex-row items-center gap-2">
              <View className="bg-surface border border-border rounded-full px-3 py-0.5">
                <Text className="text-text-secondary text-xs font-medium">
                  {CLASS_LABELS[med.medicationClass]}
                </Text>
              </View>
              <Text className="text-text-muted text-xs capitalize">{med.type}</Text>
            </View>
          </View>
          <Pressable
            onPress={handleEdit}
            accessibilityRole="button"
            accessibilityLabel="Edit medication"
            style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="pencil-outline" size={20} color={palette.accentPrimary} />
          </Pressable>
        </View>

        {/* Effectiveness section */}
        <EffectivenessSection stats={stats} totalMigraines={totalMigraines} />

        {/* Refill section */}
        <RefillSection
          med={med}
          onRefillConfirm={handleRefillConfirm}
          onSnooze={handleSnooze}
        />

        {/* Supply rate line */}
        {weeksSupply != null && (
          <Text className="text-text-secondary text-sm">
            At your usage rate, ~{weeksSupply} week{weeksSupply !== 1 ? 's' : ''} supply.
          </Text>
        )}

        {/* Last 5 doses */}
        <View className="gap-3">
          <Text className="text-text-primary text-xl font-semibold">Last 5 doses</Text>
          {recentDoses.length === 0 ? (
            <Text className="text-text-muted text-sm">No doses recorded yet.</Text>
          ) : (
            recentDoses.map((dose) => (
              <Pressable
                key={dose.id}
                onPress={() => setSelectedDose(dose)}
                accessibilityRole="button"
                accessibilityLabel={`Dose on ${formatDate(dose.takenAt)}`}
                style={{ minHeight: 44 }}
                className="flex-row items-center justify-between bg-surface border border-border rounded-xl px-4 py-3"
              >
                <Text className="text-text-primary text-sm">{formatDate(dose.takenAt)}</Text>
                <View className="flex-row items-center gap-3">
                  <Text className="text-text-secondary text-sm">{dose.doseAmount}</Text>
                  {dose.effectivenessRating && (
                    <Text className="text-text-muted text-xs">
                      {RATING_LABELS[dose.effectivenessRating] ?? dose.effectivenessRating}
                    </Text>
                  )}
                  <Ionicons name="chevron-forward" size={14} color={palette.textMuted} />
                </View>
              </Pressable>
            ))
          )}
        </View>

        {/* Deactivate */}
        <View className="pt-4">
          <Button
            label="Deactivate medication"
            variant="danger"
            size="md"
            fullWidth
            onPress={handleDeactivate}
            testID="deactivate-button"
          />
        </View>
      </ScrollView>

      <DoseDetailSheet
        dose={selectedDose}
        onClose={() => setSelectedDose(null)}
      />
    </View>
  );
}

type EffectivenessSectionProps = {
  stats: {
    totalDoses: number;
    attacksUsedIn: number;
    helpedCount: number;
    kindOfCount: number;
    didntHelpCount: number;
    avgTimeToReliefMinutes: number | null;
  } | undefined;
  totalMigraines: number;
};

function EffectivenessSection({ stats, totalMigraines }: EffectivenessSectionProps) {
  return (
    <View className="gap-3">
      <Text className="text-text-primary text-xl font-semibold">Effectiveness</Text>
      {!stats || stats.totalDoses === 0 ? (
        <Text className="text-text-muted text-sm">No doses recorded yet.</Text>
      ) : (
        <View className="bg-surface border border-border rounded-2xl p-4 gap-2">
          <Text className="text-text-primary text-sm">
            Used in {stats.attacksUsedIn} of your last {totalMigraines} attack
            {totalMigraines !== 1 ? 's' : ''}. &ldquo;Helped&rdquo; in {stats.helpedCount},
            &ldquo;kind of&rdquo; in {stats.kindOfCount}, &ldquo;didn&apos;t help&rdquo; in{' '}
            {stats.didntHelpCount}.
          </Text>
          {stats.avgTimeToReliefMinutes != null && (
            <Text className="text-text-secondary text-sm">
              Average time to relief: {stats.avgTimeToReliefMinutes} min.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
