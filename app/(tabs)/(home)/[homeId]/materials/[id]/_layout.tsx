import { Stack } from 'expo-router';

export default function MaterialDetailLayout() {
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