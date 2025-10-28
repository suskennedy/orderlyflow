import HomesScreen from '../../../components/home/homes-screen';
import AppLayout from '../../../components/layouts/AppLayout';

export default function App() {
  return (
    <AppLayout showFooter={true}>
      <HomesScreen />
    </AppLayout>
  );
} 