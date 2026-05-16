import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { LayoutDashboard, User, MessageSquare } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Design tokens
const COLORS = {
  bg: '#08090E',
  surface: '#12151F',
  accent: '#7C3AED',
  border: 'rgba(255,255,255,0.07)',
  textMuted: 'rgba(255,255,255,0.4)',
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 56 + Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8),
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
          // NO position: 'absolute' — stays in flow so content is never hidden behind it
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <MessageSquare size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
