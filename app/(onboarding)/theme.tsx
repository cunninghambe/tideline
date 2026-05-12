import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { onboardingCopy, PALETTE_PICKER_OPTIONS } from '@/copy';
import { PALETTES, type PaletteName } from '@/theme/palettes';
import { useSetPalette } from '@/theme/useTheme';
import { writeSetting } from '@/features/onboarding/repo';
import { MiniCalendarPreview } from '@/features/onboarding/components/MiniCalendarPreview';

export default function ThemeScreen() {
  const router = useRouter();
  const setPalette = useSetPalette();
  const [selected, setSelected] = useState<PaletteName | null>(null);

  function handleContinue() {
    if (!selected) return;
    setPalette(selected);
    writeSetting('theme.palette', selected);
    router.push('/(onboarding)/done');
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerClassName="items-center px-6 py-12"
    >
      <View className="w-full max-w-sm gap-8">
        <View accessibilityRole="header">
          <Text
            className="text-text-primary text-2xl font-semibold text-center"
            testID="theme-title"
          >
            {onboardingCopy.theme.title}
          </Text>
        </View>

        <Text
          className="text-text-secondary text-base text-center"
          testID="theme-body"
        >
          {onboardingCopy.theme.body}
        </Text>

        <View className="flex-row flex-wrap gap-4">
          {PALETTE_PICKER_OPTIONS.map((option) => {
            const palette = PALETTES[option.value];
            const isSelected = selected === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => setSelected(option.value)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${option.displayName} palette`}
                accessibilityState={{ selected: isSelected }}
                testID={`palette-${option.value}`}
                style={{
                  width: '47%',
                  borderRadius: 16,
                  padding: 12,
                  backgroundColor: palette.surface,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? palette.accentPrimary : palette.border,
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <MiniCalendarPreview
                  palette={palette}
                  testID={`mini-calendar-${option.value}`}
                />
                <Text
                  style={{
                    color: palette.textPrimary,
                    fontSize: 13,
                    fontWeight: '500',
                    textAlign: 'center',
                  }}
                >
                  {option.displayName}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          label="Continue"
          onPress={handleContinue}
          variant="primary"
          size="lg"
          fullWidth
          disabled={selected === null}
          testID="theme-continue"
        />
      </View>
    </ScrollView>
  );
}
