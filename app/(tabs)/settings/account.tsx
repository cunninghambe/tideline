import React from 'react';
import { View, Text } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FEATURE_FLAGS } from '@/config/feature-flags';

export default function AccountScreen() {
  return (
    <View className="flex-1 bg-bg p-4 gap-4">
      <Text className="text-text-primary text-2xl font-semibold">
        Not signed in
      </Text>

      <Text className="text-text-secondary text-base">
        Cloud backup and cross-device sync require an account. We&apos;ll add this
        in the next update.
      </Text>

      <View className="gap-2">
        <Button
          label="Sign in"
          onPress={() => {}}
          variant="secondary"
          size="lg"
          fullWidth
          disabled={!FEATURE_FLAGS.cloudSync}
          testID="account-signin-button"
        />
        {!FEATURE_FLAGS.cloudSync && (
          <Text className="text-text-muted text-sm text-center">
            Account creation is coming in the next update.
          </Text>
        )}
      </View>
    </View>
  );
}
