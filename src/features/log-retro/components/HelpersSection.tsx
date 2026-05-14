import React from 'react';
import { View, Text } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { FONT_FAMILY } from '@/theme/fonts';
import type { HelperTag } from '@/db/schema/migraines';
import { toggleInList } from '../logic';

type HelpersSectionProps = {
  sortedHelpers: { value: string; label: string }[];
  selectedHelpers: HelperTag[];
  onHelpers: (helpers: HelperTag[]) => void;
};

export function HelpersSection({
  sortedHelpers,
  selectedHelpers,
  onHelpers,
}: HelpersSectionProps) {
  return (
    <View className="gap-3">
      <Text
        style={{ fontFamily: FONT_FAMILY.serifMedium }}
        className="text-text-primary text-xl"
      >
        What helped?
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {sortedHelpers.map((helper) => (
          <Chip
            key={helper.value}
            label={helper.label}
            selected={selectedHelpers.includes(helper.value as HelperTag)}
            onPress={() =>
              onHelpers(
                toggleInList(selectedHelpers, helper.value as HelperTag),
              )
            }
            testID={`helper-chip-${helper.value}`}
          />
        ))}
      </View>
    </View>
  );
}
