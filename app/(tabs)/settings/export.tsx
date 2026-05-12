import React, { useState } from 'react';
import { View, Text, Share, Alert } from 'react-native';

import { Button } from '@/components/ui/Button';
import { generateExport } from '@/features/settings/exporter';

export default function ExportScreen() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    const result = await generateExport();
    setLoading(false);

    if (!result.ok) {
      Alert.alert('Export failed', result.error.message);
      return;
    }

    await Share.share({
      url: result.value.filePath,
      title: 'Tideline data export',
    });
  }

  return (
    <View className="flex-1 bg-bg p-4 gap-4">
      <Text className="text-text-primary text-2xl font-semibold">
        Export your data
      </Text>

      <Text className="text-text-secondary text-base">
        Save a JSON copy of everything Tideline knows about you. Lives in your
        share sheet.
      </Text>

      <Button
        label="Generate export"
        onPress={handleExport}
        variant="secondary"
        size="lg"
        fullWidth
        loading={loading}
        disabled={loading}
        testID="export-generate-button"
      />
    </View>
  );
}
