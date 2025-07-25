import { useLocalSearchParams } from 'expo-router';
import AddFilterScreen from '../../../../components/screens/add-filter-screen';
import { FiltersProvider } from '../../../../lib/contexts/FiltersContext';

export default function AddFilterPage() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  
  return (
    <FiltersProvider homeId={homeId}>
      <AddFilterScreen />
    </FiltersProvider>
  );
} 