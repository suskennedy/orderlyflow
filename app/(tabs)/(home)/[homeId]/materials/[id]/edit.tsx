import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import EditMaterialScreen from '../../../../../../components/home/material/edit-material-screen';
import { MaterialsProvider } from '../../../../../../lib/contexts/MaterialsContext';

export default function EditMaterialPage() {
  const params = useLocalSearchParams();
  const homeId = params.homeId as string;
  
  return (
    <MaterialsProvider homeId={homeId}>
      <EditMaterialScreen />
    </MaterialsProvider>
  );
}