import { Stack } from 'expo-router';
import React from 'react';
import { useTheme } from '../../../lib/contexts/ThemeContext';

export default function VendorsLayout() {
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
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]/edit"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
} 