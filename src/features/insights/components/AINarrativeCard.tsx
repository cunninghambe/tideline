import React, { useState } from 'react';
import { View, Text } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import type { MonthlyNarrativeState } from '../hooks';

type Props = {
  yearMonth: string;
  state: MonthlyNarrativeState;
  testID?: string;
};

export function AINarrativeCard({ yearMonth, state, testID }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const label = formatYearMonth(yearMonth);

  return (
    <>
      <Card testID={testID ?? 'ai-narrative-card'} padding="md">
        <Text
          className="text-text-primary text-base font-semibold mb-1"
          accessibilityRole="header"
        >
          {`Monthly summary — ${label}`}
        </Text>
        {state.isUnavailable ? (
          <Button
            label="Generate AI narrative"
            variant="secondary"
            size="md"
            onPress={() => setSheetOpen(true)}
            testID="ai-narrative-button"
          />
        ) : state.narrative ? (
          <Text className="text-text-secondary text-sm leading-5">{state.narrative}</Text>
        ) : (
          <Button
            label="Generate AI narrative"
            variant="secondary"
            size="md"
            onPress={state.generate ?? (() => {})}
            testID="ai-narrative-button"
          />
        )}
        <Text className="text-text-muted text-xs mt-2">
          Uses cloud · your anonymised data only
        </Text>
      </Card>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="AI narrative"
        testID="ai-narrative-sheet"
      >
        <View className="px-6 py-4">
          <Text className="text-text-secondary text-base leading-6">
            Cloud sync isn&#39;t enabled yet — coming next session.
          </Text>
        </View>
      </Sheet>
    </>
  );
}

function formatYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  if (!year || !month) return yearMonth;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}
