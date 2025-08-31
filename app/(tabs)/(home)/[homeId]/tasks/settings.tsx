import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import AppLayout from '../../../../../components/layouts/AppLayout';
import TaskSettingsScreen from '../../../../../components/screens/task-settings-screen';

export default function HomeTaskSettings() {
  const { homeId } = useLocalSearchParams();
  
  return (
    <AppLayout showFooter={false}>
      <TaskSettingsScreen homeId={homeId as string} />
    </AppLayout>
  );
}
