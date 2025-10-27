import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import EditWarrantyScreen from '../../../../../../components/home/warranties/edit-warranty-screen';
import { WarrantiesProvider } from '../../../../../../lib/contexts/WarrantiesContext';

export default function EditWarrantyPage() {
  const params = useLocalSearchParams();
  const homeId = params.homeId as string;
  
  return (
    <WarrantiesProvider homeId={homeId}>
      <EditWarrantyScreen />
    </WarrantiesProvider>
  );
}