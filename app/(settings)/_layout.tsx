import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Settings',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="family-management"
        options={{
          title: 'Family Management',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="invite-members"
        options={{
          title: 'Invite Members',
          headerShown: false,
        }}
      />
    </Stack>
  );
} 