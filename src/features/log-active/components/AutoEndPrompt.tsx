import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { endActive } from '@/features/migraines/repo';
import { setSetting } from '@/features/settings/store';
import { useActiveMigraineStore } from '@/stores/useActiveMigraineStore';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const SNOOZE_KEY = 'log-active.auto_end_snooze_until';

type Props = {
  migraineId: string;
  startedAt: Date;
};

function formatDaysAgo(startedAt: Date): string {
  const days = Math.floor((Date.now() - startedAt.getTime()) / (24 * 60 * 60 * 1000));
  if (days === 1) return '1 day';
  return `${days} days`;
}

export function AutoEndPrompt({ migraineId, startedAt }: Props) {
  const router = useRouter();
  const clearActive = useActiveMigraineStore((s) => s.clearActive);

  // DateTimePicker state — hour/minute/day offset from startedAt
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [endHour, setEndHour] = useState(startedAt.getHours());
  const [endMinute, setEndMinute] = useState(startedAt.getMinutes());

  function handleSnooze() {
    const snoozeUntil = Date.now() + TWENTY_FOUR_HOURS_MS;
    setSetting(SNOOZE_KEY, String(snoozeUntil));
  }

  function handleConfirmEnd() {
    const endedAt = new Date();
    endedAt.setHours(endHour, endMinute, 0, 0);

    // If chosen time is in the future, clamp to now
    const finalEndedAt = endedAt > new Date() ? new Date() : endedAt;

    endActive(migraineId, {
      endedAt: finalEndedAt,
      peakSeverity: 5, // will be updated if user had set it; this is the fallback
      helpers: [],
    });
    clearActive();
    // Navigate to end screen so user can fill in details if they want
    router.replace('/log/end');
  }

  const daysAgo = formatDaysAgo(startedAt);

  return (
    <Sheet
      open
      onClose={() => {
        /* non-dismissible — no-op */
      }}
      height="auto"
      testID="auto-end-prompt"
    >
      <View className="px-6 pb-8 gap-6">
        <Text
          className="text-text-primary text-xl font-semibold"
          accessibilityRole="header"
        >
          This migraine started {daysAgo} ago. Did it end?
        </Text>

        <Text className="text-text-secondary text-base">
          You have an ongoing migraine from {daysAgo} ago. Let us know if it has ended so we can keep your records accurate.
        </Text>

        {showTimePicker ? (
          <View className="gap-4">
            <Text className="text-text-primary text-base font-medium">
              When did it end?
            </Text>
            <View className="flex-row items-center justify-center gap-4">
              <View className="items-center gap-2">
                <Text className="text-text-secondary text-sm">Hour</Text>
                <Stepper
                  value={endHour}
                  onValueChange={setEndHour}
                  min={0}
                  max={23}
                  testID="auto-end-hour"
                />
              </View>
              <Text className="text-text-primary text-2xl font-semibold">:</Text>
              <View className="items-center gap-2">
                <Text className="text-text-secondary text-sm">Minute</Text>
                <Stepper
                  value={endMinute}
                  onValueChange={setEndMinute}
                  min={0}
                  max={59}
                  step={5}
                  testID="auto-end-minute"
                />
              </View>
            </View>
            <Button
              label="Confirm end time"
              onPress={handleConfirmEnd}
              variant="primary"
              size="xl"
              fullWidth
              testID="auto-end-confirm"
            />
            <Button
              label="Back"
              onPress={() => setShowTimePicker(false)}
              variant="ghost"
              size="lg"
              fullWidth
              testID="auto-end-back"
            />
          </View>
        ) : (
          <View className="gap-3">
            <Button
              label="Yes — when?"
              onPress={() => setShowTimePicker(true)}
              variant="primary"
              size="xl"
              fullWidth
              testID="auto-end-yes"
            />
            <Button
              label="No, still going"
              onPress={handleSnooze}
              variant="secondary"
              size="xl"
              fullWidth
              testID="auto-end-no"
            />
          </View>
        )}
      </View>
    </Sheet>
  );
}
