import { Redirect } from 'expo-router';
import React from 'react';

// This screen redirects to the profile route group when the "Profile" tab is tapped
export default function ProfileScreen() {
  return <Redirect href="/(profile)" />;
} 