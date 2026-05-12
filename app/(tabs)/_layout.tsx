import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color, size }: { name: IoniconsName; color: string; size: number }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'var(--accent-primary)',
        tabBarInactiveTintColor: 'var(--text-muted)',
        tabBarStyle: {
          backgroundColor: 'var(--surface)',
          borderTopColor: 'var(--border)',
        },
        headerStyle: { backgroundColor: 'var(--bg)' },
        headerTintColor: 'var(--text-primary)',
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="stats-chart-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="meds"
        options={{
          title: 'Meds',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="medical-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="settings-outline" color={color} size={size} />
          ),
        }}
      />
      {/* Community tab — hidden until FEATURE_FLAGS.communityFeed is true */}
      <Tabs.Screen
        name="community"
        options={{
          href: null,
          title: 'Community',
        }}
      />
    </Tabs>
  );
}
