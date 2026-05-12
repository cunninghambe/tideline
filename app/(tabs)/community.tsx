import React from 'react';
import { View, Text } from 'react-native';

/** Placeholder — community tab hidden until FEATURE_FLAGS.communityFeed=true */
export default function CommunityScreen() {
  return (
    <View className="flex-1 bg-bg items-center justify-center">
      <Text className="text-text-primary">placeholder: community</Text>
    </View>
  );
}
