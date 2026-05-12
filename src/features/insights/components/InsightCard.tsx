import React from 'react';
import { Text } from 'react-native';

import { Card } from '@/components/ui/Card';
import type { Correlation, Confidence } from '../analytics';

type Props = {
  correlation: Correlation;
  testID?: string;
};

const confidenceLabel: Record<Confidence, string> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
};

export function InsightCard({ correlation, testID }: Props) {
  return (
    <Card testID={testID ?? `insight-card-${correlation.kind}`} padding="md">
      <Text
        className="text-text-primary text-base font-semibold mb-1"
        accessibilityRole="header"
      >
        {correlation.title}
      </Text>
      <Text className="text-text-secondary text-sm leading-5 mb-3">
        {correlation.body}
      </Text>
      <Text className="text-text-muted text-xs italic">
        {`Confidence: ${confidenceLabel[correlation.confidence]} · ${correlation.sampleSize} attacks observed`}
      </Text>
    </Card>
  );
}
