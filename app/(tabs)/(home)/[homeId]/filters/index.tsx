import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { FiltersProvider } from '../../../../../lib/contexts/FiltersContext';
import FiltersScreen from '../../../../../components/screens/filters-screen';

export default function FiltersPage() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();

  if (!homeId) {
    return null; // Or a loading/error state
  }

  return (
    <FiltersProvider homeId={homeId}>
      <FiltersScreen />
    </FiltersProvider>
  );
} 