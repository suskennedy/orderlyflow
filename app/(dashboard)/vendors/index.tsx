import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '../../../components/layout/EmptyState';
import LoadingState from '../../../components/layout/LoadingState';
import ScreenHeader from '../../../components/layout/ScreenHeader';
import DeleteConfirmationModal from '../../../components/ui/DeleteConfirmationModal';
import StatsDisplay from '../../../components/ui/StatsDisplay';
import { useVendors } from '../../../lib/contexts/VendorsContext';
import VendorCard from '../../../components/dashboard/VendorCard';

interface Vendor {
  id: string;
  name: string;
  category?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_id?: string | null;
}

export default function VendorsScreen() {
  const insets = useSafeAreaInsets();
  const { vendors, loading, refreshing, deleteVendor, onRefresh } = useVendors();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const handleDeletePress = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedVendor) {
      await deleteVendor(selectedVendor.id);
      setShowDeleteModal(false);
      setSelectedVendor(null);
    }
  };

  const renderStats = () => {
    const totalVendors = vendors.length;
    const contractorVendors = vendors.filter(vendor => vendor.category === 'contractor').length;
    const supplierVendors = vendors.filter(vendor => vendor.category === 'supplier').length;
    const serviceVendors = vendors.filter(vendor => vendor.category === 'service').length;

    return (
      <StatsDisplay
        stats={[
          { value: totalVendors, label: 'Total Vendors' },
          { value: contractorVendors, label: 'Contractors', color: '#3B82F6' },
          { value: supplierVendors, label: 'Suppliers', color: '#10B981' },
          { value: serviceVendors, label: 'Services', color: '#F59E0B' }
        ]}
      />
    );
  };

  if (loading) {
    return <LoadingState message="Loading vendors..." />;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 100 }]}>
      <ScreenHeader
        title="Vendors"
        subtitle="Manage your contacts"
        paddingTop={insets.top + 20}
        onAddPress={() => router.push('/vendors/add')}
      />

      <View style={styles.content}>
        {vendors.length === 0 ? (
          <EmptyState
            title="No Vendors Yet"
            message="Add your first vendor to start managing your home service contacts"
            buttonText="Add Your First Vendor"
            iconName="people-outline"
            navigateTo="/vendors/add"
          />
        ) : (
          <FlatList
            data={vendors}
            renderItem={({ item }) => (
              <VendorCard
                vendor={item}
                onDelete={() => handleDeletePress(item)}
              />
            )}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4F46E5']}
              />
            }
            ListHeaderComponent={renderStats}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      <DeleteConfirmationModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Vendor"
        message={`Are you sure you want to delete ${selectedVendor?.name}? This action cannot be undone.`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
});