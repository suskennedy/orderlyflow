import { useLocalSearchParams } from 'expo-router';
import { FiltersProvider } from '../../../../../lib/contexts/FiltersContext';
import AddFilterScreen from '../../../../../components/home/filter/add-filter-screen';

export default function AddFilterPage() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  
  return (
    <FiltersProvider homeId={homeId}>
      <AddFilterScreen />
    </FiltersProvider>
  );
} 