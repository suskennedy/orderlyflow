import { Stack } from 'expo-router';
import React from 'react';
import { useTheme } from '../../../lib/contexts/ThemeContext';

export default function SettingsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Settings',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="family-management"
        options={{
          title: 'Family Management',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="invite-members"
        options={{
          title: 'Invite Members',
          headerShown: false,
        }}
      />
    </Stack>
  );
} 