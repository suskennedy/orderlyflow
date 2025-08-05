import AppLayout from '../../../components/layouts/AppLayout';
import SettingsScreen from '../../../components/screens/settings-screen';

export default function SettingsIndex() {
  return (
    <AppLayout showFooter={true}>
      <SettingsScreen />
    </AppLayout>
  );
} 