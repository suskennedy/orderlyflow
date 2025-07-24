import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import AppliancesScreen from '../../../../components/screens/appliances-screen';
import { AppliancesProvider } from '../../../../lib/contexts/AppliancesContext';

export default function AppliancesPage() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();

  if (!homeId) {
    return null; // Or a loading/error state
  }

  return (
    <AppliancesProvider homeId={homeId}>
      <AppliancesScreen />
    </AppliancesProvider>
  );
} 