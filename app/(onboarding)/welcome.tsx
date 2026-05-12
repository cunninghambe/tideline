import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { onboardingCopy } from '@/copy';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerClassName="flex-1 items-center justify-center px-6 py-12"
    >
      <View className="w-full max-w-sm gap-8">
        <View accessibilityRole="header">
          <Text
            className="text-text-primary text-2xl font-semibold text-center"
            testID="welcome-title"
          >
            {onboardingCopy.welcome.title}
          </Text>
        </View>

        <Text
          className="text-text-secondary text-base text-center leading-6"
          testID="welcome-body"
        >
          {onboardingCopy.welcome.body}
        </Text>

        <Button
          label={onboardingCopy.welcome.cta}
          onPress={() => router.push('/(onboarding)/location')}
          variant="primary"
          size="lg"
          fullWidth
          testID="welcome-cta"
        />
      </View>
    </ScrollView>
  );
}
