import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import PaintColorsScreen from '../../../../components/screens/paint-colors-screen';
import { PaintsProvider } from '../../../../lib/contexts/PaintsContext';

export default function PaintsPage() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();

  if (!homeId) {
    return null; // Or a loading/error state
  }

  return (
    <PaintsProvider homeId={homeId}>
      <PaintColorsScreen />
    </PaintsProvider>
  );
} 