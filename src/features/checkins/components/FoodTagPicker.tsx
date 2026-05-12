import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

import { Sheet } from '@/components/ui/Sheet';
import { TextField } from '@/components/ui/TextField';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { useFoodTags, useUpsertFoodTag, normalizeFoodTagName } from '../foodTags';
import type { FoodTagRow } from '@/types';

type FoodTagPickerProps = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  addCta: string;
};

/** Inline row of selected food tag chips with "×" remove affordance. */
function SelectedTagChips({
  selectedIds,
  tags,
  onRemove,
}: {
  selectedIds: string[];
  tags: FoodTagRow[];
  onRemove: (id: string) => void;
}) {
  const tagMap = new Map(tags.map((t) => [t.id, t]));
  return (
    <View className="flex-row flex-wrap gap-2">
      {selectedIds.map((id) => {
        const tag = tagMap.get(id);
        if (!tag) return null;
        return (
          <Pressable
            key={id}
            onPress={() => onRemove(id)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${tag.displayName}`}
            className="flex-row items-center bg-accent-primary rounded-full px-3 py-1.5 gap-1"
            style={{ minHeight: 40 }}
          >
            <Text className="text-text-inverse text-sm font-medium">
              {tag.displayName}
            </Text>
            <Text className="text-text-inverse text-sm" accessibilityElementsHidden>
              ×
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Bottom-sheet picker: search + select existing tags, add new. */
function FoodTagSheet({
  open,
  onClose,
  selectedIds,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const { tags, search } = useFoodTags();
  const upsertFoodTag = useUpsertFoodTag();

  const filtered = search(query);
  const normalizedQuery = normalizeFoodTagName(query);
  const exactMatch = tags.some((t) => t.name === normalizedQuery);
  const showAddNew = normalizedQuery.length > 0 && !exactMatch;

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id],
    );
  }

  async function handleAddNew() {
    const tag = await upsertFoodTag(query);
    onChange([...selectedIds, tag.id]);
    setQuery('');
  }

  function handleClose() {
    setQuery('');
    onClose();
  }

  return (
    <Sheet open={open} onClose={handleClose} title="Food tags" height="half">
      <View className="px-4 pb-4 gap-4">
        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder="Type to search or add"
          ariaLabel="Search food tags"
          testID="food-tag-search"
        />
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="flex-row flex-wrap gap-2 pb-2">
            {filtered.map((tag) => (
              <Chip
                key={tag.id}
                label={tag.displayName}
                selected={selectedIds.includes(tag.id)}
                onPress={() => toggle(tag.id)}
                testID={`food-tag-chip-${tag.id}`}
              />
            ))}
          </View>
          {showAddNew && (
            <Button
              label={`Add "${query.trim()}" as new tag`}
              onPress={() => { void handleAddNew(); }}
              variant="ghost"
              fullWidth
              testID="food-tag-add-new"
            />
          )}
        </ScrollView>
      </View>
    </Sheet>
  );
}

/** Combined: chips row + "+ Add" button + sheet. */
export function FoodTagPicker({ selectedIds, onChange, addCta }: FoodTagPickerProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { tags } = useFoodTags();

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2 items-center">
        {selectedIds.length > 0 && (
          <SelectedTagChips
            selectedIds={selectedIds}
            tags={tags}
            onRemove={(id) => onChange(selectedIds.filter((s) => s !== id))}
          />
        )}
        <Pressable
          onPress={() => setSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={addCta}
          style={{ minHeight: 40 }}
          className="flex-row items-center bg-surface border border-border rounded-full px-4 py-2"
        >
          <Text className="text-accent-primary text-sm font-medium">{addCta}</Text>
        </Pressable>
      </View>
      <FoodTagSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        selectedIds={selectedIds}
        onChange={onChange}
      />
    </View>
  );
}
