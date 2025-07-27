import { Redirect } from 'expo-router';
import React from 'react';

// This screen redirects to the homes route group when the "Homes" tab is tapped
export default function HomeScreen() {
  return <Redirect href="/(home)" />;
} 