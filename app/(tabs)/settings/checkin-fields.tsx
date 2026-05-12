import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';

/** Per G10: placeholder — field customization deferred. */
export default function CheckinFieldsScreen() {
  return (
    <View className="flex-1 bg-bg p-4">
      <Card testID="checkin-fields-coming-soon">
        <Text className="text-text-primary text-base">
          Coming soon — every check-in field is shown by default for now.
        </Text>
      </Card>
    </View>
  );
}
