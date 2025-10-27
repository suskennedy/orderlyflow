import React from 'react';
import AppLayout from '../../../components/layouts/AppLayout';
import VendorsScreen from '../../../components/vendors/vendors-screen';

export default function Vendors() {
  return (
    <AppLayout showFooter={true}>
      <VendorsScreen />
    </AppLayout>
  );
} 