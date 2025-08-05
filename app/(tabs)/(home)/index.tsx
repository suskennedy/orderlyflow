import AppLayout from '../../../components/layouts/AppLayout';
import HomesScreen from '../../../components/screens/homes-screen';

export default function App() {
  return (
    <AppLayout showFooter={true}>
      <HomesScreen />
    </AppLayout>
  );
} 