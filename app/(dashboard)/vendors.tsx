import { Redirect } from 'expo-router';
import React from 'react';

// This screen redirects to the vendors route group when the "Vendors" tab is tapped
export default function DashboardVendorsScreen() {
  return <Redirect href="/(vendors)" />;
} 