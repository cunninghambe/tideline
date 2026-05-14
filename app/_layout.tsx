import '../global.css';

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { ThemeProvider } from '@/theme/provider';
import { usePalette } from '@/theme/useTheme';
import { useTidelineFonts } from '@/theme/fonts';
import { runMigrations } from '@/db/client';
import { getActive } from '@/features/migraines/repo';
import { useActiveMigraineStore } from '@/stores/useActiveMigraineStore';
import { scheduleDailyCheckinReminder } from '@/features/checkins/notifications';

void SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
  },
});

export default function RootLayout() {
  const setActiveMigraineId = useActiveMigraineStore((s) => s.setActiveMigraineId);
  const fontsLoaded = useTidelineFonts();

  useEffect(() => {
    runMigrations().catch((e: unknown) => {
      // Migration errors are programmer errors — log and surface
      console.error('[tideline] Migration failed:', e);
    });

    const result = getActive();
    if (result.ok && result.value) {
      setActiveMigraineId(result.value.id);
    }

    scheduleDailyCheckinReminder().catch((e: unknown) => {
      console.error('[tideline] Failed to schedule daily check-in reminder:', e);
    });
  }, [setActiveMigraineId]);

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemedStack />
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function ThemedStack() {
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
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="day/[date]" options={{ title: '', headerBackTitle: 'Calendar' }} />
      <Stack.Screen name="log/choose" options={{ title: 'Log a migraine', presentation: 'modal' }} />
      <Stack.Screen name="log/active" options={{ title: "You're having a migraine", headerShown: false }} />
      <Stack.Screen name="log/retro" options={{ title: 'Log a migraine', headerBackTitle: 'Back' }} />
      <Stack.Screen name="log/end" options={{ title: 'It ended', presentation: 'modal' }} />
      <Stack.Screen name="companion" options={{ title: 'Tideline is here', headerShown: false }} />
      <Stack.Screen name="checkin/[date]" options={{ title: 'Daily check-in' }} />
      <Stack.Screen name="meds/add" options={{ title: 'Add medication', presentation: 'modal' }} />
      <Stack.Screen name="meds/[id]" options={{ title: 'Medication', headerBackTitle: 'Meds' }} />
    </Stack>
  );
}
