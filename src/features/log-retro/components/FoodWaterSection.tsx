import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Link } from 'expo-router';

import { Stepper } from '@/components/ui/Stepper';
import { Chip } from '@/components/ui/Chip';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { usePalette } from '@/theme/useTheme';
import { FONT_FAMILY } from '@/theme/fonts';
import type { FoodTagRow } from '@/types';
import { normaliseFoodTagName } from '../logic';

type FoodWaterSectionProps = {
  /** Date of the migraine start, for linking to the check-in screen. */
  date: string;
  /** Existing check-in for this date — shown read-only if present. */
  existingCheckin: {
    waterCups: number | null;
    foodTagIds: string[];
  } | null;
  /** All food tags in the DB (for the inline picker). */
  allFoodTags: FoodTagRow[];
  /** Inline form state (used when no existing check-in). */
  waterCups: number;
  selectedFoodTagIds: string[];
  onWaterCups: (n: number) => void;
  onToggleFoodTag: (tagId: string) => void;
  onAddNewFoodTag: (name: string) => void;
};

export function FoodWaterSection({
  date,
  existingCheckin,
  allFoodTags,
  waterCups,
  selectedFoodTagIds,
  onWaterCups,
  onToggleFoodTag,
  onAddNewFoodTag,
}: FoodWaterSectionProps) {
  const palette = usePalette();
  const [newTagInput, setNewTagInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  function handleAddTag() {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;

    const normalised = normaliseFoodTagName(trimmed);
    const existing = allFoodTags.find((t) => t.name === normalised);

    if (existing) {
      if (!selectedFoodTagIds.includes(existing.id)) {
        onToggleFoodTag(existing.id);
      }
    } else {
      onAddNewFoodTag(trimmed);
    }

    setNewTagInput('');
    setShowInput(false);
  }

  if (existingCheckin) {
    const checkinFoodTags = allFoodTags.filter((t) =>
      existingCheckin.foodTagIds.includes(t.id),
    );

    return (
      <View className="gap-3">
        <Text
          style={{ fontFamily: FONT_FAMILY.serifMedium }}
          className="text-text-primary text-xl"
        >
          Food + water
        </Text>
        <Text className="text-text-secondary text-sm">
          Pulled from this day&apos;s check-in.
        </Text>

        {typeof existingCheckin.waterCups === 'number' && (
          <View className="flex-row items-center gap-2">
            <SectionLabel style={{ marginBottom: 0, width: 56 }}>Water</SectionLabel>
            <Text className="text-text-primary text-base">
              {existingCheckin.waterCups} cups
            </Text>
          </View>
        )}

        {checkinFoodTags.length > 0 && (
          <View className="gap-1">
            <SectionLabel>Food</SectionLabel>
            <View className="flex-row flex-wrap gap-2">
              {checkinFoodTags.map((t) => (
                <View
                  key={t.id}
                  className="bg-surface border border-border px-3 py-1.5 rounded-full"
                >
                  <Text className="text-text-primary text-sm">{t.displayName}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Link
          href={{ pathname: '/checkin/[date]', params: { date } }}
          className="text-accent-primary text-sm font-medium"
          accessibilityLabel="Edit this day's check-in"
        >
          Edit this day&apos;s check-in →
        </Link>
      </View>
    );
  }

  // No existing check-in — show inline mini form
  return (
    <View className="gap-3">
      <Text className="text-text-primary text-xl font-semibold">Food + water</Text>
      <Text className="text-text-secondary text-sm">
        No check-in for this day. Fill in what you remember.
      </Text>

      {/* Water */}
      <View className="gap-1">
        <SectionLabel>Water</SectionLabel>
        <Stepper
          value={waterCups}
          onValueChange={onWaterCups}
          min={0}
          max={20}
          unit="cups"
          testID="water-stepper"
        />
      </View>

      {/* Food tags */}
      <View className="gap-2">
        <SectionLabel>Food</SectionLabel>

        {allFoodTags.length > 0 && (
          <View className="flex-row flex-wrap gap-2">
            {allFoodTags.map((tag) => (
              <Chip
                key={tag.id}
                label={tag.displayName}
                selected={selectedFoodTagIds.includes(tag.id)}
                onPress={() => onToggleFoodTag(tag.id)}
                testID={`food-chip-${tag.id}`}
              />
            ))}
          </View>
        )}

        {showInput ? (
          <View className="flex-row items-center gap-2">
            <TextInput
              value={newTagInput}
              onChangeText={setNewTagInput}
              placeholder="e.g. red wine"
              placeholderTextColor={palette.textMuted}
              accessibilityLabel="New food tag name"
              returnKeyType="done"
              onSubmitEditing={handleAddTag}
              autoFocus
              className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-text-primary text-sm h-10"
            />
            <Pressable
              onPress={handleAddTag}
              accessibilityRole="button"
              accessibilityLabel="Add food tag"
              style={{ minHeight: 40, minWidth: 44 }}
              className="items-center justify-center bg-accent-primary rounded-xl px-3"
            >
              <Text className="text-text-inverse text-sm font-medium">Add</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setShowInput(false);
                setNewTagInput('');
              }}
              accessibilityRole="button"
              accessibilityLabel="Cancel adding food tag"
              style={{ minHeight: 40, minWidth: 44 }}
              className="items-center justify-center"
            >
              <Text className="text-text-secondary text-sm">Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setShowInput(true)}
            accessibilityRole="button"
            accessibilityLabel="Add food tag"
            style={{ minHeight: 44 }}
            className="self-start flex-row items-center gap-1"
          >
            <Text className="text-accent-primary text-sm font-medium">+ Add</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
