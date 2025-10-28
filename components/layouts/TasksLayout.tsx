import { Stack } from 'expo-router';
import React from 'react';
import BaseStackLayout from './BaseStackLayout';

export default function TasksLayout() {
  return (
    <BaseStackLayout headerShown={false}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
    </BaseStackLayout>
  );
}
