import { Stack } from 'expo-router';

export default function WarrantyDetailLayout() {
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