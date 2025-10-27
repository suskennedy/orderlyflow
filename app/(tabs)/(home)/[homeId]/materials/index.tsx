import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import MaterialsScreen from '../../../../../components/home/material/materials-screen';
import { MaterialsProvider } from '../../../../../lib/contexts/MaterialsContext';

export default function MaterialsPage() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();

  if (!homeId) {
    return null; // Or a loading/error state
  }

  return (
    <MaterialsProvider homeId={homeId}>
      <MaterialsScreen />
    </MaterialsProvider>
  );
} 