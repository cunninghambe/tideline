import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { usePalette } from '@/theme/useTheme';
import { useActiveMigraineStore } from '@/stores/useActiveMigraineStore';
import { getById } from '@/features/migraines/repo';
import { formatDuration } from '@/lib/format';

type DuringTintBannerProps = {
  testID?: string;
};

function useElapsedMinutes(startedAt: Date | null): number {
  const [elapsed, setElapsed] = useState(() =>
    startedAt ? Math.floor((Date.now() - startedAt.getTime()) / 60_000) : 0,
  );

  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 60_000));
    }, 60_000);
    return () => clearInterval(id);
  }, [startedAt]);

  return elapsed;
}

export function DuringTintBanner({ testID }: DuringTintBannerProps) {
  const router = useRouter();
  const palette = usePalette();
  const activeMigraineId = useActiveMigraineStore((s) => s.activeMigraineId);
  const [startedAt, setStartedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!activeMigraineId) {
      setStartedAt(null);
      return;
    }
    const result = getById(activeMigraineId);
    if (result.ok && result.value) {
      const d = result.value.startedAt instanceof Date
        ? result.value.startedAt
        : new Date(result.value.startedAt);
      setStartedAt(d);
    }
  }, [activeMigraineId]);

  const elapsedMins = useElapsedMinutes(startedAt);

  if (!activeMigraineId) return null;

  return (
    <View
      testID={testID}
      style={{
        backgroundColor: palette.severitySevere,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}
      accessibilityLiveRegion="polite"
    >
      <Text style={{ color: palette.textInverse, fontSize: 14, flex: 1 }}>
        Migraine in progress · started {formatDuration(elapsedMins)} ago
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={() => router.push('/log/end')}
          accessibilityRole="button"
          accessibilityLabel="It ended"
          style={{
            backgroundColor: palette.textInverse,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 6,
            minHeight: 32,
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: palette.severitySevere, fontSize: 13, fontWeight: '600' }}>
            It ended
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/companion')}
          accessibilityRole="button"
          accessibilityLabel="Open companion"
          style={{
            borderWidth: 1,
            borderColor: palette.textInverse,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 6,
            minHeight: 32,
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: palette.textInverse, fontSize: 13, fontWeight: '500' }}>
            Open companion
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
