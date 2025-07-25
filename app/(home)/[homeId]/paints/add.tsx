import { useLocalSearchParams } from 'expo-router';
import AddPaintColorScreen from '../../../../components/screens/add-paint-color-screen';
import { PaintsProvider } from '../../../../lib/contexts/PaintsContext';

export default function AddPaintPage() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  
  return (
    <PaintsProvider homeId={homeId}>
      <AddPaintColorScreen />
    </PaintsProvider>
  );
} 