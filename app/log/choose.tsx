import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { useActiveMigraineStore } from '@/stores/useActiveMigraineStore';

export default function LogChooseScreen() {
  const router = useRouter();
  const activeMigraineId = useActiveMigraineStore((s) => s.activeMigraineId);

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerClassName="flex-grow items-center justify-center px-6 py-12"
    >
      <View className="w-full max-w-sm gap-6">
        <View accessibilityRole="header">
          <Text className="text-text-primary text-2xl font-semibold text-center">
            What&apos;s happening?
          </Text>
        </View>

        <View className="gap-4">
          <View className="gap-2">
            <Button
              label="It's happening now"
              onPress={() => router.push('/log/active')}
              variant="primary"
              size="xl"
              fullWidth
              disabled={activeMigraineId !== null}
              testID="choose-happening-now"
            />
            {activeMigraineId !== null && (
              <Text
                className="text-text-secondary text-sm text-center"
                accessibilityLiveRegion="polite"
              >
                You already have a migraine in progress.
              </Text>
            )}
            {activeMigraineId !== null && (
              <Button
                label="View companion mode"
                onPress={() => router.push('/companion')}
                variant="secondary"
                size="xl"
                fullWidth
                testID="choose-view-companion"
              />
            )}
          </View>

          <Button
            label="Log one that already ended"
            onPress={() => router.push('/log/retro')}
            variant="secondary"
            size="xl"
            fullWidth
            testID="choose-already-ended"
          />
        </View>
      </View>
    </ScrollView>
  );
}
