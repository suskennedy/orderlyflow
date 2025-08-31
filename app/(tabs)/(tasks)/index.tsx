import React from 'react';
import AppLayout from '../../../components/layouts/AppLayout';
import HomeSelectorScreen from '../../../components/screens/home-selector-screen';

export default function Tasks() {
  return (
    <AppLayout showFooter={true}>
      <HomeSelectorScreen />
    </AppLayout>
  );
} 