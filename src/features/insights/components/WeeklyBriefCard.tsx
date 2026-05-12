import React from 'react';
import { View, Text } from 'react-native';

import { Card } from '@/components/ui/Card';
import type { WeeklyBrief } from '../hooks';

type Props = {
  brief: WeeklyBrief;
  testID?: string;
};

export function WeeklyBriefCard({ brief, testID }: Props) {
  const hasContent =
    brief.migraineCount > 0 ||
    brief.pressureNotes.length > 0 ||
    brief.sleepNotes.length > 0 ||
    brief.stressNotes.length > 0;

  return (
    <Card testID={testID ?? 'weekly-brief-card'} padding="md">
      <Text
        className="text-text-primary text-base font-semibold mb-2"
        accessibilityRole="header"
      >
        This week
      </Text>
      {!hasContent ? (
        <Text className="text-text-secondary text-sm">No migraines this week.</Text>
      ) : (
        <View className="gap-1">
          {brief.migraineDetails.map((detail, i) => (
            <Text key={i} className="text-text-secondary text-sm">
              {brief.migraineCount === 1
                ? `1 migraine (${detail}).`
                : `${brief.migraineCount} migraines including ${detail}.`}
            </Text>
          ))}
          {brief.pressureNotes.map((note, i) => (
            <Text key={`p-${i}`} className="text-text-secondary text-sm">{note}</Text>
          ))}
          {brief.sleepNotes.map((note, i) => (
            <Text key={`s-${i}`} className="text-text-secondary text-sm">{note}</Text>
          ))}
          {brief.stressNotes.map((note, i) => (
            <Text key={`st-${i}`} className="text-text-secondary text-sm">{note}</Text>
          ))}
          {brief.cluster && (
            <Text className="text-text-muted text-xs italic mt-1">{brief.cluster}</Text>
          )}
        </View>
      )}
    </Card>
  );
}
