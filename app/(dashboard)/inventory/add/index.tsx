// This file is needed to make Expo Router recognize the directory
// It will redirect to the main inventory page

import { Redirect } from 'expo-router';

export default function AddInventoryIndexScreen() {
  return <Redirect href="/inventory" />;
}