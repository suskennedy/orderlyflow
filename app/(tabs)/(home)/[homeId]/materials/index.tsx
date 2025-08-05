import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { MaterialsProvider } from '../../../../../lib/contexts/MaterialsContext';
import MaterialsScreen from '../../../../../components/screens/materials-screen';

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