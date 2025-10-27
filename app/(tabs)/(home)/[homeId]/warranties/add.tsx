import { useLocalSearchParams } from 'expo-router';
import AddWarrantyScreen from '../../../../../components/home/warranties/add-warranty-screen';
import { WarrantiesProvider } from '../../../../../lib/contexts/WarrantiesContext';

export default function AddWarrantyPage() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  
  return (
    <WarrantiesProvider homeId={homeId}>
      <AddWarrantyScreen />
    </WarrantiesProvider>
  );
} 