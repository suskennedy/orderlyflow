import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import reusable components
import DeleteConfirmationModal from '../../../components/ui/DeleteConfirmationModal';
import EmptyState from '../../../components/layout/EmptyState';
import InventoryItemCard from '../../../components/dashboard/InventoryItemCard';
import LoadingState from '../../../components/layout/LoadingState';
import ScreenHeader from '../../../components/layout/ScreenHeader';
import StatsDisplay from '../../../components/ui/StatsDisplay';

// Import hooks
import { useInventory } from '../../../lib/contexts/InventoryContext';

interface InventoryItem {
  id: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  location?: string | null;
  purchase_date?: string | null;
  purchase_price?: number | null;
  warranty_expiration?: string | null;
  manual_url?: string | null;
  notes?: string | null;
  home_id?: string | null;
  homes?: { name: string } | null;
  user_id?: string | null;
}

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const { items, loading, refreshing, deleteItem, onRefresh } = useInventory();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const handleDeletePress = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedItem) {
      await deleteItem(selectedItem.id);
      setShowDeleteModal(false);
      setSelectedItem(null);
    }
  };

  // Check if a warranty is active or expired
  const checkWarrantyStatus = (expirationDate: string | null): 'active' | 'expired' | 'none' => {
    if (!expirationDate) return 'none';
    
    try {
      const expDate = new Date(expirationDate);
      const today = new Date();
      
      // Check if date is valid
      if (isNaN(expDate.getTime())) return 'none';
      
      return expDate > today ? 'active' : 'expired';
    } catch (error) {
      return 'none';
    }
  };

  // Render statistics component
  const renderStats = () => {
    const totalItems = items.length;
    const warrantyActive = items.filter(item => 
      checkWarrantyStatus(item.warranty_expiration) === 'active'
    ).length;
    const warrantyExpired = items.filter(item => 
      checkWarrantyStatus(item.warranty_expiration) === 'expired'
    ).length;
    const noWarranty = items.filter(item => 
      checkWarrantyStatus(item.warranty_expiration) === 'none'
    ).length;

    return (
      <StatsDisplay
        stats={[
          { value: totalItems, label: 'Total Items' },
          { value: warrantyActive, label: 'Active Warranty', color: '#10B981' },
          { value: warrantyExpired, label: 'Expired Warranty', color: '#EF4444' },
          { value: noWarranty, label: 'No Warranty', color: '#6B7280' }
        ]}
      />
    );
  };

  // Show loading state while fetching data
  if (loading) {
    return <LoadingState message="Loading inventory..." />;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 100 }]}>
      {/* Screen header */}
      <ScreenHeader
        title="Inventory"
        subtitle="Manage your items"
        paddingTop={insets.top + 20}
        onAddPress={() => router.push('/inventory/add')}
      />

      <View style={styles.content}>
        {items.length === 0 ? (
          <EmptyState
            title="No Items Yet"
            message="Start tracking your home inventory by adding your first item"
            buttonText="Add First Item"
            iconName="cube-outline"
            navigateTo="/inventory/add"
          />
        ) : (
          <FlatList
            data={items}
            renderItem={({ item }) => (
              <InventoryItemCard
                item={item}
                onDelete={handleDeletePress}
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

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Item"
        message={`Are you sure you want to delete ${selectedItem?.name}? This action cannot be undone.`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
});