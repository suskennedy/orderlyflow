import React from 'react';
import AppLayout from '../../../components/layouts/AppLayout';
import VendorsScreen from '../../../components/screens/VendorsScreen';

export default function Vendors() {
  return (
    <AppLayout showFooter={true}>
      <VendorsScreen />
    </AppLayout>
  );
} 