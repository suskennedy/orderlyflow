import { Stack } from 'expo-router';
import React from 'react';
import BaseStackLayout from './BaseStackLayout';

export default function TabsLayout() {
  return (
    <BaseStackLayout headerShown={false}>
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
    </BaseStackLayout>
  );
}
