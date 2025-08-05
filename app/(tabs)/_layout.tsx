import { Stack } from 'expo-router';
import React from 'react';
import { useTheme } from '../../lib/contexts/ThemeContext';

export default function TabsLayout() {
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
        name="(dashboard)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(home)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(tasks)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(vendors)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(flo)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(settings)"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
} 