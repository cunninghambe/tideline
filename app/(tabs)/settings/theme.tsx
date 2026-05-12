import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PALETTE_PICKER_OPTIONS } from '@/copy';
import { PALETTES, type PaletteName } from '@/theme/palettes';
import { usePalette, useSetPalette } from '@/theme/useTheme';
import { useThemeStore } from '@/stores/useThemeStore';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useSetSetting } from '@/features/settings/store';

type ThemeMode = 'light' | 'dark' | 'system';

const THEME_MODE_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

function PaletteCard({
  option,
  isSelected,
  onSelect,
}: {
  option: (typeof PALETTE_PICKER_OPTIONS)[number];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const palette = PALETTES[option.value];

  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityLabel={option.displayName}
      accessibilityState={{ checked: isSelected }}
      className="flex-1 rounded-2xl overflow-hidden border-2"
      style={{
        borderColor: isSelected ? palette.accentPrimary : palette.border,
        backgroundColor: palette.bg,
        minHeight: 100,
      }}
    >
      {/* Mini calendar preview — 3 rows of colour blocks */}
      <View style={{ padding: 8, gap: 4 }}>
        <View style={{ flexDirection: 'row', gap: 3 }}>
          {[palette.bg, palette.severityMild, palette.severityModerate].map(
            (color, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 14,
                  borderRadius: 3,
                  backgroundColor: color,
                  borderWidth: 1,
                  borderColor: palette.border,
                }}
              />
            ),
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 3 }}>
          {[palette.severitySevere, palette.bg, palette.accentSecondary].map(
            (color, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 14,
                  borderRadius: 3,
                  backgroundColor: color,
                  borderWidth: 1,
                  borderColor: palette.border,
                }}
              />
            ),
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 3 }}>
          {[palette.bg, palette.accentPrimary, palette.bg].map((color, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 14,
                borderRadius: 3,
                backgroundColor: color,
                borderWidth: 1,
                borderColor: palette.border,
              }}
            />
          ))}
        </View>
      </View>

      <View style={{ padding: 8, paddingTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: palette.textPrimary, fontSize: 12, fontWeight: '600' }}>
          {option.displayName}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={16} color={palette.accentPrimary} />
        )}
      </View>
    </Pressable>
  );
}

export default function ThemeScreen() {
  const currentPalette = usePalette();
  const setPalette = useSetPalette();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const { mutate: setSettingMutate } = useSetSetting();
  const currentPaletteName = useThemeStore((s) => s.palette);

  function handlePaletteSelect(name: PaletteName) {
    setPalette(name);
    setSettingMutate({ key: 'theme.palette', value: name });
  }

  function handleModeChange(newMode: ThemeMode) {
    setMode(newMode);
    setSettingMutate({ key: 'theme.mode', value: newMode });
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: 40 }}
    >
      <View className="gap-3">
        <Text className="text-text-primary text-xl font-semibold">Palette</Text>
        <Text className="text-text-secondary text-sm">
          Tap a palette to apply it immediately.
        </Text>

        {/* Two-column grid */}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {PALETTE_PICKER_OPTIONS.slice(0, 2).map((opt) => (
              <PaletteCard
                key={opt.value}
                option={opt}
                isSelected={currentPaletteName === opt.value}
                onSelect={() => handlePaletteSelect(opt.value)}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {PALETTE_PICKER_OPTIONS.slice(2, 4).map((opt) => (
              <PaletteCard
                key={opt.value}
                option={opt}
                isSelected={currentPaletteName === opt.value}
                onSelect={() => handlePaletteSelect(opt.value)}
              />
            ))}
          </View>
        </View>
      </View>

      <View className="gap-3">
        <Text className="text-text-primary text-xl font-semibold">Theme mode</Text>
        <Text className="text-text-secondary text-sm">
          In v1, the palette determines how light or dark the app looks.
          This setting will take full effect in a future update.
        </Text>
        <SegmentedControl
          options={THEME_MODE_OPTIONS}
          value={mode}
          onChange={handleModeChange}
          ariaLabel="Theme mode"
          testID="theme-mode-control"
        />
      </View>

      {/* Swatch preview of selected palette */}
      <View className="gap-2 bg-surface rounded-2xl p-4 border border-border">
        <Text className="text-text-secondary text-sm font-medium">
          Colour preview
        </Text>
        <View className="flex-row gap-2 flex-wrap">
          {[
            { label: 'Severe', color: currentPalette.severitySevere },
            { label: 'Moderate', color: currentPalette.severityModerate },
            { label: 'Mild', color: currentPalette.severityMild },
            { label: 'Aura', color: currentPalette.accentSecondary },
            { label: 'Accent', color: currentPalette.accentPrimary },
          ].map(({ label, color }) => (
            <View key={label} className="items-center gap-1">
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: color,
                }}
              />
              <Text className="text-text-muted text-xs">{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
