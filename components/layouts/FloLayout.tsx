import { Stack } from 'expo-router';
import React from 'react';
import BaseStackLayout from './BaseStackLayout';

export default function FloLayout() {
  return (
    <BaseStackLayout headerShown={false} backgroundColor="#fff">
      <Stack.Screen name="index" />
      <Stack.Screen name="chat" />
    </BaseStackLayout>
  );
}
