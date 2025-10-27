import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import WarrantiesScreen from '../../../../../components/home/warranties/warranties-screen';
import { WarrantiesProvider } from '../../../../../lib/contexts/WarrantiesContext';

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