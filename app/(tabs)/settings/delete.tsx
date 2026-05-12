import React, { useState } from 'react';
import { ScrollView, View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { deleteAll } from '@/features/settings/deleter';

const CONFIRM_PHRASE = 'DELETE';

export default function DeleteScreen() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const confirmed = input === CONFIRM_PHRASE;

  async function handleDelete() {
    if (!confirmed) return;
    setLoading(true);
    const result = await deleteAll();
    setLoading(false);

    if (!result.ok) {
      Alert.alert('Delete failed', result.error.message);
      return;
    }

    router.replace('/(onboarding)/welcome');
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
    >
      <Text className="text-text-primary text-2xl font-semibold">
        Delete all your data?
      </Text>

      <Text className="text-text-secondary text-base">
        This is permanent.
      </Text>

      <View className="bg-surface rounded-2xl p-4 border border-border gap-2">
        <View className="flex-row items-start gap-2">
          <Text className="text-accent-primary">✓</Text>
          <Text className="text-text-primary text-sm flex-1">
            Local data on this phone — deleted
          </Text>
        </View>
        <View className="flex-row items-start gap-2">
          <Text className="text-accent-primary">✓</Text>
          <Text className="text-text-primary text-sm flex-1">
            Your cloud backup — deleted
          </Text>
        </View>
        <View className="flex-row items-start gap-2">
          <Text className="text-accent-primary">✓</Text>
          <Text className="text-text-primary text-sm flex-1">
            Your account — deleted
          </Text>
        </View>
      </View>

      <Text className="text-text-muted text-sm">
        Anonymised aggregated data already in the community pool cannot be
        extracted, since it was anonymised at upload. We can confirm no future
        contributions will be made.
      </Text>

      <TextField
        value={input}
        onChangeText={setInput}
        label='Type "DELETE" to confirm'
        placeholder="DELETE"
        ariaLabel='Type DELETE to confirm'
        testID="delete-confirm-input"
      />

      <Button
        label="Delete everything"
        onPress={handleDelete}
        variant={confirmed ? 'danger' : 'secondary'}
        size="lg"
        fullWidth
        loading={loading}
        disabled={!confirmed || loading}
        testID="delete-confirm-button"
      />
    </ScrollView>
  );
}
