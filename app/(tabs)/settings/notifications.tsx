import React from 'react';
import { ScrollView, View, Text, Platform } from 'react-native';

import { ToggleRow } from '@/features/settings/components/ToggleRow';
import { useSetting, useSetSetting } from '@/features/settings/store';
import { isExpoGo } from '@/lib/runtime';
import { scheduleDailyCheckinReminder } from '@/features/checkins/notifications';

/**
 * Simple HH:MM time picker using two steppers.
 * Expo Go / RN does not have a native time picker cross-platform,
 * so we render a readable label + increment/decrement pairs.
 */
function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [hStr, mStr] = value.split(':');
  const h = parseInt(hStr ?? '9', 10);
  const m = parseInt(mStr ?? '0', 10);

  function pad(n: number) {
    return String(n).padStart(2, '0');
  }

  function adjustHour(delta: number) {
    const next = ((h + delta + 24) % 24);
    onChange(`${pad(next)}:${pad(m)}`);
  }

  function adjustMinute(delta: number) {
    const next = ((m + delta + 60) % 60);
    onChange(`${pad(h)}:${pad(next)}`);
  }

  return (
    <View
      className="px-4 py-4 bg-surface border-b border-divider"
      accessibilityLabel={label}
    >
      <Text className="text-text-secondary text-sm font-medium mb-3">{label}</Text>
      <View className="flex-row items-center gap-4">
        {/* Hours */}
        <View className="items-center gap-1">
          <Text className="text-text-muted text-xs">Hour</Text>
          <View className="flex-row items-center gap-3">
            <Text
              onPress={() => adjustHour(-1)}
              accessibilityRole="button"
              accessibilityLabel="Decrease hour"
              className="text-accent-primary text-xl font-medium px-2 py-1"
              style={{ minWidth: 32, textAlign: 'center' }}
            >
              −
            </Text>
            <Text className="text-text-primary text-xl font-semibold w-8 text-center">
              {pad(h)}
            </Text>
            <Text
              onPress={() => adjustHour(1)}
              accessibilityRole="button"
              accessibilityLabel="Increase hour"
              className="text-accent-primary text-xl font-medium px-2 py-1"
              style={{ minWidth: 32, textAlign: 'center' }}
            >
              +
            </Text>
          </View>
        </View>

        <Text className="text-text-secondary text-xl font-semibold">:</Text>

        {/* Minutes */}
        <View className="items-center gap-1">
          <Text className="text-text-muted text-xs">Minute</Text>
          <View className="flex-row items-center gap-3">
            <Text
              onPress={() => adjustMinute(-15)}
              accessibilityRole="button"
              accessibilityLabel="Decrease minutes by 15"
              className="text-accent-primary text-xl font-medium px-2 py-1"
              style={{ minWidth: 32, textAlign: 'center' }}
            >
              −
            </Text>
            <Text className="text-text-primary text-xl font-semibold w-8 text-center">
              {pad(m)}
            </Text>
            <Text
              onPress={() => adjustMinute(15)}
              accessibilityRole="button"
              accessibilityLabel="Increase minutes by 15"
              className="text-accent-primary text-xl font-medium px-2 py-1"
              style={{ minWidth: 32, textAlign: 'center' }}
            >
              +
            </Text>
          </View>
        </View>

        <Text className="text-text-secondary text-sm ml-4">
          {h < 12 ? 'AM' : 'PM'}
        </Text>
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const checkinEnabled = useSetting('notifications.daily_checkin_enabled', 'true') === 'true';
  const checkinTime = useSetting('notifications.daily_checkin_time', '09:00');
  const refillEnabled = useSetting('notifications.refill_reminders_enabled', 'true') === 'true';
  const inMigraineEnabled = useSetting('notifications.in_migraine_enabled', 'false') === 'true';

  const { mutate: setSettingMutateRaw } = useSetSetting();

  const setSettingMutate = (args: { key: string; value: string }) => {
    setSettingMutateRaw(args, {
      onSuccess: () => {
        if (args.key === 'notifications.daily_checkin_enabled' || args.key === 'notifications.daily_checkin_time') {
          scheduleDailyCheckinReminder().catch(() => {});
        }
      },
    });
  };

  const expoGoCaption =
    Platform.OS !== 'web' && isExpoGo()
      ? 'Notifications appear as in-app banners in Expo Go.'
      : undefined;

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {expoGoCaption && (
        <View className="mx-4 mt-4 p-3 bg-surface rounded-xl border border-border">
          <Text className="text-text-secondary text-sm">{expoGoCaption}</Text>
        </View>
      )}

      <View className="mt-4">
        <ToggleRow
          label="Daily check-in reminder"
          value={checkinEnabled}
          onValueChange={(v) =>
            setSettingMutate({
              key: 'notifications.daily_checkin_enabled',
              value: String(v),
            })
          }
          testID="notifications-toggle-checkin"
        />
        {checkinEnabled && (
          <TimeField
            label="Reminder time"
            value={checkinTime}
            onChange={(v) =>
              setSettingMutate({
                key: 'notifications.daily_checkin_time',
                value: v,
              })
            }
          />
        )}
        <ToggleRow
          label="Refill reminders"
          caption="Reminds you when a medication is running low"
          value={refillEnabled}
          onValueChange={(v) =>
            setSettingMutate({
              key: 'notifications.refill_reminders_enabled',
              value: String(v),
            })
          }
          testID="notifications-toggle-refill"
        />
        <ToggleRow
          label="In-migraine check-ins"
          caption="Occasional nudges to update severity during an attack"
          value={inMigraineEnabled}
          onValueChange={(v) =>
            setSettingMutate({
              key: 'notifications.in_migraine_enabled',
              value: String(v),
            })
          }
          testID="notifications-toggle-in-migraine"
        />
      </View>
    </ScrollView>
  );
}
