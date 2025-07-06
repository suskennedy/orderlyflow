import { Stack } from 'expo-router';
import React from 'react';

export default function AddInventoryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[type]" />
    </Stack>
  );
}