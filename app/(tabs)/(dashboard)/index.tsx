import HomeScreen from "../../../components/home/HomeScreen";
import AppLayout from "../../../components/layouts/AppLayout";

export default function DashboardPage() {
  return (
    <AppLayout showFooter={true}>
      <HomeScreen />
    </AppLayout>
  );
}