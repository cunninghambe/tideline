import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

import { Sheet } from '@/components/ui/Sheet';
import { Slider } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';
import { usePalette } from '@/theme/useTheme';
import { useDensity } from '@/theme/calendarTokenHooks';
import { FONT_FAMILY } from '@/theme/fonts';
import { useUpdateSeverity } from '../hooks';
import { CompanionBlock } from './CompanionBlock';

type Props = {
  migraineId: string;
  loggedAgoText: string;
  severity: number;
};

export function DuringSection({ migraineId, loggedAgoText, severity }: Props) {
  const palette = usePalette();
  const density = useDensity();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftSeverity, setDraftSeverity] = useState(severity);
  const updateSeverity = useUpdateSeverity(migraineId);

  function openSheet() {
    setDraftSeverity(severity);
    setSheetOpen(true);
  }

  function saveAndClose() {
    updateSeverity.mutate(draftSeverity, { onSuccess: () => setSheetOpen(false) });
  }

  // loggedAgoText looks like "You logged this migraine 2h 14m ago." — pull
  // out the duration token so we can mono-style it.
  const match = /^(.*?)(\d+[hm].*?ago\.?)(.*)$/i.exec(loggedAgoText);
  const beforeDuration = match?.[1] ?? loggedAgoText;
  const duration = match?.[2] ?? '';

  return (
    <CompanionBlock label="Right now">
      <Text
        style={{
          color: palette.textPrimary,
          fontFamily: FONT_FAMILY.sans,
          fontSize: 15 * density.typeScale,
          lineHeight: 24 * density.typeScale,
          marginBottom: 4,
        }}
      >
        {beforeDuration}
        {duration && (
          <Text
            style={{
              fontFamily: FONT_FAMILY.monoMedium,
              color: palette.textPrimary,
            }}
          >
            {duration}
          </Text>
        )}
      </Text>

      <Pressable
        onPress={openSheet}
        accessibilityRole="button"
        accessibilityLabel={`Severity ${severity}`}
        accessibilityHint="Tap to update"
      >
        <Text
          style={{
            color: palette.textPrimary,
            fontFamily: FONT_FAMILY.sans,
            fontSize: 15 * density.typeScale,
            lineHeight: 24 * density.typeScale,
          }}
        >
          {'Severity: '}
          <Text style={{ fontFamily: FONT_FAMILY.monoMedium }}>{severity}</Text>
          <Text style={{ color: palette.textMuted, fontStyle: 'italic' }}>
            {'  tap to update'}
          </Text>
        </Text>
      </Pressable>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Update severity">
        <View style={{ paddingHorizontal: 24, paddingBottom: 32, gap: 24 }}>
          <Slider
            value={draftSeverity}
            onValueChange={setDraftSeverity}
            min={1}
            max={10}
            ariaLabel="Severity 1 to 10"
            testID="severity-slider"
          />
          <Button
            label="Save"
            onPress={saveAndClose}
            size="xl"
            fullWidth
            loading={updateSeverity.isPending}
          />
        </View>
      </Sheet>
    </CompanionBlock>
  );
}
