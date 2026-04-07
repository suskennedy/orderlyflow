import { Stack } from 'expo-router';
import React from 'react';
import BaseStackLayout from './BaseStackLayout';

export default function AuthLayout() {
  return (
    <BaseStackLayout headerShown={false}>
      <Stack.Screen name="signin" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="auth/callback" />
    </BaseStackLayout>
  );
}
