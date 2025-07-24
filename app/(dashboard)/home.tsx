import { Redirect } from 'expo-router';
import React from 'react';

// This screen is never actually seen by the user when they tap the "Home" tab.
// The `href` in `_layout.tsx` redirects them to the `/(home)` route group.
// This file simply exists to satisfy the router and prevent a warning about a
// missing "home" route inside the "(dashboard)" layout.
export default function DummyHomeScreen() {
  return <Redirect href="/(home)" />;
} 