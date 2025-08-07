import { Stack } from 'expo-router';
import React from 'react';

export default function HomeDetailLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        contentStyle: {
          backgroundColor: '#fff',
        },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="info" />
      <Stack.Screen name="appliances" />
      <Stack.Screen name="paints" />
      <Stack.Screen name="warranties" />
      <Stack.Screen name="materials" />
      <Stack.Screen name="filters" />
    </Stack>
  );
} 