import { useLocalSearchParams } from 'expo-router';
import { AppliancesProvider } from '../../../../../lib/contexts/AppliancesContext';
import AddApplianceScreen from '../../../../../components/home/appliance/add-appliance-screen';

export default function AddAppliancePage() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  
  return (
    <AppliancesProvider homeId={homeId}>
      <AddApplianceScreen />
    </AppliancesProvider>
  );
} 