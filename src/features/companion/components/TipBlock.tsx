import React from 'react';
import { View, Text } from 'react-native';

import { companionCopy } from '@/copy';
import type { HelperTag } from '@/db/schema/migraines';

type HelperSummary = { tag: HelperTag; count: number };

type Props = {
  helpers: HelperSummary[];
  completedCount: number;
};

function helperLine(h: HelperSummary): string {
  return `You said "${h.tag.replace(/_/g, ' ')}" helped ${h.count} ${h.count === 1 ? 'time' : 'times'}.`;
}

export function TipBlock({ helpers, completedCount }: Props) {
  const showPersonalized = completedCount >= 3 && helpers.length > 0;

  return (
    <View className="gap-6">
      {/* Personalized helpers */}
      <View className="gap-3">
        <Text className="text-text-primary text-2xl font-semibold">
          {companionCopy.helpedHistoryHeading}
        </Text>

        {showPersonalized ? (
          <View accessibilityRole="list">
            {helpers.map((h) => (
              <Text key={h.tag} className="text-text-primary text-xl">
                {`• ${helperLine(h)}`}
              </Text>
            ))}
          </View>
        ) : (
          <Text className="text-text-secondary text-xl italic">
            {companionCopy.emptyHelpedHistory}
          </Text>
        )}
      </View>

      {/* General tips */}
      <View className="gap-3">
        <Text className="text-text-primary text-2xl font-semibold">
          {companionCopy.generalTipsHeading}
        </Text>

        <View accessibilityRole="list">
          {companionCopy.generalTips.map((tip) => (
            <Text key={tip} className="text-text-primary text-xl">
              {`• ${tip}`}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}
