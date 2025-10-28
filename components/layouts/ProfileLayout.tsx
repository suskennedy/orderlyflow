import { Stack } from 'expo-router';
import React from 'react';
import BaseStackLayout from './BaseStackLayout';

export default function ProfileLayout() {
  return (
    <BaseStackLayout headerShown={false}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" />
    </BaseStackLayout>
  );
}
