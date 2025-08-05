import HomeScreen from "../../../components/dashboard/HomeScreen";
import AppLayout from "../../../components/layouts/AppLayout";

export default function DashboardPage() {
  return (
    <AppLayout showFooter={true}>
      <HomeScreen />
    </AppLayout>
  );
}