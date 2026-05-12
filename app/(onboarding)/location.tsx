import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { requestForegroundPermissionsAsync } from 'expo-location';

import { Button } from '@/components/ui/Button';
import { onboardingCopy } from '@/copy';
import { writeSetting } from '@/features/onboarding/repo';

export default function LocationScreen() {
  const router = useRouter();

  async function handleAllow() {
    const { status } = await requestForegroundPermissionsAsync();
    writeSetting('location.permission_granted', status === 'granted');
    router.push('/(onboarding)/notifications');
  }

  function handleMaybeLater() {
    writeSetting('location.permission_granted', false);
    router.push('/(onboarding)/notifications');
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
            testID="location-title"
          >
            {onboardingCopy.location.title}
          </Text>
        </View>

        <Text
          className="text-text-secondary text-base text-center leading-6"
          testID="location-body"
        >
          {onboardingCopy.location.body}
        </Text>

        <View className="gap-3">
          <Button
            label={onboardingCopy.location.primary}
            onPress={handleAllow}
            variant="primary"
            size="lg"
            fullWidth
            testID="location-allow"
          />
          <Button
            label={onboardingCopy.location.secondary}
            onPress={handleMaybeLater}
            variant="ghost"
            size="lg"
            fullWidth
            testID="location-skip"
          />
        </View>
      </View>
    </ScrollView>
  );
}
