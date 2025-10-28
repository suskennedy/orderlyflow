import { Stack } from 'expo-router';
import React from 'react';
import BaseStackLayout from './BaseStackLayout';

interface DetailLayoutProps {
  backgroundColor?: string;
}

export default function DetailLayout({ backgroundColor = '#fff' }: DetailLayoutProps) {
  return (
    <BaseStackLayout headerShown={false} backgroundColor={backgroundColor}>
      <Stack.Screen name="edit" />
    </BaseStackLayout>
  );
}
