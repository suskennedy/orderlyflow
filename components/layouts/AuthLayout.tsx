import { Stack } from 'expo-router';
import React from 'react';
import BaseStackLayout from './BaseStackLayout';

export default function AuthLayout() {
  return (
    <BaseStackLayout headerShown={false}>
      <Stack.Screen name="signin" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </BaseStackLayout>
  );
}
