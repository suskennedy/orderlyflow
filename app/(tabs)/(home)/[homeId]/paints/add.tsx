import { useLocalSearchParams } from 'expo-router';
import AddPaintColorScreen from '../../../../../components/home/paints/add-paint-color-screen';
import { PaintsProvider } from '../../../../../lib/contexts/PaintsContext';

export default function AddPaintPage() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  
  return (
    <PaintsProvider homeId={homeId}>
      <AddPaintColorScreen />
    </PaintsProvider>
  );
} 