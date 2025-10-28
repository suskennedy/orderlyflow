import AppLayout from '../../../components/layouts/AppLayout';
import SettingsScreen from '../../../components/settings/settings-screen';

export default function SettingsIndex() {
  return (
    <AppLayout showFooter={true}>
      <SettingsScreen />
    </AppLayout>
  );
} 