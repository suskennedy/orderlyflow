import { useLocalSearchParams } from 'expo-router';
import AddMaterialScreen from   '../../../../../components/home/material/add-material-screen';
import { MaterialsProvider } from '../../../../../lib/contexts/MaterialsContext';

export default function AddMaterialPage() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  
  return (
    <MaterialsProvider homeId={homeId}>
      <AddMaterialScreen />
    </MaterialsProvider>
  );
} 