import { Stack } from 'expo-router';
import React from 'react';
import BaseStackLayout from './BaseStackLayout';

export default function SettingsLayout() {
  return (
    <BaseStackLayout headerShown={false}>
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
      <Stack.Screen
        name="feedback"
        options={{
          title: 'Feedback',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="report-bug"
        options={{
          title: 'Report Bug',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="contact-support"
        options={{
          title: 'Contact Support',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="privacy-policy"
        options={{
          title: 'Privacy Policy',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="terms-of-service"
        options={{
          title: 'Terms of Service',
          headerShown: false,
        }}
      />
    </BaseStackLayout>
  );
}
