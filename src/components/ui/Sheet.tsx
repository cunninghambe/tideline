import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

type SheetHeight = 'auto' | 'half' | 'full';

type SheetProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  height?: SheetHeight;
  testID?: string;
};

const heightStyles: Record<SheetHeight, object> = {
  auto: { maxHeight: '90%' },
  half: { height: '50%' },
  full: { height: '100%' },
};

export function Sheet({
  open,
  onClose,
  children,
  title,
  height = 'auto',
  testID,
}: SheetProps) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID={testID}
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Backdrop */}
        <Pressable
          className="flex-1 bg-during-tint/50"
          onPress={onClose}
          accessibilityLabel="Close sheet"
          accessibilityRole="button"
        />
        {/* Sheet container */}
        <View
          style={heightStyles[height]}
          className="bg-surface-elevated rounded-t-3xl"
        >
          {/* Drag handle */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>
          {/* Optional title */}
          {title && (
            <View className="flex-row items-center justify-between px-6 pb-4">
              <Text className="text-text-primary text-xl font-semibold">
                {title}
              </Text>
              <Pressable
                onPress={onClose}
                accessibilityLabel="Close"
                accessibilityRole="button"
                hitSlop={12}
              >
                <Text className="text-accent-primary text-base font-medium">Done</Text>
              </Pressable>
            </View>
          )}
          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
