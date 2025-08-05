import { Ionicons } from '@expo/vector-icons';
import { RelativePathString, router } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import reusable components
import InventoryItemCard from '../../components/dashboard/InventoryItemCard';
import EmptyState from '../../components/layout/EmptyState';
import LoadingState from '../../components/layout/LoadingState';
import ScreenHeader from '../../components/layout/ScreenHeader';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import StatsDisplay from '../../components/ui/StatsDisplay';

// Import hooks
import { useInventory } from '../../lib/contexts/InventoryContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { InventoryItem } from '../../lib/services/InventoryService';

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const { items, loading, refreshing, deleteItem, onRefresh } = useInventory();
  const { colors } = useTheme();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const handleDeletePress = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedItem) {
      await deleteItem(selectedItem.id, selectedItem.item_type);
      setShowDeleteModal(false);
      setSelectedItem(null);
    }
  };

  // Handle add button press - show item type selection modal
  const handleAddPress = () => {
    setShowAddTypeModal(true);
  };

  // Navigate to the appropriate add screen based on item type
  const navigateToAddScreen = (itemType: string) => {
    setShowAddTypeModal(false);
    router.push(`/(tabs)/(dashboard)/homes/inventory/add/${itemType}` as RelativePathString);
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
      checkWarrantyStatus(item.warranty_expiration as string) === 'active'
    ).length;
    const warrantyExpired = items.filter(item => 
      checkWarrantyStatus(item.warranty_expiration as string) === 'expired'
    ).length;
    const noWarranty = items.filter(item => 
      checkWarrantyStatus(item.warranty_expiration as string) === 'none'
    ).length;

    // Get counts by item type
    const itemTypeCount: Record<string, number> = {};
    items.forEach(item => {
      const type = item.item_type || 'unknown';
      itemTypeCount[type] = (itemTypeCount[type] || 0) + 1;
    });

    return (
      <StatsDisplay
        stats={[
          { value: totalItems, label: 'Total Items' },
          { value: warrantyActive, label: 'Active Warranty', color: colors.success },
          { value: warrantyExpired, label: 'Expired Warranty', color: colors.error },
          { value: itemTypeCount['appliance'] || 0, label: 'Appliances', color: colors.info }
        ]}
      />
    );
  };

  // Show loading state while fetching data
  if (loading) {
    return <LoadingState message="Loading inventory..." />;
  }

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.background,
      paddingBottom: insets.bottom + 100 
    }]}>
      {/* Screen header with custom add action */}
      <ScreenHeader
        title="Inventory"
        subtitle="Manage your items"
        paddingTop={insets.top + 20}
        onAddPress={handleAddPress}
      />

      <View style={styles.content}>
        {items.length === 0 ? (
          <EmptyState
            title="No Items Yet"
            message="Start tracking your home inventory by adding your first item"
            buttonText="Add First Item"
            iconName="cube-outline"
            onButtonPress={handleAddPress}
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
            keyExtractor={(item) => `${item.item_type}-${item.id}`}
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

      {/* Item type selection modal */}
      <Modal
        visible={showAddTypeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Inventory Item</Text>
              <TouchableOpacity 
                onPress={() => setShowAddTypeModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Select item type to add</Text>

            <View style={styles.itemTypeList}>
              <TouchableOpacity 
                style={styles.itemTypeButton}
                onPress={() => navigateToAddScreen('appliance')}
              >
                <View style={[styles.itemTypeIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="cube" size={24} color="#3B82F6" />
                </View>
                <Text style={styles.itemTypeText}>Appliance</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.itemTypeButton}
                onPress={() => navigateToAddScreen('filter')}
              >
                <View style={[styles.itemTypeIcon, { backgroundColor: '#E0E7FF' }]}>
                  <Ionicons name="filter" size={24} color="#6366F1" />
                </View>
                <Text style={styles.itemTypeText}>Filter</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.itemTypeButton}
                onPress={() => navigateToAddScreen('light_fixture')}
              >
                <View style={[styles.itemTypeIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="bulb" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.itemTypeText}>Light Fixture</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.itemTypeButton}
                onPress={() => navigateToAddScreen('cabinet')}
              >
                <View style={[styles.itemTypeIcon, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="file-tray-stacked" size={24} color="#10B981" />
                </View>
                <Text style={styles.itemTypeText}>Cabinet</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.itemTypeButton}
                onPress={() => navigateToAddScreen('tile')}
              >
                <View style={[styles.itemTypeIcon, { backgroundColor: '#FCE7F3' }]}>
                  <Ionicons name="grid" size={24} color="#DB2777" />
                </View>
                <Text style={styles.itemTypeText}>Tile</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.itemTypeButton}
                onPress={() => navigateToAddScreen('paint')}
              >
                <View style={[styles.itemTypeIcon, { backgroundColor: '#EDE9FE' }]}>
                  <Ionicons name="color-palette" size={24} color="#8B5CF6" />
                </View>
                <Text style={styles.itemTypeText}>Paint</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  itemTypeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemTypeButton: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemTypeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  itemTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
});