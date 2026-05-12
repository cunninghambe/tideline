import React from 'react';
import { ScrollView, View, Text } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FEATURE_FLAGS } from '@/config/feature-flags';

function SharedItem({ label, shared }: { label: string; shared: boolean }) {
  return (
    <View className="flex-row items-start gap-2 py-1">
      <Text className={shared ? 'text-accent-primary' : 'text-severity-severe'}>
        {shared ? '✓' : '✗'}
      </Text>
      <Text className="text-text-primary text-sm flex-1">{label}</Text>
    </View>
  );
}

export default function CommunityScreen() {
  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}
    >
      {/* Status badge */}
      <View className="items-start">
        <View className="bg-surface border border-border rounded-xl px-3 py-1.5">
          <Text className="text-text-secondary text-sm font-semibold">
            Currently OFF
          </Text>
        </View>
      </View>

      <Text className="text-text-primary text-base">
        When ON, your anonymised data contributes to community insights and you
        see &quot;In your area today.&quot;
      </Text>

      {/* What's shared */}
      <View className="bg-surface rounded-2xl p-4 border border-border gap-1">
        <Text className="text-text-primary text-base font-semibold mb-2">
          What&apos;s shared:
        </Text>
        <SharedItem label="Date a migraine started/ended" shared />
        <SharedItem label="Severity bucket" shared />
        <SharedItem label="Region (~25km hex, not exact location)" shared />
        <SharedItem label="Weather snapshot" shared />
        <SharedItem label="Sleep hours, stress level, caffeine, water" shared />
        <SharedItem label="Food tags (not brand names)" shared />
        <SharedItem label='Medication classes (e.g. "NSAID", not "Advil")' shared />
      </View>

      {/* What's never shared */}
      <View className="bg-surface rounded-2xl p-4 border border-border gap-1">
        <Text className="text-text-primary text-base font-semibold mb-2">
          What&apos;s NEVER shared:
        </Text>
        <SharedItem label="Your free-text notes" shared={false} />
        <SharedItem label="Exact location" shared={false} />
        <SharedItem label="Cycle data" shared={false} />
        <SharedItem label="Brand-name medications" shared={false} />
        <SharedItem label="Anything that could identify you" shared={false} />
      </View>

      {/* Toggle — disabled because communityFeed flag is off */}
      <View className="gap-2">
        <Button
          label="Turn ON community sharing"
          onPress={() => {}}
          variant="secondary"
          size="lg"
          fullWidth
          disabled={!FEATURE_FLAGS.communityFeed}
          testID="community-toggle-button"
        />
        {!FEATURE_FLAGS.communityFeed && (
          <Text className="text-text-muted text-sm text-center">
            Cloud sync isn&apos;t enabled yet — coming next session.
          </Text>
        )}
      </View>

      {/* Footer disclaimer */}
      <Text className="text-text-muted text-sm">
        You can turn this off any time. If you turn it off, your past contributions
        remain in the anonymised pool — there&apos;s no way to extract them since they
        were anonymised at upload. New data stops flowing immediately.
      </Text>
    </ScrollView>
  );
}
