import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

import { Sheet } from '@/components/ui/Sheet';
import { Slider } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';
import { companionCopy } from '@/copy';
import { useUpdateSeverity } from '../hooks';

type Props = {
  migraineId: string;
  loggedAgoText: string;
  severity: number;
};

export function DuringSection({ migraineId, loggedAgoText, severity }: Props) {
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

  return (
    <View className="gap-3">
      <Text className="text-text-primary text-2xl font-semibold">
        {companionCopy.rightNowHeading}
      </Text>

      <Text className="text-text-primary text-xl">{loggedAgoText}</Text>

      <Pressable
        onPress={openSheet}
        accessibilityRole="button"
        accessibilityLabel={companionCopy.severityLine(severity)}
        accessibilityHint="Tap to update"
      >
        <Text className="text-text-secondary text-xl underline">
          {companionCopy.severityLine(severity)}
        </Text>
      </Pressable>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Update severity">
        <View className="px-6 pb-8 gap-6">
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
    </View>
  );
}
