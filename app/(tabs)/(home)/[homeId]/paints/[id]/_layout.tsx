import { Stack } from 'expo-router';

export default function PaintDetailLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="edit" />
    </Stack>
  );
} 