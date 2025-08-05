import React from 'react';
import AppLayout from '../../../components/layouts/AppLayout';
import TasksScreen from '../../../components/screens/task-screen';

export default function Tasks() {
  return (
    <AppLayout showFooter={true}>
      <TasksScreen />
    </AppLayout>
  );
} 