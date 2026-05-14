import React from 'react';
import { Stack } from 'expo-router';
import { usePalette } from '@/theme/useTheme';

export default function SettingsLayout() {
  const palette = usePalette();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.bg },
        headerTintColor: palette.textPrimary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: palette.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="account" options={{ title: 'Account' }} />
      <Stack.Screen name="checkin-fields" options={{ title: 'Check-in fields' }} />
      <Stack.Screen name="community" options={{ title: 'Community' }} />
      <Stack.Screen name="delete" options={{ title: 'Delete data' }} />
      <Stack.Screen name="export" options={{ title: 'Export' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="theme" options={{ title: 'Theme' }} />
    </Stack>
  );
}
