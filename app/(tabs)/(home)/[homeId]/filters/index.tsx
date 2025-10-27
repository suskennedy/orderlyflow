import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import FiltersScreen from '../../../../../components/home/filter/filters-screen';
import { FiltersProvider } from '../../../../../lib/contexts/FiltersContext';

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