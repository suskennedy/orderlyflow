import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { WarrantiesProvider } from '../../../../../lib/contexts/WarrantiesContext';
import WarrantiesScreen from '../../../../../components/screens/warranties-screen';

export default function WarrantiesPage() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();

  if (!homeId) {
    return null; // Or a loading/error state
  }

  return (
    <WarrantiesProvider homeId={homeId}>
      <WarrantiesScreen />
    </WarrantiesProvider>
  );
} 