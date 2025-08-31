import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import AppLayout from '../../../../../components/layouts/AppLayout';
import AddTaskScreen from '../../../../../components/screens/add-task-screen';

export default function AddHomeTask() {
  const { homeId } = useLocalSearchParams();
  
  return (
    <AppLayout showFooter={false}>
      <AddTaskScreen homeId={homeId as string} />
    </AppLayout>
  );
}
