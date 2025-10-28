import { Stack } from 'expo-router';
import React from 'react';
import BaseStackLayout from './BaseStackLayout';

export default function HomeDetailLayout() {
  return (
    <BaseStackLayout headerShown={false} backgroundColor="#fff">
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="info" />
      <Stack.Screen name="appliances" />
      <Stack.Screen name="paints" />
      <Stack.Screen name="warranties" />
      <Stack.Screen name="materials" />
      <Stack.Screen name="filters" />
      <Stack.Screen name="tasks" />
      <Stack.Screen name="calendar" />
    </BaseStackLayout>
  );
}
