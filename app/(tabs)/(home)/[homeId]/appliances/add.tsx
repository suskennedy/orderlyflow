import { useLocalSearchParams } from 'expo-router';
import AddApplianceScreen from '../../../../../components/screens/add-appliance-screen';
import { AppliancesProvider } from '../../../../../lib/contexts/AppliancesContext';

export default function AddAppliancePage() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  
  return (
    <AppliancesProvider homeId={homeId}>
      <AddApplianceScreen />
    </AppliancesProvider>
  );
} 