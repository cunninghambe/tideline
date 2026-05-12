import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { ToggleRow } from '@/features/settings/components/ToggleRow';
import { useSetting, useSetSetting } from '@/features/settings/store';
import Constants from 'expo-constants';

function SectionHeader({ label }: { label: string }) {
  return (
    <View className="px-4 pt-6 pb-2">
      <Text className="text-text-secondary text-xs font-semibold uppercase tracking-widest">
        {label}
      </Text>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const communityEnabled = useSetting('community.sharing_enabled', 'false') === 'true';
  const cycleEnabled = useSetting('cycle.tracking_enabled', 'true') === 'true';
  const { mutate: setSettingMutate } = useSetSetting();

  const version = Constants.expoConfig?.version ?? '1.0.0';

  const communityBadge = communityEnabled ? 'ON' : 'OFF';

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <SectionHeader label="Appearance" />
      <View className="bg-surface border-t border-divider">
        <SettingsRow
          label="Theme"
          onPress={() => router.push('/(tabs)/settings/theme')}
          testID="settings-row-theme"
        />
      </View>

      <SectionHeader label="Daily routine" />
      <View className="bg-surface border-t border-divider">
        <SettingsRow
          label="Notifications"
          onPress={() => router.push('/(tabs)/settings/notifications')}
          testID="settings-row-notifications"
        />
        <SettingsRow
          label="Daily check-in"
          onPress={() => router.push('/(tabs)/settings/checkin-fields')}
          testID="settings-row-checkin-fields"
        />
        <ToggleRow
          label="Cycle tracking"
          value={cycleEnabled}
          onValueChange={(v) =>
            setSettingMutate({ key: 'cycle.tracking_enabled', value: String(v) })
          }
          testID="settings-toggle-cycle"
        />
      </View>

      <SectionHeader label="Community" />
      <View className="bg-surface border-t border-divider">
        <SettingsRow
          label="Community sharing"
          badge={communityBadge}
          onPress={() => router.push('/(tabs)/settings/community')}
          testID="settings-row-community"
        />
      </View>

      <SectionHeader label="Account & data" />
      <View className="bg-surface border-t border-divider">
        <SettingsRow
          label="Account"
          caption="Not signed in"
          onPress={() => router.push('/(tabs)/settings/account')}
          testID="settings-row-account"
        />
        <SettingsRow
          label="Export data"
          onPress={() => router.push('/(tabs)/settings/export')}
          testID="settings-row-export"
        />
        <SettingsRow
          label="Delete data"
          onPress={() => router.push('/(tabs)/settings/delete')}
          danger
          testID="settings-row-delete"
        />
      </View>

      <SectionHeader label="About" />
      <View className="bg-surface border-t border-divider">
        <View className="px-4 py-4 gap-3 border-b border-divider">
          <Text className="text-text-primary text-base">
            Tideline v{version}
          </Text>
          <Text className="text-text-muted text-sm">
            Privacy policy and Terms coming soon
          </Text>
          <Text className="text-text-muted text-sm">
            This is not medical advice. Tideline helps you track patterns —
            always consult a healthcare professional about your migraines.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
