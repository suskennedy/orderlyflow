import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import EditPaintColorScreen from '../../../../../../components/home/paints/edit-paint-color-screen';
import { PaintsProvider } from '../../../../../../lib/contexts/PaintsContext';

export default function EditPaintColorPage() {
  const params = useLocalSearchParams();
  const homeId = params.homeId as string;
  
  return (
    <PaintsProvider homeId={homeId}>
      <EditPaintColorScreen />
    </PaintsProvider>
  );
}