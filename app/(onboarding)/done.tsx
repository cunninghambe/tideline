import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { onboardingCopy } from '@/copy';
import { writeSetting } from '@/features/onboarding/repo';

export default function DoneScreen() {
  const router = useRouter();

  function handleGetStarted() {
    writeSetting('onboarding.completed', true);
    router.replace('/(tabs)');
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
            testID="done-title"
          >
            {onboardingCopy.done.title}
          </Text>
        </View>

        <Text
          className="text-text-secondary text-base text-center leading-6"
          testID="done-body"
        >
          {onboardingCopy.done.body}
        </Text>

        <Button
          label={onboardingCopy.done.cta}
          onPress={handleGetStarted}
          variant="primary"
          size="lg"
          fullWidth
          testID="done-cta"
        />
      </View>
    </ScrollView>
  );
}
