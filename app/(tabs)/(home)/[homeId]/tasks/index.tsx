import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import AppLayout from '../../../../../components/layouts/AppLayout';
import TasksScreen from '../../../../../components/tasks/task-screen';

export default function HomeTasks() {
  const { homeId } = useLocalSearchParams();
  
  return (
    <AppLayout showFooter={true}>
      <TasksScreen homeId={homeId as string} />
    </AppLayout>
  );
}
