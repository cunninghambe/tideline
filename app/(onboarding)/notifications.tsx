import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { onboardingCopy } from '@/copy';
import { writeSetting } from '@/features/onboarding/repo';
import { isExpoGo } from '@/lib/runtime';

const DEFAULT_HOUR = 9;
const DEFAULT_MINUTE = 0;

function formatHHMM(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [hour, setHour] = useState(DEFAULT_HOUR);
  const [minute, setMinute] = useState(DEFAULT_MINUTE);

  async function handleYes() {
    await Notifications.requestPermissionsAsync();
    const time = formatHHMM(hour, minute);
    writeSetting('notifications.daily_checkin_enabled', true);
    writeSetting('notifications.daily_checkin_time', time);
    router.push('/(onboarding)/theme');
  }

  function handleNoThanks() {
    writeSetting('notifications.daily_checkin_enabled', false);
    router.push('/(onboarding)/theme');
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerClassName="flex-1 items-center justify-center px-6 py-12"
    >
      <View className="w-full max-w-sm gap-8">
        <View accessibilityRole="header">
          <Text
            className="text-text-primary text-2xl font-semibold text-center"
            testID="notifications-title"
          >
            {onboardingCopy.notifications.title}
          </Text>
        </View>

        <Text
          className="text-text-secondary text-base text-center leading-6"
          testID="notifications-body"
        >
          {onboardingCopy.notifications.body}
        </Text>

        <View
          className="bg-surface rounded-2xl border border-border p-6 gap-4"
          accessibilityLabel={onboardingCopy.notifications.timeLabel}
          accessibilityRole="none"
        >
          <Text className="text-text-primary text-base font-medium text-center">
            {onboardingCopy.notifications.timeLabel}
          </Text>

          <View className="flex-row items-center justify-center gap-4">
            <View className="items-center gap-2">
              <Text className="text-text-secondary text-sm">Hour</Text>
              <Stepper
                value={hour}
                onValueChange={setHour}
                min={0}
                max={23}
                testID="notifications-hour"
              />
            </View>

            <Text className="text-text-primary text-2xl font-semibold">:</Text>

            <View className="items-center gap-2">
              <Text className="text-text-secondary text-sm">Minute</Text>
              <Stepper
                value={minute}
                onValueChange={setMinute}
                min={0}
                max={59}
                step={5}
                testID="notifications-minute"
              />
            </View>
          </View>

          <Text className="text-text-primary text-xl font-semibold text-center">
            {formatHHMM(hour, minute)}
          </Text>
        </View>

        {isExpoGo() && (
          <Text
            className="text-text-muted text-sm text-center"
            testID="notifications-expo-go-caption"
          >
            Reminders show as in-app banners in Expo Go.
          </Text>
        )}

        <View className="gap-3">
          <Button
            label={onboardingCopy.notifications.primary}
            onPress={handleYes}
            variant="primary"
            size="lg"
            fullWidth
            testID="notifications-yes"
          />
          <Button
            label={onboardingCopy.notifications.secondary}
            onPress={handleNoThanks}
            variant="ghost"
            size="lg"
            fullWidth
            testID="notifications-no"
          />
        </View>
      </View>
    </ScrollView>
  );
}
